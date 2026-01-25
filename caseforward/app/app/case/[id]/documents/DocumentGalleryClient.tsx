'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radley, Poppins } from 'next/font/google';

const radley = Radley({ subsets: ['latin'], weight: '400' });
const poppins = Poppins({ subsets: ['latin'], weight: '500' });

interface DocumentData {
  _id: string;
  title: string;
  category: string;
  status: string;
  file: {
    originalName?: string;
    storagePath?: string;
    mimeType?: string;
    size?: number;
  };
  uploadedAt?: string;
  extractedContent?: {
    text?: string;
    pageCount?: number;
  };
  aiAnalysis?: {
    summary?: string;
    keyFindings?: string[];
  };
}

interface Props {
  caseId: string;
  caseNumber: string;
  clientName: string;
  documents: DocumentData[];
}

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; group: string }> = {
  medical_record: { emoji: '📊', label: 'Medical Records', group: 'Medical' },
  medical_bill: { emoji: '💵', label: 'Medical Bills', group: 'Medical' },
  diagnostic_imaging: { emoji: '🩻', label: 'Diagnostic Imaging', group: 'Medical' },
  pharmacy_record: { emoji: '💊', label: 'Pharmacy Records', group: 'Medical' },
  police_report: { emoji: '👮', label: 'Police Report', group: 'Incident' },
  incident_photo: { emoji: '📸', label: 'Incident Photos', group: 'Incident' },
  witness_statement: { emoji: '👁️', label: 'Witness Statements', group: 'Incident' },
  pay_stub: { emoji: '💰', label: 'Pay Stubs', group: 'Financial' },
  employer_letter: { emoji: '✉️', label: 'Employer Letters', group: 'Financial' },
  tax_document: { emoji: '📋', label: 'Tax Documents', group: 'Financial' },
  insurance_policy: { emoji: '🛡️', label: 'Insurance Policy', group: 'Insurance' },
  insurance_claim: { emoji: '📄', label: 'Insurance Claims', group: 'Insurance' },
  denial_letter: { emoji: '❌', label: 'Denial Letters', group: 'Insurance' },
  retainer_agreement: { emoji: '✍️', label: 'Retainer Agreement', group: 'Legal' },
  demand_letter: { emoji: '📨', label: 'Demand Letters', group: 'Legal' },
  settlement_document: { emoji: '🤝', label: 'Settlement Documents', group: 'Legal' },
  court_filing: { emoji: '⚖️', label: 'Court Filings', group: 'Legal' },
  client_correspondence: { emoji: '💬', label: 'Client Correspondence', group: 'Communication' },
  provider_correspondence: { emoji: '📬', label: 'Provider Correspondence', group: 'Communication' },
  client_intake: { emoji: '📝', label: 'Client Intake', group: 'Intake' },
  other: { emoji: '📁', label: 'Other Documents', group: 'Other' },
};

const GROUP_ORDER = ['Medical', 'Incident', 'Financial', 'Insurance', 'Legal', 'Communication', 'Intake', 'Other'];

export default function DocumentGalleryClient({ caseId, caseNumber, clientName, documents }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);

  // Group documents by category
  const docsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocumentData[]>);

  // Get categories sorted by group order
  const sortedCategories = Object.keys(docsByCategory).sort((a, b) => {
    const groupA = CATEGORY_CONFIG[a]?.group || 'Other';
    const groupB = CATEGORY_CONFIG[b]?.group || 'Other';
    return GROUP_ORDER.indexOf(groupA) - GROUP_ORDER.indexOf(groupB);
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const openDocument = async (doc: DocumentData) => {
    if (doc.file?.storagePath) {
      // Open in new tab via API that generates signed URL
      window.open(`/api/documents/${doc._id}/view`, '_blank');
    }
  };

  return (
    <div className={`min-h-screen bg-[#f0ece6] ${poppins.className}`}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/app" className="text-[#4b1d1d] hover:underline text-sm mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}>
              Case Documents
            </h1>
            <p className="text-[#4b1d1d]/70 mt-1">
              {caseNumber} • {clientName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#4b1d1d]">{documents.length}</p>
            <p className="text-sm text-[#4b1d1d]/70">Total Documents</p>
          </div>
        </div>

        {/* Category Sections */}
        <div className="space-y-4">
          {sortedCategories.length === 0 ? (
            <div className="bg-white shadow border border-[#e6ded3] rounded-none p-8 text-center">
              <p className="text-gray-500">No documents uploaded yet.</p>
              <Link 
                href={`/app/case/new`}
                className="mt-4 inline-block px-6 py-2 bg-[#f0a56b] text-[#4b1d1d] font-semibold rounded hover:bg-amber-400"
              >
                Upload Documents
              </Link>
            </div>
          ) : (
            sortedCategories.map(category => {
              const config = CATEGORY_CONFIG[category] || { emoji: '📁', label: category, group: 'Other' };
              const docs = docsByCategory[category];
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category} className="bg-white shadow border border-[#e6ded3] rounded-none overflow-hidden">
                  {/* Category Header - Collapsible */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full bg-[#4b1d1d] text-white px-6 py-4 flex items-center justify-between hover:bg-[#5a2424] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.emoji}</span>
                      <div className="text-left">
                        <h2 className={`text-xl font-bold ${radley.className}`}>{config.label}</h2>
                        <p className="text-xs text-amber-200">{config.group}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                        {docs.length} {docs.length === 1 ? 'document' : 'documents'}
                      </span>
                      <span className="text-2xl transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Document List - Expandable */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {docs.map(doc => (
                        <div
                          key={doc._id}
                          className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between cursor-pointer group"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <span className="text-2xl">
                              {doc.file?.mimeType?.startsWith('image/') ? '🖼️' : 
                               doc.file?.mimeType === 'application/pdf' ? '📄' : '📁'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                              <p className="text-sm text-gray-500">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                                {doc.file?.size && ` • ${(doc.file.size / 1024).toFixed(1)} KB`}
                                {doc.extractedContent?.pageCount ? ` • ${doc.extractedContent.pageCount} pages` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              doc.status === 'processed' || doc.status === 'reviewed' 
                                ? 'bg-green-100 text-green-800' 
                                : doc.status?.includes('fail') 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDocument(doc);
                              }}
                              className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-[#4b1d1d] text-white text-sm rounded hover:bg-[#5a2424] transition-all"
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Document Preview Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
            <div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#4b1d1d] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${radley.className}`}>{selectedDoc.title}</h3>
                  <p className="text-sm text-amber-200">
                    {CATEGORY_CONFIG[selectedDoc.category]?.label || selectedDoc.category}
                  </p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="text-2xl hover:text-amber-200">×</button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">File Info</p>
                    <p className="text-sm text-gray-600">
                      {selectedDoc.file?.originalName} • {((selectedDoc.file?.size || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  
                  {selectedDoc.aiAnalysis?.summary && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">AI Summary</p>
                      <p className="text-sm text-gray-600">{selectedDoc.aiAnalysis.summary}</p>
                    </div>
                  )}
                  
                  {selectedDoc.aiAnalysis?.keyFindings && selectedDoc.aiAnalysis.keyFindings.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Key Findings</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {selectedDoc.aiAnalysis.keyFindings.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedDoc.extractedContent?.text && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Content Preview</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {selectedDoc.extractedContent.text}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => openDocument(selectedDoc)}
                  className="px-4 py-2 bg-[#f0a56b] text-[#4b1d1d] font-semibold rounded hover:bg-amber-400"
                >
                  Open Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
