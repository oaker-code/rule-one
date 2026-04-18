import type { RuleArchiveRecord, TopSummaryItem } from "../schema";
import { getDatabase } from "../client";

export const ruleArchiveRepository = {
  async insert(record: RuleArchiveRecord): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `INSERT INTO rule_archive (
        rule_id,
        session_id,
        rule_text,
        bias_type,
        rule_tag,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        record.rule_id,
        record.session_id,
        record.rule_text,
        record.bias_type,
        record.rule_tag,
        record.status,
        record.created_at,
      ],
    );
  },

  async findBySessionId(sessionId: string): Promise<RuleArchiveRecord | null> {
    const db = await getDatabase();
    const rows = await db.select<RuleArchiveRecord[]>(
      `SELECT
        rule_id,
        session_id,
        rule_text,
        bias_type,
        rule_tag,
        status,
        created_at
      FROM rule_archive
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [sessionId],
    );

    return rows[0] ?? null;
  },

  async upsertBySession(record: RuleArchiveRecord): Promise<void> {
    const existing = await this.findBySessionId(record.session_id);
    const db = await getDatabase();

    if (existing) {
      await db.execute(
        `UPDATE rule_archive
        SET
          rule_text = $2,
          bias_type = $3,
          rule_tag = $4,
          status = $5,
          created_at = $6
        WHERE session_id = $1`,
        [
          record.session_id,
          record.rule_text,
          record.bias_type,
          record.rule_tag,
          record.status,
          record.created_at,
        ],
      );
      return;
    }

    await this.insert(record);
  },

  async getTopBiases(limit = 3, days = 30): Promise<TopSummaryItem[]> {
    const db = await getDatabase();
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const rows = await db.select<Array<{ label: string | null; count: number | string }>>(
      `SELECT
        bias_type AS label,
        COUNT(*) AS count
      FROM rule_archive
      WHERE created_at >= $1
        AND bias_type IS NOT NULL
        AND TRIM(bias_type) <> ''
      GROUP BY bias_type
      ORDER BY COUNT(*) DESC, bias_type ASC
      LIMIT $2`,
      [sinceDate, limit],
    );

    return rows
      .filter((row) => typeof row.label === "string" && row.label.trim())
      .map((row) => ({
        label: row.label!.trim(),
        count: Number(row.count),
      }));
  },

  async getTopRuleTags(limit = 3, days = 30): Promise<TopSummaryItem[]> {
    const db = await getDatabase();
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const rows = await db.select<Array<{ label: string | null; count: number | string }>>(
      `SELECT
        rule_tag AS label,
        COUNT(*) AS count
      FROM rule_archive
      WHERE created_at >= $1
        AND rule_tag IS NOT NULL
        AND TRIM(rule_tag) <> ''
      GROUP BY rule_tag
      ORDER BY COUNT(*) DESC, rule_tag ASC
      LIMIT $2`,
      [sinceDate, limit],
    );

    return rows
      .filter((row) => typeof row.label === "string" && row.label.trim())
      .map((row) => ({
        label: row.label!.trim(),
        count: Number(row.count),
      }));
  },
};
