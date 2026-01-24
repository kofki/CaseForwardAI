import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface EvidenceAnalyzerResponse {
  opinion: string;
  facts: string[];
  contradictions: string[];
  evidenceScore: number;
  recommendations: string[];
}

export async function analyzeAsEvidenceAnalyzer(caseData: {
  title: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<EvidenceAnalyzerResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are the Evidence Analyzer, an AI specialist focused on facts and logical consistency. 
Analyze this case objectively:

Title: ${caseData.title}
Description: ${caseData.description}
${caseData.metadata ? `Metadata: ${JSON.stringify(caseData.metadata)}` : ''}

Provide:
1. Your objective opinion based on facts
2. Key facts identified (3-5 bullet points)
3. Any contradictions or inconsistencies found
4. An evidence score (0-100) indicating the strength of evidence
5. Recommendations for gathering more evidence

Respond in JSON format with: opinion, facts (array), contradictions (array), evidenceScore (number), recommendations (array).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON parsing fails
    return {
      opinion: text,
      facts: ['Case details provided', 'Documentation available'],
      contradictions: [],
      evidenceScore: 70,
      recommendations: ['Verify documentation', 'Cross-reference facts'],
    };
  } catch (error) {
    console.error('Evidence Analyzer error:', error);
    return {
      opinion: 'Unable to analyze evidence at this time. Please review the case documentation.',
      facts: ['Case exists', 'Details provided'],
      contradictions: [],
      evidenceScore: 50,
      recommendations: ['Review all documents', 'Verify information'],
    };
  }
}

