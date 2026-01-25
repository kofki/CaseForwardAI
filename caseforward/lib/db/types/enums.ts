export enum CaseType {
  AUTO_ACCIDENT = 'auto_accident',
  PREMISES_LIABILITY = 'premises_liability',
  MEDICAL_MALPRACTICE = 'medical_malpractice',
  WRONGFUL_DEATH = 'wrongful_death',
  SLIP_AND_FALL = 'slip_and_fall',
  PRODUCT_LIABILITY = 'product_liability',
  WORKERS_COMP = 'workers_comp',
  OTHER = 'other',
}

export const CaseTypeLabels: Record<CaseType, string> = {
  [CaseType.AUTO_ACCIDENT]: 'Auto Accident',
  [CaseType.PREMISES_LIABILITY]: 'Premises Liability',
  [CaseType.MEDICAL_MALPRACTICE]: 'Medical Malpractice',
  [CaseType.WRONGFUL_DEATH]: 'Wrongful Death',
  [CaseType.SLIP_AND_FALL]: 'Slip and Fall',
  [CaseType.PRODUCT_LIABILITY]: 'Product Liability',
  [CaseType.WORKERS_COMP]: 'Workers Compensation',
  [CaseType.OTHER]: 'Other',
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

export enum DocumentStatus {
  UPLOADING = 'uploading',
  EXTRACTING = 'extracting',
  ANALYZING = 'analyzing',
  PENDING_ASSIGNMENT = 'pending_assignment',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  REVIEWED = 'reviewed',
  REJECTED = 'rejected',
  EXTRACTION_FAILED = 'extraction_failed',
  ANALYSIS_FAILED = 'analysis_failed',
}

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.UPLOADING]: 'Uploading',
  [DocumentStatus.EXTRACTING]: 'Extracting Content',
  [DocumentStatus.ANALYZING]: 'AI Analyzing',
  [DocumentStatus.PENDING_ASSIGNMENT]: 'Pending Case Assignment',
  [DocumentStatus.ASSIGNED]: 'Assigned to Case',
  [DocumentStatus.PROCESSING]: 'Round Table Processing',
  [DocumentStatus.PROCESSED]: 'Processed',
  [DocumentStatus.REVIEWED]: 'Reviewed',
  [DocumentStatus.REJECTED]: 'Rejected',
  [DocumentStatus.EXTRACTION_FAILED]: 'Extraction Failed',
  [DocumentStatus.ANALYSIS_FAILED]: 'Analysis Failed',
};

export enum DocumentCategory {
  MEDICAL_RECORD = 'medical_record',
  MEDICAL_BILL = 'medical_bill',
  DIAGNOSTIC_IMAGING = 'diagnostic_imaging',
  PHARMACY_RECORD = 'pharmacy_record',
  POLICE_REPORT = 'police_report',
  INCIDENT_PHOTO = 'incident_photo',
  WITNESS_STATEMENT = 'witness_statement',
  PAY_STUB = 'pay_stub',
  EMPLOYER_LETTER = 'employer_letter',
  TAX_DOCUMENT = 'tax_document',
  INSURANCE_POLICY = 'insurance_policy',
  INSURANCE_CLAIM = 'insurance_claim',
  DENIAL_LETTER = 'denial_letter',
  RETAINER_AGREEMENT = 'retainer_agreement',
  DEMAND_LETTER = 'demand_letter',
  SETTLEMENT_DOCUMENT = 'settlement_document',
  COURT_FILING = 'court_filing',
  CLIENT_CORRESPONDENCE = 'client_correspondence',
  PROVIDER_CORRESPONDENCE = 'provider_correspondence',
  CLIENT_INTAKE = 'client_intake',
  OTHER = 'other',
}

export const DocumentCategoryLabels: Record<DocumentCategory, string> = {
  [DocumentCategory.MEDICAL_RECORD]: 'Medical Records',
  [DocumentCategory.MEDICAL_BILL]: 'Medical Bills',
  [DocumentCategory.DIAGNOSTIC_IMAGING]: 'Diagnostic Imaging',
  [DocumentCategory.PHARMACY_RECORD]: 'Pharmacy Records',
  [DocumentCategory.POLICE_REPORT]: 'Police Report',
  [DocumentCategory.INCIDENT_PHOTO]: 'Incident Photos',
  [DocumentCategory.WITNESS_STATEMENT]: 'Witness Statement',
  [DocumentCategory.PAY_STUB]: 'Pay Stubs',
  [DocumentCategory.EMPLOYER_LETTER]: 'Employer Letter',
  [DocumentCategory.TAX_DOCUMENT]: 'Tax Documents',
  [DocumentCategory.INSURANCE_POLICY]: 'Insurance Policy',
  [DocumentCategory.INSURANCE_CLAIM]: 'Insurance Claim',
  [DocumentCategory.DENIAL_LETTER]: 'Denial Letter',
  [DocumentCategory.RETAINER_AGREEMENT]: 'Retainer Agreement',
  [DocumentCategory.DEMAND_LETTER]: 'Demand Letter',
  [DocumentCategory.SETTLEMENT_DOCUMENT]: 'Settlement Documents',
  [DocumentCategory.COURT_FILING]: 'Court Filing',
  [DocumentCategory.CLIENT_CORRESPONDENCE]: 'Client Correspondence',
  [DocumentCategory.PROVIDER_CORRESPONDENCE]: 'Provider Correspondence',
  [DocumentCategory.CLIENT_INTAKE]: 'Client Intake Form',
  [DocumentCategory.OTHER]: 'Other',
};

export const DocumentCategoryGroups = {
  'Medical': [
    DocumentCategory.MEDICAL_RECORD,
    DocumentCategory.MEDICAL_BILL,
    DocumentCategory.DIAGNOSTIC_IMAGING,
    DocumentCategory.PHARMACY_RECORD,
  ],
  'Incident': [
    DocumentCategory.POLICE_REPORT,
    DocumentCategory.INCIDENT_PHOTO,
    DocumentCategory.WITNESS_STATEMENT,
  ],
  'Financial': [
    DocumentCategory.PAY_STUB,
    DocumentCategory.EMPLOYER_LETTER,
    DocumentCategory.TAX_DOCUMENT,
  ],
  'Insurance': [
    DocumentCategory.INSURANCE_POLICY,
    DocumentCategory.INSURANCE_CLAIM,
    DocumentCategory.DENIAL_LETTER,
  ],
  'Legal': [
    DocumentCategory.RETAINER_AGREEMENT,
    DocumentCategory.DEMAND_LETTER,
    DocumentCategory.SETTLEMENT_DOCUMENT,
    DocumentCategory.COURT_FILING,
  ],
  'Communication': [
    DocumentCategory.CLIENT_CORRESPONDENCE,
    DocumentCategory.PROVIDER_CORRESPONDENCE,
  ],
  'Intake': [
    DocumentCategory.CLIENT_INTAKE,
  ],
  'Other': [
    DocumentCategory.OTHER,
  ],
};

export enum ActionType {
  SEND_EMAIL = 'send_email',
  SEND_TEXT = 'send_text',
  SCHEDULE_CALL = 'schedule_call',
  REQUEST_DOCUMENT = 'request_document',
  REQUEST_RECORDS = 'request_records',
  UPDATE_CASE_STATUS = 'update_case_status',
  FLAG_FOR_REVIEW = 'flag_for_review',
  ADD_CASE_NOTE = 'add_case_note',
  CATEGORIZE_DOCUMENT = 'categorize_document',
  ASSIGN_DOCUMENT = 'assign_document',
  GENERAL_RECOMMENDATION = 'general_recommendation',
}

export const ActionTypeLabels: Record<ActionType, string> = {
  [ActionType.SEND_EMAIL]: 'Send Email',
  [ActionType.SEND_TEXT]: 'Send Text Message',
  [ActionType.SCHEDULE_CALL]: 'Schedule Call',
  [ActionType.REQUEST_DOCUMENT]: 'Request Document',
  [ActionType.REQUEST_RECORDS]: 'Request Records',
  [ActionType.UPDATE_CASE_STATUS]: 'Update Case Status',
  [ActionType.FLAG_FOR_REVIEW]: 'Flag for Review',
  [ActionType.ADD_CASE_NOTE]: 'Add Case Note',
  [ActionType.CATEGORIZE_DOCUMENT]: 'Categorize Document',
  [ActionType.ASSIGN_DOCUMENT]: 'Assign Document to Case',
  [ActionType.GENERAL_RECOMMENDATION]: 'General Recommendation',
};

export enum ActionStatus {
  PENDING = 'pending',
  AWAITING_REVIEW = 'awaiting_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export const ActionStatusLabels: Record<ActionStatus, string> = {
  [ActionStatus.PENDING]: 'Pending',
  [ActionStatus.AWAITING_REVIEW]: 'Awaiting Review',
  [ActionStatus.APPROVED]: 'Approved',
  [ActionStatus.REJECTED]: 'Rejected',
  [ActionStatus.EXECUTED]: 'Executed',
  [ActionStatus.FAILED]: 'Failed',
  [ActionStatus.EXPIRED]: 'Expired',
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

export enum AgentType {
  ORCHESTRATOR = 'orchestrator',
  CLIENT_GURU = 'client_guru',
  EVIDENCE_ANALYZER = 'evidence_analyzer',
  SYSTEM = 'system',
}

export const AgentTypeLabels: Record<AgentType, string> = {
  [AgentType.ORCHESTRATOR]: 'Orchestrator',
  [AgentType.CLIENT_GURU]: 'Client Guru',
  [AgentType.EVIDENCE_ANALYZER]: 'Evidence Analyzer',
  [AgentType.SYSTEM]: 'System',
};

export const AgentTypeEmojis: Record<AgentType, string> = {
  [AgentType.ORCHESTRATOR]: '🎯',
  [AgentType.CLIENT_GURU]: '👤',
  [AgentType.EVIDENCE_ANALYZER]: '🔍',
  [AgentType.SYSTEM]: '⚙️',
};

export enum AuditEventType {
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_EXTRACTED = 'document_extracted',
  DOCUMENT_ANALYZED = 'document_analyzed',
  DOCUMENT_ASSIGNED = 'document_assigned',
  ROUND_TABLE_STARTED = 'round_table_started',
  ROUND_TABLE_COMPLETED = 'round_table_completed',
  AGENT_RESPONSE = 'agent_response',
  ACTION_CREATED = 'action_created',
  ACTION_APPROVED = 'action_approved',
  ACTION_REJECTED = 'action_rejected',
  ACTION_EXECUTED = 'action_executed',
  SYSTEM_ERROR = 'system_error',
  USER_LOGIN = 'user_login',
}

export const AuditEventTypeLabels: Record<AuditEventType, string> = {
  [AuditEventType.DOCUMENT_UPLOADED]: 'Document Uploaded',
  [AuditEventType.DOCUMENT_EXTRACTED]: 'Document Extracted',
  [AuditEventType.DOCUMENT_ANALYZED]: 'Document Analyzed',
  [AuditEventType.DOCUMENT_ASSIGNED]: 'Document Assigned',
  [AuditEventType.ROUND_TABLE_STARTED]: 'Round Table Started',
  [AuditEventType.ROUND_TABLE_COMPLETED]: 'Round Table Completed',
  [AuditEventType.AGENT_RESPONSE]: 'Agent Response',
  [AuditEventType.ACTION_CREATED]: 'Action Created',
  [AuditEventType.ACTION_APPROVED]: 'Action Approved',
  [AuditEventType.ACTION_REJECTED]: 'Action Rejected',
  [AuditEventType.ACTION_EXECUTED]: 'Action Executed',
  [AuditEventType.SYSTEM_ERROR]: 'System Error',
  [AuditEventType.USER_LOGIN]: 'User Login',
};

export enum SeverityLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export const SeverityLevelLabels: Record<SeverityLevel, string> = {
  [SeverityLevel.DEBUG]: 'Debug',
  [SeverityLevel.INFO]: 'Info',
  [SeverityLevel.WARNING]: 'Warning',
  [SeverityLevel.ERROR]: 'Error',
  [SeverityLevel.CRITICAL]: 'Critical',
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

// FEEDBACK ENUMS (Learning)
// ============================================================================

export enum RejectionReason {
  TONE_WRONG = 'tone_wrong',
  INCORRECT_INFO = 'incorrect_info',
  NOT_NEEDED = 'not_needed',
  BAD_TIMING = 'bad_timing',
  WRONG_RECIPIENT = 'wrong_recipient',
  MISSING_CONTEXT = 'missing_context',
  OTHER = 'other',
}

export const RejectionReasonLabels: Record<RejectionReason, string> = {
  [RejectionReason.TONE_WRONG]: 'Tone was wrong',
  [RejectionReason.INCORRECT_INFO]: 'Incorrect information',
  [RejectionReason.NOT_NEEDED]: 'Not needed',
  [RejectionReason.BAD_TIMING]: 'Bad timing',
  [RejectionReason.WRONG_RECIPIENT]: 'Wrong recipient',
  [RejectionReason.MISSING_CONTEXT]: 'Missing context',
  [RejectionReason.OTHER]: 'Other',
};

// ============================================================================
// INPUT SOURCE ENUMS
// ============================================================================

export enum InputSource {
  WEB_UPLOAD = 'web_upload',
  EMAIL = 'email',
  TEXT_MESSAGE = 'text_message',
  CLIENT_PORTAL = 'client_portal',
  FAX = 'fax',
  API = 'api',
  MANUAL = 'manual',
}

export const InputSourceLabels: Record<InputSource, string> = {
  [InputSource.WEB_UPLOAD]: 'Web Upload',
  [InputSource.EMAIL]: 'Email',
  [InputSource.TEXT_MESSAGE]: 'Text Message',
  [InputSource.CLIENT_PORTAL]: 'Client Portal',
  [InputSource.FAX]: 'Fax',
  [InputSource.API]: 'API',
  [InputSource.MANUAL]: 'Manual Entry',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

// ============================================================================
// EXPORTED ARRAYS (for Mongoose enums)
// ============================================================================

export const CASE_TYPES = getEnumValues(CaseType);
export const CASE_STATUSES = getEnumValues(CaseStatus);
export const DOCUMENT_STATUSES = getEnumValues(DocumentStatus);
export const DOCUMENT_CATEGORIES = getEnumValues(DocumentCategory);
export const ACTION_TYPES = getEnumValues(ActionType);
export const ACTION_STATUSES = getEnumValues(ActionStatus);
export const ACTION_PRIORITIES = [1, 2, 3, 4];
export const AGENT_TYPES = getEnumValues(AgentType);
export const AUDIT_EVENT_TYPES = getEnumValues(AuditEventType);
export const SEVERITY_LEVELS = getEnumValues(SeverityLevel);
export const LIEN_TYPES = getEnumValues(LienType);
export const LIEN_STATUSES = getEnumValues(LienStatus);
export const REJECTION_REASONS = getEnumValues(RejectionReason);
export const INPUT_SOURCES = getEnumValues(InputSource);
