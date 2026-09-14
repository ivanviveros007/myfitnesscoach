import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifiedExercises,
  exerciseCatalogStats,
} from "@myfitnesscoach/contracts";

test("classified catalog has unique ids and both origins", () => {
  assert.equal(
    new Set(classifiedExercises.map((item) => item.id)).size,
    classifiedExercises.length,
  );
  assert.ok(exerciseCatalogStats.observedInBigg > 50);
  assert.ok(exerciseCatalogStats.observedInDcfit > 10);
  assert.ok(exerciseCatalogStats.observedOnWeb > 20);
  assert.ok(exerciseCatalogStats.curated > 20);
});

for (const goal of [
  "warmup",
  "power",
  "strength",
  "hypertrophy",
  "hiit",
  "cross-training",
  "pilates",
  "sport",
  "midline",
  "mobility",
]) {
  test(`classified catalog covers ${goal}`, () => {
    assert.ok(
      classifiedExercises.filter((item) => item.goals.includes(goal)).length >=
        3,
    );
  });
}

test("no-impact movements never receive power dosing", () => {
  assert.deepEqual(
    classifiedExercises.filter(
      (item) => item.impact === "none" && item.doseProfiles.includes("power"),
    ),
    [],
  );
});
