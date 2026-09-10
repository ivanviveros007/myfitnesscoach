import { z } from "zod";
import { additionalExercises } from "./catalog.js";
export const orientationSchema = z.enum([
  "padel",
  "football",
  "fitness",
  "free",
]);
export type Orientation = z.infer<typeof orientationSchema>;
export const orientations: Record<
  Orientation,
  { name: string; focus: string }
> = {
  padel: {
    name: "Pádel",
    focus: "Control y estabilidad para acompañar tu juego.",
  },
  football: {
    name: "Fútbol",
    focus: "Una base de fuerza de piernas y control corporal.",
  },
  fitness: {
    name: "Fitness",
    focus: "Movimiento y fuerza general, a tu ritmo.",
  },
  free: { name: "Libre", focus: "Elegí los ejercicios de tu próxima sesión." },
};
export const exerciseSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  equipment: z.string().max(120),
  muscles: z.string().max(120),
  illustration: z.enum([
    "squat",
    "bridge",
    "bird-dog",
    "goblet",
    "hinge",
    "push",
    "row",
    "db-row",
    "jump",
    "child",
    "shuffle",
    "leg-swing",
    "calf",
  ]),
  steps: z.array(z.string().min(1).max(600)).min(2).max(10),
  cues: z.array(z.string().max(300)).min(1).max(8),
  videoId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{11}$/)
    .optional(),
  videoUrl: z.url().optional(),
  sourceUrl: z.url(),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export const exercises: Exercise[] = [
  ...additionalExercises,
  {
    id: "squat",
    name: "Sentadilla con manos detrás de la cabeza",
    equipment: "Sin equipamiento",
    muscles: "Cuádriceps · glúteos",
    illustration: "squat",
    steps: [
      "Separá los pies aproximadamente al ancho de las caderas. Apoyá las manos detrás de la cabeza sin tirar del cuello.",
      "Flexioná caderas y rodillas de forma controlada. Descendé hasta una profundidad cómoda manteniendo los pies apoyados y el tronco estable.",
      "Empujá el suelo para volver a ponerte de pie. Extendé caderas y rodillas de forma coordinada.",
    ],
    cues: [
      "Evitá que las rodillas caigan hacia adentro.",
      "No fuerces la profundidad ni tires del cuello.",
    ],
    videoId: "UYbsgiiZgao",
    sourceUrl:
      "https://www.nasm.org/resource-center/exercise-library/prisoner-squat",
  },
  {
    id: "bridge",
    name: "Puente de glúteos",
    equipment: "Colchoneta opcional",
    muscles: "Glúteos · zona media",
    illustration: "bridge",
    steps: [
      "Acostate boca arriba, con rodillas flexionadas, pies apoyados y brazos al costado.",
      "Elevá la pelvis con control hasta alinear hombros, caderas y rodillas, sin arquear la zona lumbar.",
      "Bajá lentamente la pelvis y repetí manteniendo el control del movimiento.",
    ],
    cues: [
      "Mantené ambos pies apoyados.",
      "Evitá compensar el movimiento arqueando la espalda.",
    ],
    videoId: "Z3cY3d3BBo4",
    sourceUrl:
      "https://www.nasm.org/resource-center/exercise-library/floor-bridge",
  },
  {
    id: "bird-dog",
    name: "Bird dog",
    equipment: "Colchoneta opcional",
    muscles: "Zona media · estabilidad",
    illustration: "bird-dog",
    steps: [
      "Apoyá manos debajo de los hombros y rodillas debajo de las caderas.",
      "Extendé un brazo hacia adelante y la pierna contraria hacia atrás sin girar el tronco.",
      "Volvé con control y alterná el lado. Cada repetición indicada corresponde a un lado.",
    ],
    cues: [
      "Mantené la pelvis estable y la espalda neutra.",
      "Movete despacio y seguí respirando.",
    ],
    videoId: "ZdAHe9_HeEw",
    sourceUrl: "https://www.nasm.org/resource-center/exercise-library/bird-dog",
  },
];
export const prescriptionSchema = z.object({
  exercise: exerciseSchema,
  sets: z.number().int().min(1).max(20),
  reps: z.number().int().min(1).max(200),
  restSeconds: z.number().int().min(0).max(600),
  block: z
    .enum([
      "warmup",
      "power",
      "transfer",
      "strength",
      "stability",
      "flexibility",
    ])
    .optional(),
  unit: z.enum(["reps", "seconds"]).optional(),
  perSide: z.boolean().optional(),
  effort: z.string().max(400).optional(),
});
export type Prescription = z.infer<typeof prescriptionSchema>;
export const trainingModeSchema = z.enum([
  "planned",
  "amrap",
  "free",
  "legacy",
]);
export const blockFormatSchema = z.enum([
  "sets",
  "rounds",
  "amrap",
  "intervals",
  "emom",
  "for-time",
]);
export const workoutBlockSchema = z.object({
  id: z.string().min(1).max(100),
  position: z.number().int().min(0).max(3),
  section: z.enum(["warmup", "block-1", "block-2", "block-3"]),
  title: z.string().min(1).max(120),
  purpose: z.string().min(1).max(240),
  format: blockFormatSchema,
  durationMinutes: z.number().int().min(1).max(60),
  items: z.array(prescriptionSchema).min(1).max(20),
});
export type WorkoutBlock = z.infer<typeof workoutBlockSchema>;
export const routineSchema = z
  .object({
    id: z.string().max(80),
    name: z.string().max(120),
    orientation: orientationSchema,
    planWeek: z.string().optional(),
    scheduledDay: z.number().int().min(0).max(6).optional(),
    focus: z.string().optional(),
    estimatedMinutes: z.number().optional(),
    trainingMode: trainingModeSchema.optional(),
    blocks: z.array(workoutBlockSchema).min(1).max(4).optional(),
    items: z.array(prescriptionSchema).min(1).max(30),
  })
  .superRefine((routine, ctx) => {
    if (routine.blocks) {
      const flattened = routine.blocks
        .flatMap((block) => block.items)
        .map((item) => item.exercise.id);
      if (
        flattened.join("|") !==
        routine.items.map((item) => item.exercise.id).join("|")
      )
        ctx.addIssue({
          code: "custom",
          message: "Los bloques no coinciden con los ejercicios de la rutina.",
        });
    }
  });
export type Routine = z.infer<typeof routineSchema>;
export function template(
  orientation: Orientation,
  selected: string[] = [],
): Routine {
  const ids =
    orientation === "free"
      ? selected
      : orientation === "padel"
        ? ["bird-dog", "squat", "bridge"]
        : orientation === "football"
          ? ["squat", "bridge", "bird-dog"]
          : ["bridge", "squat", "bird-dog"];
  return {
    id: `demo-${orientation}`,
    name:
      orientation === "free"
        ? "Mi sesión libre"
        : `Base ${orientations[orientation].name}`,
    orientation,
    items: ids.map((id) => ({
      exercise: exercises.find((e) => e.id === id)!,
      sets: 2,
      reps: ["calf-stretch", "child"].includes(id)
        ? 25
        : id === "shuffle"
          ? 20
          : id === "jump"
            ? 3
            : id === "bird-dog"
              ? 6
              : 10,
      unit: ["calf-stretch", "child", "shuffle"].includes(id)
        ? "seconds"
        : "reps",
      perSide: [
        "bird-dog",
        "calf-stretch",
        "leg-swing",
        "dumbbell-row",
      ].includes(id),
      restSeconds: id === "jump" ? 120 : 60,
    })),
  };
}
export const seriesSchema = z.object({
  reps: z.number().int().min(0).max(1000),
  weight: z.number().min(0).max(1000),
  done: z.boolean(),
});
export const sessionSchema = z
  .object({
    id: z.uuid(),
    routine: routineSchema,
    startedAt: z.iso.datetime(),
    finishedAt: z.iso.datetime().nullable(),
    amrap: z
      .object({
        durationSeconds: z.number().int().min(60).max(3600),
        startedAt: z.iso.datetime().nullable(),
        rounds: z.number().int().nonnegative().max(1000),
        extraReps: z.number().int().nonnegative().max(10000),
      })
      .optional(),
    items: z
      .array(
        z.object({
          exerciseId: z.string(),
          status: z.enum(["pending", "completed", "partial", "skipped"]),
          comment: z.string().max(2000),
          series: z.array(seriesSchema).min(1).max(20),
        }),
      )
      .min(1)
      .max(30),
  })
  .superRefine((s, ctx) => {
    if (
      s.items.length !== s.routine.items.length ||
      s.items.some(
        (item, i) =>
          item.exerciseId !== s.routine.items[i]?.exercise.id ||
          item.series.length !== s.routine.items[i]?.sets,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "La sesión no coincide con su rutina.",
      });
    if (s.finishedAt && s.finishedAt < s.startedAt)
      ctx.addIssue({ code: "custom", message: "Fecha de cierre inválida." });
  });
export type Session = z.infer<typeof sessionSchema>;
export const syncSchema = z.object({
  operationId: z.uuid(),
  baseVersion: z.number().int().nonnegative(),
  session: sessionSchema,
});
export const credentialsSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
});
export function exerciseStatus(
  series: z.infer<typeof seriesSchema>[],
): "pending" | "partial" | "completed" {
  const done = series.filter((s) => s.done).length;
  return done === series.length ? "completed" : done ? "partial" : "pending";
}

export function routineBlocks(routine: Routine): WorkoutBlock[] {
  if (routine.blocks) return routine.blocks;
  return [
    {
      id: `${routine.id}-legacy`,
      position: 0,
      section: "block-1",
      title: routine.focus?.trim() || "Bloque principal",
      purpose: routine.focus ?? "Sesión guardada",
      format: "sets",
      durationMinutes: routine.estimatedMinutes ?? 30,
      items: routine.items,
    },
  ];
}

export function amrapTemplate(
  orientation: Orientation,
  durationMinutes: 8 | 12 | 16 | 20 = 12,
  equipment: "bodyweight" | "dumbbells" | "gym" = "gym",
): Routine {
  const warmupItems = ["leg-swing", "squat"].map((id) => {
    const exercise = exercises.find((candidate) => candidate.id === id)!;
    return {
      exercise,
      sets: 1,
      reps: 8,
      restSeconds: 15,
      unit: "reps" as const,
      perSide: id === "leg-swing",
      effort: "Movimiento controlado para preparar el circuito.",
    };
  });
  const ids =
    orientation === "padel"
      ? [
          "shuffle",
          equipment === "bodyweight" ? "squat" : "goblet",
          "incline-push",
          "bird-dog",
        ]
      : ["squat", "incline-push", "bridge", "bird-dog"];
  const mainItems = ids.map((id) => {
    const exercise = exercises.find((candidate) => candidate.id === id)!;
    return {
      exercise,
      sets: 1,
      reps: id === "shuffle" ? 20 : id === "bird-dog" ? 6 : 8,
      restSeconds: 0,
      unit: id === "shuffle" ? ("seconds" as const) : ("reps" as const),
      perSide: id === "bird-dog",
      effort: "Ritmo sostenible: mantené la técnica durante todas las rondas.",
    };
  });
  const items = [...warmupItems, ...mainItems];
  return {
    id: `amrap-${orientation}-${durationMinutes}`,
    name: `AMRAP · ${durationMinutes} minutos`,
    orientation,
    trainingMode: "amrap",
    focus:
      "Completá tantas rondas de calidad como puedas sin perder la técnica.",
    estimatedMinutes: durationMinutes + 6,
    blocks: [
      {
        id: `amrap-${orientation}-${durationMinutes}-warmup`,
        position: 0,
        section: "warmup",
        title: "Warm up",
        purpose: "Preparación para el circuito",
        format: "sets",
        durationMinutes: 6,
        items: warmupItems,
      },
      {
        id: `amrap-${orientation}-${durationMinutes}-main`,
        position: 1,
        section: "block-1",
        title: "AMRAP",
        purpose: "Acondicionamiento y fuerza resistente",
        format: "amrap",
        durationMinutes,
        items: mainItems,
      },
    ],
    items,
  };
}

export * from "./planning.js";
