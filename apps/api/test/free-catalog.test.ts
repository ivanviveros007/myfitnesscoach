import test from "node:test";
import assert from "node:assert/strict";
import {
  freeExercises,
  freeImagesForName,
  searchFreeExercises,
} from "../src/free-catalog.js";

test("expanded catalog imports every Free Exercise DB movement with unique ids", () => {
  assert.equal(freeExercises.length, 876);
  assert.equal(new Set(freeExercises.map((item) => item.id)).size, 876);
});

test("curated exercises can reuse exact Free Exercise DB photography", () => {
  assert.equal(freeImagesForName("Goblet Squat")?.length, 2);
  assert.equal(freeImagesForName("DDB Shoulder Press")?.length, 2);
  assert.equal(freeImagesForName("Barbell Front Squat")?.length, 2);
  assert.equal(freeImagesForName("An unrelated movement"), undefined);
});

test("expanded search includes real start and movement images", () => {
  const result = searchFreeExercises("deadlift", 10, 0);
  assert.ok(result.total > 0);
  assert.equal(result.items[0]?.catalogSource, "free-exercise-db");
  assert.equal(result.items[0]?.imageUrls?.length, 2);
  assert.match(result.items[0]?.imageUrls?.[0] ?? "", /^\/catalog\/media\//);
});
