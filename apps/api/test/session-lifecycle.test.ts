import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSessionActive,
  sessionSchema,
  template,
} from "@myfitnesscoach/contracts";

function session() {
  const routine = template("fitness");
  return sessionSchema.parse({
    id: "870d7df7-8cbb-4fa8-9b9d-4a4afb73f020",
    routine,
    startedAt: "2026-09-14T12:00:00.000Z",
    finishedAt: null,
    items: routine.items.map((item) => ({
      exerciseId: item.exercise.id,
      status: "pending",
      comment: "",
      series: Array.from({ length: item.sets }, () => ({ reps: item.reps, weight: 0, done: false })),
    })),
  });
}

test("paused sessions remain active and can be resumed", () => {
  const paused = sessionSchema.parse({ ...session(), pausedAt: "2026-09-14T12:10:00.000Z" });
  assert.equal(isSessionActive(paused), true);
  assert.equal(isSessionActive({ ...paused, pausedAt: null }), true);
});

test("cancelled and finished sessions are not active", () => {
  const current = session();
  assert.equal(isSessionActive({ ...current, cancelledAt: "2026-09-14T12:10:00.000Z" }), false);
  assert.equal(isSessionActive({ ...current, finishedAt: "2026-09-14T12:20:00.000Z" }), false);
});
