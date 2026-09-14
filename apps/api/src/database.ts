import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
import { exerciseTechniques } from "@myfitnesscoach/contracts";
import type { ExerciseTechnique } from "@myfitnesscoach/contracts";
@Injectable()
export class Database implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  async onModuleInit() {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS auth_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
      CREATE TABLE IF NOT EXISTS training_sessions (user_id uuid NOT NULL REFERENCES users(id), id uuid NOT NULL, version integer NOT NULL CHECK(version>0), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,id));
      CREATE TABLE IF NOT EXISTS sync_operations (user_id uuid NOT NULL REFERENCES users(id), operation_id uuid NOT NULL, payload_hash text NOT NULL, result jsonb NOT NULL, PRIMARY KEY(user_id,operation_id));
      CREATE TABLE IF NOT EXISTS user_data (user_id uuid NOT NULL REFERENCES users(id), key text NOT NULL, kind text NOT NULL, version integer NOT NULL CHECK(version>0), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,key));
      CREATE TABLE IF NOT EXISTS exercises (id text PRIMARY KEY, name_es text NOT NULL, name_en text NOT NULL, level text NOT NULL, impact text NOT NULL, active boolean NOT NULL DEFAULT true, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS exercise_prescriptions (exercise_id text NOT NULL REFERENCES exercises(id) ON DELETE CASCADE, profile text NOT NULL, data jsonb NOT NULL, PRIMARY KEY(exercise_id,profile));
      CREATE TABLE IF NOT EXISTS exercise_substitutions (exercise_id text NOT NULL REFERENCES exercises(id) ON DELETE CASCADE, substitute_id text NOT NULL REFERENCES exercises(id), reason text NOT NULL, priority integer NOT NULL, PRIMARY KEY(exercise_id,substitute_id));
      CREATE TABLE IF NOT EXISTS daily_training_cache (cache_key text PRIMARY KEY, training_date date NOT NULL, data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
    `);
    await this.seedExerciseCatalog();
  }
  private async seedExerciseCatalog() {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const sheet of exerciseTechniques) {
        await client.query(
          `INSERT INTO exercises(id,name_es,name_en,level,impact,data) VALUES($1,$2,$3,$4,$5,$6)
           ON CONFLICT(id) DO UPDATE SET name_es=excluded.name_es,name_en=excluded.name_en,level=excluded.level,impact=excluded.impact,data=excluded.data,updated_at=now()`,
          [sheet.exercise.id, sheet.exercise.name.es, sheet.exercise.name.en, sheet.exercise.level, sheet.exercise.impact, sheet],
        );
        for (const prescription of sheet.prescriptions) {
          await client.query(
            `INSERT INTO exercise_prescriptions(exercise_id,profile,data) VALUES($1,$2,$3)
             ON CONFLICT(exercise_id,profile) DO UPDATE SET data=excluded.data`,
            [sheet.exercise.id, prescription.profile, prescription],
          );
        }
      }
      await client.query("DELETE FROM exercise_substitutions");
      for (const sheet of exerciseTechniques) {
        for (const [priority, substitution] of sheet.substitutions.entries()) {
          await client.query(
            "INSERT INTO exercise_substitutions(exercise_id,substitute_id,reason,priority) VALUES($1,$2,$3,$4)",
            [sheet.exercise.id, substitution.exerciseId, substitution.reason, priority],
          );
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async listExercises(filters: {
    goal?: string;
    equipment?: string;
    level?: string;
    beginnerEligible?: boolean;
  }): Promise<ExerciseTechnique[]> {
    const conditions = ["active=true"];
    const values: unknown[] = [];
    const add = (condition: string, value: unknown) => {
      values.push(value);
      conditions.push(condition.replace("$?", `$${values.length}`));
    };
    if (filters.goal) add("data->'exercise'->'goals' ? $?", filters.goal);
    if (filters.equipment) add("data->'exercise'->'equipment' ? $?", filters.equipment);
    if (filters.level) add("level=$?", filters.level);
    if (filters.beginnerEligible !== undefined)
      add("(data->>'beginnerEligible')::boolean=$?", filters.beginnerEligible);
    const result = await this.pool.query<{ data: ExerciseTechnique }>(
      `SELECT data FROM exercises WHERE ${conditions.join(" AND ")} ORDER BY name_es`,
      values,
    );
    return result.rows.map((row) => row.data);
  }
  async getExercise(id: string): Promise<ExerciseTechnique | undefined> {
    const result = await this.pool.query<{ data: ExerciseTechnique }>(
      "SELECT data FROM exercises WHERE id=$1 AND active=true",
      [id],
    );
    return result.rows[0]?.data;
  }
  async getDailyTraining(cacheKey: string): Promise<unknown | undefined> {
    const result = await this.pool.query<{ data: unknown }>(
      "SELECT data FROM daily_training_cache WHERE cache_key=$1",
      [cacheKey],
    );
    return result.rows[0]?.data;
  }
  async cacheDailyTraining(cacheKey: string, date: string, data: unknown) {
    await this.pool.query(
      `INSERT INTO daily_training_cache(cache_key,training_date,data) VALUES($1,$2,$3)
       ON CONFLICT(cache_key) DO UPDATE SET data=excluded.data,created_at=now()`,
      [cacheKey, date, JSON.stringify(data)],
    );
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
