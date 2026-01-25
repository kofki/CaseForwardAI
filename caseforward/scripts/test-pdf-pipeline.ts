
import dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables explicitly before anything else
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function runTest() {
    console.log('🚀 Starting PDF Pipeline Test...');

    try {
        // 2. Dynamic imports to ensure env vars are loaded before modules initialize
        const { default: connectDB, disconnectDB } = await import('../lib/db/connect');
        const { default: Document } = await import('../lib/db/models/Document');
        const { extractPdfContent } = await import('../lib/db/extractors/pdf');
        const { categorizeDocument } = await import('../lib/agents/services/document-categorization.service');

        // 3. Connect to DB
        await connectDB();
        console.log('✅ Database connected');

        // 4. Clear Database (Optional, but requested)
        console.log('🧹 Clearing Documents collection...');
        await Document.deleteMany({});
        console.log('✅ Documents cleared');

        // 5. Simulate PDF File (Minimal valid PDF)
        // We use a base64 string of a valid "Hello World" PDF to avoid structure errors like 'bad XRef entry'
        const validPdfBase64 =
            'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9YmoKCjMgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9YmoKCjUgMCBvYmogCjw8IC9MZW5ndGggMjIgPj4Kc3RyZWFtCkJUIC9GMSAxMiBUZiAxMCAxMCBUZCAoSGVsbG8gV29ybGQpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNTcgMDAwMDAgbiAKMDAwMDAwMDI1NSAwMDAwMCBuIAowMDAwMDAwMzQ0IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQxNgolJUVPRgo=';

        const buffer = Buffer.from(validPdfBase64, 'base64');
        console.log(`📄 Created mock PDF buffer (${buffer.length} bytes)`);

        // 6. Test Extraction
        console.log('🕵️‍♀️ Testing PDF Extraction...');
        const extractedContent = await extractPdfContent(buffer);
        console.log('✨ Extraction Result:', {
            textLength: extractedContent.textLength,
            textPreview: extractedContent.text.substring(0, 100).replace(/\n/g, ' '),
            pages: extractedContent.pageCount,
            error: extractedContent.extractionError
        });

        if (extractedContent.textLength === 0) {
            console.warn('⚠️ No text extracted. Extraction might have failed silently or PDF is empty.');
        }

        // 7. Test Categorization
        console.log('🧠 Testing Categorization...');
        const mockMedicalText = `
    MEDICAL REPORT
    Patient: John Doe
    Date of Service: 2023-10-15
    Diagnosis: Cervical Strain, Lumbar Radiculopathy
    Treatment: MRI ordered of C-spine.
    Provider: City General Hospital
    `;

        // Combine extracted text with mock text
        const textToAnalyze = (extractedContent.text || '') + '\n\n' + mockMedicalText;

        const categoryResult = await categorizeDocument(textToAnalyze, 'test-medical-report.pdf', 'application/pdf');

        console.log('🏷️ Categorization Result:', JSON.stringify(categoryResult, null, 2));

        // 8. Simulate DB Insertion
        console.log('💾 Saving to Database...');
        const doc = await Document.create({
            caseId: null,
            title: 'Test Medical Report',
            category: categoryResult.category,
            status: 'processed',
            inputSource: 'web_upload',
            file: {
                originalName: 'test-medical-report.pdf',
                storagePath: 'test/path/uuid.pdf',
                mimeType: 'application/pdf',
                size: buffer.length,
                hash: 'test-hash-123'
            },
            extractedContent: {
                ...extractedContent,
                text: textToAnalyze
            },
            aiAnalysis: {
                isProcessed: true,
                summary: categoryResult.reasoning,
                confidence: categoryResult.confidence
            },
            uploadedBy: 'system-test'
        });

        console.log(`✅ Document created with ID: ${doc._id}`);

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        // We can't easily disconnect if we imported dynamically inside, but assuming we can access the module
        try {
            const { disconnectDB } = await import('../lib/db/connect');
            await disconnectDB();
        } catch (e) { console.log('Disconnect error', e); }
        console.log('👋 Done');
        process.exit(0);
    }
}

runTest();
