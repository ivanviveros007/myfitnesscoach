import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifiedExercises,
  exerciseTechniqueById,
  exerciseTechniques,
  exerciseTechniqueSchema,
} from "@myfitnesscoach/contracts";
import { appExercise } from "../src/training-catalog.js";

test("every classified exercise has one complete technical sheet", () => {
  assert.equal(exerciseTechniques.length, classifiedExercises.length);
  assert.equal(
    new Set(exerciseTechniques.map((x) => x.exercise.id)).size,
    classifiedExercises.length,
  );
  for (const sheet of exerciseTechniques) exerciseTechniqueSchema.parse(sheet);
});

test("all substitutions reference a real different exercise", () => {
  const ids = new Set(exerciseTechniques.map((x) => x.exercise.id));
  for (const sheet of exerciseTechniques) {
    for (const substitution of sheet.substitutions) {
      assert.ok(ids.has(substitution.exerciseId));
      assert.notEqual(substitution.exerciseId, sheet.exercise.id);
    }
  }
});

test("advanced or complex movements require coach review and are excluded for beginners", () => {
  for (const sheet of exerciseTechniques.filter(
    (x) => x.exercise.level === "advanced",
  )) {
    assert.equal(sheet.coachReviewRequired, true);
    assert.equal(sheet.beginnerEligible, false);
  }
});

test("power prescriptions prioritize quality and full recovery", () => {
  for (const sheet of exerciseTechniques) {
    for (const prescription of sheet.prescriptions.filter(
      (x) => x.profile === "power",
    )) {
      assert.ok((prescription.repsMax ?? 999) <= 5);
      assert.ok(prescription.restSecondsMin >= 90);
    }
  }
});

test("single-leg RDL has an exact unilateral guide and illustration", () => {
  const sheet = exerciseTechniqueById.get("single-leg-rdl");
  assert.ok(sheet);
  assert.match(sheet.setup.join(" "), /pierna de trabajo/i);
  assert.match(sheet.execution.join(" "), /pierna libre/i);
  assert.equal(appExercise(sheet).illustration, "single-leg-hinge");
});
