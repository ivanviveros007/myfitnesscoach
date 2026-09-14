import { test } from "node:test";
import assert from "node:assert/strict";
import { template, type TrainingProfile } from "@myfitnesscoach/contracts";
import { makeDailyRoutines } from "../../mobile/src/daily-routines";

const profile: TrainingProfile = {
  experience: "regular",
  equipment: "gym",
  limitations: "none",
  notes: "",
  jumpReady: true,
};

test("every proposal has warm up plus four populated blocks", () => {
  const choices = makeDailyRoutines(template("padel"), "2026-09-14", 0, profile);
  assert.equal(choices.length, 13);
  for (const choice of choices) {
    assert.equal(choice.routine.blocks?.length, 5);
    assert.equal(choice.routine.blocks?.[0]?.goal, "warmup");
    assert.ok(choice.routine.blocks?.every((block) => block.items.length > 0));
    assert.equal(new Set(choice.routine.items.map((item) => item.exercise.id)).size, choice.routine.items.length);
  }
});

test("modalities use different exercises and rotate on another day", () => {
  const first = makeDailyRoutines(template("padel"), "2026-09-14", 0, profile);
  const next = makeDailyRoutines(template("padel"), "2026-09-15", 0, profile);
  const ids = (choice: (typeof first)[number]) => choice.routine.items.map((item) => item.exercise.id).join("|");
  assert.notEqual(ids(first.find((choice) => choice.key === "strength")!), ids(first.find((choice) => choice.key === "hiit")!));
  for (const choice of first) assert.notEqual(ids(choice), ids(next.find((item) => item.key === choice.key)!));
});

test("HIIT and hypertrophy use their intended formats", () => {
  const choices = makeDailyRoutines(template("fitness"), "2026-09-14", 0, profile);
  const hiit = choices.find((choice) => choice.key === "hiit")!;
  const hypertrophy = choices.find((choice) => choice.key === "hypertrophy")!;
  assert.ok(hiit.routine.blocks?.some((block) => block.format === "intervals"));
  assert.ok(hypertrophy.routine.blocks?.slice(1, 4).every((block) => block.format === "sets"));
});
