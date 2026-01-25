import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import { getCaseById } from '@/lib/db/models/Case';
import Document from '@/lib/db/models/Document';
import dbConnect from '@/lib/db/dbConnect';
import Link from 'next/link';
import mongoose from 'mongoose';
import { DocumentCategory, DocumentCategoryLabels, DocumentCategoryGroups } from '@/lib/db/types/enums';
import DocumentGalleryClient from './DocumentGalleryClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getDocumentsForCase(caseId: string) {
  await dbConnect();
  try {
    const objectId = new mongoose.Types.ObjectId(caseId);
    const docs = await Document.find({ caseId: objectId }).sort({ uploadedAt: -1 }).lean();
    return docs;
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export default async function CaseDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth0.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  const { id } = await params;

  await dbConnect();

  const caseData = await getCaseById(id);
  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#f0ece6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4b1d1d] mb-2">Case Not Found</h1>
          <p className="text-gray-500 mb-4">Case ID: {id}</p>
          <Link href="/app" className="text-[#4b1d1d] hover:underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const documents = await getDocumentsForCase(id);
  
  // Serialize documents for client component
  const serializedDocs = documents.map((doc: any) => ({
    _id: doc._id.toString(),
    title: doc.title || doc.file?.originalName || 'Untitled',
    category: doc.category || 'other',
    status: doc.status,
    file: {
      originalName: doc.file?.originalName,
      storagePath: doc.file?.storagePath,
      mimeType: doc.file?.mimeType,
      size: doc.file?.size,
    },
    uploadedAt: doc.uploadedAt?.toISOString(),
    extractedContent: {
      text: doc.extractedContent?.text?.substring(0, 500) || '',
      pageCount: doc.extractedContent?.pageCount || 0,
    },
    aiAnalysis: {
      summary: doc.aiAnalysis?.summary || '',
      keyFindings: doc.aiAnalysis?.keyFindings || [],
    },
  }));

  return (
    <DocumentGalleryClient 
      caseId={id}
      caseNumber={caseData.caseNumber}
      clientName={`${caseData.client?.firstName || ''} ${caseData.client?.lastName || ''}`}
      documents={serializedDocs}
    />
  );
}
