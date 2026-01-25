import { analyzeAsClientGuru, ClientGuruResponse } from './specialists/client-guru';
import { analyzeAsEvidenceAnalyzer, EvidenceAnalyzerResponse } from './specialists/evidence-analyzer';

export interface OrchestrationResult {
  actionCard: {
    recommendation: 'approve' | 'reject' | 'review';
    reasoning: string;
    confidence: number;
  };
  consensus: {
    clientGuruOpinion: string;
    evidenceAnalyzerOpinion: string;
    finalDecision: string;
  };
}

export async function orchestrateAnalysis(caseData: {
  title: string;
  description: string;
  metadata?: Record<string, any>;
}): Promise<OrchestrationResult> {
  // Run both specialists in parallel
  const [clientGuruResult, evidenceAnalyzerResult] = await Promise.all([
    analyzeAsClientGuru(caseData),
    analyzeAsEvidenceAnalyzer(caseData),
  ]);

  // Determine recommendation based on both analyses
  const avgScore = (clientGuruResult.clarityScore + evidenceAnalyzerResult.evidenceScore) / 2;
  const hasContradictions = evidenceAnalyzerResult.contradictions.length > 0;
  
  let recommendation: 'approve' | 'reject' | 'review';
  if (avgScore >= 80 && !hasContradictions) {
    recommendation = 'approve';
  } else if (avgScore < 50 || hasContradictions) {
    recommendation = 'reject';
  } else {
    recommendation = 'review';
  }

  const confidence = Math.round(avgScore);

  const reasoning = `
    Client Guru Analysis: ${clientGuruResult.opinion}
    Evidence Analyzer Analysis: ${evidenceAnalyzerResult.opinion}
    Combined Score: ${avgScore.toFixed(1)}/100
    ${hasContradictions ? '⚠️ Contradictions detected' : '✓ No contradictions'}
  `.trim();

  const finalDecision = `
    Based on the analysis:
    - Client perspective: ${clientGuruResult.opinion}
    - Evidence perspective: ${evidenceAnalyzerResult.opinion}
    - Recommendation: ${recommendation.toUpperCase()}
    - Confidence: ${confidence}%
  `.trim();

  return {
    actionCard: {
      recommendation,
      reasoning,
      confidence,
    },
    consensus: {
      clientGuruOpinion: clientGuruResult.opinion,
      evidenceAnalyzerOpinion: evidenceAnalyzerResult.opinion,
      finalDecision,
    },
  };
}

