'use client';

import { useState, useEffect } from 'react';

interface QueuedDocument {
  documentId: string;
  fileName: string;
  status: 'queued' | 'categorizing' | 'analyzing' | 'processed' | 'failed';
  category?: string;
  confidence?: number;
  suggestedTitle?: string;
  error?: string;
  mimeType?: string;
  size?: number;
}

interface DocumentQueueProps {
  caseId: string;
  batchId?: string;
  documents: QueuedDocument[];
  onDocumentProcessed?: (doc: QueuedDocument) => void;
  onAllProcessed?: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  medical_record: '📊',
  medical_bill: '💵',
  diagnostic_imaging: '🩻',
  pharmacy_record: '💊',
  police_report: '👮',
  incident_photo: '📸',
  witness_statement: '👁️',
  pay_stub: '💰',
  employer_letter: '✉️',
  tax_document: '📋',
  insurance_policy: '📋',
  insurance_claim: '📄',
  denial_letter: '❌',
  retainer_agreement: '✍️',
  demand_letter: '📨',
  settlement_document: '🤝',
  court_filing: '⚖️',
  client_correspondence: '💬',
  provider_correspondence: '📬',
  client_intake: '📝',
  other: '📁',
};

const CATEGORY_LABELS: Record<string, string> = {
  medical_record: 'Medical Records',
  medical_bill: 'Medical Bills',
  diagnostic_imaging: 'Imaging',
  pharmacy_record: 'Pharmacy',
  police_report: 'Police Report',
  incident_photo: 'Photos',
  witness_statement: 'Witness Statement',
  pay_stub: 'Pay Stubs',
  employer_letter: 'Employer Letter',
  tax_document: 'Tax Document',
  insurance_policy: 'Insurance Policy',
  insurance_claim: 'Insurance Claim',
  denial_letter: 'Denial Letter',
  retainer_agreement: 'Retainer',
  demand_letter: 'Demand Letter',
  settlement_document: 'Settlement',
  court_filing: 'Court Filing',
  client_correspondence: 'Client Correspondence',
  provider_correspondence: 'Provider Correspondence',
  client_intake: 'Client Intake',
  other: 'Other',
};

export default function DocumentQueue({
  caseId,
  batchId,
  documents: initialDocuments,
  onDocumentProcessed,
  onAllProcessed,
}: DocumentQueueProps) {
  const [documents, setDocuments] = useState<QueuedDocument[]>(initialDocuments);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Start processing queue
  useEffect(() => {
    if (documents.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [documents.length]);

  const processQueue = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      // Skip already processed or failed docs
      if (doc.status === 'processed' || doc.status === 'failed') {
        continue;
      }

      setProcessingIndex(i);

      // Update status to categorizing
      setDocuments(prev => prev.map((d, idx) => 
        idx === i ? { ...d, status: 'categorizing' as const } : d
      ));

      try {
        // Step 1: Categorize
        const categorizeRes = await fetch(`/api/documents/${doc.documentId}/categorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (categorizeRes.ok) {
          const categorizeData = await categorizeRes.json();
          
          setDocuments(prev => prev.map((d, idx) => 
            idx === i ? {
              ...d,
              status: 'analyzing' as const,
              category: categorizeData.category,
              confidence: categorizeData.confidence,
              suggestedTitle: categorizeData.suggestedTitle,
            } : d
          ));

          // Step 2: Full analysis with Round Table (if case is assigned)
          if (caseId) {
            const analyzeRes = await fetch(`/api/documents/${doc.documentId}/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ caseId }),
            });

            if (analyzeRes.ok) {
              const updatedDoc: QueuedDocument = {
                ...doc,
                status: 'processed',
                category: categorizeData.category,
                confidence: categorizeData.confidence,
                suggestedTitle: categorizeData.suggestedTitle,
              };
              
              setDocuments(prev => prev.map((d, idx) => 
                idx === i ? updatedDoc : d
              ));
              
              onDocumentProcessed?.(updatedDoc);
            } else {
              throw new Error('Analysis failed');
            }
          } else {
            // No case - just mark as categorized
            const updatedDoc: QueuedDocument = {
              ...doc,
              status: 'processed',
              category: categorizeData.category,
              confidence: categorizeData.confidence,
              suggestedTitle: categorizeData.suggestedTitle,
            };
            
            setDocuments(prev => prev.map((d, idx) => 
              idx === i ? updatedDoc : d
            ));
            
            onDocumentProcessed?.(updatedDoc);
          }
        } else {
          throw new Error('Categorization failed');
        }
      } catch (error) {
        console.error(`Error processing ${doc.fileName}:`, error);
        
        setDocuments(prev => prev.map((d, idx) => 
          idx === i ? {
            ...d,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Processing failed',
          } : d
        ));
      }

      // Small delay between documents to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    onAllProcessed?.();
  };

  const getStatusIcon = (status: QueuedDocument['status']) => {
    switch (status) {
      case 'queued': return '⏳';
      case 'categorizing': return '🔍';
      case 'analyzing': return '🤖';
      case 'processed': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusLabel = (status: QueuedDocument['status']) => {
    switch (status) {
      case 'queued': return 'Queued';
      case 'categorizing': return 'Categorizing...';
      case 'analyzing': return 'AI Analyzing...';
      case 'processed': return 'Complete';
      case 'failed': return 'Failed';
    }
  };

  const processedCount = documents.filter(d => d.status === 'processed').length;
  const failedCount = documents.filter(d => d.status === 'failed').length;
  const totalCount = documents.length;

  // Group documents by category for summary
  const categoryGroups = documents.reduce((acc, doc) => {
    if (doc.category) {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
      <div className="bg-[#4b1d1d] text-white px-5 py-3 flex items-center justify-between border-b border-white/15">
        <div>
          <p className="text-sm text-amber-200">AI Processing</p>
          <h3 className="text-xl font-bold">Document Queue</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{processedCount}/{totalCount}</p>
          <p className="text-xs text-amber-200">Processed</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-[#f0a56b] h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((processedCount + failedCount) / totalCount) * 100}%` }}
          />
        </div>

        {/* Category summary */}
        {Object.keys(categoryGroups).length > 0 && (
          <div className="flex flex-wrap gap-2 py-2 border-b border-[#e6ded3]">
            {Object.entries(categoryGroups).map(([category, count]) => (
              <span 
                key={category}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#f7f1eb] text-xs font-medium text-[#4b1d1d] rounded"
              >
                {CATEGORY_EMOJIS[category] || '📄'} {CATEGORY_LABELS[category] || category} ({count})
              </span>
            ))}
          </div>
        )}

        {/* Document list */}
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {documents.map((doc, idx) => (
            <li 
              key={doc.documentId || idx}
              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                doc.status === 'categorizing' || doc.status === 'analyzing'
                  ? 'bg-amber-50 border border-amber-200'
                  : doc.status === 'processed'
                  ? 'bg-green-50 border border-green-200'
                  : doc.status === 'failed'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="text-lg">{getStatusIcon(doc.status)}</span>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.suggestedTitle || doc.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{getStatusLabel(doc.status)}</span>
                  {doc.category && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {CATEGORY_EMOJIS[doc.category]} {CATEGORY_LABELS[doc.category]}
                      </span>
                    </>
                  )}
                  {doc.confidence && (
                    <span className="text-gray-400">
                      ({Math.round(doc.confidence * 100)}%)
                    </span>
                  )}
                </div>
                {doc.error && (
                  <p className="text-xs text-red-600 mt-1">{doc.error}</p>
                )}
              </div>

              {doc.size && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {(doc.size / 1024).toFixed(0)} KB
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Status message */}
        {isProcessing && (
          <p className="text-sm text-center text-gray-600 animate-pulse">
            🤖 AI is analyzing your documents...
          </p>
        )}
        
        {!isProcessing && processedCount === totalCount && totalCount > 0 && (
          <p className="text-sm text-center text-green-600 font-medium">
            ✅ All documents processed and categorized!
          </p>
        )}

        {!isProcessing && failedCount > 0 && (
          <p className="text-sm text-center text-amber-600">
            ⚠️ {failedCount} document(s) failed to process
          </p>
        )}
      </div>
    </div>
  );
}
