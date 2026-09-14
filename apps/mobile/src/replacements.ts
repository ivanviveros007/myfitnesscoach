import {
  exercises,
  exerciseTechniqueById,
  exerciseTechniques,
  type Exercise,
  type Prescription,
  type Routine,
  type TrainingProfile,
} from "@myfitnesscoach/contracts";
import { appExercise, compatibleWithProfile } from "./classified-exercises";

const replacementGroups = {
  warmup: ["leg-swing", "shuffle", "calf-stretch", "child"],
  power: ["jump", "shuffle", "squat"],
  transfer: ["shuffle", "jump", "leg-swing"],
  strength: [
    "squat",
    "goblet",
    "rdl",
    "bridge",
    "incline-push",
    "machine-row",
    "dumbbell-row",
  ],
  stability: ["bird-dog", "bridge", "squat"],
  flexibility: ["child", "calf-stretch", "leg-swing"],
};

export function availableReplacements(
  current: Exercise,
  block: keyof typeof replacementGroups | undefined,
  equipment: TrainingProfile["equipment"] = "gym",
) {
  const currentSheet = exerciseTechniqueById.get(current.id);
  if (currentSheet) {
    const profile: TrainingProfile = {
      experience: "regular",
      equipment,
      limitations: "none",
      notes: "",
      jumpReady: true,
    };
    return exerciseTechniques
      .filter((sheet) => sheet.exercise.id !== current.id)
      .filter((sheet) => compatibleWithProfile(sheet, profile))
      .map((sheet) => ({
        sheet,
        score:
          sheet.exercise.patterns.filter((item) =>
            currentSheet.exercise.patterns.includes(item),
          ).length * 6 +
          sheet.exercise.goals.filter((item) =>
            currentSheet.exercise.goals.includes(item),
          ).length * 3 +
          (block && sheet.exercise.goals.includes(block) ? 2 : 0),
      }))
      .filter(({ score }) => score >= 6)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.sheet.exercise.id.localeCompare(b.sheet.exercise.id),
      )
      .slice(0, 8)
      .map(({ sheet }) => appExercise(sheet));
  }
  const ids = block
    ? replacementGroups[block]
    : exercises.map((exercise) => exercise.id);
  return ids
    .map((id) => exercises.find((exercise) => exercise.id === id))
    .filter(
      (exercise): exercise is Exercise =>
        !!exercise && exercise.id !== current.id,
    )
    .filter(
      (exercise) => equipment === "gym" || !/máquina/i.test(exercise.equipment),
    )
    .filter(
      (exercise) =>
        equipment !== "bodyweight" ||
        !/mancuerna|kettlebell/i.test(exercise.equipment),
    )
    .slice(0, 6);
}

export function replaceRoutineExercise(
  routine: Routine,
  index: number,
  replacement: Exercise,
) {
  const replace = (item: Prescription) => ({ ...item, exercise: replacement });
  let cursor = -1;
  return {
    ...routine,
    items: routine.items.map((item, itemIndex) =>
      itemIndex === index ? replace(item) : item,
    ),
    blocks: routine.blocks?.map((block) => ({
      ...block,
      items: block.items.map((item) => {
        cursor += 1;
        return cursor === index ? replace(item) : item;
      }),
    })),
  };
}
