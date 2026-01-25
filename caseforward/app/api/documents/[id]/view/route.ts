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
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    await dbConnect();

    const doc = await Document.findById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!doc.file?.storagePath) {
      return NextResponse.json({ error: 'No file associated with this document' }, { status: 404 });
    }

    // Construct URL to fetch file via Cloudflare Worker
    const workerUrl = process.env.CF_WORKER_URL || process.env.CF_WORKER_UPLOAD_URL;
    const publicUrl = process.env.R2_PUBLIC_URL;
    
    if (publicUrl) {
      // If you have a public R2 URL configured
      return NextResponse.redirect(`${publicUrl}/${doc.file.storagePath}`);
    }
    
    if (workerUrl) {
      // Redirect to worker endpoint that serves files
      const fileUrl = `${workerUrl}/file/${encodeURIComponent(doc.file.storagePath)}`;
      return NextResponse.redirect(fileUrl);
    }

    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });

  } catch (error: any) {
    console.error('Document view error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to view document' },
      { status: 500 }
    );
  }
}
