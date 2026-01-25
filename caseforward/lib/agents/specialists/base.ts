// lib/agents/specialists/base.ts
// ============================================================================
// Base Specialist Class
// ============================================================================
// Abstract base for all AI specialists (Client Guru, Evidence Analyzer, etc.)
// Specialists are stateless - all coordination happens through Round Table.
// ============================================================================

import { AgentType } from '@/lib/db/types/enums';
import {
  SpecialistConfig,
  SpecialistInput,
  SpecialistOutput,
  AgentMessage,
  AgentResponse,
  LLMProvider,
  LLMOptions,
} from '../types';

export abstract class BaseSpecialist {
  protected config: SpecialistConfig;
  protected llmProvider: LLMProvider;

  constructor(config: SpecialistConfig, llmProvider: LLMProvider) {
    this.config = config;
    this.llmProvider = llmProvider;
  }

  /**
   * Get the specialist's name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get the specialist's agent type
   */
  get agentType(): AgentType {
    return this.config.agentType;
  }

  /**
   * Get the specialist's description
   */
  get description(): string {
    return this.config.description;
  }

  /**
   * Build the conversation messages for the LLM
   */
  protected buildMessages(input: SpecialistInput): AgentMessage[] {
    const messages: AgentMessage[] = [
      {
        role: 'system',
        content: this.config.systemPrompt,
      },
    ];

    // Add context about the task
    const contextMessage = this.buildContextMessage(input);
    messages.push({
      role: 'user',
      content: contextMessage,
    });

    // Add previous responses from other agents (for round table discussion)
    if (input.previousResponses && input.previousResponses.length > 0) {
      const discussionContext = this.buildDiscussionContext(input.previousResponses);
      messages.push({
        role: 'user',
        content: discussionContext,
      });
    }

    // Add the specific task
    messages.push({
      role: 'user',
      content: `Task: ${input.task}`,
    });

    return messages;
  }

  /**
   * Build context message from TaskContext
   */
  protected buildContextMessage(input: SpecialistInput): string {
    const ctx = input.context;
    const parts: string[] = [];

    parts.push(`## Context`);
    parts.push(`Task Type: ${ctx.taskType}`);

    if (ctx.caseNumber) {
      parts.push(`\n## Case Information`);
      parts.push(`Case Number: ${ctx.caseNumber}`);
      if (ctx.clientName) parts.push(`Client: ${ctx.clientName}`);
      if (ctx.caseType) parts.push(`Case Type: ${ctx.caseType}`);
      if (ctx.caseStatus) parts.push(`Status: ${ctx.caseStatus}`);
      if (ctx.caseSummary) parts.push(`Summary: ${ctx.caseSummary}`);
    }

    if (ctx.documentTitle) {
      parts.push(`\n## Document Information`);
      parts.push(`Title: ${ctx.documentTitle}`);
      if (ctx.documentCategory) parts.push(`Category: ${ctx.documentCategory}`);
      if (ctx.documentText) {
        // Truncate if too long
        const text = ctx.documentText.length > 8000 
          ? ctx.documentText.substring(0, 8000) + '... [truncated]'
          : ctx.documentText;
        parts.push(`\nDocument Content:\n${text}`);
      }
    }

    if (ctx.userCommand) {
      parts.push(`\n## User Request`);
      parts.push(ctx.userCommand);
    }

    if (ctx.relatedDocuments && ctx.relatedDocuments.length > 0) {
      parts.push(`\n## Related Documents`);
      ctx.relatedDocuments.forEach((doc, i) => {
        parts.push(`${i + 1}. ${doc.title} (${doc.category})${doc.summary ? ': ' + doc.summary : ''}`);
      });
    }

    if (ctx.recentActions && ctx.recentActions.length > 0) {
      parts.push(`\n## Recent Actions`);
      ctx.recentActions.forEach((action, i) => {
        parts.push(`${i + 1}. ${action}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Build discussion context from previous agent responses
   */
  protected buildDiscussionContext(responses: AgentResponse[]): string {
    const parts: string[] = ['## Discussion So Far'];
    
    responses.forEach(response => {
      const agentLabel = this.getAgentLabel(response.agent);
      parts.push(`\n**${agentLabel}:**`);
      parts.push(response.content);
    });

    parts.push('\n---');
    parts.push('Please provide your perspective, building on or respectfully disagreeing with the above.');

    return parts.join('\n');
  }

  /**
   * Get human-readable agent label
   */
  protected getAgentLabel(agent: AgentType): string {
    const labels: Record<AgentType, string> = {
      [AgentType.ORCHESTRATOR]: '🎯 Orchestrator',
      [AgentType.CLIENT_GURU]: '👤 Client Guru',
      [AgentType.EVIDENCE_ANALYZER]: '🔍 Evidence Analyzer',
      [AgentType.SYSTEM]: '⚙️ System',
    };
    return labels[agent] || agent;
  }

  /**
   * Process the LLM response into structured output
   * Override in subclasses for specialized parsing
   */
  protected processResponse(
    content: string,
    input: SpecialistInput,
    latencyMs: number,
    tokensUsed: number
  ): SpecialistOutput {
    return {
      response: {
        agent: this.agentType,
        content,
        timestamp: new Date(),
        tokensUsed,
        latencyMs,
      },
    };
  }

  /**
   * Execute the specialist's task
   */
  async execute(input: SpecialistInput): Promise<SpecialistOutput> {
    const messages = this.buildMessages(input);
    
    const llmOptions: LLMOptions = {
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };

    const startTime = Date.now();
    const response = await this.llmProvider.generateResponse(messages, llmOptions);
    const latencyMs = Date.now() - startTime;

    return this.processResponse(
      response.content,
      input,
      latencyMs,
      response.tokensUsed
    );
  }
}
