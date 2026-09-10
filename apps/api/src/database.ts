import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
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
    `);
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
