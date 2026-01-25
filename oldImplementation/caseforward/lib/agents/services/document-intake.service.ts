
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '../core/gemini';
import Case, { ICase } from '../../db/models/Case';
import connectToDatabase from '../../db/connect';
import { CaseStatus } from '../../db/types/enums';

// Zod schema for the intake decision
const IntakeDecisionSchema = z.object({
    action: z.enum(['ASSIGN', 'CREATE']),
    caseId: z.string().optional().describe('The ID of the existing case to assign this document to'),
    confidence: z.number().min(0).max(1).describe('Confidence level in this decision (0-1)'),
    reasoning: z.string().describe('Explanation for why this document belongs to the case or needs a new one'),
    newCaseData: z.object({
        clientName: z.string().describe('Full name of the client found in the document'),
        incidentDate: z.string().describe('Date of the incident if found (YYYY-MM-DD)'),
        location: z.string().optional().describe('Location of the incident'),
        description: z.string().describe('Brief description of the incident or case matter'),
        caseType: z.enum(['auto_accident', 'medical_malpractice', 'slip_and_fall', 'other']).optional(),
    }).optional().describe('Extracted data for creating a new case, if action is CREATE'),
});

export type IntakeDecision = z.infer<typeof IntakeDecisionSchema>;

export class DocumentIntakeService {
    /**
     * Analyzes a document (text and/or image) to determine if it belongs to an existing case
     * or if a new case should be created.
     * 
     * @param content Text content of the document (optional if image provided)
     * @param imageBase64 Base64 encoded image data (optional if text provided)
     * @param mimeType Mime type of the image (required if imageBase64 provided)
     */
    async processDocument(content: string = '', imageBase64?: string, mimeType?: string): Promise<IntakeDecision> {
        await connectToDatabase();

        // 1. Fetch concise list of active cases
        // We only need basic identifying info to match against
        const activeCases = await Case.find({
            status: { $ne: CaseStatus.CLOSED }
        })
            .select('_id caseNumber client.name incident.date incident.description')
            .limit(50) // Limit to avoid context window explosion, though Flash has huge context
            .lean<ICase[]>();

        // Format cases for the prompt
        const casesSummary = activeCases.map(c =>
            `- ID: ${c._id}\n  Case #: ${c.caseNumber}\n  Client: ${c.client.name}\n  Incident: ${c.incident.date.toISOString().split('T')[0]} - ${c.incident.description.substring(0, 100)}...`
        ).join('\n\n');

        // 2. Prepare the prompt messages
        const systemPrompt = `
      You are an expert Legal Intake Clerk. Your job is to route incoming documents.
      
      I will provide you with a document (text or image) and a list of ACTIVE CASES.
      
      Your task:
      1. Analyze the document to identify the Client Name, Incident Details, and Dates.
      2. Compare found details against the ACTIVE CASES list.
      3. If you find a STRONG MATCH (same client name AND similar incident/date):
         - Set action to 'ASSIGN'.
         - Return the matching 'caseId'.
      4. If you DO NOT find a match:
         - Set action to 'CREATE'.
         - Extract as much information as possible into 'newCaseData'.
      
      Confidence Threshold:
      - Only 'ASSIGN' if you are >80% sure. 
      - If unsure, prefer 'CREATE' or maybe flag for review (but for now output CREATE).
    `;

        const userPrompt = `
      ACTIVE CASES LIST:
      ${casesSummary}

      ---
      DOCUMENT CONTENT:
      ${content}
    `;

        // 3. call Gemini
        // Define structure manually to avoid deep type inference issues with AI SDK
        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: [
                    { type: 'text', text: userPrompt }
                ]
            }
        ];

        // Add image part if provided
        if (imageBase64 && mimeType) {
            if (Array.isArray(messages[1].content)) {
                messages[1].content.push({
                    type: 'image',
                    image: imageBase64,
                });
            }
        }

        // Using generateObject to get structured JSON
        const result = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: IntakeDecisionSchema as any, // Cast schema to any to definitely fix TS2589
            messages: messages as any,
        });

        return result.object as IntakeDecision; // Cast return back to typed object
    }

    /**
     * Orchestrates the full intake: analyzes document -> creates DB records.
     */
    async handleDocumentIntake(
        file: {
            originalName: string,
            storagePath: string,
            mimeType: string,
            size: number,
            hash: string
        },
        textContent: string = '',
        imageBase64?: string,
        uploadedBy: string = 'system'
    ): Promise<{
        success: boolean,
        decision: IntakeDecision,
        caseId?: string,
        documentId?: string,
        message: string
    }> {

        // 1. Analyze
        const decision = await this.processDocument(textContent, imageBase64, file.mimeType);

        let targetCaseId = decision.caseId;

        // 2. Execute Action
        if (decision.action === 'CREATE' && decision.newCaseData) {
            // Create new case
            const nc = decision.newCaseData;
            const newCase = await Case.create({
                caseNumber: `CASE-${Date.now().toString().slice(-6)}`, // specific logic can be improved
                fileNumber: `FILE-${Date.now().toString().slice(-6)}`,
                caseType: nc.caseType || 'other',
                status: CaseStatus.INTAKE,
                client: {
                    name: nc.clientName,
                    // placeholders as we might not have them yet
                    email: 'pending@intake.com', // In real app, might extract or leave empty/optional if schema allows
                    phone: '000-000-0000',
                },
                incident: {
                    date: nc.incidentDate ? new Date(nc.incidentDate) : new Date(),
                    description: nc.description,
                    location: {
                        city: nc.location || 'Unknown',
                        state: 'Unknown'
                    }
                },
                dates: {
                    incidentDate: nc.incidentDate ? new Date(nc.incidentDate) : new Date(),
                    statuteOfLimitations: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2), // Default 2 years
                },
                team: {
                    leadAttorney: 'Unassigned' // Queue for assignment
                },
                insurance: {
                    defendantPolicy: {
                        carrier: 'Unknown',
                        claimNumber: 'Unknown',
                        adjuster: { name: 'Unknown', email: 'unknown@example.com', phone: '000-000-0000' }
                    }
                }
            });
            targetCaseId = newCase._id.toString();
        }

        if (!targetCaseId) {
            // Should not happen if logic holds, but fallback
            return { success: false, decision, message: 'Could not determine a target case ID.' };
        }

        // 3. Create Document Record
        // lazy load Document model to avoid circular deps if any (though here it's fine)
        const DocumentModel = (await import('../../db/models/Document')).default;

        const newDoc = await DocumentModel.create({
            caseId: targetCaseId,
            title: file.originalName,
            category: 'other', // Could also ask AI to categorize in same step
            status: 'received',
            file: {
                originalName: file.originalName,
                storagePath: file.storagePath,
                mimeType: file.mimeType,
                size: file.size,
                hash: file.hash,
                storageProvider: 'local'
            },
            aiAnalysis: {
                isProcessed: true,
                summary: decision.reasoning,
                confidence: decision.confidence,
                processedAt: new Date(),
            },
            uploadedBy: uploadedBy,
        });

        return {
            success: true,
            decision,
            caseId: targetCaseId,
            documentId: newDoc._id.toString(),
            message: decision.action === 'CREATE'
                ? `Created new case #${targetCaseId} and attached document.`
                : `Attached document to existing case #${targetCaseId}.`
        };
    }
}
