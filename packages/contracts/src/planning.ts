import { z } from "zod";
import {
  exercises,
  orientationSchema,
  routineSchema,
  type Prescription,
  type Routine,
  type WorkoutBlock,
} from "./index.js";
export const dayNames = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export const blocks = {
  warmup: "Entrada en calor",
  power: "Potencia",
  transfer: "Transferencia",
  strength: "Fuerza",
  stability: "Estabilidad",
  flexibility: "Flexibilidad",
};
export const profileSchema = z.object({
  experience: z.enum(["new", "regular"]),
  equipment: z.enum(["bodyweight", "dumbbells", "gym"]),
  limitations: z.enum(["none", "review"]),
  notes: z.string().max(1000),
  jumpReady: z.boolean(),
});
export type TrainingProfile = z.infer<typeof profileSchema>;
export const dailyTrainingRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orientation: orientationSchema,
  completedCount: z.number().int().nonnegative(),
  profile: profileSchema,
});
export type DailyTrainingRequest = z.infer<typeof dailyTrainingRequestSchema>;
export const dailyTrainingChoiceSchema = z.object({
  key: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  tag: z.string().min(1).max(120),
  goal: z.string().min(1).max(40),
  insight: z.string().min(1).max(280).optional(),
  routine: routineSchema,
});
export const dailyTrainingResponseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  orientation: orientationSchema,
  generatedAt: z.iso.datetime(),
  choices: z.array(dailyTrainingChoiceSchema).min(1),
});
export type DailyTrainingResponse = z.infer<typeof dailyTrainingResponseSchema>;
export const weekInputSchema = z
  .object({
    week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    orientation: orientationSchema,
    days: z.array(z.number().int().min(0).max(6)).min(2).max(4),
    sportDays: z.array(z.number().int().min(0).max(6)).max(7),
    minutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
    readiness: z.enum(["normal", "tired"]),
  })
  .refine((v) => new Set(v.days).size === v.days.length, {
    message: "Los días de gimnasio no se pueden repetir.",
  });
export type WeekInput = z.infer<typeof weekInputSchema>;
export const weeklyPlanSchema = z.object({
  input: weekInputSchema,
  profile: profileSchema,
  routines: z.array(routineSchema),
  notes: z.array(z.string()),
  reviewNeeded: z.boolean(),
});
export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
export const cloudDataRecordSchema = z.discriminatedUnion("kind", [
  z.object({
    key: z.literal("profile"),
    kind: z.literal("profile"),
    value: profileSchema,
  }),
  z.object({
    key: z.string().regex(/^plan:[a-z-]+:\d{4}-\d{2}-\d{2}$/),
    kind: z.literal("weekly-plan"),
    value: weeklyPlanSchema,
  }),
  z.object({
    key: z.enum(["favorites:movement", "favorites:block"]),
    kind: z.literal("favorites"),
    value: z.array(z.string().min(1).max(80)).max(500),
  }),
]);
export const cloudDataSyncSchema = z.object({
  operationId: z.uuid(),
  baseVersion: z.number().int().nonnegative(),
  record: cloudDataRecordSchema,
});
export type CloudDataRecord = z.infer<typeof cloudDataRecordSchema>;
export function currentWeek(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}
export function makeWeeklyPlan(
  profile: TrainingProfile,
  input: WeekInput,
): WeeklyPlan {
  profileSchema.parse(profile);
  weekInputSchema.parse(input);
  const notes = [
    "La planificación distribuye las capacidades a lo largo de la semana; no exige trabajarlas todas al máximo cada día.",
    "En fuerza dejá unas 2–3 repeticiones posibles sin hacer. Registrá la carga; no se aumenta automáticamente por cambiar de semana.",
  ];
  if (profile.limitations === "review")
    return {
      input,
      profile,
      routines: [],
      reviewNeeded: true,
      notes: [
        "Indicás una lesión, dolor o restricción. La app conserva tu disponibilidad, pero necesita una adaptación revisada antes de generar sesiones. No interpreta comentarios clínicos como una autorización para entrenar.",
      ],
    };
  const days = [...input.days].sort((a, b) => a - b);
  // Two main strength exposures; optional days distribute low-load work rather than doubling it.
  const eligible = days.filter(
    (d) =>
      !input.sportDays.includes(d) && !input.sportDays.includes((d + 1) % 7),
  );
  let main: number[] = [];
  for (const d of eligible) {
    if (main.every((x) => Math.abs(d - x) >= 2)) main.push(d);
    if (main.length === 2) break;
  }
  if (main.length < 2)
    notes.push(
      "Tu calendario no deja dos días de fuerza separados y lejos del partido. Priorizamos sesiones de carga baja; cambiá los días o revisá la semana para completar el estímulo de fuerza.",
    );
  if (input.readiness === "tired")
    notes.push(
      "Semana con fatiga: menos series y sin saltos. Recuperá primero la calidad de movimiento.",
    );
  if (profile.experience === "new" || !profile.jumpReady)
    notes.push(
      "Potencia pendiente de preparación: se practica la técnica sin saltos. Se habilita el bloque explosivo al confirmar experiencia y recepciones controladas.",
    );
  if (profile.equipment === "bodyweight")
    notes.push(
      "Sin material falta una tracción progresiva para espalda. No sustituimos un remo con un ejercicio de movilidad; incorporá material o una adaptación revisada para completar ese patrón.",
    );
  if (input.orientation === "padel")
    notes.push(
      "Transferencia al pádel: los pasos laterales son una base; sumá práctica de lectura, frenada y golpe en cancha. No se promete transferencia solo por imitar gestos.",
    );
  if (input.orientation === "football")
    notes.push(
      "Transferencia al fútbol: esta base coordinativa debe complementarse con tareas con pelota y aceleraciones progresivas en campo.",
    );
  const routines = days.map((day, index): Routine => {
    const hard = main.includes(day) && input.readiness === "normal";
    const strengthSets =
      input.readiness === "tired" || main.length < 2
        ? 1
        : hard && input.minutes === 60
          ? 3
          : 2;
    const secondary = index >= 2;
    const power = hard && profile.experience === "regular" && profile.jumpReady;
    const items: Prescription[] = [];
    function add(
      id: string,
      block: NonNullable<Prescription["block"]>,
      sets: number,
      reps: number,
      rest: number,
      effort: string,
      unit: "reps" | "seconds" = "reps",
      perSide = false,
    ) {
      const exercise = exercises.find((e) => e.id === id);
      if (!exercise) throw new Error("Ejercicio inexistente: " + id);
      items.push({
        exercise,
        block,
        sets,
        reps,
        restSeconds: rest,
        unit,
        perSide,
        effort,
      });
    }
    add(
      "leg-swing",
      "warmup",
      1,
      8,
      15,
      "Movimiento suave, rango cómodo. Antes: caminá 3–5 minutos.",
      "reps",
      true,
    );
    if (power)
      add(
        "jump",
        "power",
        3,
        3,
        120,
        "Recepción estable. Detené la serie si perdés velocidad o control.",
      );
    add(
      "shuffle",
      "transfer",
      hard ? 2 : 1,
      20,
      60,
      input.orientation === "padel"
        ? "Pasos laterales controlados; practicar la respuesta a la pelota corresponde a la cancha."
        : "Coordinación a velocidad cómoda; no es un sprint máximo.",
      "seconds",
    );
    add(
      profile.equipment === "bodyweight" ? "squat" : "goblet",
      "strength",
      strengthSets,
      hard ? 8 : 6,
      hard ? 90 : 45,
      hard
        ? "Carga controlable; terminá con 2–3 repeticiones en reserva."
        : "Técnica cómoda, sin esfuerzo cercano al límite.",
    );
    add(
      profile.equipment !== "bodyweight" && profile.experience === "regular"
        ? "rdl"
        : "bridge",
      "strength",
      strengthSets,
      8,
      hard ? 90 : 45,
      "Controlá la bisagra o la extensión de cadera.",
    );
    add(
      "incline-push",
      "strength",
      strengthSets,
      8,
      hard ? 90 : 45,
      "Elegí una altura que permita mantener el cuerpo alineado.",
    );
    if (profile.equipment !== "bodyweight")
      add(
        profile.equipment === "gym" ? "machine-row" : "dumbbell-row",
        "strength",
        strengthSets,
        8,
        hard ? 90 : 45,
        "Tracción controlada sin balanceo.",
        "reps",
        profile.equipment === "dumbbells",
      );
    add(
      "bird-dog",
      "stability",
      secondary ? 2 : 1,
      6,
      30,
      "Pelvis quieta; priorizá estabilidad sobre amplitud.",
      "reps",
      true,
    );
    add(
      "calf-stretch",
      "flexibility",
      1,
      25,
      10,
      "Tensión suave y sin rebotes.",
      "seconds",
      true,
    );
    add(
      "child",
      "flexibility",
      1,
      30,
      10,
      "Respiración tranquila; posición cómoda.",
      "seconds",
    );
    // Conservative estimate includes unilateral work, rests and transitions. Trim sets, never recovery time, to fit.
    const estimate = () =>
      Math.ceil(
        (240 +
          items.reduce(
            (total, p) =>
              total +
              p.sets *
                ((p.unit === "seconds" ? p.reps : p.reps * 4) *
                  (p.perSide ? 2 : 1)) +
              Math.max(0, p.sets - 1) * p.restSeconds +
              40,
            0,
          )) /
          60,
      );
    while (estimate() > input.minutes) {
      const candidate = items.find((p) => p.block === "strength" && p.sets > 1);
      if (!candidate) break;
      candidate.sets--;
    }
    const groups: {
      section: WorkoutBlock["section"];
      goal: NonNullable<WorkoutBlock["goal"]>;
      title: string;
      purpose: string;
      kinds: Prescription["block"][];
    }[] = [
      {
        section: "warmup",
        goal: "warmup",
        title: "Warm up",
        purpose: "Movilidad y preparación",
        kinds: ["warmup"],
      },
      {
        section: "block-1",
        goal: power ? "power" : "transfer",
        title: power
          ? "Potencia y transferencia"
          : "Coordinación y transferencia",
        purpose: "Calidad, velocidad y control",
        kinds: ["power", "transfer"],
      },
      {
        section: "block-2",
        goal: secondary ? "full-body" : "strength",
        title: "Fuerza principal",
        purpose: "Patrones globales de fuerza",
        kinds: ["strength"],
      },
      {
        section: "block-3",
        goal: "stability",
        title: "Midline & Stability",
        purpose: "Control del tronco y estabilidad",
        kinds: ["stability"],
      },
      {
        section: "block-4",
        goal: "mobility",
        title: "Mobility & Recovery",
        purpose: "Movilidad y vuelta a la calma",
        kinds: ["flexibility"],
      },
    ];
    const workoutBlocks: WorkoutBlock[] = groups
      .map((group, position) => ({
        id: `week-${input.week}-${input.orientation}-${day}-${group.section}`,
        position,
        section: group.section,
        goal: group.goal,
        title: group.title,
        purpose: group.purpose,
        format: "sets" as const,
        durationMinutes: Math.max(
          3,
          Math.round(
            input.minutes * ([0.12, 0.18, 0.42, 0.14, 0.14][position] ?? 0.2),
          ),
        ),
        items: items.filter((item) => group.kinds.includes(item.block)),
      }))
      .filter((block) => block.items.length > 0);
    return {
      id: `week-${input.week}-${input.orientation}-${day}`,
      name: `${dayNames[day]} · ${hard ? "Fuerza y control" : secondary ? "Movimiento y recuperación" : "Técnica y estabilidad"}`,
      orientation: input.orientation,
      planWeek: input.week,
      scheduledDay: day,
      focus: hard
        ? "Fuerza global, estabilidad y potencia cuando corresponde."
        : "Carga baja para sostener el trabajo sin acumular fatiga.",
      estimatedMinutes: estimate(),
      trainingMode: "planned",
      blocks: workoutBlocks,
      items,
    };
  });
  return weeklyPlanSchema.parse({
    input,
    profile,
    routines,
    notes,
    reviewNeeded: false,
  });
}
