import type { ReviewSessionRecord } from "../schema";
import { getDatabase } from "../client";

export const reviewSessionRepository = {
  async insert(record: ReviewSessionRecord): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `INSERT INTO review_sessions (
        session_id,
        review_date,
        emotion_label,
        raw_input,
        structured_review,
        main_bias,
        did_well,
        rule_one,
        risk_flag,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        record.session_id,
        record.review_date,
        record.emotion_label,
        record.raw_input,
        record.structured_review,
        record.main_bias,
        record.did_well,
        record.rule_one,
        record.risk_flag,
        record.created_at,
      ],
    );
  },

  async list(): Promise<ReviewSessionRecord[]> {
    const db = await getDatabase();

    return db.select<ReviewSessionRecord[]>(
      `SELECT
        session_id,
        review_date,
        emotion_label,
        raw_input,
        structured_review,
        main_bias,
        did_well,
        rule_one,
        risk_flag,
        created_at
      FROM review_sessions
      ORDER BY created_at DESC`,
    );
  },

  async getById(sessionId: string): Promise<ReviewSessionRecord | null> {
    const db = await getDatabase();
    const rows = await db.select<ReviewSessionRecord[]>(
      `SELECT
        session_id,
        review_date,
        emotion_label,
        raw_input,
        structured_review,
        main_bias,
        did_well,
        rule_one,
        risk_flag,
        created_at
      FROM review_sessions
      WHERE session_id = $1
      LIMIT 1`,
      [sessionId],
    );

    return rows[0] ?? null;
  },

  async updateResult(record: ReviewSessionRecord): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `UPDATE review_sessions
      SET
        review_date = $2,
        emotion_label = $3,
        raw_input = $4,
        structured_review = $5,
        main_bias = $6,
        did_well = $7,
        rule_one = $8,
        risk_flag = $9,
        created_at = $10
      WHERE session_id = $1`,
      [
        record.session_id,
        record.review_date,
        record.emotion_label,
        record.raw_input,
        record.structured_review,
        record.main_bias,
        record.did_well,
        record.rule_one,
        record.risk_flag,
        record.created_at,
      ],
    );
  },
};
