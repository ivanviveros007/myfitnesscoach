import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import {
  sessionSchema,
  cloudDataRecordSchema,
  type Session,
  type CloudDataRecord,
} from "@myfitnesscoach/contracts";
const db = SQLite.openDatabaseSync("myfitnesscoach.db");
db.execSync(`PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS settings(owner TEXT NOT NULL,key TEXT NOT NULL,value TEXT NOT NULL,PRIMARY KEY(owner,key));
 CREATE TABLE IF NOT EXISTS sessions(owner TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(owner,id));
 CREATE TABLE IF NOT EXISTS outbox(seq INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS favorites(owner TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(owner,kind,id));
 CREATE TABLE IF NOT EXISTS data_versions(owner TEXT NOT NULL,key TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(owner,key));
 CREATE TABLE IF NOT EXISTS data_outbox(seq INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,key TEXT NOT NULL,payload TEXT NOT NULL);
`);
function queueData(owner: string, record: CloudDataRecord) {
  cloudDataRecordSchema.parse(record);
  const baseVersion =
    db.getFirstSync<{ version: number }>(
      "SELECT version FROM data_versions WHERE owner=? AND key=?",
      owner,
      record.key,
    )?.version ?? 0;
  db.runSync(
    "DELETE FROM data_outbox WHERE owner=? AND key=?",
    owner,
    record.key,
  );
  db.runSync(
    "INSERT INTO data_outbox(owner,key,payload) VALUES(?,?,?)",
    owner,
    record.key,
    JSON.stringify({ operationId: Crypto.randomUUID(), baseVersion, record }),
  );
}
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
    db.runSync(
      "INSERT OR IGNORE INTO settings(owner,key,value) SELECT ?,key,value FROM settings WHERE owner='guest'",
      owner,
    );
    db.runSync("DELETE FROM settings WHERE owner='guest'");
    db.runSync(
      "INSERT OR IGNORE INTO favorites(owner,kind,id,created_at) SELECT ?,kind,id,created_at FROM favorites WHERE owner='guest'",
      owner,
    );
    db.runSync("DELETE FROM favorites WHERE owner='guest'");
    for (const row of db.getAllSync<{ key: string; value: string }>(
      "SELECT key,value FROM settings WHERE owner=? AND (key='profile' OR key LIKE 'plan:%') AND key NOT LIKE '%:revision:%'",
      owner,
    ))
      queueData(owner, {
        key: row.key,
        kind: row.key === "profile" ? "profile" : "weekly-plan",
        value: JSON.parse(row.value),
      } as CloudDataRecord);
    queueData(owner, {
      key: "favorites:movement",
      kind: "favorites",
      value: favorites(owner, "movement"),
    });
  });
}

export type FavoriteKind = "movement" | "block";
export function favorites(owner: string, kind: FavoriteKind): string[] {
  return db
    .getAllSync<{ id: string }>(
      "SELECT id FROM favorites WHERE owner=? AND kind=? ORDER BY created_at DESC",
      owner,
      kind,
    )
    .map((row) => row.id);
}
export function toggleFavorite(owner: string, kind: FavoriteKind, id: string) {
  const exists = db.getFirstSync(
    "SELECT 1 FROM favorites WHERE owner=? AND kind=? AND id=?",
    owner,
    kind,
    id,
  );
  if (exists)
    db.runSync(
      "DELETE FROM favorites WHERE owner=? AND kind=? AND id=?",
      owner,
      kind,
      id,
    );
  else
    db.runSync(
      "INSERT INTO favorites(owner,kind,id,created_at) VALUES(?,?,?,?)",
      owner,
      kind,
      id,
      new Date().toISOString(),
    );
  if (kind === "movement")
    queueData(owner, {
      key: "favorites:movement",
      kind: "favorites",
      value: favorites(owner, "movement"),
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

export function readSetting<T>(owner: string, key: string): T | null {
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE owner=? AND key=?",
    owner,
    key,
  );
  return row ? JSON.parse(row.value) : null;
}
export function writeSetting(owner: string, key: string, value: unknown) {
  db.runSync(
    "INSERT OR REPLACE INTO settings(owner,key,value) VALUES(?,?,?)",
    owner,
    key,
    JSON.stringify(value),
  );
  if (key === "profile")
    queueData(owner, {
      key: "profile",
      kind: "profile",
      value,
    } as CloudDataRecord);
  else if (/^plan:[a-z-]+:\d{4}-\d{2}-\d{2}$/.test(key))
    queueData(owner, { key, kind: "weekly-plan", value } as CloudDataRecord);
}

export function writeSettings(
  owner: string,
  entries: { key: string; value: unknown }[],
) {
  db.withTransactionSync(() => {
    for (const entry of entries) writeSetting(owner, entry.key, entry.value);
  });
}

export function pendingData(owner: string) {
  return db.getAllSync<{ seq: number; key: string; payload: string }>(
    "SELECT seq,key,payload FROM data_outbox WHERE owner=? ORDER BY seq",
    owner,
  );
}
export function acknowledgeData(
  owner: string,
  seq: number,
  key: string,
  version: number,
) {
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM data_outbox WHERE owner=? AND seq=?", owner, seq);
    db.runSync(
      "INSERT OR REPLACE INTO data_versions(owner,key,version) VALUES(?,?,?)",
      owner,
      key,
      version,
    );
  });
}
export function mergeData(
  owner: string,
  records: { key: string; kind: string; value: unknown; version: number }[],
) {
  db.withTransactionSync(() => {
    for (const raw of records) {
      const record = cloudDataRecordSchema.parse(raw);
      if (
        db.getFirstSync(
          "SELECT 1 FROM data_outbox WHERE owner=? AND key=?",
          owner,
          record.key,
        )
      )
        continue;
      if (record.kind === "favorites") {
        db.runSync(
          "DELETE FROM favorites WHERE owner=? AND kind='movement'",
          owner,
        );
        for (const id of record.value)
          db.runSync(
            "INSERT INTO favorites(owner,kind,id,created_at) VALUES(?,'movement',?,?)",
            owner,
            id,
            new Date().toISOString(),
          );
      } else
        db.runSync(
          "INSERT OR REPLACE INTO settings(owner,key,value) VALUES(?,?,?)",
          owner,
          record.key,
          JSON.stringify(record.value),
        );
      db.runSync(
        "INSERT OR REPLACE INTO data_versions(owner,key,version) VALUES(?,?,?)",
        owner,
        record.key,
        raw.version,
      );
    }
  });
}
