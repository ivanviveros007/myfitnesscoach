import { z } from "zod";
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
  illustration: z.enum(["squat", "bridge", "bird-dog"]),
  steps: z.array(z.string().min(1).max(600)).min(2).max(10),
  cues: z.array(z.string().max(300)).min(1).max(8),
  videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  sourceUrl: z.url(),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export const exercises: Exercise[] = [
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
});
export type Prescription = z.infer<typeof prescriptionSchema>;
export const routineSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(120),
  orientation: orientationSchema,
  items: z.array(prescriptionSchema).min(1).max(30),
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
      reps: id === "bird-dog" ? 6 : 10,
      restSeconds: 60,
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
