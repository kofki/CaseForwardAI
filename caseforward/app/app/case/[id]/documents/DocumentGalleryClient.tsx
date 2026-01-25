'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Radley, Poppins } from 'next/font/google';
import {
  FileText,
  DollarSign,
  Activity,
  Pill,
  Shield,
  FileCheck,
  FileMinus,
  Camera,
  Eye,
  Briefcase,
  Mail,
  CreditCard,
  FileSpreadsheet,
  Scale,
  Send,
  Handshake,
  Gavel,
  MessageSquare,
  Inbox,
  ClipboardList,
  Package,
  Building,
  Folder,
  Download,
  X,
  ChevronDown,
  Clock,
  AlertCircle,
  Maximize2,
  Loader2,
  Settings,
} from 'lucide-react';

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
  caseType: string;
  clientName: string;
  documents: DocumentData[];
}

const CASE_STATUSES = [
  { value: 'intake', label: 'Intake' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'demand', label: 'Demand' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'litigation', label: 'Litigation' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

const ALL_CATEGORIES = [
  { key: 'medical_record', icon: FileText, label: 'Medical Records', group: 'Medical', universal: true },
  { key: 'medical_bill', icon: DollarSign, label: 'Medical Bills', group: 'Medical', universal: true },
  { key: 'diagnostic_imaging', icon: Activity, label: 'Diagnostic Imaging', group: 'Medical', universal: true },
  { key: 'pharmacy_record', icon: Pill, label: 'Pharmacy Records', group: 'Medical', universal: true },
  { key: 'police_report', icon: Shield, label: 'Police Report', group: 'Incident', caseTypes: ['auto_accident', 'wrongful_death', 'slip_and_fall', 'premises_liability'] },
  { key: 'incident_photo', icon: Camera, label: 'Incident Photos', group: 'Incident', universal: true },
  { key: 'witness_statement', icon: Eye, label: 'Witness Statements', group: 'Incident', universal: true },
  { key: 'pay_stub', icon: CreditCard, label: 'Pay Stubs', group: 'Financial', universal: true },
  { key: 'employer_letter', icon: Mail, label: 'Employer Letters', group: 'Financial', universal: true },
  { key: 'tax_document', icon: FileSpreadsheet, label: 'Tax Documents', group: 'Financial', universal: true },
  { key: 'insurance_policy', icon: FileCheck, label: 'Insurance Policy', group: 'Insurance', universal: true },
  { key: 'insurance_claim', icon: Briefcase, label: 'Insurance Claims', group: 'Insurance', universal: true },
  { key: 'denial_letter', icon: FileMinus, label: 'Denial Letters', group: 'Insurance', universal: true },
  { key: 'retainer_agreement', icon: Scale, label: 'Retainer Agreement', group: 'Legal', universal: true },
  { key: 'demand_letter', icon: Send, label: 'Demand Letters', group: 'Legal', universal: true },
  { key: 'settlement_document', icon: Handshake, label: 'Settlement Documents', group: 'Legal', universal: true },
  { key: 'court_filing', icon: Gavel, label: 'Court Filings', group: 'Legal', caseTypes: ['medical_malpractice', 'wrongful_death', 'product_liability'] },
  { key: 'client_correspondence', icon: MessageSquare, label: 'Client Correspondence', group: 'Communication', universal: true },
  { key: 'provider_correspondence', icon: Inbox, label: 'Provider Correspondence', group: 'Communication', universal: true },
  { key: 'client_intake', icon: ClipboardList, label: 'Client Intake', group: 'Intake', universal: true },
  { key: 'product_documentation', icon: Package, label: 'Product Documentation', group: 'Product', caseTypes: ['product_liability'] },
  { key: 'employer_report', icon: Building, label: 'Employer Incident Report', group: 'Workers Comp', caseTypes: ['workers_comp'] },
  { key: 'other', icon: Folder, label: 'Miscellaneous / Uncategorized', group: 'Other', universal: true },
];

const GROUP_ORDER = ['Medical', 'Incident', 'Financial', 'Insurance', 'Legal', 'Communication', 'Intake', 'Product', 'Workers Comp', 'Other'];

function isRecentlyAdded(uploadedAt?: string): boolean {
  if (!uploadedAt) return false;
  const hoursDiff = (Date.now() - new Date(uploadedAt).getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

function needsAttention(status: string): boolean {
  return status?.includes('fail') || status === 'pending_assignment';
}

export default function DocumentGalleryClient({ caseId, caseNumber, caseType, clientName, documents }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['medical_record', 'police_report']));
  const [viewingDoc, setViewingDoc] = useState<DocumentData | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [caseStatus, setCaseStatus] = useState<string>('intake');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const visibleCategories = ALL_CATEGORIES.filter(cat => {
    if (cat.universal) return true;
    if (cat.caseTypes && cat.caseTypes.includes(caseType)) return true;
    return documents.some(d => d.category === cat.key);
  });

  const docsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocumentData[]>);

  const sortedCategories = visibleCategories.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  const categoriesWithNewDocs = new Set(documents.filter(d => isRecentlyAdded(d.uploadedAt)).map(d => d.category || 'other'));
  const categoriesNeedingAttention = new Set(documents.filter(d => needsAttention(d.status)).map(d => d.category || 'other'));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const updateCaseStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCaseStatus(newStatus);
        setShowStatusPanel(false);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openDocument = async (doc: DocumentData) => {
    setViewingDoc(doc);
    setLoadingDoc(true);
    setDocContent('');
    setPdfUrl('');

    try {
      // For images, no need to fetch - the img tag will handle it
      if (doc.file?.mimeType?.startsWith('image/')) {
        setLoadingDoc(false);
        return;
      }

      // For PDFs, get the raw file
      if (doc.file?.mimeType === 'application/pdf') {
        const res = await fetch(`/api/documents/${doc._id}/raw`);
        if (res.ok && res.headers.get('content-type')?.includes('pdf')) {
          const blob = await res.blob();
          setPdfUrl(window.URL.createObjectURL(blob));
        }
      }
      
      // For text files, fetch raw content directly
      const isTextFile = doc.file?.mimeType?.includes('text') || 
                         doc.file?.originalName?.endsWith('.txt') ||
                         doc.file?.originalName?.endsWith('.md') ||
                         doc.file?.originalName?.endsWith('.csv') ||
                         doc.file?.originalName?.endsWith('.json');
      
      if (isTextFile) {
        const rawRes = await fetch(`/api/documents/${doc._id}/raw`);
        if (rawRes.ok) {
          const text = await rawRes.text();
          setDocContent(text);
          setLoadingDoc(false);
          return;
        }
      }
      
      // For other files, try to get extracted content from MongoDB
      const contentRes = await fetch(`/api/documents/${doc._id}/content`);
      if (contentRes.ok) {
        const data = await contentRes.json();
        setDocContent(data.content || data.text || doc.extractedContent?.text || '');
      } else {
        setDocContent(doc.extractedContent?.text || '');
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setDocContent(doc.extractedContent?.text || 'Error loading document');
    } finally {
      setLoadingDoc(false);
    }
  };

  const closeViewer = () => {
    if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
    setViewingDoc(null);
    setDocContent('');
    setIsFullscreen(false);
  };

  const downloadDocument = async (doc: DocumentData) => {
    try {
      const res = await fetch(`/api/documents/${doc._id}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file?.originalName || doc.title || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Download failed');
      }
    } catch {
      alert('Failed to download');
    }
  };

  let currentGroup = '';

  // Fullscreen modal for PDF
  if (isFullscreen && viewingDoc && pdfUrl) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-[#4b1d1d] text-white px-6 py-3 flex items-center justify-between">
          <h3 className={`text-lg font-bold ${radley.className}`}>{viewingDoc.title}</h3>
          <div className="flex items-center gap-4">
            <button onClick={() => downloadDocument(viewingDoc)} className="flex items-center gap-2 text-sm px-4 py-2 bg-white/20 rounded hover:bg-white/30">
              <Download size={16} /> Download
            </button>
            <button onClick={() => setIsFullscreen(false)} className="text-2xl hover:text-amber-200">
              <X size={28} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-900 overflow-auto flex items-start justify-center p-4">
          <object
            data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            type="application/pdf"
            className="w-full max-w-4xl bg-white shadow-2xl"
            style={{ height: 'calc(100vh - 80px)' }}
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              title={viewingDoc.title}
            />
          </object>
        </div>
      </div>
    );
  }

  const currentStatusConfig = CASE_STATUSES.find(s => s.value === caseStatus) || CASE_STATUSES[0];

  return (
    <div className={`min-h-screen bg-[#f0ece6] ${poppins.className}`}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header with Status Tab */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/app" className="text-[#4b1d1d] hover:underline text-sm mb-2 inline-block">← Back to Dashboard</Link>
            <h1 className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}>Case Documents</h1>
            <p className="text-[#4b1d1d]/70 mt-1">{caseNumber} • {clientName} • <span className="capitalize">{caseType.replace(/_/g, ' ')}</span></p>
          </div>
          <div className="flex items-center gap-4">
            {/* Case Status Tab - Maroon button */}
            <div className="relative">
              <button
                onClick={() => setShowStatusPanel(!showStatusPanel)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4b1d1d] text-white hover:bg-[#5a2424] transition"
              >
                <Settings size={16} />
                <span className="font-medium">{currentStatusConfig.label}</span>
                <ChevronDown size={16} className={`transition-transform ${showStatusPanel ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown - White/Cream background */}
              {showStatusPanel && (
                <div className="absolute right-0 top-full mt-2 bg-white shadow-xl border border-[#e6ded3] rounded-lg py-2 z-50 min-w-[200px]">
                  <p className="px-4 py-2 text-xs font-semibold text-[#4b1d1d]/60 uppercase">Change Case Status</p>
                  {CASE_STATUSES.map(status => (
                    <button
                      key={status.value}
                      onClick={() => updateCaseStatus(status.value)}
                      disabled={updatingStatus}
                      className={`w-full px-4 py-2 text-left hover:bg-[#f0ece6] flex items-center justify-between text-[#4b1d1d] ${caseStatus === status.value ? 'bg-[#f0ece6]' : ''}`}
                    >
                      <span className="font-medium">{status.label}</span>
                      {caseStatus === status.value && <span className="text-[#4b1d1d]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold text-[#4b1d1d]">{documents.length}</p>
              <p className="text-sm text-[#4b1d1d]/70">Total Documents</p>
            </div>
          </div>
        </div>

        {/* Click outside to close status panel */}
        {showStatusPanel && (
          <div className="fixed inset-0 z-40" onClick={() => setShowStatusPanel(false)} />
        )}

        <div className="flex gap-6">
          <div className={`space-y-3 ${viewingDoc ? 'w-1/3' : 'w-full'} transition-all`}>
            {sortedCategories.map((cat, idx) => {
              const docs = docsByCategory[cat.key] || [];
              const isExpanded = expandedCategories.has(cat.key);
              const showGroupHeader = cat.group !== currentGroup;
              const hasNewDocs = categoriesWithNewDocs.has(cat.key);
              const hasAttention = categoriesNeedingAttention.has(cat.key);
              const IconComponent = cat.icon;
              if (showGroupHeader) currentGroup = cat.group;

              return (
                <div key={cat.key}>
                  {showGroupHeader && idx > 0 && (
                    <div className="pt-4 pb-2">
                      <p className="text-xs font-semibold text-[#4b1d1d]/50 uppercase tracking-wider">{cat.group}</p>
                    </div>
                  )}
                  <div className={`bg-white shadow border overflow-hidden ${hasAttention ? 'border-[#4b1d1d]' : hasNewDocs ? 'border-green-300' : 'border-[#e6ded3]'}`}>
                    <button
                      onClick={() => toggleCategory(cat.key)}
                      className={`w-full px-5 py-3 flex items-center justify-between transition-colors ${
                        docs.length > 0 
                          ? hasAttention ? 'bg-[#4b1d1d] text-white hover:bg-[#3a1616]'
                            : hasNewDocs ? 'bg-green-700 text-white hover:bg-green-800'
                            : 'bg-[#4b1d1d] text-white hover:bg-[#5a2424]'
                          : 'bg-gray-50 text-[#4b1d1d]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={20} className={docs.length === 0 ? 'text-[#4b1d1d]/60' : ''} />
                        <span className={`font-semibold ${radley.className} ${docs.length === 0 ? 'text-[#4b1d1d]/60' : ''}`}>{cat.label}</span>
                        {hasNewDocs && !hasAttention && <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full"><Clock size={12} /> New</span>}
                        {hasAttention && <span className="flex items-center gap-1 text-xs bg-[#f0a56b] text-[#4b1d1d] px-2 py-0.5 rounded-full"><AlertCircle size={12} /> Attention</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${docs.length > 0 ? 'bg-white/20 text-white' : 'bg-[#4b1d1d]/10 text-[#4b1d1d]/60'}`}>{docs.length}</span>
                        {docs.length > 0 && <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
                      </div>
                    </button>
                    {isExpanded && docs.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {docs.map(doc => (
                          <div key={doc._id} onClick={() => openDocument(doc)} className={`px-5 py-3 flex items-center justify-between cursor-pointer ${viewingDoc?._id === doc._id ? 'bg-amber-100' : 'hover:bg-amber-50'}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText size={18} className="text-gray-400" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate text-sm">{doc.title}</p>
                                <p className="text-xs text-gray-500">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}{doc.file?.size ? ` • ${(doc.file.size / 1024).toFixed(0)} KB` : ''}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{doc.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {viewingDoc && (
            <div className="w-2/3 bg-white shadow border border-[#e6ded3] overflow-hidden sticky top-6 self-start max-h-[calc(100vh-80px)] min-h-[700px] flex flex-col">
              <div className="bg-[#4b1d1d] text-white px-5 py-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className={`text-lg font-bold truncate ${radley.className}`}>{viewingDoc.title}</h3>
                  <p className="text-xs text-amber-200">{ALL_CATEGORIES.find(c => c.key === viewingDoc.category)?.label || viewingDoc.category}</p>
                </div>
                <button onClick={closeViewer} className="hover:text-amber-200 ml-4"><X size={24} /></button>
              </div>

              <div className="px-5 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-500">{viewingDoc.file?.originalName} • {((viewingDoc.file?.size || 0) / 1024).toFixed(0)} KB</div>
                <div className="flex items-center gap-2">
                  {pdfUrl && (
                    <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-1 text-xs px-3 py-1 border border-[#4b1d1d] text-[#4b1d1d] rounded hover:bg-[#f0ece6]">
                      <Maximize2 size={14} /> Fullscreen
                    </button>
                  )}
                  <button onClick={() => downloadDocument(viewingDoc)} className="flex items-center gap-1 text-xs px-3 py-1 bg-[#4b1d1d] text-white rounded hover:bg-[#5a2424]"><Download size={14} /> Download</button>
                </div>
              </div>

              <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-[#f0ece6]">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-[#4b1d1d]" />
                  <p className="text-sm font-semibold text-[#4b1d1d]">AI Document Overview</p>
                </div>
                {viewingDoc.aiAnalysis?.summary ? (
                  <p className="text-sm text-gray-700 mb-3">{viewingDoc.aiAnalysis.summary}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic mb-3">AI analysis pending. Document will be analyzed automatically.</p>
                )}
                {viewingDoc.aiAnalysis?.keyFindings && viewingDoc.aiAnalysis.keyFindings.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    {viewingDoc.aiAnalysis.keyFindings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-[#f0a56b]">•</span><span>{finding}</span></li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 pt-3 border-t border-[#e6ded3] grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">Category:</span> <span className="text-gray-700">{ALL_CATEGORIES.find(c => c.key === viewingDoc.category)?.label || 'Uncategorized'}</span></div>
                  <div><span className="text-gray-500">Status:</span> <span className={viewingDoc.status === 'processed' ? 'text-green-600' : 'text-amber-600'}>{viewingDoc.status}</span></div>
                  <div><span className="text-gray-500">Uploaded:</span> <span className="text-gray-700">{viewingDoc.uploadedAt ? new Date(viewingDoc.uploadedAt).toLocaleDateString() : 'Unknown'}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="text-gray-700">{viewingDoc.file?.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown'}</span></div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col min-h-[350px]">
                {loadingDoc ? (
                  <div className="flex items-center justify-center pt-12">
                    <div className="text-center text-[#4b1d1d]">
                      <Loader2 size={28} className="animate-spin mx-auto mb-2" />
                      <p className="text-sm">Loading...</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <object data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} type="application/pdf" className="w-full flex-1 min-h-[400px]">
                    <div className="flex items-center justify-center h-full p-5">
                      <div className="text-center text-gray-500">
                        <p>PDF preview not available.</p>
                        <button onClick={() => setIsFullscreen(true)} className="mt-4 px-4 py-2 bg-[#4b1d1d] text-white rounded hover:bg-[#5a2424]">Open Fullscreen</button>
                      </div>
                    </div>
                  </object>
                ) : viewingDoc.file?.mimeType?.startsWith('image/') ? (
                  <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
                    <img src={`/api/documents/${viewingDoc._id}/raw`} alt={viewingDoc.title} className="max-w-full max-h-full object-contain shadow-lg rounded" />
                  </div>
                ) : docContent ? (
                  <div className="flex-1 overflow-auto">
                    <div className="px-5 py-2 bg-gray-100 border-b border-gray-200 sticky top-0">
                      <p className="text-xs text-gray-500">
                        {viewingDoc.file?.mimeType?.includes('text') || viewingDoc.file?.originalName?.match(/\.(txt|md|csv|json)$/i)
                          ? `File Content (${viewingDoc.file?.originalName || 'text file'})`
                          : 'Extracted Text'} • {docContent.length.toLocaleString()} characters
                      </p>
                    </div>
                    <div className="p-5 bg-white">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{docContent}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full p-5">
                    <div className="text-center text-gray-400">
                      <Folder size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No preview available</p>
                      <p className="text-sm mt-1">Click Download to view the file.</p>
                      <button onClick={() => downloadDocument(viewingDoc)} className="mt-4 px-4 py-2 bg-[#4b1d1d] text-white rounded hover:bg-[#5a2424]">Download File</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}