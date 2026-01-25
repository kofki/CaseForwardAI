'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Poppins, Radley } from 'next/font/google';
import DocumentQueue from '@/components/DocumentQueue';

const poppins = Poppins({ subsets: ['latin'], weight: '500' });
const radley = Radley({ subsets: ['latin'], weight: '400' });

interface FormData {
  caseNumber: string;
  incidentDate: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  caseType: string;
  priority: string;
  assignTo: string;
}

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

export default function NewCaseForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    caseNumber: '',
    incidentDate: '',
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    description: '',
    caseType: 'auto_accident',
    priority: 'medium',
    assignTo: 'AI Orchestrator',
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);

  // New state for document queue
  const [createdCaseId, setCreatedCaseId] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');
  const [queuedDocuments, setQueuedDocuments] = useState<QueuedDocument[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [showChannelPull, setShowChannelPull] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setUploadProgress([]);
    setQueuedDocuments([]);
    setShowQueue(false);

    try {
      // Step 1: Create the case
      setUploadProgress(prev => [...prev, '📋 Creating case...']);

      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseNumber: formData.caseNumber || `CF-${Date.now()}`,
          incidentDate: formData.incidentDate,
          clientFirstName: formData.clientFirstName,
          clientLastName: formData.clientLastName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          description: formData.description,
          caseType: formData.caseType,
          priority: formData.priority,
          assignTo: formData.assignTo,
        }),
      });

      const caseData = await caseRes.json();

      if (!caseRes.ok) {
        throw new Error(caseData.message || 'Failed to create case');
      }

      setCreatedCaseId(caseData.caseId);
      setUploadProgress(prev => [...prev, `✅ Case created: ${caseData.caseNumber}`]);

      // Step 2: Batch upload files if any
      if (files.length > 0) {
        setUploadProgress(prev => [...prev, `📤 Uploading ${files.length} file(s)...`]);

        const formDataUpload = new FormData();
        files.forEach(file => {
          formDataUpload.append('files', file);
        });
        formDataUpload.append('caseId', caseData.caseId);
        formDataUpload.append('uploadedBy', 'web-intake');

        const batchRes = await fetch('/api/intake/batch', {
          method: 'POST',
          body: formDataUpload,
        });

        const batchData = await batchRes.json();

        if (batchRes.ok && batchData.success) {
          setBatchId(batchData.batchId);
          setUploadProgress(prev => [...prev, `✅ Uploaded ${batchData.processed} file(s)`]);

          if (batchData.failed > 0) {
            setUploadProgress(prev => [...prev, `⚠️ ${batchData.failed} file(s) failed to upload`]);
          }

          // Convert batch files to queue format
          const queueDocs: QueuedDocument[] = batchData.files
            .filter((f: any) => f.status === 'queued')
            .map((f: any) => ({
              documentId: f.documentId,
              fileName: f.fileName,
              status: 'queued' as const,
              mimeType: f.mimeType,
              size: f.size,
            }));

          if (queueDocs.length > 0) {
            setQueuedDocuments(queueDocs);
            setShowQueue(true);
            setUploadProgress(prev => [...prev, `🤖 Starting AI categorization...`]);
          } else {
            // No documents to process, redirect
            setUploadProgress(prev => [...prev, '🎉 Case setup complete!']);
            setTimeout(() => {
              router.push(`/app/case/${caseData.caseId}/documents`);
            }, 1500);
          }
        } else {
          throw new Error(batchData.message || 'Batch upload failed');
        }
      } else {
        // No files to upload
        setUploadProgress(prev => [...prev, '🎉 Case setup complete!']);
        setTimeout(() => {
          router.push(`/app/case/${caseData.caseId}`);
        }, 1500);
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setUploadProgress(prev => [...prev, `❌ Error: ${err.message}`]);
      setIsSubmitting(false);
    }
  };

  const handleQueueComplete = () => {
    setUploadProgress(prev => [...prev, '🎉 All documents processed!']);
    setIsSubmitting(false);

    // Redirect after a short delay
    setTimeout(() => {
      if (createdCaseId) {
        router.push(`/app/case/${createdCaseId}/documents`);
      }
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-[#f0ece6] ${poppins.className}`}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[#4b1d1d]/80 uppercase tracking-[0.08em]">
              Case Intake
            </p>
            <h1 className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}>
              Register New Case
            </h1>
            <p className="text-sm text-[#4b1d1d]/70 mt-2">
              Create a new case and upload documents for AI analysis.
            </p>
          </div>
          <Link
            href="/app"
            className="text-[#4b1d1d] hover:text-[#301010] font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            {/* Main Form */}
            <div className="bg-white shadow border border-[#e6ded3] rounded-none">
              <div className="bg-[#4b1d1d] text-white px-6 py-4 rounded-none flex items-center justify-between border-b border-white/15">
                <div>
                  <p className="text-sm text-amber-200">Case Details</p>
                  <h2 className="text-2xl font-bold">Primary Information</h2>
                </div>
                <span className="text-3xl">📂</span>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Case Number</span>
                    <input
                      type="text"
                      name="caseNumber"
                      value={formData.caseNumber}
                      onChange={handleInputChange}
                      placeholder="CF-2026-001 (auto-generated if empty)"
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Incident Date *</span>
                    <input
                      type="date"
                      name="incidentDate"
                      value={formData.incidentDate}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">First Name *</span>
                    <input
                      type="text"
                      name="clientFirstName"
                      value={formData.clientFirstName}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      required
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Last Name *</span>
                    <input
                      type="text"
                      name="clientLastName"
                      value={formData.clientLastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Client Email</span>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleInputChange}
                      placeholder="jane.doe@example.com"
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Phone</span>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#4b1d1d]">Case Summary</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Briefly describe the incident, location, and key notes."
                    className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Case Type</span>
                    <select
                      name="caseType"
                      value={formData.caseType}
                      onChange={handleInputChange}
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    >
                      <option value="auto_accident">Auto Accident</option>
                      <option value="slip_and_fall">Slip and Fall</option>
                      <option value="premises_liability">Premises Liability</option>
                      <option value="medical_malpractice">Medical Malpractice</option>
                      <option value="wrongful_death">Wrongful Death</option>
                      <option value="product_liability">Product Liability</option>
                      <option value="workers_comp">Workers Compensation</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#4b1d1d]">Priority</span>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Standard</option>
                      <option value="high">High / Urgent</option>
                      <option value="critical">Critical / Time Sensitive</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Link
                    href="/app"
                    className="px-5 py-3 rounded-none border border-[#d7cfc3] text-[#4b1d1d] font-semibold hover:bg-[#f7f1eb]"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-none bg-[#f0a56b] text-[#4b1d1d] font-semibold hover:bg-amber-400 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating Case...' : 'Create Case & Analyze'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* File Upload - Enhanced */}
              <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
                <div className="bg-[#4b1d1d] text-white px-5 py-3 flex items-center justify-between border-b border-white/15">
                  <div>
                    <p className="text-sm text-amber-200">Evidence</p>
                    <h3 className="text-xl font-bold">Upload Case Files</h3>
                  </div>
                  <span className="text-2xl">📤</span>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-700">
                    Upload multiple files at once. AI will analyze and categorize them automatically.
                  </p>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#d7cfc3] bg-[#f7f1eb] rounded-none px-4 py-8 text-center cursor-pointer hover:border-[#f0a56b] transition-colors">
                    <span className="text-3xl">📁</span>
                    <span className="text-sm font-semibold text-[#4b1d1d]">
                      {files.length > 0
                        ? `${files.length} file(s) selected`
                        : 'Drop files here or click to browse'
                      }
                    </span>
                    <span className="text-xs text-gray-600">
                      PDF, TXT, PNG, JPG, RTF, CSV, MD, HTML — up to 50 MB each
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.text,.md,.markdown,.csv,.html,.htm,.rtf,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* File list with remove option */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#4b1d1d]">
                          Selected Files ({files.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles([])}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear All
                        </button>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                        {files.map((file, i) => (
                          <li key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <span>📄</span>
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-gray-400 text-xs whitespace-nowrap">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              type="button"
                              onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Pull From Channel - Collapsible */}
              <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
                <button
                  type="button"
                  onClick={() => setShowChannelPull(!showChannelPull)}
                  className="w-full bg-[#4b1d1d] text-white px-5 py-3 flex items-center justify-between border-b border-white/15"
                >
                  <div className="text-left">
                    <p className="text-sm text-amber-200">Optional</p>
                    <h3 className="text-xl font-bold">Pull From Channel</h3>
                  </div>
                  <span className="text-2xl">{showChannelPull ? '▲' : '▼'}</span>
                </button>

                {showChannelPull && (
                  <div className="p-5 space-y-3">
                    <p className="text-sm text-gray-500">
                      Connect to external sources to import documents automatically.
                    </p>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#4b1d1d]">
                        Select Source
                      </span>
                      <select className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]">
                        <option value="">-- Select a source --</option>
                        <option value="email">Email Intake</option>
                        <option value="slack">Slack Channel</option>
                        <option value="teams">Teams Channel</option>
                        <option value="gdrive">Google Drive</option>
                        <option value="dropbox">Dropbox</option>
                        <option value="onedrive">OneDrive</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-[#4b1d1d]">
                        Link or Identifier
                      </span>
                      <input
                        type="text"
                        placeholder="Paste channel link or folder ID"
                        className="w-full rounded-none border border-[#d7cfc3] bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b]"
                      />
                    </label>
                    <button
                      type="button"
                      className="w-full px-4 py-3 mt-1 rounded-none bg-gray-200 text-gray-600 font-semibold cursor-not-allowed"
                      disabled
                    >
                      Coming Soon
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Log */}
              {uploadProgress.length > 0 && (
                <div className="bg-white shadow border border-[#e6ded3] overflow-hidden rounded-none">
                  <div className="bg-[#4b1d1d] text-white px-5 py-3 flex items-center justify-between border-b border-white/15">
                    <div>
                      <p className="text-sm text-amber-200">Progress</p>
                      <h3 className="text-xl font-bold">Processing Status</h3>
                    </div>
                    <span className="text-2xl">🔄</span>
                  </div>
                  <div className="p-5">
                    <ul className="text-sm space-y-2">
                      {uploadProgress.map((msg, i) => (
                        <li key={i} className="text-gray-700">{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Document Queue - AI Processing */}
              {showQueue && queuedDocuments.length > 0 && (
                <DocumentQueue
                  caseId={createdCaseId}
                  batchId={batchId}
                  documents={queuedDocuments}
                  onAllProcessed={handleQueueComplete}
                />
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
