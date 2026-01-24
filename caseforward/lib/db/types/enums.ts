// lib/db/types/enums.ts

export enum CaseType {
  AUTO_ACCIDENT = 'auto_accident',
  PREMISES_LIABILITY = 'premises_liability',
  MEDICAL_MALPRACTICE = 'medical_malpractice',
  WRONGFUL_DEATH = 'wrongful_death',
  SLIP_AND_FALL = 'slip_and_fall',
  PRODUCT_LIABILITY = 'product_liability',
  OTHER = 'other',
}

export const CaseTypeLabels: Record<CaseType, string> = {
  [CaseType.AUTO_ACCIDENT]: 'Auto Accident',
  [CaseType.PREMISES_LIABILITY]: 'Premises Liability',
  [CaseType.MEDICAL_MALPRACTICE]: 'Medical Malpractice',
  [CaseType.WRONGFUL_DEATH]: 'Wrongful Death',
  [CaseType.SLIP_AND_FALL]: 'Slip and Fall',
  [CaseType.PRODUCT_LIABILITY]: 'Product Liability',
  [CaseType.OTHER]: 'Other',
};

export const CaseTypeDescriptions: Record<CaseType, string> = {
  [CaseType.AUTO_ACCIDENT]: 'Car, truck, motorcycle, or other vehicle crashes',
  [CaseType.PREMISES_LIABILITY]: 'Injuries occurring on someone else\'s property',
  [CaseType.MEDICAL_MALPRACTICE]: 'Injuries caused by doctor or hospital negligence',
  [CaseType.WRONGFUL_DEATH]: 'Death caused by another party\'s negligence',
  [CaseType.SLIP_AND_FALL]: 'Falls due to hazardous conditions',
  [CaseType.PRODUCT_LIABILITY]: 'Injuries caused by defective products',
  [CaseType.OTHER]: 'Other personal injury cases',
};


export enum CaseStatus {
  INTAKE = 'intake',
  INVESTIGATION = 'investigation',
  TREATMENT = 'treatment',
  DEMAND_PREP = 'demand_prep',
  NEGOTIATION = 'negotiation',
  LITIGATION = 'litigation',
  TRIAL = 'trial',
  SETTLED = 'settled',
  CLOSED = 'closed',
}

export const CaseStatusLabels: Record<CaseStatus, string> = {
  [CaseStatus.INTAKE]: 'Intake',
  [CaseStatus.INVESTIGATION]: 'Investigation',
  [CaseStatus.TREATMENT]: 'Treatment',
  [CaseStatus.DEMAND_PREP]: 'Demand Preparation',
  [CaseStatus.NEGOTIATION]: 'Negotiation',
  [CaseStatus.LITIGATION]: 'Litigation',
  [CaseStatus.TRIAL]: 'Trial',
  [CaseStatus.SETTLED]: 'Settled',
  [CaseStatus.CLOSED]: 'Closed',
};

export const CaseStatusDescriptions: Record<CaseStatus, string> = {
  [CaseStatus.INTAKE]: 'New case - gathering initial information',
  [CaseStatus.INVESTIGATION]: 'Collecting evidence and building the case',
  [CaseStatus.TREATMENT]: 'Client is still receiving medical treatment',
  [CaseStatus.DEMAND_PREP]: 'Preparing the demand package for insurance',
  [CaseStatus.NEGOTIATION]: 'Negotiating settlement with insurance company',
  [CaseStatus.LITIGATION]: 'Lawsuit has been filed',
  [CaseStatus.TRIAL]: 'Case is going to trial',
  [CaseStatus.SETTLED]: 'Case has been settled',
  [CaseStatus.CLOSED]: 'Case is complete and closed',
};

export const CaseStatusOrder: CaseStatus[] = [
  CaseStatus.INTAKE,
  CaseStatus.INVESTIGATION,
  CaseStatus.TREATMENT,
  CaseStatus.DEMAND_PREP,
  CaseStatus.NEGOTIATION,
  CaseStatus.LITIGATION,
  CaseStatus.TRIAL,
  CaseStatus.SETTLED,
  CaseStatus.CLOSED,
];

export enum DocumentCategory {
  CLIENT_INTAKE = 'client_intake',
  RETAINER_AGREEMENT = 'retainer_agreement',
  MEDICAL_RECORD = 'medical_record',
  MEDICAL_BILL = 'medical_bill',
  DIAGNOSTIC_IMAGING = 'diagnostic_imaging',
  PHARMACY_RECORDS = 'pharmacy_records',
  POLICE_REPORT = 'police_report',
  INCIDENT_PHOTOS = 'incident_photos',
  WITNESS_STATEMENT = 'witness_statement',
  PAY_STUBS = 'pay_stubs',
  EMPLOYER_LETTER = 'employer_letter',
  INSURANCE_DOCS = 'insurance_docs',
  DEMAND_LETTER = 'demand_letter',
  SETTLEMENT_DOCS = 'settlement_docs',
  OTHER = 'other',
}

export const DocumentCategoryLabels: Record<DocumentCategory, string> = {
  [DocumentCategory.CLIENT_INTAKE]: 'Client Intake Form',
  [DocumentCategory.RETAINER_AGREEMENT]: 'Retainer Agreement',
  [DocumentCategory.MEDICAL_RECORD]: 'Medical Records',
  [DocumentCategory.MEDICAL_BILL]: 'Medical Bills',
  [DocumentCategory.DIAGNOSTIC_IMAGING]: 'Diagnostic Imaging',
  [DocumentCategory.PHARMACY_RECORDS]: 'Pharmacy Records',
  [DocumentCategory.POLICE_REPORT]: 'Police Report',
  [DocumentCategory.INCIDENT_PHOTOS]: 'Incident Photos',
  [DocumentCategory.WITNESS_STATEMENT]: 'Witness Statement',
  [DocumentCategory.PAY_STUBS]: 'Pay Stubs',
  [DocumentCategory.EMPLOYER_LETTER]: 'Employer Letter',
  [DocumentCategory.INSURANCE_DOCS]: 'Insurance Documents',
  [DocumentCategory.DEMAND_LETTER]: 'Demand Letter',
  [DocumentCategory.SETTLEMENT_DOCS]: 'Settlement Documents',
  [DocumentCategory.OTHER]: 'Other',
};

export const DocumentCategoryDescriptions: Record<DocumentCategory, string> = {
  [DocumentCategory.CLIENT_INTAKE]: 'Initial client information, accident details, and injury description',
  [DocumentCategory.RETAINER_AGREEMENT]: 'Signed attorney-client agreement',
  [DocumentCategory.MEDICAL_RECORD]: 'Hospital records, ER visits, doctor notes, treatment records',
  [DocumentCategory.MEDICAL_BILL]: 'Bills and invoices from healthcare providers',
  [DocumentCategory.DIAGNOSTIC_IMAGING]: 'X-rays, MRIs, CT scans, and other imaging',
  [DocumentCategory.PHARMACY_RECORDS]: 'Prescription records and medication history',
  [DocumentCategory.POLICE_REPORT]: 'Official police accident report',
  [DocumentCategory.INCIDENT_PHOTOS]: 'Photos of accident scene, vehicle damage, injuries',
  [DocumentCategory.WITNESS_STATEMENT]: 'Written statements from witnesses',
  [DocumentCategory.PAY_STUBS]: 'Pay stubs showing income before accident',
  [DocumentCategory.EMPLOYER_LETTER]: 'Letter from employer verifying lost wages',
  [DocumentCategory.INSURANCE_DOCS]: 'Insurance policies, claim documents, denial letters',
  [DocumentCategory.DEMAND_LETTER]: 'Settlement demand sent to insurance company',
  [DocumentCategory.SETTLEMENT_DOCS]: 'Settlement agreements, releases, disbursement sheets',
  [DocumentCategory.OTHER]: 'Other relevant documents',
};

export const DocumentCategoryGroups = {
  'Core Intake': [
    DocumentCategory.CLIENT_INTAKE,
    DocumentCategory.RETAINER_AGREEMENT,
  ],
  'Medical': [
    DocumentCategory.MEDICAL_RECORD,
    DocumentCategory.MEDICAL_BILL,
    DocumentCategory.DIAGNOSTIC_IMAGING,
    DocumentCategory.PHARMACY_RECORDS,
  ],
  'Incident': [
    DocumentCategory.POLICE_REPORT,
    DocumentCategory.INCIDENT_PHOTOS,
    DocumentCategory.WITNESS_STATEMENT,
  ],
  'Financial': [
    DocumentCategory.PAY_STUBS,
    DocumentCategory.EMPLOYER_LETTER,
    DocumentCategory.INSURANCE_DOCS,
  ],
  'Legal': [
    DocumentCategory.DEMAND_LETTER,
    DocumentCategory.SETTLEMENT_DOCS,
  ],
  'Other': [
    DocumentCategory.OTHER,
  ],
};

export enum DocumentStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'Pending',
  [DocumentStatus.RECEIVED]: 'Received',
  [DocumentStatus.UNDER_REVIEW]: 'Under Review',
  [DocumentStatus.APPROVED]: 'Approved',
  [DocumentStatus.REJECTED]: 'Rejected',
};

export const DocumentStatusDescriptions: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'Document has been requested but not yet received',
  [DocumentStatus.RECEIVED]: 'Document received but not yet reviewed',
  [DocumentStatus.UNDER_REVIEW]: 'Document is being reviewed by the team',
  [DocumentStatus.APPROVED]: 'Document has been reviewed and approved',
  [DocumentStatus.REJECTED]: 'Document rejected (duplicate, irrelevant, or incomplete)',
};

export enum LienType {
  MEDICARE = 'medicare',
  MEDICAID = 'medicaid',
  HEALTH_INSURANCE = 'health_insurance',
  HOSPITAL = 'hospital',
  PROVIDER = 'provider',
  ERISA = 'erisa',
  WORKERS_COMP = 'workers_comp',
  OTHER = 'other',
}

export const LienTypeLabels: Record<LienType, string> = {
  [LienType.MEDICARE]: 'Medicare',
  [LienType.MEDICAID]: 'Medicaid',
  [LienType.HEALTH_INSURANCE]: 'Health Insurance',
  [LienType.HOSPITAL]: 'Hospital',
  [LienType.PROVIDER]: 'Medical Provider',
  [LienType.ERISA]: 'ERISA',
  [LienType.WORKERS_COMP]: 'Workers Compensation',
  [LienType.OTHER]: 'Other',
};

export const LienTypeDescriptions: Record<LienType, string> = {
  [LienType.MEDICARE]: 'Federal Medicare conditional payment lien',
  [LienType.MEDICAID]: 'State Medicaid reimbursement lien',
  [LienType.HEALTH_INSURANCE]: 'Private health insurance subrogation claim',
  [LienType.HOSPITAL]: 'Hospital lien for unpaid services',
  [LienType.PROVIDER]: 'Doctor or specialist lien',
  [LienType.ERISA]: 'Employer health plan (ERISA) subrogation',
  [LienType.WORKERS_COMP]: 'Workers compensation lien',
  [LienType.OTHER]: 'Other type of lien',
};

export const LienTypePriority: Record<LienType, number> = {
  [LienType.MEDICARE]: 1,
  [LienType.MEDICAID]: 2,
  [LienType.ERISA]: 3,  
  [LienType.HEALTH_INSURANCE]: 4,
  [LienType.HOSPITAL]: 5,
  [LienType.PROVIDER]: 6,
  [LienType.WORKERS_COMP]: 7,
  [LienType.OTHER]: 8,
};

export enum LienStatus {
  IDENTIFIED = 'identified',
  CONFIRMED = 'confirmed',
  NEGOTIATING = 'negotiating',
  DISPUTED = 'disputed',
  PAID = 'paid',
  WAIVED = 'waived',
}

export const LienStatusLabels: Record<LienStatus, string> = {
  [LienStatus.IDENTIFIED]: 'Identified',
  [LienStatus.CONFIRMED]: 'Confirmed',
  [LienStatus.NEGOTIATING]: 'Negotiating',
  [LienStatus.DISPUTED]: 'Disputed',
  [LienStatus.PAID]: 'Paid',
  [LienStatus.WAIVED]: 'Waived',
};

export const LienStatusDescriptions: Record<LienStatus, string> = {
  [LienStatus.IDENTIFIED]: 'Lien has been identified but amount not confirmed',
  [LienStatus.CONFIRMED]: 'Lien amount has been confirmed by lienholder',
  [LienStatus.NEGOTIATING]: 'Currently negotiating reduction of lien amount',
  [LienStatus.DISPUTED]: 'Disputing charges included in the lien',
  [LienStatus.PAID]: 'Lien has been paid in full',
  [LienStatus.WAIVED]: 'Lien has been waived by lienholder',
};

export enum AgentType {
  ORCHESTRATOR = 'orchestrator',
  CLIENT_GURU = 'client_guru',
  EVIDENCE_ANALYZER = 'evidence_analyzer',
}

export const AgentTypeLabels: Record<AgentType, string> = {
  [AgentType.ORCHESTRATOR]: 'Orchestrator',
  [AgentType.CLIENT_GURU]: 'Client Guru',
  [AgentType.EVIDENCE_ANALYZER]: 'Evidence Analyzer',
};

export const AgentTypeDescriptions: Record<AgentType, string> = {
  [AgentType.ORCHESTRATOR]: 'Routes incoming tasks to the appropriate specialist agent',
  [AgentType.CLIENT_GURU]: 'Drafts empathetic, professional client communications',
  [AgentType.EVIDENCE_ANALYZER]: 'Analyzes documents, identifies missing evidence, flags issues',
};

export const AgentTypeEmojis: Record<AgentType, string> = {
  [AgentType.ORCHESTRATOR]: '🎯',
  [AgentType.CLIENT_GURU]: '👤',
  [AgentType.EVIDENCE_ANALYZER]: '🔍',
};

export enum ActionType {
  SEND_CLIENT_EMAIL = 'send_client_email',
  SEND_CLIENT_TEXT = 'send_client_text',
  REQUEST_CLIENT_INFO = 'request_client_info',
  REQUEST_MISSING_DOCUMENT = 'request_missing_document',
  FLAG_DOCUMENT_ISSUE = 'flag_document_issue',
  REVIEW_FLAGGED_ITEM = 'review_flagged_item',
  GENERAL_RECOMMENDATION = 'general_recommendation',
}

export const ActionTypeLabels: Record<ActionType, string> = {
  [ActionType.SEND_CLIENT_EMAIL]: 'Send Client Email',
  [ActionType.SEND_CLIENT_TEXT]: 'Send Client Text',
  [ActionType.REQUEST_CLIENT_INFO]: 'Request Client Information',
  [ActionType.REQUEST_MISSING_DOCUMENT]: 'Request Missing Document',
  [ActionType.FLAG_DOCUMENT_ISSUE]: 'Flag Document Issue',
  [ActionType.REVIEW_FLAGGED_ITEM]: 'Review Flagged Item',
  [ActionType.GENERAL_RECOMMENDATION]: 'General Recommendation',
};

export const ActionTypeDescriptions: Record<ActionType, string> = {
  [ActionType.SEND_CLIENT_EMAIL]: 'Send an email communication to the client',
  [ActionType.SEND_CLIENT_TEXT]: 'Send a text message to the client',
  [ActionType.REQUEST_CLIENT_INFO]: 'Request additional information from the client',
  [ActionType.REQUEST_MISSING_DOCUMENT]: 'Request a missing document for the case',
  [ActionType.FLAG_DOCUMENT_ISSUE]: 'Flag an issue found in a document',
  [ActionType.REVIEW_FLAGGED_ITEM]: 'Review an item that has been flagged',
  [ActionType.GENERAL_RECOMMENDATION]: 'General case recommendation',
};

export const ActionTypeAgentMap: Record<ActionType, AgentType> = {
  [ActionType.SEND_CLIENT_EMAIL]: AgentType.CLIENT_GURU,
  [ActionType.SEND_CLIENT_TEXT]: AgentType.CLIENT_GURU,
  [ActionType.REQUEST_CLIENT_INFO]: AgentType.CLIENT_GURU,
  [ActionType.REQUEST_MISSING_DOCUMENT]: AgentType.EVIDENCE_ANALYZER,
  [ActionType.FLAG_DOCUMENT_ISSUE]: AgentType.EVIDENCE_ANALYZER,
  [ActionType.REVIEW_FLAGGED_ITEM]: AgentType.EVIDENCE_ANALYZER,
  [ActionType.GENERAL_RECOMMENDATION]: AgentType.ORCHESTRATOR,
};

export enum ActionStatus {
  PENDING = 'pending',
  AWAITING_REVIEW = 'awaiting_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const ActionStatusLabels: Record<ActionStatus, string> = {
  [ActionStatus.PENDING]: 'Pending',
  [ActionStatus.AWAITING_REVIEW]: 'Awaiting Review',
  [ActionStatus.APPROVED]: 'Approved',
  [ActionStatus.REJECTED]: 'Rejected',
  [ActionStatus.COMPLETED]: 'Completed',
  [ActionStatus.CANCELLED]: 'Cancelled',
};

export const ActionStatusDescriptions: Record<ActionStatus, string> = {
  [ActionStatus.PENDING]: 'Action is being processed by AI',
  [ActionStatus.AWAITING_REVIEW]: 'Action is ready for human review (swipe)',
  [ActionStatus.APPROVED]: 'Action was approved (swipe right)',
  [ActionStatus.REJECTED]: 'Action was rejected (swipe left)',
  [ActionStatus.COMPLETED]: 'Action has been executed',
  [ActionStatus.CANCELLED]: 'Action was cancelled',
};

export enum ActionPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
}

export const ActionPriorityLabels: Record<ActionPriority, string> = {
  [ActionPriority.CRITICAL]: 'Critical',
  [ActionPriority.HIGH]: 'High',
  [ActionPriority.MEDIUM]: 'Medium',
  [ActionPriority.LOW]: 'Low',
};

export const ActionPriorityColors: Record<ActionPriority, string> = {
  [ActionPriority.CRITICAL]: 'red',
  [ActionPriority.HIGH]: 'orange',
  [ActionPriority.MEDIUM]: 'yellow',
  [ActionPriority.LOW]: 'green',
};

export enum AuditEventType {
  TASK_RECEIVED = 'task_received',
  TASK_ROUTED = 'task_routed',
  ANALYSIS_STARTED = 'analysis_started',
  ANALYSIS_COMPLETE = 'analysis_complete',
  DRAFT_CREATED = 'draft_created',
  ROUND_TABLE = 'round_table',
  ACTION_CREATED = 'action_created',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_LEFT = 'swipe_left',
  EXECUTED = 'executed',
  ERROR = 'error',
}

export const AuditEventTypeLabels: Record<AuditEventType, string> = {
  [AuditEventType.TASK_RECEIVED]: 'Task Received',
  [AuditEventType.TASK_ROUTED]: 'Task Routed',
  [AuditEventType.ANALYSIS_STARTED]: 'Analysis Started',
  [AuditEventType.ANALYSIS_COMPLETE]: 'Analysis Complete',
  [AuditEventType.DRAFT_CREATED]: 'Draft Created',
  [AuditEventType.ROUND_TABLE]: 'Round Table Discussion',
  [AuditEventType.ACTION_CREATED]: 'Action Created',
  [AuditEventType.SWIPE_RIGHT]: 'Swipe Right (Approved)',
  [AuditEventType.SWIPE_LEFT]: 'Swipe Left (Rejected)',
  [AuditEventType.EXECUTED]: 'Action Executed',
  [AuditEventType.ERROR]: 'Error',
};

export enum Severity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export const SeverityLabels: Record<Severity, string> = {
  [Severity.DEBUG]: 'Debug',
  [Severity.INFO]: 'Info',
  [Severity.WARNING]: 'Warning',
  [Severity.ERROR]: 'Error',
};

export enum InputSourceType {
  EMAIL = 'email',
  TEXT = 'text',
  PORTAL = 'portal',
  DOCUMENT_UPLOAD = 'document_upload',
  CALL_TRANSCRIPT = 'call_transcript',
  SCHEDULED_REVIEW = 'scheduled_review',
  MANUAL = 'manual',
}

export const InputSourceTypeLabels: Record<InputSourceType, string> = {
  [InputSourceType.EMAIL]: 'Email',
  [InputSourceType.TEXT]: 'Text Message',
  [InputSourceType.PORTAL]: 'Client Portal',
  [InputSourceType.DOCUMENT_UPLOAD]: 'Document Upload',
  [InputSourceType.CALL_TRANSCRIPT]: 'Call Transcript',
  [InputSourceType.SCHEDULED_REVIEW]: 'Scheduled Review',
  [InputSourceType.MANUAL]: 'Manual Entry',
};

export function getEnumValues<T extends Record<string, string>>(enumObj: T): string[] {
  return Object.values(enumObj);
}

export function isValidEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string
): boolean {
  return Object.values(enumObj).includes(value);
}

export function getEnumLabel<T extends string>(
  labels: Record<T, string>,
  value: T
): string {
  return labels[value] || value;
}

export const CASE_TYPES = getEnumValues(CaseType);
export const CASE_STATUSES = getEnumValues(CaseStatus);
export const DOCUMENT_CATEGORIES = getEnumValues(DocumentCategory);
export const DOCUMENT_STATUSES = getEnumValues(DocumentStatus);
export const LIEN_TYPES = getEnumValues(LienType);
export const LIEN_STATUSES = getEnumValues(LienStatus);
export const AGENT_TYPES = getEnumValues(AgentType);
export const ACTION_TYPES = getEnumValues(ActionType);
export const ACTION_STATUSES = getEnumValues(ActionStatus);
export const ACTION_PRIORITIES = [1, 2, 3, 4];
export const AUDIT_EVENT_TYPES = getEnumValues(AuditEventType);
export const SEVERITIES = getEnumValues(Severity);
export const INPUT_SOURCE_TYPES = getEnumValues(InputSourceType);