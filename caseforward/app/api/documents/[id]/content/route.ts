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

    const doc = await Document.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Return extracted content from MongoDB
    const content = (doc as any).extractedContent?.text || '';
    
    return NextResponse.json({
      success: true,
      content,
      text: content,
      pageCount: (doc as any).extractedContent?.pageCount || 0,
      title: (doc as any).title,
      mimeType: (doc as any).file?.mimeType,
      hasContent: content.length > 0,
    });

  } catch (error: any) {
    console.error('Document content error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get document content' },
      { status: 500 }
    );
  }
}
