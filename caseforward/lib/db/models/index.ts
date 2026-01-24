// lib/db/models/index.ts

export { default as Case } from './Case';
export { default as Document } from './Document';
export { default as Lien } from './Lien';
export { default as Action } from './Action';
export { default as AuditLog } from './AuditLog';
export type { ICase } from './Case';
export type { IDocument } from './Document';
export type { ILien } from './Lien';
export type { IAction } from './Action';
export type { IAuditLog } from './AuditLog';

export {
  CaseType,
  CaseTypeLabels,
  CaseTypeDescriptions,
  CASE_TYPES,

  CaseStatus,
  CaseStatusLabels,
  CaseStatusDescriptions,
  CaseStatusOrder,
  CASE_STATUSES,

  DocumentCategory,
  DocumentCategoryLabels,
  DocumentCategoryDescriptions,
  DocumentCategoryGroups,
  DOCUMENT_CATEGORIES,

  DocumentStatus,
  DocumentStatusLabels,
  DocumentStatusDescriptions,
  DOCUMENT_STATUSES,

  LienType,
  LienTypeLabels,
  LienTypeDescriptions,
  LienTypePriority,
  LIEN_TYPES,

  LienStatus,
  LienStatusLabels,
  LienStatusDescriptions,
  LIEN_STATUSES,

  AgentType,
  AgentTypeLabels,
  AgentTypeDescriptions,
  AgentTypeEmojis,
  AGENT_TYPES,

  ActionType,
  ActionTypeLabels,
  ActionTypeDescriptions,
  ActionTypeAgentMap,
  ACTION_TYPES,

  ActionStatus,
  ActionStatusLabels,
  ActionStatusDescriptions,
  ACTION_STATUSES,

  ActionPriority,
  ActionPriorityLabels,
  ActionPriorityColors,
  ACTION_PRIORITIES,

  AuditEventType,
  AuditEventTypeLabels,
  AUDIT_EVENT_TYPES,

  Severity,
  SeverityLabels,
  SEVERITIES,

  InputSourceType,
  InputSourceTypeLabels,
  INPUT_SOURCE_TYPES,

  getEnumValues,
  isValidEnumValue,
  getEnumLabel,
} from '../types/enums';