import type { ReflectionCardRecord } from "../schema";
import { getDatabase } from "../client";

export const reflectionCardRepository = {
  async insert(record: ReflectionCardRecord): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `INSERT INTO reflection_cards (
        card_id,
        session_id,
        emotion,
        main_bias,
        did_well,
        rule_one,
        summary,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        record.card_id,
        record.session_id,
        record.emotion,
        record.main_bias,
        record.did_well,
        record.rule_one,
        record.summary,
        record.created_at,
      ],
    );
  },

  async findBySessionId(sessionId: string): Promise<ReflectionCardRecord | null> {
    const db = await getDatabase();
    const rows = await db.select<ReflectionCardRecord[]>(
      `SELECT
        card_id,
        session_id,
        emotion,
        main_bias,
        did_well,
        rule_one,
        summary,
        created_at
      FROM reflection_cards
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [sessionId],
    );

    return rows[0] ?? null;
  },

  async upsertBySession(record: ReflectionCardRecord): Promise<void> {
    const existing = await this.findBySessionId(record.session_id);
    const db = await getDatabase();

    if (existing) {
      await db.execute(
        `UPDATE reflection_cards
        SET
          emotion = $2,
          main_bias = $3,
          did_well = $4,
          rule_one = $5,
          summary = $6,
          created_at = $7
        WHERE session_id = $1`,
        [
          record.session_id,
          record.emotion,
          record.main_bias,
          record.did_well,
          record.rule_one,
          record.summary,
          record.created_at,
        ],
      );
      return;
    }

    await this.insert(record);
  },
};
