import {
  exerciseTechniques,
  type Exercise,
  type ExerciseTechnique,
  type TrainingProfile,
} from "@myfitnesscoach/contracts";

const illustrationByPattern: Record<string, Exercise["illustration"]> = {
  squat: "squat",
  hinge: "hinge",
  "hip-extension": "bridge",
  "horizontal-push": "push",
  "vertical-push": "push",
  "horizontal-pull": "row",
  "vertical-pull": "row",
  "vertical-jump": "jump",
  "horizontal-jump": "jump",
  "lateral-jump": "jump",
  landing: "jump",
  lunge: "goblet",
  "lateral-lunge": "goblet",
  "anti-rotation": "bird-dog",
  "anti-extension": "bird-dog",
  plank: "bird-dog",
  rotation: "bird-dog",
  "thoracic-rotation": "bird-dog",
  "spinal-rotation": "bird-dog",
  locomotion: "shuffle",
  running: "shuffle",
  footwork: "shuffle",
  "change-of-direction": "shuffle",
  "ankle-mobility": "calf",
  "hip-rotation": "leg-swing",
};

export function appExercise(sheet: ExerciseTechnique): Exercise {
  const illustration =
    sheet.exercise.patterns
      .map((pattern) => illustrationByPattern[pattern])
      .find(Boolean) ?? "bird-dog";
  return {
    id: sheet.exercise.id,
    name: sheet.exercise.name.es,
    equipment: sheet.exercise.equipment.join(" · "),
    muscles: sheet.exercise.regions.join(" · "),
    illustration,
    steps: [...sheet.setup, ...sheet.execution].slice(0, 10),
    cues: [...sheet.cues, ...sheet.stopConditions].slice(0, 8),
    sourceUrl:
      sheet.provenance.sourceUrl ??
      "https://github.com/ivanviveros007/myfitnesscoach/blob/main/docs/exercise-api.md",
  };
}

export function compatibleWithProfile(
  sheet: ExerciseTechnique,
  profile: TrainingProfile,
) {
  if (sheet.coachReviewRequired) return false;
  if (profile.experience === "new" && !sheet.beginnerEligible) return false;
  if (!profile.jumpReady && sheet.exercise.impact === "high") return false;
  if (profile.equipment === "gym") return true;
  const allowed =
    profile.equipment === "dumbbells"
      ? new Set(["none", "mat", "dumbbell", "bench", "band", "jump-rope"])
      : new Set(["none", "mat"]);
  return sheet.exercise.equipment.every((item) => allowed.has(item));
}

export function classifiedPool(profile: TrainingProfile) {
  return exerciseTechniques.filter((sheet) =>
    compatibleWithProfile(sheet, profile),
  );
}
