import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/dbConnect';
import Document from '@/lib/db/models/Document';
import { getSignedUrl } from '@/lib/storage/r2';

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

    // Get signed URL from R2
    const signedUrl = await getSignedUrl(doc.file.storagePath);
    
    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);

  } catch (error: any) {
    console.error('Document view error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to view document' },
      { status: 500 }
    );
  }
}
