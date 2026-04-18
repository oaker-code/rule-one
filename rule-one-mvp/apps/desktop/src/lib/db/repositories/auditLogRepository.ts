import type { AuditLogRecord } from "../schema";
import { getDatabase } from "../client";

export const auditLogRepository = {
  async insert(record: AuditLogRecord): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `INSERT INTO audit_logs (
        log_id,
        session_id,
        stage,
        input_payload,
        output_payload,
        safety_hit,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        record.log_id,
        record.session_id,
        record.stage,
        record.input_payload,
        record.output_payload,
        record.safety_hit,
        record.created_at,
      ],
    );
  },

  async listBySessionId(sessionId: string): Promise<AuditLogRecord[]> {
    const db = await getDatabase();

    return db.select<AuditLogRecord[]>(
      `SELECT
        log_id,
        session_id,
        stage,
        input_payload,
        output_payload,
        safety_hit,
        created_at
      FROM audit_logs
      WHERE session_id = $1
      ORDER BY created_at DESC`,
      [sessionId],
    );
  },
};
