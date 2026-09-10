import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { template, sessionSchema } from "@myfitnesscoach/contracts";
import { Database } from "../src/database.js";
import { Sync } from "../src/sync.js";
import { Auth } from "../src/auth.js";

test("PostgreSQL: retry, concurrent conflict, ownership and persisted history", async () => {
  assert.ok(
    process.env.DATABASE_URL,
    "Set DATABASE_URL to a dedicated test database",
  );
  const db = new Database();
  await db.onModuleInit();
  const sync = new Sync(db);
  const auth = new Auth(db);
  const email = `test-${randomUUID()}@example.com`;
  const user = await auth.authenticate(email, "test-password-1234", true);
  const other = await auth.authenticate(
    `other-${randomUUID()}@example.com`,
    "test-password-1234",
    true,
  );
  try {
    assert.equal(
      (await auth.authenticate(email, "test-password-1234", false)).userId,
      user.userId,
    );
    await assert.rejects(auth.authenticate(email, "incorrect-password", false));
    const routine = template("padel");
    const session = sessionSchema.parse({
      id: randomUUID(),
      routine,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      items: routine.items.map((p) => ({
        exerciseId: p.exercise.id,
        status: "pending",
        comment: "",
        series: Array.from({ length: p.sets }, () => ({
          done: false,
          reps: p.reps,
          weight: 0,
        })),
      })),
    });
    const first = { operationId: randomUUID(), baseVersion: 0, session };
    const repeated = await Promise.all([
      sync.push(user.userId, first),
      sync.push(user.userId, first),
    ]);
    assert.deepEqual(repeated, [
      { id: session.id, version: 1 },
      { id: session.id, version: 1 },
    ]);
    await assert.rejects(sync.push(user.userId, { ...first, baseVersion: 1 }));
    const changed = structuredClone(session);
    changed.items[0].comment = "Solo pude completar una serie";
    changed.items[0].series[0].done = true;
    changed.items[0].status = "partial";
    const concurrent = await Promise.allSettled([
      sync.push(user.userId, {
        operationId: randomUUID(),
        baseVersion: 1,
        session: changed,
      }),
      sync.push(user.userId, {
        operationId: randomUUID(),
        baseVersion: 1,
        session,
      }),
    ]);
    assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(concurrent.filter((r) => r.status === "rejected").length, 1);
    assert.deepEqual(await sync.list(other.userId), []);
    const history = await sync.list(user.userId);
    assert.equal(history.length, 1);
    assert.equal(history[0].version, 2);
    const secondConnection = new Database();
    try {
      assert.equal(
        (await new Sync(secondConnection).list(user.userId)).length,
        1,
      );
    } finally {
      await secondConnection.onModuleDestroy();
    }
    const malformed = structuredClone(session);
    malformed.items[0].exerciseId = "wrong";
    assert.equal(sessionSchema.safeParse(malformed).success, false);
  } finally {
    for (const id of [user.userId, other.userId]) {
      await db.pool.query("DELETE FROM sync_operations WHERE user_id=$1", [id]);
      await db.pool.query("DELETE FROM training_sessions WHERE user_id=$1", [
        id,
      ]);
      await db.pool.query("DELETE FROM auth_sessions WHERE user_id=$1", [id]);
      await db.pool.query("DELETE FROM users WHERE id=$1", [id]);
    }
    await db.onModuleDestroy();
  }
});
