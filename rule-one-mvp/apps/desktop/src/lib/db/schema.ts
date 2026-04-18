export const DATABASE_NAME = "ruleone.db";
export const DATABASE_URL = `sqlite:${DATABASE_NAME}`;

export const CORE_TABLES = [
  "app_settings",
  "review_sessions",
  "reflection_cards",
  "rule_archive",
  "audit_logs",
] as const;

export type CoreTableName = (typeof CORE_TABLES)[number];

export interface AppSettingRecord {
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export interface ReviewSessionRecord {
  session_id: string;
  review_date: string;
  emotion_label: string | null;
  raw_input: string | null;
  structured_review: string | null;
  main_bias: string | null;
  did_well: string | null;
  rule_one: string | null;
  risk_flag: number;
  created_at: string;
}

export interface ReflectionCardRecord {
  card_id: string;
  session_id: string;
  emotion: string | null;
  main_bias: string | null;
  did_well: string | null;
  rule_one: string | null;
  summary: string | null;
  created_at: string;
}

export interface RuleArchiveRecord {
  rule_id: string;
  session_id: string;
  rule_text: string;
  bias_type: string | null;
  rule_tag: string | null;
  status: string | null;
  created_at: string;
}

export interface TopSummaryItem {
  label: string;
  count: number;
}

export interface AuditLogRecord {
  log_id: string;
  session_id: string | null;
  stage: string;
  input_payload: string | null;
  output_payload: string | null;
  safety_hit: number;
  created_at: string;
}

export interface DatabaseHealthCheck {
  isConnected: boolean;
  databasePath: string;
  tables: CoreTableName[];
}

export interface DemoInsertResult {
  sessionId: string;
  reflectionCardId: string;
  ruleId: string;
  logId: string;
}
