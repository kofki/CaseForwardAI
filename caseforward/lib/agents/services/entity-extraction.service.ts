/**
 * Entity Extraction Service
 * 
 * Extracts key entities from document text for case matching and analysis.
 * Uses Gemini to identify patient names, dates, providers, amounts, etc.
 */

import { z } from 'zod';
import { generateObject } from 'ai';
import { getGeminiModel } from '../core/gemini';

// ============================================
// Types
// ============================================

export interface EntityExtractionResult {
  // Person identification
  patientName?: string;
  patientDOB?: string;
  patientSSN?: string; // Last 4 only for matching
  
  // Provider information
  providerName?: string;
  providerAddress?: string;
  providerNPI?: string;
  
  // Dates
  dates?: Date[];
  dateOfService?: Date;
  dateOfInjury?: Date;
  
  // Financial
  amounts?: number[];
  totalCharges?: number;
  balanceDue?: number;
  
  // Case identifiers
  claimNumber?: string;
  caseNumber?: string;
  policyNumber?: string;
  
  // Incident details
  incidentLocation?: string;
  vehicleInfo?: string;
  
  // Medical
  diagnoses?: string[];
  procedures?: string[];
  icdCodes?: string[];
  cptCodes?: string[];
  
  // Metadata
  documentType?: string;
  confidence: number;
}

const EntitySchema = z.object({
  patientName: z.string().optional(),
  patientDOB: z.string().optional(),
  patientSSNLast4: z.string().optional(),
  
  providerName: z.string().optional(),
  providerAddress: z.string().optional(),
  providerNPI: z.string().optional(),
  
  dateOfService: z.string().optional(),
  dateOfInjury: z.string().optional(),
  otherDates: z.array(z.string()).optional(),
  
  totalCharges: z.number().optional(),
  balanceDue: z.number().optional(),
  otherAmounts: z.array(z.number()).optional(),
  
  claimNumber: z.string().optional(),
  caseNumber: z.string().optional(),
  policyNumber: z.string().optional(),
  
  incidentLocation: z.string().optional(),
  vehicleInfo: z.string().optional(),
  
  diagnoses: z.array(z.string()).optional(),
  procedures: z.array(z.string()).optional(),
  icdCodes: z.array(z.string()).optional(),
  cptCodes: z.array(z.string()).optional(),
  
  documentType: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

// ============================================
// Entity Extraction
// ============================================

export async function extractEntities(documentText: string): Promise<EntityExtractionResult> {
  // Truncate very long documents
  const text = documentText.length > 15000 
    ? documentText.substring(0, 15000) + '\n... [Document truncated for analysis]'
    : documentText;
  
  try {
    const result = await generateObject({
      model: getGeminiModel('gemini-2.5-flash'),
      schema: EntitySchema,
      prompt: `
You are an expert legal document analyzer. Extract all relevant entities from this document.

DOCUMENT TEXT:
---
${text}
---

INSTRUCTIONS:
1. Extract the PATIENT/CLIENT name (the person who was injured)
2. Extract dates in ISO format (YYYY-MM-DD)
3. Extract all monetary amounts
4. Look for case numbers, claim numbers, policy numbers
5. For medical documents, extract diagnoses, procedures, and codes
6. Determine the document type (medical record, bill, police report, etc.)
7. Provide a confidence score (0-1) based on how clearly you could extract information

Be precise. Only extract what is clearly present in the document.
      `,
    });
    
    const obj = result.object;
    
    return {
      patientName: obj.patientName,
      patientDOB: obj.patientDOB,
      patientSSN: obj.patientSSNLast4,
      
      providerName: obj.providerName,
      providerAddress: obj.providerAddress,
      providerNPI: obj.providerNPI,
      
      dateOfService: obj.dateOfService ? new Date(obj.dateOfService) : undefined,
      dateOfInjury: obj.dateOfInjury ? new Date(obj.dateOfInjury) : undefined,
      dates: obj.otherDates?.map(d => new Date(d)),
      
      totalCharges: obj.totalCharges,
      balanceDue: obj.balanceDue,
      amounts: obj.otherAmounts,
      
      claimNumber: obj.claimNumber,
      caseNumber: obj.caseNumber,
      policyNumber: obj.policyNumber,
      
      incidentLocation: obj.incidentLocation,
      vehicleInfo: obj.vehicleInfo,
      
      diagnoses: obj.diagnoses,
      procedures: obj.procedures,
      icdCodes: obj.icdCodes,
      cptCodes: obj.cptCodes,
      
      documentType: obj.documentType,
      confidence: obj.confidence,
    };
    
  } catch (error) {
    console.error('[EntityExtraction] Failed:', error);
    
    // Return minimal result on failure
    return {
      confidence: 0,
    };
  }
}

/**
 * Quick extraction for case matching (faster, less detailed)
 */
export async function extractQuickEntities(documentText: string): Promise<{
  patientName?: string;
  patientDOB?: string;
  dateOfInjury?: string;
  claimNumber?: string;
  confidence: number;
}> {
  const text = documentText.substring(0, 5000);
  
  try {
    const result = await generateObject({
      model: getGeminiModel('gemini-2.5-flash-lite'),
      schema: z.object({
        patientName: z.string().optional(),
        patientDOB: z.string().optional(),
        dateOfInjury: z.string().optional(),
        claimNumber: z.string().optional(),
        confidence: z.number(),
      }),
      prompt: `
Extract the patient/client name, DOB, date of injury, and any claim/case number from this document. Be quick and precise.

DOCUMENT:
${text}
      `,
    });
    
    return result.object;
    
  } catch (error) {
    return { confidence: 0 };
  }
}
