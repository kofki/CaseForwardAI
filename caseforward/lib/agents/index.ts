/**
 * AI Agents Module
 * 
 * This module exports the complete AI agent system for CaseForward.
 * 
 * Main Components:
 * - Round Table V2: Multi-round AI discussion with consensus detection
 * - Document Analysis: Entity extraction and case matching
 * - Specialists: Client Guru, Evidence Analyzer, Settlement Valuator
 * 
 * Usage:
 * ```typescript
 * import { runRoundTable, analyzeDocument } from '@/lib/agents';
 * 
 * // Trigger a round table discussion
 * const result = await runRoundTable(caseId, 'What should we do next?');
 * 
 * // Analyze a document
 * const analysis = await analyzeDocument({ documentId, extractedText });
 * ```
 */

// ============================================
// Round Table (Main Entry Point)
// ============================================
export {
  RoundTableV2,
  runRoundTable,
  type RoundTableConfig,
  type RoundTableResult,
  type RoundTableSession,
  type ConsensusAnalysis,
} from './round-table-v2';

// Legacy export for backwards compatibility
export { RoundTable } from './round-table';
export { runOrchestrator } from './orchestrator';

// ============================================
// Document Analysis
// ============================================
export {
  DocumentAnalysisService,
  analyzeDocument,
  type DocumentAnalysisInput,
  type DocumentAnalysisResult,
} from './document-analysis.service';

// ============================================
// Supporting Services
// ============================================
export {
  extractEntities,
  extractQuickEntities,
  type EntityExtractionResult,
} from './services/entity-extraction.service';

export {
  findMatchingCases,
  type CaseMatch,
} from './services/case-matching.service';

export {
  fetchFullCaseContext,
  formatCaseContextForPrompt,
  type CaseContext,
} from './services/case-context.service';

// ============================================
// Specialists
// ============================================
export { ClientGuru } from './specialists/client-guru';
export { EvidenceAnalyzer } from './specialists/evidence-analyzer';
export { SettlementValuator } from './specialists/settlement-valuator';

// ============================================
// Core Types
// ============================================
export type {
  AgentRole,
  AgentMessage,
  ActionCard,
} from './core/types';

export { ActionCardSchema } from './core/types';

export type {
  Specialist,
  AgentContext,
} from './core/specialist';

// ============================================
// Knowledge Base
// ============================================
export { LIEN_KNOWLEDGE } from './knowledge/lien-knowledge';

// Utility to generate a unique file number (e.g., when none is provided in the request)
export function generateUniqueFileNumber(prefix = 'FILE') {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}
