import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeWeeklyPlan,
  exercises,
  exerciseSchema,
  currentWeek,
  template,
  amrapTemplate,
  sessionSchema,
  physicalActivitySchema,
  type TrainingProfile,
  type WeekInput,
} from "@myfitnesscoach/contracts";

test("physical activities preserve sport load without becoming workouts", () => {
  const activity = physicalActivitySchema.parse({
    id: "87952b9e-b53e-4c51-8b5d-90a60d75b810",
    type: "padel",
    name: "Partido de pádel",
    occurredAt: "2026-09-17T18:00:00.000Z",
    durationMinutes: 90,
    intensity: "high",
  });
  assert.equal(activity.durationMinutes, 90);
  assert.equal(activity.type, "padel");
});
const profile: TrainingProfile = {
  experience: "regular",
  equipment: "gym",
  limitations: "none",
  notes: "",
  jumpReady: true,
};
const input: WeekInput = {
  week: "2026-09-07",
  orientation: "padel",
  days: [0, 2, 4],
  sportDays: [],
  minutes: 45,
  readiness: "normal",
};
test("weekly availability, duration and guides across equipment and experience", () => {
  for (const equipment of ["bodyweight", "dumbbells", "gym"] as const)
    for (const experience of ["new", "regular"] as const)
      for (const minutes of [30, 45, 60] as const)
        for (const days of [
          [0, 3],
          [0, 2, 4],
          [0, 2, 4, 6],
        ]) {
          const plan = makeWeeklyPlan(
            { ...profile, equipment, experience },
            { ...input, minutes, days },
          );
          assert.equal(plan.routines.length, days.length);
          for (const r of plan.routines) {
            assert.equal(r.trainingMode, "planned");
            assert.deepEqual(
              r.blocks?.map((block) => block.section),
              ["warmup", "block-1", "block-2", "block-3", "block-4"],
            );
            assert.ok(r.items.length >= 8);
            assert.ok(r.estimatedMinutes! <= minutes);
            for (const p of r.items) {
              exerciseSchema.parse(p.exercise);
              assert.ok(p.exercise.videoId || p.exercise.videoUrl);
              assert.ok(p.exercise.steps.length >= 2);
            }
            if (experience === "new")
              assert.ok(!r.items.some((p) => p.block === "power"));
            if (equipment === "bodyweight")
              assert.ok(
                !r.items.some((p) =>
                  ["goblet", "rdl", "machine-row", "dumbbell-row"].includes(
                    p.exercise.id,
                  ),
                ),
              );
          }
        }
});
test("AMRAP has a warm up, a timed block and compatible session results", () => {
  const routine = amrapTemplate("padel", 12, "bodyweight");
  assert.deepEqual(
    routine.blocks?.map((block) => block.section),
    ["warmup", "block-1", "block-2", "block-3", "block-4"],
  );
  assert.equal(routine.blocks?.[0]?.goal, "warmup");
  assert.equal(
    routine.blocks?.find((block) => block.format === "amrap")?.durationMinutes,
    12,
  );
  assert.ok(!routine.items.some((item) => item.exercise.id === "goblet"));
  const session = sessionSchema.parse({
    id: "2d4f13a8-0e3d-4ab0-a8fc-a0d924b9fb12",
    routine,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    amrap: { durationSeconds: 720, startedAt: null, rounds: 3, extraReps: 4 },
    items: routine.items.map((item) => ({
      exerciseId: item.exercise.id,
      status: "pending",
      comment: "",
      series: Array.from({ length: item.sets }, () => ({
        reps: item.reps,
        weight: 0,
        done: false,
      })),
    })),
  });
  assert.equal(session.amrap?.rounds, 3);
});
test("every new routine uses warm up plus four ordered blocks", () => {
  for (const routine of [
    template("padel"),
    template("football"),
    template("fitness"),
    template("free", ["squat", "bridge"]),
    amrapTemplate("padel", 12, "gym"),
  ]) {
    assert.equal(routine.blocks?.length, 5);
    assert.deepEqual(
      routine.blocks?.map((block) => block.section),
      ["warmup", "block-1", "block-2", "block-3", "block-4"],
    );
    assert.equal(routine.blocks?.[0]?.goal, "warmup");
    assert.equal(routine.blocks?.[0]?.title.toLowerCase(), "warm up");
    assert.ok(routine.blocks?.every((block) => block.items.length > 0));
  }
});
test("fatigue, adjacent gym days and competition reduce load", () => {
  for (const configuration of [
    { ...input, readiness: "tired" as const },
    { ...input, sportDays: [0, 1, 2, 3, 4, 5, 6] },
  ]) {
    const plan = makeWeeklyPlan(profile, configuration);
    assert.ok(
      plan.routines.every((r) => !r.items.some((p) => p.block === "power")),
    );
    assert.ok(
      plan.routines.every((r) =>
        r.items
          .filter((p) => p.block === "strength")
          .every((p) => p.sets === 1),
      ),
    );
  }
  const adjacent = makeWeeklyPlan(profile, { ...input, days: [0, 1] });
  assert.equal(
    adjacent.routines.filter((r) => r.items.some((p) => p.block === "power"))
      .length,
    1,
  );
});
test("restrictions require adaptation; incomplete or duplicate availability is rejected", () => {
  assert.equal(
    makeWeeklyPlan({ ...profile, limitations: "review" }, input).routines
      .length,
    0,
  );
  assert.throws(() => makeWeeklyPlan(profile, { ...input, days: [0, 0] }));
  assert.throws(() => makeWeeklyPlan(profile, { ...input, days: [0] }));
});
test("changing weekly availability does not mutate past plans or catalogue", () => {
  const before = JSON.stringify(exercises);
  const first = makeWeeklyPlan(profile, input);
  const snapshot = JSON.stringify(first);
  makeWeeklyPlan(profile, { ...input, days: [1, 4] });
  assert.equal(JSON.stringify(first), snapshot);
  assert.equal(JSON.stringify(exercises), before);
  assert.equal(new Set(exercises.map((e) => e.id)).size, exercises.length);
  assert.equal(currentWeek(new Date(2026, 8, 13, 12)), "2026-09-07");
  assert.equal(currentWeek(new Date(2026, 8, 14, 12)), "2026-09-14");
});
