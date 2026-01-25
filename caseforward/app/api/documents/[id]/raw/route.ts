import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import Document from '@/lib/db/models/Document';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    await dbConnect();

    const doc = await Document.findById(id).lean();
    if (!doc) {
      return new NextResponse('Not found', { status: 404 });
    }

    const docData = doc as any;
    
    if (!docData.file?.storagePath) {
      // Fallback to extracted text
      if (docData.extractedContent?.text) {
        return new NextResponse(docData.extractedContent.text, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      return new NextResponse('No file available', { status: 404 });
    }

    const workerUrl = process.env.CF_WORKER_UPLOAD_URL;
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!workerUrl || !apiKey) {
      // Fallback to extracted text
      if (docData.extractedContent?.text) {
        return new NextResponse(docData.extractedContent.text, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      return new NextResponse('Storage not configured', { status: 500 });
    }

    // Fetch from worker using GET /file/:key
    const fileUrl = `${workerUrl}/file/${encodeURIComponent(docData.file.storagePath)}`;
    
    const fileRes = await fetch(fileUrl, {
      headers: { 'X-Internal-Auth': apiKey },
    });

    if (fileRes.ok) {
      const arrayBuffer = await fileRes.arrayBuffer();
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': docData.file.mimeType || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${docData.file.originalName || 'document'}"`,
        },
      });
    }

    console.error('Worker error:', fileRes.status);
    
    // Fallback to extracted text
    if (docData.extractedContent?.text) {
      return new NextResponse(docData.extractedContent.text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return new NextResponse('File not accessible', { status: 502 });

  } catch (error: any) {
    console.error('Raw document error:', error);
    return new NextResponse('Error: ' + error.message, { status: 500 });
  }
}
