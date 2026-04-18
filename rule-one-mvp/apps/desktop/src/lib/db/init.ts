import type { DatabaseHealthCheck, DemoInsertResult, ReviewSessionRecord } from "./schema";
import { getDatabase, getDatabaseFilePath } from "./client";
import { CORE_TABLES } from "./schema";
import { auditLogRepository } from "./repositories/auditLogRepository";
import { reflectionCardRepository } from "./repositories/reflectionCardRepository";
import { reviewSessionRepository } from "./repositories/reviewSessionRepository";
import { ruleArchiveRepository } from "./repositories/ruleArchiveRepository";

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execute("PRAGMA foreign_keys = ON");
  await db.execute(
    `CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS review_sessions (
      session_id TEXT PRIMARY KEY,
      review_date TEXT NOT NULL,
      emotion_label TEXT,
      raw_input TEXT,
      structured_review TEXT,
      main_bias TEXT,
      did_well TEXT,
      rule_one TEXT,
      risk_flag INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS reflection_cards (
      card_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      emotion TEXT,
      main_bias TEXT,
      did_well TEXT,
      rule_one TEXT,
      summary TEXT,
      created_at TEXT NOT NULL
    )`,
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS rule_archive (
      rule_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      rule_text TEXT NOT NULL,
      bias_type TEXT,
      rule_tag TEXT,
      status TEXT,
      created_at TEXT NOT NULL
    )`,
  );
  await db.execute(
    `CREATE TABLE IF NOT EXISTS audit_logs (
      log_id TEXT PRIMARY KEY,
      session_id TEXT,
      stage TEXT NOT NULL,
      input_payload TEXT,
      output_payload TEXT,
      safety_hit INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
  );
  await ensureColumnExists("rule_archive", "rule_tag", "TEXT");
}

export async function testDbConnection(): Promise<DatabaseHealthCheck> {
  await initDatabase();

  const db = await getDatabase();
  const tables = await db.select<Array<{ name: string }>>(
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name IN (${CORE_TABLES.map((_, index) => `$${index + 1}`).join(", ")})
     ORDER BY name`,
    [...CORE_TABLES],
  );

  return {
    isConnected: true,
    databasePath: await getDatabaseFilePath(),
    tables: tables.map((table) => table.name).filter(isCoreTableName),
  };
}

export async function insertDemoReview(): Promise<DemoInsertResult> {
  await initDatabase();

  const createdAt = new Date().toISOString();
  const sessionId = crypto.randomUUID();
  const reflectionCardId = crypto.randomUUID();
  const ruleId = crypto.randomUUID();
  const logId = crypto.randomUUID();

  await reviewSessionRepository.insert({
    session_id: sessionId,
    review_date: createdAt.slice(0, 10),
    emotion_label: "Calm",
    raw_input: JSON.stringify({
      note: "Demo local review created during SQLite setup.",
      source: "insertDemoReview",
    }),
    structured_review: JSON.stringify({
      summary: "Stayed patient during a volatile market move.",
      action: "Waited for confirmation instead of chasing.",
    }),
    main_bias: "Recency bias",
    did_well: "Paused before acting and reviewed the process.",
    rule_one: "Protect downside before optimizing upside.",
    risk_flag: 0,
    created_at: createdAt,
  });

  await reflectionCardRepository.insert({
    card_id: reflectionCardId,
    session_id: sessionId,
    emotion: "Calm",
    main_bias: "Recency bias",
    did_well: "Followed the checklist before making a decision.",
    rule_one: "Protect downside before optimizing upside.",
    summary: "A concise reflection card generated from the demo review.",
    created_at: createdAt,
  });

  await ruleArchiveRepository.insert({
    rule_id: ruleId,
    session_id: sessionId,
    rule_text: "If the setup is unclear, wait instead of forcing a trade.",
    bias_type: "Recency bias",
    rule_tag: "wait_for_confirmation",
    status: "active",
    created_at: createdAt,
  });

  await auditLogRepository.insert({
    log_id: logId,
    session_id: sessionId,
    stage: "demo_seed",
    input_payload: JSON.stringify({
      action: "insertDemoReview",
      sessionId,
    }),
    output_payload: JSON.stringify({
      reflectionCardId,
      ruleId,
      status: "ok",
    }),
    safety_hit: 0,
    created_at: createdAt,
  });

  return {
    sessionId,
    reflectionCardId,
    ruleId,
    logId,
  };
}

export async function listReviewSessions(): Promise<ReviewSessionRecord[]> {
  await initDatabase();
  return reviewSessionRepository.list();
}

function isCoreTableName(value: string): value is DatabaseHealthCheck["tables"][number] {
  return CORE_TABLES.includes(value as (typeof CORE_TABLES)[number]);
}

async function ensureColumnExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
  const db = await getDatabase();
  const columns = await db.select<Array<{ name: string }>>(
    `SELECT name FROM pragma_table_info('${tableName}')`,
  );
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}
