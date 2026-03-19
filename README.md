# CaseForward | AI-Powered Case Management System

## Swamphacks XI Winner 🏆 | 1st Place in Tender for Lawyers Challenge 🐊

### Built With

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6-green)
![Gemini](https://img.shields.io/badge/Gemini-2.5-orange)
![Cloudflare](https://img.shields.io/badge/Cloudflare-R2-orange)
![Auth0](https://img.shields.io/badge/Auth0-Authentication-red)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan)

---

## ✨ Description

CaseForward takes documents from multiple channels (web uploads, email, call transcripts), processes them through AI specialists who deliberate on findings, and generates action cards for attorney creating an efficient workflow that bridges the gap between AI-powered analysis and human legal expertise.

---

## 🚀 Installation

### 📋 Prerequisites
- Node.js 18+
- MongoDB Atlas or local instance
- Google AI API Key (Gemini)
- Cloudflare R2 bucket + Worker
- (Optional) Solana devnet wallet

### Steps

**1. Clone the Repository**
```bash
git clone https://github.com/your-org/CaseForwardAI
cd CaseForwardAI
```

**2. Install Dependencies**
```bash
cd caseforward
npm install
```
Dev Dependencies:
```bash
npm install -D @tailwindcss/postcss @types/formidable @types/node @types/react @types/react-dom eslint eslint-config-next tailwindcss tsx typescript
```

Dependencies:
```bash
npm install @ai-sdk/google @auth0/nextjs-auth0 @google/generative-ai @solana/web3.js ai bson dotenv formidable lucide-react mongodb mongoose next pdf-parse react react-dom zod
```


**3. Configure Environment Variables**
```bash
cp .env.example .env.local
```

Required variables:
```env
# Database
MONGODB_URI=mongodb+srv://...

# Auth0
AUTH0_SECRET=...
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=...

# Cloudflare R2
CF_WORKER_UPLOAD_URL=https://your-worker.workers.dev
INTERNAL_API_KEY=...
```

**4. Deploy Cloudflare Worker**
```bash
cd caseforward-worker
npx wrangler deploy
```

**5. Run Development Server**
```bash
cd caseforward
npm run dev
```

**6. Access the Application**
Open `http://localhost:3000` in your browser.


---

## 🧩 Tech Stack

| Category | Technologies |
|----------|--------------|
| 🖼️ **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| ⚙️ **Backend** | Next.js API Routes, MongoDB, Mongoose |
| 🤖 **AI** | Google Gemini 2.5, Vercel AI SDK, Zod |
| ☁️ **Storage** | Cloudflare R2, Cloudflare Workers |
| 🔐 **Auth** | Auth0 |
| 🛠️ **Dev Tools** | ESLint, TSX, pnpm/npm |


---

## 🏗️ Architecture

CaseForward AI follows a modern serverless architecture with clear separation between the client application, server APIs, AI orchestration layer, and storage services.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CASEFORWARD AI SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   CLIENT LAYER (Next.js)            AI LAYER (Round Table)                      │
│   ──────────────────────            ──────────────────────                      │
│                                                                                 │
│   ┌──────────────────┐              ┌─────────────────────┐                     │
│   │  Dashboard UI    │◄────────────►│    Orchestrator     │                     │
│   │  (React 19)      │              └──────────┬──────────┘                     │
│   └──────────────────┘                         │                                │
│                                     ┌──────────┴──────────┐                     │
│   ┌──────────────────┐              │     Round Table     │                     │
│   │  Swipe Interface │◄────────────►│  ┌───────┬───────┐  │                     │
│   │  (Action Cards)  │              │  │Client │Evidence│ │                     │
│   └──────────────────┘              │  │ Guru  │Analyzer│ │                     │
│                                     │  ├───────┴───────┤  │                     │
│                                     │  │  Settlement   │  │                     │
│                                     │  │  Valuator     │  │                     │
│                                     │  └───────────────┘  │                     │
│                                     └─────────────────────┘                     │
│                                                                                 │
│   DATA LAYER (MongoDB)              STORAGE LAYER                               │
│   ────────────────────              ─────────────                               │
│                                                                                 │
│   ┌─────────┐ ┌─────────┐           ┌─────────────────────┐                     │
│   │  Cases  │ │Documents│◄─────────►│   Cloudflare R2     │                     │
│   └─────────┘ └─────────┘           │   (raw files)       │                     │
│                                     └─────────────────────┘                     │
│   ┌─────────┐ ┌─────────┐                                                       │
│   │ Actions │ │  Liens  │           ┌─────────────────────┐                     │
│   └─────────┘ └─────────┘           │   Solana Devnet     │                     │
│                                     │   (audit hashes)    │                     │
│   ┌─────────┐ ┌─────────┐           └─────────────────────┘                     │
│   │AuditLogs│ │Feedback │                                                       │
│   └─────────┘ └─────────┘                                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 🧠 AI Layer

The AI layer implements a novel "Round Table" multi-agent deliberation system powered by Google Gemini.


**Agent Roles:**

| Agent | Role | Expertise |
|-------|------|-----------|
| **Orchestrator** | Moderator | Routes tasks, sets context, synthesizes conclusions |
| **Client Guru** | Empathy Expert | Client communication, emotional intelligence, relationship management |
| **Evidence Analyzer** | Facts Expert | Document analysis, gap identification, inconsistency detection |
| **Settlement Valuator** | Numbers Expert | Case valuation, lien calculations, net recovery projections |

**Deliberation Flow:**
1. Orchestrator introduces the topic with full case context
2. Each specialist provides their perspective (parallel analysis)
3. Optional follow-up rounds for consensus building
4. Orchestrator synthesizes discussion into an Action Card
5. Action Card returned with structured schema validation

---

### Security Archetecture can be found [Here](https://github.com/kofki/CaseForwardAI/blob/main/Security.md)

---

*CaseForward AI - Intelligent Legal Case Management*
