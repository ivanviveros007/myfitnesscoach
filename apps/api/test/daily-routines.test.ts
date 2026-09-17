import { test } from "node:test";
import assert from "node:assert/strict";
import { template, type TrainingProfile } from "@myfitnesscoach/contracts";
import {
  dailySelectionCandidates,
  makeDailyRoutines,
} from "../src/daily-training.js";

const profile: TrainingProfile = {
  experience: "regular",
  equipment: "gym",
  limitations: "none",
  notes: "",
  jumpReady: true,
};

test("every proposal has warm up plus four populated blocks", () => {
  const choices = makeDailyRoutines({
    orientation: "padel",
    date: "2026-09-14",
    completedCount: 0,
    profile,
  });
  assert.equal(choices.length, 13);
  for (const choice of choices) {
    assert.equal(choice.routine.blocks?.length, 5);
    assert.equal(choice.routine.blocks?.[0]?.goal, "warmup");
    assert.ok(choice.routine.blocks?.every((block) => block.items.length > 0));
    assert.equal(
      new Set(choice.routine.items.map((item) => item.exercise.id)).size,
      choice.routine.items.length,
    );
    assert.ok(
      choice.routine.items.every(
        (item) => (item.exercise.imageUrls?.length ?? 0) >= 2,
      ),
      `${choice.name} contiene un ejercicio sin demostración visual`,
    );
  }
});

test("modalities use different exercises and rotate on another day", () => {
  const first = makeDailyRoutines({
    orientation: "padel",
    date: "2026-09-14",
    completedCount: 0,
    profile,
  });
  const next = makeDailyRoutines({
    orientation: "padel",
    date: "2026-09-15",
    completedCount: 0,
    profile,
  });
  const ids = (choice: (typeof first)[number]) =>
    choice.routine.items.map((item) => item.exercise.id).join("|");
  assert.notEqual(
    ids(first.find((choice) => choice.key === "strength")!),
    ids(first.find((choice) => choice.key === "hiit")!),
  );
  for (const choice of first)
    assert.notEqual(
      ids(choice),
      ids(next.find((item) => item.key === choice.key)!),
    );
});

test("HIIT and hypertrophy use their intended formats", () => {
  const choices = makeDailyRoutines({
    orientation: "fitness",
    date: "2026-09-14",
    completedCount: 0,
    profile,
  });
  const hiit = choices.find((choice) => choice.key === "hiit")!;
  const hypertrophy = choices.find((choice) => choice.key === "hypertrophy")!;
  assert.ok(hiit.routine.blocks?.some((block) => block.format === "intervals"));
  assert.ok(
    hypertrophy.routine.blocks
      ?.slice(1, 4)
      .every((block) => block.format === "sets"),
  );
});

test("the recommended routine follows the user's declared goal", () => {
  const power = makeDailyRoutines({
    orientation: "padel",
    date: "2026-09-15",
    completedCount: 0,
    profile: { ...profile, goals: ["power", "sport-performance"] },
  })[0]!;
  const muscle = makeDailyRoutines({
    orientation: "fitness",
    date: "2026-09-15",
    completedCount: 0,
    profile: { ...profile, goals: ["muscle-gain"] },
  })[0]!;
  assert.ok(power.routine.blocks?.some((block) => block.goal === "power"));
  assert.ok(
    muscle.routine.blocks?.some((block) => block.title === "Lower Body"),
  );
  assert.notDeepEqual(
    power.routine.blocks?.slice(1).map((block) => block.goal),
    muscle.routine.blocks?.slice(1).map((block) => block.goal),
  );
});

test("main blocks have useful density and recent work changes the recommendation", () => {
  const first = makeDailyRoutines({
    orientation: "padel",
    date: "2026-09-14",
    completedCount: 0,
    profile: { ...profile, goals: ["sport-performance", "power"] },
  })[0]!;
  assert.ok(first.routine.blocks![0]!.items.length >= 3);
  assert.ok(first.routine.blocks!.slice(1, 4).every((block) => block.items.length >= 3));
  const priorIds = first.routine.items.map((item) => item.exercise.id);
  const next = makeDailyRoutines({
    orientation: "padel",
    date: "2026-09-15",
    completedCount: 1,
    profile: { ...profile, goals: ["sport-performance", "power"] },
    recentSessions: [{
      finishedAt: "2026-09-14T18:00:00.000Z",
      exerciseIds: priorIds,
    }],
    upcomingSportInDays: 1,
  })[0]!;
  const overlap = next.routine.items.filter((item) => priorIds.includes(item.exercise.id));
  assert.ok(overlap.length < next.routine.items.length / 2);
  assert.match(next.insight ?? "", /24 horas/);
});

test("validated AI selections replace exercises only from the allowed block pool", () => {
  const input = {
    date: "2026-09-14",
    orientation: "fitness" as const,
    completedCount: 0,
    profile: {
      experience: "regular" as const,
      equipment: "gym" as const,
      limitations: "none" as const,
      notes: "",
      jumpReady: true,
    },
  };
  const candidate = dailySelectionCandidates(input)[0]!;
  const firstBlock = candidate.blocks[0]!;
  const exerciseIds = firstBlock.candidates
    .slice(0, firstBlock.count)
    .map((item) => item.id);
  const choices = makeDailyRoutines(input, {
    [candidate.key]: { [firstBlock.position]: exerciseIds },
  });
  assert.deepEqual(
    choices[0]!.routine.blocks![0]!.items.map((item) => item.exercise.id),
    exerciseIds,
  );
});

test("every supported equipment profile receives only fully illustrated exercises", () => {
  for (const equipment of ["bodyweight", "dumbbells", "gym"] as const) {
    const choices = makeDailyRoutines({
      orientation: "fitness",
      date: "2026-09-16",
      completedCount: 0,
      profile: {
        ...profile,
        experience: equipment === "bodyweight" ? "new" : "regular",
        equipment,
      },
    });
    for (const choice of choices) {
      assert.ok(choice.routine.blocks?.every((block) => block.items.length > 0));
      assert.ok(
        choice.routine.items.every(
          (item) => (item.exercise.imageUrls?.length ?? 0) >= 2,
        ),
      );
    }
  }
});
