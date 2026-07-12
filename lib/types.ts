// Precision Closer — Domain Types
// All date fields use ISO 8601 strings. No runtime code.

// ── Status & Enum Unions ───────────────────────────────────────────────────

export type LeadStatus =
  | "not_called"
  | "dialing"
  | "connected"
  | "qualified"
  | "not_interested"
  | "no_answer"
  | "voicemail"
  | "failed";

export type CapitalType =
  | "term_loan"
  | "line_of_credit"
  | "mca"
  | "equipment_financing"
  | "other";

export type CreditScoreRange =
  | "below_580"
  | "580_619"
  | "620_659"
  | "660_699"
  | "700_719"
  | "720_750"
  | "above_750"
  | "unknown";

export type CallStatus =
  | "dialing"
  | "ringing"
  | "connected"
  | "completed"
  | "failed"
  | "no_answer"
  | "voicemail"
  | "busy"
  | "bridging"
  | "bridged";

export type TelephonyEventType =
  | "call.initiated"
  | "call.ringing"
  | "call.connected"
  | "call.completed"
  | "call.failed"
  | "call.no_answer"
  | "call.voicemail";

export type AgentEventType =
  | "turn.agent"
  | "turn.lead"
  | "qualification.complete"
  | "qualification.field_update"
  | "call.end_requested";

// ── Core Domain Interfaces ──────────────────────────────────────────────────

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  company_name: string | null;
  status: LeadStatus;
  metadata: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  dnc: boolean;
}

export interface QualificationData {
  id: string;
  lead_id: string;
  call_id: string;
  still_looking: boolean | null;
  capital_type: CapitalType | null;
  amount_requested: number | null;
  use_of_funds: string | null;
  active_debt: boolean | null;
  credit_score_range: CreditScoreRange | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  lead_id: string;
  script_id: string;
  voice_id: string | null;
  status: CallStatus;
  provider: "twilio" | "telnyx";
  provider_call_id: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  call_id: string;
  speaker: "agent" | "lead";
  text: string;
  sequence: number;
  timestamp_ms: number;
  created_at: string;
}

export interface TakeoverEvent {
  id: string;
  call_id: string;
  operator_id: string;
  joined_at: string;
  left_at: string | null;
  bridge_token: string | null;
  bridge_token_expires_at: string | null;
}

export interface User {
  id: string;
  email: string;
  role: "operator" | "admin";
  created_at: string;
}

export interface DncEntry {
  id: string;
  phone_number: string;
  reason: string | null;
  added_at: string;
}

// ── Request / Response Shapes ────────────────────────────────────────────────

export interface CreateLeadRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
  company_name?: string;
  metadata?: Record<string, string>;
}

export interface CreateLeadResponse {
  id: string;
  status: LeadStatus;
  created_at: string;
}

export interface InitiateCallRequest {
  lead_id: string;
  script_id: string;
  voice_id?: string;
}

export interface InitiateCallResponse {
  call_id: string;
  status: CallStatus;
  uri: string;
}

export interface TakeoverResponse {
  status: string;
  bridge_uri: string;
}

/**
 * Start the outbound dialer for a batch of leads.
 * @param batch_size - Number of leads to dial concurrently. Default 1, max 10.
 */
export interface DialerStartRequest {
  batch_size?: number;
}

export interface DialerStopRequest {
  // No required fields — sending an empty POST stops the active dialer.
}

export interface DncScrubRequest {
  phone_numbers: string[];
}

export interface DncScrubResponse {
  blocked: string[];
  allowed: string[];
}

export interface CrmPushRequest {
  lead_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  company_name?: string;
  qualification_data?: QualificationData;
}

export interface TelephonyWebhookPayload {
  event: TelephonyEventType;
  call_id: string;
  provider_call_id: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface AgentWebhookPayload {
  event: AgentEventType;
  call_id: string;
  lead_id: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface ApiError {
  code: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
