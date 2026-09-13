export type UserRole = 'bank_officer' | 'reviewer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export type RiskLevel = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
export type CaseStatus = 'DRAFT' | 'PROCESSING' | 'ANALYZED' | 'PENDING_REVIEW' | 'NEEDS_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface DocumentItem {
  id: string;
  case_id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  processing_status: string;
  ocr_confidence?: number | null;
  created_at: string;
}

export interface ExtractedFieldItem {
  id: string;
  document_id?: string | null;
  field_name: string;
  field_value: string;
  normalized_value: string;
  confidence: number;
  source: string;
  created_at: string;
}

export interface VerificationCheck {
  check_type: string;
  status: string;
  score: number;
  details?: any;
}

export interface TrustScoreBreakdown {
  identity_score: number;
  document_integrity_score: number;
  field_consistency_score: number;
  ocr_confidence_score: number;
  source_verification_score: number;
  transaction_risk_score: number;
  final_score: number;
  risk_level: RiskLevel;
  explanation?: string | null;
  ai_recommendation_supported: boolean;
}

export interface SideBySideDiff {
  field_name: string;
  uploaded_value: string;
  trusted_value?: string | null;
  status: 'MATCH' | 'MISMATCH' | 'NOT_FOUND' | 'WARNING' | 'VERIFIED' | string;
}

export interface CrossDocConflict {
  field_name: string;
  document_a: string;
  value_a: string;
  document_b: string;
  value_b: string;
  status: 'CONFLICT' | 'CONSISTENT' | string;
}

export interface PolicySnippet {
  filename: string;
  section: string;
  guidance: string;
  relevance_score?: number | null;
}

export interface CaseDetail {
  id: string;
  case_number: string;
  created_by: string;
  title: string;
  description?: string | null;
  ai_recommendation: string;
  case_type: string;
  status: CaseStatus;
  trust_score?: number | null;
  risk_level?: RiskLevel | null;
  transaction_amount?: number | null;
  transaction_currency: string;
  transaction_type?: string | null;
  transaction_count_24h: number;
  is_new_device: boolean;
  is_unusual_location: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  documents: DocumentItem[];
  extracted_fields: ExtractedFieldItem[];
  verification_results: VerificationCheck[];
  trust_score_detail?: TrustScoreBreakdown | null;
  side_by_side_diff: SideBySideDiff[];
  cross_doc_conflicts: CrossDocConflict[];
  policy_guidance: PolicySnippet[];
  ai_explanation?: string | null;
  recommendation_verdict?: 'SUPPORTED' | 'NOT_SUPPORTED' | 'CONDITIONALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
  final_action_routing?: 'PROCEED' | 'ADDITIONAL_VERIFICATION' | 'HUMAN_REVIEW_REQUIRED';
}

export interface DashboardSummary {
  total_cases: number;
  low_risk_cases: number;
  medium_risk_cases: number;
  high_risk_cases: number;
  pending_reviews: number;
  approved_cases: number;
  rejected_cases: number;
  avg_trust_score: number;
  risk_distribution: Array<{ name: string; value: number; color: string }>;
  daily_case_activity: Array<{ date: string; cases: number }>;
  review_outcomes: Array<{ name: string; count: number; color: string }>;
  high_risk_reasons: Array<{ reason: string; percentage: number }>;
}

export interface AuditLogItem {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  case_id?: string | null;
  case_number?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata_json?: any;
  ip_hash_or_masked_ip: string;
  prev_hash?: string | null;
  current_hash?: string | null;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  app_version: string;
  environment: string;
  timestamp: string;
  components: Record<string, { status: string; latency_ms?: number; details?: string }>;
}
