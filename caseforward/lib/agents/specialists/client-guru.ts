import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ClientGuruResponse {
  opinion: string;
  empathyPoints: string[];
  clarityScore: number;
  recommendations: string[];
}

export async function analyzeAsClientGuru(caseData: {
  title: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<ClientGuruResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are the Client Guru, an AI specialist focused on empathy and clarity. 
Analyze this case from the client's perspective:

Title: ${caseData.title}
Description: ${caseData.description}
${caseData.metadata ? `Metadata: ${JSON.stringify(caseData.metadata)}` : ''}

Provide:
1. Your empathetic opinion on how the client might feel
2. Key empathy points (3-5 bullet points)
3. A clarity score (0-100) indicating how clear the case is
4. Recommendations for improving client communication

Respond in JSON format with: opinion, empathyPoints (array), clarityScore (number), recommendations (array).`;

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
      empathyPoints: ['Client needs clear communication', 'Empathy is crucial'],
      clarityScore: 75,
      recommendations: ['Improve documentation', 'Provide regular updates'],
    };
  } catch (error) {
    console.error('Client Guru error:', error);
    return {
      opinion: 'Unable to analyze at this time. Please ensure clear communication with the client.',
      empathyPoints: ['Client needs support', 'Clear communication required'],
      clarityScore: 50,
      recommendations: ['Review case details', 'Contact client for clarification'],
    };
  }
}

