import { Injectable, ConflictException } from "@nestjs/common";
import { syncSchema } from "@myfitnesscoach/contracts";
import { Database } from "./database.js";
import { digest } from "./auth.js";
@Injectable()
export class Sync {
  constructor(private readonly db: Database) {}
  async push(userId: string, payload: ReturnType<typeof syncSchema.parse>) {
    const client = await this.db.pool.connect();
    try {
      await client.query("BEGIN");
      // Serialize writes per account, including first creation and duplicate retries.
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        userId,
      ]);
      const hash = digest(JSON.stringify(payload));
      const previous = await client.query(
        "SELECT payload_hash,result FROM sync_operations WHERE user_id=$1 AND operation_id=$2",
        [userId, payload.operationId],
      );
      if (previous.rows.length) {
        if (previous.rows[0].payload_hash !== hash)
          throw new ConflictException(
            "Operación reutilizada con datos diferentes.",
          );
        await client.query("COMMIT");
        return previous.rows[0].result;
      }
      const current = await client.query(
        "SELECT version,data FROM training_sessions WHERE user_id=$1 AND id=$2",
        [userId, payload.session.id],
      );
      const version = current.rows[0]?.version ?? 0;
      if (version !== payload.baseVersion)
        throw new ConflictException({
          message: "La sesión cambió en otro dispositivo.",
          serverVersion: version,
          serverSession: current.rows[0]?.data,
        });
      const next = version + 1;
      await client.query(
        "INSERT INTO training_sessions(user_id,id,version,data) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,id) DO UPDATE SET version=EXCLUDED.version,data=EXCLUDED.data,updated_at=now()",
        [userId, payload.session.id, next, JSON.stringify(payload.session)],
      );
      const result = { id: payload.session.id, version: next };
      await client.query(
        "INSERT INTO sync_operations(user_id,operation_id,payload_hash,result) VALUES($1,$2,$3,$4)",
        [userId, payload.operationId, hash, JSON.stringify(result)],
      );
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async list(userId: string) {
    const { rows } = await this.db.pool.query(
      "SELECT data AS session,version FROM training_sessions WHERE user_id=$1 ORDER BY updated_at DESC",
      [userId],
    );
    return rows;
  }
}
