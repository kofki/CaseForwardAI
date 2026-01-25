/**
 * Document Categorization Service
 * 
 * Uses AI to automatically categorize documents based on their content.
 * This is the first step in the document processing pipeline:
 * 
 * 1. Document uploaded → R2 + MongoDB
 * 2. Content extracted (PDF, TXT, etc.)
 * 3. AI categorizes document ← THIS SERVICE
 * 4. Document assigned to case (if matched)
 * 5. Round Table analyzes for insights
 */

import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { getGeminiModel } from '../core/gemini';
import {
  DocumentCategory,
  DocumentCategoryLabels,
  DocumentCategoryGroups,
} from '@/lib/db/types/enums';

// ============================================
// Types
// ============================================

export interface CategorizationResult {
  category: DocumentCategory;
  confidence: number;
  subcategory?: string;
  suggestedTitle?: string;
  extractedEntities: {
    patientName?: string;
    providerName?: string;
    providerType?: string;
    dateOfService?: string;
    amounts?: string[];
    diagnoses?: string[];
    procedures?: string[];
    caseReferences?: string[];
  };
  reasoning: string;
}

export interface BatchCategorizationResult {
  documentId: string;
  result: CategorizationResult;
  processingTimeMs: number;
}

// ============================================
// Schema for AI response
// ============================================

const CategorizationSchema = z.object({
  category: z.enum([
    'medical_record',
    'medical_bill',
    'diagnostic_imaging',
    'pharmacy_record',
    'police_report',
    'incident_photo',
    'witness_statement',
    'pay_stub',
    'employer_letter',
    'tax_document',
    'insurance_policy',
    'insurance_claim',
    'denial_letter',
    'retainer_agreement',
    'demand_letter',
    'settlement_document',
    'court_filing',
    'client_correspondence',
    'provider_correspondence',
    'client_intake',
    'other',
  ]).describe('The document category based on content analysis'),

  confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),

  subcategory: z.string().optional().describe('More specific subcategory if applicable'),

  suggestedTitle: z.string().describe('A clear, descriptive title for this document'),

  extractedEntities: z.object({
    patientName: z.string().optional().describe('Patient/client name if found'),
    providerName: z.string().optional().describe('Medical provider, facility, or company name'),
    providerType: z.string().optional().describe('Type of provider (hospital, clinic, specialist, etc.)'),
    dateOfService: z.string().optional().describe('Primary date of service or incident'),
    amounts: z.array(z.string()).optional().describe('Dollar amounts found'),
    diagnoses: z.array(z.string()).optional().describe('Medical diagnoses or conditions'),
    procedures: z.array(z.string()).optional().describe('Medical procedures or treatments'),
    caseReferences: z.array(z.string()).optional().describe('Case numbers, claim numbers, or references'),
  }),

  reasoning: z.string().describe('Brief explanation of why this category was chosen'),
});

// ============================================
// Main categorization function
// ============================================

const CATEGORIZATION_PROMPT = `You are a legal document categorization AI assistant for a personal injury law firm.

Your task is to analyze document content and categorize it into the correct category for case management.

## Document Categories

**Medical Documents:**
- medical_record: Hospital records, ER visits, doctor's notes, treatment records
- medical_bill: Bills from healthcare providers, itemized charges
- diagnostic_imaging: X-rays, MRIs, CT scans, radiology reports
- pharmacy_record: Prescription records, medication lists

**Incident Documents:**
- police_report: Official accident/incident reports from law enforcement
- incident_photo: Photos of accident scene, injuries, property damage
- witness_statement: Written statements from witnesses

**Financial Documents:**
- pay_stub: Proof of income, pay statements
- employer_letter: Lost wage verification, employment letters
- tax_document: W-2s, tax returns, 1099s

**Insurance Documents:**
- insurance_policy: Policy documents, coverage information
- insurance_claim: Claim forms, claim correspondence
- denial_letter: Insurance denial of claim

**Legal Documents:**
- retainer_agreement: Attorney-client agreements
- demand_letter: Settlement demands to insurers
- settlement_document: Settlement agreements, releases
- court_filing: Pleadings, motions, court documents

**Correspondence:**
- client_correspondence: Emails, letters from/to client
- provider_correspondence: Letters from medical providers, insurers

**Intake:**
- client_intake: Initial client questionnaire, intake forms

**Other:**
- other: Documents that don't fit other categories

## Instructions

1. Read the document content carefully
2. Identify key indicators (letterhead, medical terms, legal language, etc.)
3. Extract relevant entities (names, dates, amounts)
4. Select the most appropriate category
5. Provide a confidence score (0.0-1.0)
6. Suggest a clear, descriptive title

Be precise. Medical records and medical bills are different. A police report is not a witness statement.
`;

export async function categorizeDocument(
  documentText: string,
  fileName?: string,
  mimeType?: string
): Promise<CategorizationResult> {
  const model = getGeminiModel('gemma-3-27b-it');

  const userPrompt = `Analyze and categorize this document:

**File Name:** ${fileName || 'Unknown'}
**File Type:** ${mimeType || 'Unknown'}

**Document Content:**
${documentText.substring(0, 15000)}

${documentText.length > 15000 ? `\n[Content truncated - ${documentText.length} total characters]` : ''}

Categorize this document and extract relevant information.
Respond with a valid JSON object strictly matching the schema.`;

  try {
    const { text } = await generateText({
      model,
      system: CATEGORIZATION_PROMPT + "\n\nCRITICAL: OUTPUT VALID JSON ONLY. NO MARKDOWN.",
      prompt: userPrompt + "\n\nEnsure the output matches the CategorizationSchema structure precisely.",
    });

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    return {
      category: result.category as DocumentCategory,
      confidence: result.confidence,
      subcategory: result.subcategory,
      suggestedTitle: result.suggestedTitle,
      extractedEntities: result.extractedEntities || {},
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('[Categorization] AI error:', error);

    // Fallback: try to infer from filename
    const category = inferCategoryFromFileName(fileName || '');

    return {
      category,
      confidence: 0.3,
      suggestedTitle: fileName || 'Unknown Document',
      extractedEntities: {},
      reasoning: 'AI categorization failed, inferred from filename',
    };
  }
}

/**
 * Categorize multiple documents in a batch
 */
export async function categorizeDocumentBatch(
  documents: Array<{
    documentId: string;
    text: string;
    fileName?: string;
    mimeType?: string;
  }>
): Promise<BatchCategorizationResult[]> {
  const results: BatchCategorizationResult[] = [];

  for (const doc of documents) {
    const startTime = Date.now();

    const result = await categorizeDocument(
      doc.text,
      doc.fileName,
      doc.mimeType
    );

    results.push({
      documentId: doc.documentId,
      result,
      processingTimeMs: Date.now() - startTime,
    });
  }

  return results;
}

/**
 * Fallback: Infer category from filename patterns
 */
function inferCategoryFromFileName(fileName: string): DocumentCategory {
  const lowerName = fileName.toLowerCase();

  // Medical
  if (lowerName.includes('medical') || lowerName.includes('record')) {
    return DocumentCategory.MEDICAL_RECORD;
  }
  if (lowerName.includes('bill') || lowerName.includes('invoice') || lowerName.includes('statement')) {
    return DocumentCategory.MEDICAL_BILL;
  }
  if (lowerName.includes('xray') || lowerName.includes('mri') || lowerName.includes('ct') || lowerName.includes('radiology')) {
    return DocumentCategory.DIAGNOSTIC_IMAGING;
  }
  if (lowerName.includes('rx') || lowerName.includes('prescription') || lowerName.includes('pharmacy')) {
    return DocumentCategory.PHARMACY_RECORD;
  }

  // Incident
  if (lowerName.includes('police') || lowerName.includes('accident report')) {
    return DocumentCategory.POLICE_REPORT;
  }
  if (lowerName.includes('photo') || lowerName.includes('image') || lowerName.includes('img')) {
    return DocumentCategory.INCIDENT_PHOTO;
  }
  if (lowerName.includes('witness')) {
    return DocumentCategory.WITNESS_STATEMENT;
  }

  // Financial
  if (lowerName.includes('pay') || lowerName.includes('stub') || lowerName.includes('wage')) {
    return DocumentCategory.PAY_STUB;
  }
  if (lowerName.includes('employer') || lowerName.includes('employment')) {
    return DocumentCategory.EMPLOYER_LETTER;
  }
  if (lowerName.includes('tax') || lowerName.includes('w2') || lowerName.includes('1099')) {
    return DocumentCategory.TAX_DOCUMENT;
  }

  // Insurance
  if (lowerName.includes('policy')) {
    return DocumentCategory.INSURANCE_POLICY;
  }
  if (lowerName.includes('claim')) {
    return DocumentCategory.INSURANCE_CLAIM;
  }
  if (lowerName.includes('denial')) {
    return DocumentCategory.DENIAL_LETTER;
  }

  // Legal
  if (lowerName.includes('retainer') || lowerName.includes('agreement')) {
    return DocumentCategory.RETAINER_AGREEMENT;
  }
  if (lowerName.includes('demand')) {
    return DocumentCategory.DEMAND_LETTER;
  }
  if (lowerName.includes('settlement')) {
    return DocumentCategory.SETTLEMENT_DOCUMENT;
  }
  if (lowerName.includes('court') || lowerName.includes('filing') || lowerName.includes('motion')) {
    return DocumentCategory.COURT_FILING;
  }

  // Intake
  if (lowerName.includes('intake') || lowerName.includes('questionnaire')) {
    return DocumentCategory.CLIENT_INTAKE;
  }

  return DocumentCategory.OTHER;
}

/**
 * Get category group for a document category
 */
export function getCategoryGroup(category: DocumentCategory): string {
  for (const [group, categories] of Object.entries(DocumentCategoryGroups)) {
    if ((categories as DocumentCategory[]).includes(category)) {
      return group;
    }
  }
  return 'Other';
}

/**
 * Get emoji for a document category
 */
export function getCategoryEmoji(category: DocumentCategory): string {
  const emojiMap: Record<DocumentCategory, string> = {
    [DocumentCategory.MEDICAL_RECORD]: '📊',
    [DocumentCategory.MEDICAL_BILL]: '💵',
    [DocumentCategory.DIAGNOSTIC_IMAGING]: '🩻',
    [DocumentCategory.PHARMACY_RECORD]: '💊',
    [DocumentCategory.POLICE_REPORT]: '👮',
    [DocumentCategory.INCIDENT_PHOTO]: '📸',
    [DocumentCategory.WITNESS_STATEMENT]: '👁️',
    [DocumentCategory.PAY_STUB]: '💰',
    [DocumentCategory.EMPLOYER_LETTER]: '✉️',
    [DocumentCategory.TAX_DOCUMENT]: '📋',
    [DocumentCategory.INSURANCE_POLICY]: '📋',
    [DocumentCategory.INSURANCE_CLAIM]: '📄',
    [DocumentCategory.DENIAL_LETTER]: '❌',
    [DocumentCategory.RETAINER_AGREEMENT]: '✍️',
    [DocumentCategory.DEMAND_LETTER]: '📨',
    [DocumentCategory.SETTLEMENT_DOCUMENT]: '🤝',
    [DocumentCategory.COURT_FILING]: '⚖️',
    [DocumentCategory.CLIENT_CORRESPONDENCE]: '💬',
    [DocumentCategory.PROVIDER_CORRESPONDENCE]: '📬',
    [DocumentCategory.CLIENT_INTAKE]: '📝',
    [DocumentCategory.OTHER]: '📁',
  };

  return emojiMap[category] || '📄';
}
