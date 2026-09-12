import {
  exercises,
  type Exercise,
  type Prescription,
  type Routine,
  type TrainingProfile,
} from "@myfitnesscoach/contracts";

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
