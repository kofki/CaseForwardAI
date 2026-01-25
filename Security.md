# Zero Trust Document Storage Architecture
---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER/CLIENT                    CLOUDFLARE EDGE                            │
│   ───────────                    ────────────────                           │
│                                                                             │
│   ┌──────────────┐               ┌──────────────────┐                       │
│   │  Browser     │──────────────►│  Cloudflare      │                       │
│   │  (holds      │   HTTPS +     │  Worker          │                       │
│   │  object key) │   Auth Token  │  (IP-locked)     │                       │
│   └──────────────┘               └────────┬─────────┘                       │
│                                           │                                 │
│         Object Key                        │ Internal Auth                   │
│         stays client-side                 │ + IP Allowlist                  │
│         ─────────────────                 ▼                                 │
│                                  ┌──────────────────┐                       │
│                                  │  Cloudflare R2   │                       │
│                                  │  Bucket          │◄── NO PUBLIC ACCESS   │
│                                  │  (raw files)     │                       │
│                                  └──────────────────┘                       │
│                                                                             │
│   MONGODB (Metadata Only)                                                   │
│   ───────────────────────                                                   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────┐               │
│   │  Documents Collection                                   │               │
│   │  ─────────────────────                                  │               │
│   │  • file.storagePath (object key reference)              │               │
│   │  • file.hash (SHA-256 for deduplication)                │               │
│   │  • extractedContent.text (extracted text only)          │               │
│   │  • aiAnalysis.summary (AI-generated summary)            │               │
│   │  • metadata (dates, amounts, entities)                  │               │
│   │                                                         │               │
│   │  NO raw file bytes stored                               │               │
│   │  NO embedded images stored                              │               │
│   │  NO original PDFs stored                                │               │
│   └─────────────────────────────────────────────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Key Security Principles

### 1. Client-Side Object Key Ownership

- **Object keys are generated server-side** but only returned to the authenticated client
- **MongoDB stores only the key reference**, not the file content
- **To access a file**, a user must possess both:
  - Valid authentication session (Auth0)
  - The specific object key for that document
- **Even database compromise** does not expose raw files—attackers would only get storage paths, not content

### 2. R2 Bucket Isolation

- **No public access**: The R2 bucket has zero public endpoints
- **Worker-only access**: Only the Cloudflare Worker can read/write to the bucket
- **IP allowlisting**: The Worker validates requests via:
  - `X-Internal-Auth` header with secret API key
  - Origin IP restrictions to the Next.js server
- **No direct URLs**: Files cannot be accessed via direct R2 URLs

**Worker authentication check**:
```typescript
const auth = request.headers.get('X-Internal-Auth');
if (auth !== env.INTERNAL_API_KEY) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 3. MongoDB as Metadata-Only Store

The database intentionally stores **no raw file content**:

| Stored in MongoDB | NOT Stored in MongoDB |
|-------------------|----------------------|
| Object key reference (`file.storagePath`) | Raw PDF bytes |
| File hash for deduplication | Original document images |
| Extracted text content | Embedded file attachments |
| AI-generated summaries | Scanned page images |
| Parsed entities (names, dates, amounts) | Binary file content |
| Document metadata (size, type, upload date) | — |

This separation ensures:
- **Database breaches are limited**: Attackers get text/metadata, not original documents
- **Faster queries**: MongoDB isn't bloated with binary data
- **Efficient AI processing**: Text is readily available for analysis
- **Compliance flexibility**: Raw files can be purged from R2 independently

### 4. Hash-Based Deduplication

- Files are hashed (SHA-256) before upload
- Duplicate detection prevents storage of identical documents
- Hash stored in MongoDB; file stored once in R2
- Reduces storage costs and prevents redundant processing

```typescript
const fileHash = await computeFileHash(arrayBuffer);
const existingDoc = await Document.findOne({ 'file.hash': fileHash });
if (existingDoc) {
  return NextResponse.json({
    success: false,
    message: 'This file has already been uploaded',
    documentId: existingDoc._id.toString(),
  }, { status: 409 });
}
```

---
