import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { sessionSchema, type Session } from "@myfitnesscoach/contracts";
const db = SQLite.openDatabaseSync("myfitnesscoach.db");
db.execSync(`PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS sessions(owner TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(owner,id));
 CREATE TABLE IF NOT EXISTS outbox(seq INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL);
`);
export type Stored = { session: Session; version: number };
export function history(owner: string): Stored[] {
  return db
    .getAllSync<{ data: string; version: number }>(
      "SELECT data,version FROM sessions WHERE owner=? ORDER BY json_extract(data,'$.startedAt') DESC",
      owner,
    )
    .map((row) => ({
      session: sessionSchema.parse(JSON.parse(row.data)),
      version: row.version,
    }));
}
function saveInside(owner: string, session: Session) {
  sessionSchema.parse(session);
  const row = db.getFirstSync<{ version: number }>(
    "SELECT version FROM sessions WHERE owner=? AND id=?",
    owner,
    session.id,
  );
  const baseVersion = row?.version ?? 0;
  db.runSync(
    "INSERT OR REPLACE INTO sessions(owner,id,data,version) VALUES(?,?,?,?)",
    owner,
    session.id,
    JSON.stringify(session),
    baseVersion + 1,
  );
  db.runSync(
    "INSERT INTO outbox(owner,id,payload) VALUES(?,?,?)",
    owner,
    session.id,
    JSON.stringify({ operationId: Crypto.randomUUID(), baseVersion, session }),
  );
}
export function save(owner: string, session: Session) {
  db.withTransactionSync(() => saveInside(owner, session));
}
export function pending(owner: string) {
  return db.getAllSync<{ seq: number; id: string; payload: string }>(
    "SELECT seq,id,payload FROM outbox WHERE owner=? ORDER BY seq",
    owner,
  );
}
export function acknowledge(seq: number) {
  db.runSync("DELETE FROM outbox WHERE seq=?", seq);
}
export function merge(owner: string, records: Stored[]) {
  db.withTransactionSync(() => {
    for (const row of records) {
      sessionSchema.parse(row.session);
      if (
        !db.getFirstSync(
          "SELECT 1 FROM outbox WHERE owner=? AND id=?",
          owner,
          row.session.id,
        )
      )
        db.runSync(
          "INSERT OR REPLACE INTO sessions(owner,id,data,version) VALUES(?,?,?,?)",
          owner,
          row.session.id,
          JSON.stringify(row.session),
          row.version,
        );
    }
  });
}
export function claimGuest(owner: string) {
  db.withTransactionSync(() => {
    for (const row of history("guest"))
      saveInside(owner, { ...row.session, id: Crypto.randomUUID() });
    db.runSync("DELETE FROM outbox WHERE owner=?", "guest");
    db.runSync("DELETE FROM sessions WHERE owner=?", "guest");
  });
}
// Explicit conflict resolution preserves the local work as an independent session.
export function preserveConflict(owner: string, id: string) {
  const row = history(owner).find((x) => x.session.id === id);
  if (!row) return;
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM outbox WHERE owner=? AND id=?", owner, id);
    db.runSync("DELETE FROM sessions WHERE owner=? AND id=?", owner, id);
    saveInside(owner, {
      ...row.session,
      id: Crypto.randomUUID(),
      routine: {
        ...row.session.routine,
        name: row.session.routine.name.slice(0, 106) + " (copia local)",
      },
    });
  });
}
