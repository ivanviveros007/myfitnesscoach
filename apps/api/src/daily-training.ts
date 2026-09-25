import {
  routineSchema,
  type BlockGoal,
  type DoseProfile,
  type ExerciseTechnique,
  type Prescription,
  type Routine,
  template,
  type DailyTrainingRequest,
  type TrainingProfile,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";
import { appExercise, classifiedPool } from "./training-catalog.js";

export const dailyStyles = [
  ["recommended", "Sesión recomendada", "PARA HOY", "full-body"],
  ["power", "Power", "POTENCIA · VELOCIDAD", "power"],
  ["strength", "Strength", "FUERZA · CONTROL", "strength"],
  [
    "combined",
    "Combined Strength",
    "FUERZA · ACONDICIONAMIENTO",
    "conditioning",
  ],
  ["full-body", "Full Body", "CUERPO COMPLETO", "full-body"],
  ["upper", "Upper Body", "TREN SUPERIOR", "upper-body"],
  ["midline", "Midline", "CORE · ESTABILIDAD", "stability"],
  ["pilates", "Pilates", "CONTROL · MOVILIDAD", "mobility"],
  ["sport", "Sport", "RENDIMIENTO DEPORTIVO", "transfer"],
  ["cross", "Cross Training", "FUERZA · CARDIO", "conditioning"],
  ["hiit", "HIIT", "INTERVALOS · INTENSIDAD", "conditioning"],
  ["hrx", "HRX Training", "HÍBRIDO · RESISTENCIA", "hypertrophy"],
  ["hypertrophy", "Traditional Hypertrophy", "MUSCULACIÓN", "hypertrophy"],
  ["ppl-push", "PPL · Push", "PECHO · HOMBROS · TRÍCEPS", "hypertrophy"],
  ["ppl-pull", "PPL · Pull", "ESPALDA · BÍCEPS", "hypertrophy"],
  ["ppl-legs", "PPL · Legs", "PIERNAS · GLÚTEOS", "hypertrophy"],
] as const satisfies readonly (readonly [string, string, string, BlockGoal])[];

type BlockSpec = {
  title: string;
  goal: BlockGoal;
  catalogGoals: string[];
  dose: DoseProfile;
  count: number;
  format?: WorkoutBlock["format"];
  patterns?: string[];
  regions?: string[];
};

export type DailyExerciseSelections = Record<string, Record<number, string[]>>;

const warmup: BlockSpec = {
  title: "Warm Up",
  goal: "warmup",
  catalogGoals: ["warmup"],
  dose: "warmup",
  count: 3,
};
const mobility: BlockSpec = {
  title: "Mobility & Recovery",
  goal: "mobility",
  catalogGoals: ["mobility", "recovery"],
  dose: "mobility",
  count: 2,
};
const stability: BlockSpec = {
  title: "Midline & Stability",
  goal: "stability",
  catalogGoals: ["stability", "midline"],
  dose: "core-control",
  count: 3,
};
const b = (
  title: string,
  goal: BlockGoal,
  catalogGoals: string[],
  dose: DoseProfile,
  count = 3,
  extra: Partial<BlockSpec> = {},
): BlockSpec => ({ title, goal, catalogGoals, dose, count, ...extra });

const modalityBlocks: Record<string, BlockSpec[]> = {
  recommended: [
    b(
      "Coordinación y transferencia",
      "transfer",
      ["transfer", "sport"],
      "core-control",
      3,
    ),
    b("Fuerza principal", "strength", ["strength", "full-body"], "strength", 4),
    stability,
    mobility,
  ],
  power: [
    b("Potencia", "power", ["power"], "power", 2, { format: "intervals" }),
    b(
      "Transferencia atlética",
      "transfer",
      ["transfer", "sport"],
      "conditioning",
    ),
    b("Fuerza de soporte", "strength", ["strength"], "strength"),
    mobility,
  ],
  strength: [
    b("Piernas", "legs", ["strength", "legs"], "strength", 2, {
      regions: ["quads", "glutes", "hamstrings"],
    }),
    b(
      "Empuje y tracción",
      "upper-body",
      ["strength", "upper-body"],
      "strength",
      2,
      { regions: ["chest", "back", "shoulders"] },
    ),
    b("Fuerza complementaria", "strength", ["strength"], "strength"),
    stability,
  ],
  combined: [
    b("Fuerza base", "strength", ["strength", "combined-strength"], "strength"),
    b("Potencia", "power", ["power"], "power", 2, { format: "intervals" }),
    b(
      "Acondicionamiento",
      "conditioning",
      ["conditioning"],
      "conditioning",
      3,
      { format: "amrap" },
    ),
    mobility,
  ],
  "full-body": [
    b("Piernas y cadera", "legs", ["full-body", "strength"], "strength", 2, {
      regions: ["quads", "glutes", "hamstrings", "legs"],
    }),
    b("Torso", "upper-body", ["full-body", "upper-body"], "strength", 2, {
      regions: ["chest", "back", "shoulders"],
    }),
    b(
      "Full Body Conditioning",
      "full-body",
      ["full-body", "conditioning"],
      "conditioning",
      3,
      { format: "rounds" },
    ),
    mobility,
  ],
  upper: [
    b("Empuje", "upper-body", ["upper-body", "strength"], "strength", 2, {
      patterns: ["horizontal-push", "vertical-push"],
    }),
    b("Tracción", "upper-body", ["upper-body", "strength"], "strength", 2, {
      patterns: ["horizontal-pull", "vertical-pull"],
    }),
    b(
      "Musculación",
      "hypertrophy",
      ["upper-body", "hypertrophy"],
      "hypertrophy",
    ),
    stability,
  ],
  midline: [
    b(
      "Anti extensión",
      "stability",
      ["midline", "stability"],
      "core-control",
      2,
      { patterns: ["anti-extension", "plank"] },
    ),
    b(
      "Rotación y transferencia",
      "transfer",
      ["midline", "transfer", "sport"],
      "core-control",
      2,
      { patterns: ["rotation", "anti-rotation", "trunk-rotation"] },
    ),
    b(
      "Core Conditioning",
      "conditioning",
      ["midline", "conditioning"],
      "conditioning",
      3,
      { format: "amrap" },
    ),
    mobility,
  ],
  pilates: [
    b("Control central", "stability", ["pilates", "midline"], "core-control"),
    b("Cadera y piernas", "legs", ["pilates", "legs"], "core-control"),
    b(
      "Estabilidad global",
      "stability",
      ["pilates", "stability"],
      "core-control",
    ),
    mobility,
  ],
  sport: [
    b(
      "Coordinación y transferencia",
      "transfer",
      ["sport", "transfer", "padel"],
      "core-control",
      3,
    ),
    b("Potencia multidireccional", "power", ["sport", "power"], "power", 3, {
      format: "intervals",
    }),
    b("Fuerza unilateral", "strength", ["sport", "strength"], "strength", 3, {
      patterns: ["single-leg", "lunge", "hinge"],
    }),
    stability,
  ],
  cross: [
    b("Strength", "strength", ["cross-training", "strength"], "strength", 3),
    b("Power", "power", ["cross-training", "power"], "power", 2, {
      format: "intervals",
    }),
    b(
      "Metcon",
      "conditioning",
      ["cross-training", "conditioning"],
      "conditioning",
      4,
      { format: "amrap" },
    ),
    mobility,
  ],
  hiit: [
    b("Activación dinámica", "conditioning", ["hiit", "warmup"], "warmup"),
    b("Intervalos de potencia", "power", ["hiit", "power"], "interval", 2, {
      format: "intervals",
    }),
    b(
      "HIIT Conditioning",
      "conditioning",
      ["hiit", "conditioning"],
      "interval",
      3,
      { format: "intervals" },
    ),
    mobility,
  ],
  hrx: [
    b("Fuerza funcional", "strength", ["strength", "full-body"], "strength"),
    b(
      "Trabajo híbrido",
      "full-body",
      ["conditioning", "cross-training"],
      "conditioning",
      3,
      { format: "rounds" },
    ),
    b(
      "Resistencia muscular",
      "hypertrophy",
      ["hypertrophy", "conditioning"],
      "hypertrophy",
    ),
    stability,
  ],
  hypertrophy: [
    b("Lower Body", "legs", ["hypertrophy", "legs"], "hypertrophy", 2, {
      regions: ["quads", "glutes", "hamstrings"],
    }),
    b("Push", "upper-body", ["hypertrophy", "upper-body"], "hypertrophy", 2, {
      patterns: ["horizontal-push", "vertical-push", "elbow-extension"],
    }),
    b("Pull", "upper-body", ["hypertrophy", "upper-body"], "hypertrophy", 2, {
      patterns: ["horizontal-pull", "vertical-pull", "elbow-flexion"],
    }),
    mobility,
  ],
  "ppl-push": [
    b("Pecho", "hypertrophy", ["hypertrophy", "upper-body"], "hypertrophy", 2, {
      patterns: ["horizontal-push"],
      regions: ["chest"],
    }),
    b(
      "Hombros",
      "upper-body",
      ["hypertrophy", "upper-body"],
      "hypertrophy",
      2,
      {
        patterns: ["vertical-push", "shoulder-raise"],
        regions: ["shoulders"],
      },
    ),
    b(
      "Tríceps",
      "hypertrophy",
      ["hypertrophy", "upper-body"],
      "hypertrophy",
      1,
      {
        patterns: ["elbow-extension"],
        regions: ["triceps"],
      },
    ),
    mobility,
  ],
  "ppl-pull": [
    b(
      "Espalda",
      "upper-body",
      ["hypertrophy", "upper-body"],
      "hypertrophy",
      3,
      {
        patterns: ["horizontal-pull", "vertical-pull"],
        regions: ["back", "lats"],
      },
    ),
    b(
      "Deltoide posterior",
      "upper-body",
      ["hypertrophy", "upper-body"],
      "hypertrophy",
      1,
      {
        patterns: ["horizontal-pull", "shoulder-raise"],
        regions: ["shoulders"],
      },
    ),
    b(
      "Bíceps",
      "hypertrophy",
      ["hypertrophy", "upper-body"],
      "hypertrophy",
      2,
      {
        patterns: ["elbow-flexion"],
        regions: ["biceps"],
      },
    ),
    mobility,
  ],
  "ppl-legs": [
    b("Cuádriceps", "legs", ["hypertrophy", "legs"], "hypertrophy", 2, {
      patterns: ["squat", "lunge"],
      regions: ["quads"],
    }),
    b("Cadena posterior", "legs", ["hypertrophy", "legs"], "hypertrophy", 2, {
      patterns: ["hinge", "hip-extension"],
      regions: ["hamstrings", "glutes"],
    }),
    b("Pantorrillas", "legs", ["hypertrophy", "legs"], "hypertrophy", 1, {
      regions: ["calves"],
    }),
    mobility,
  ],
};

function recommendedBlocks(profile: TrainingProfile): BlockSpec[] {
  const goals = new Set(profile.goals ?? []);
  if (
    goals.has("power") ||
    goals.has("speed") ||
    goals.has("sport-performance")
  )
    return modalityBlocks.sport!;
  if (goals.has("muscle-gain")) return modalityBlocks.hypertrophy!;
  if (goals.has("strength")) return modalityBlocks.strength!;
  if (goals.has("endurance")) return modalityBlocks.hrx!;
  if (goals.has("mobility")) return modalityBlocks.pilates!;
  return modalityBlocks.recommended!;
}

const hash = (value: string) =>
  [...value].reduce(
    (total, char) => (total * 31 + char.charCodeAt(0)) >>> 0,
    17,
  );
function selectExercises(
  pool: ExerciseTechnique[],
  spec: BlockSpec,
  seed: number,
  used: Set<string>,
  recentIds: Set<string> = new Set(),
  recentRegions: Set<string> = new Set(),
) {
  const score = (sheet: ExerciseTechnique) =>
    sheet.exercise.goals.filter((item) => spec.catalogGoals.includes(item))
      .length *
      8 +
    (spec.patterns?.some((item) => sheet.exercise.patterns.includes(item))
      ? 5
      : 0) +
    (spec.regions?.some((item) => sheet.exercise.regions.includes(item))
      ? 4
      : 0) +
    (sheet.prescriptions.some((item) => item.profile === spec.dose) ? 3 : 0) -
    (recentIds.has(sheet.exercise.id) ? 12 : 0) -
    sheet.exercise.regions.filter((region) => recentRegions.has(region))
      .length *
      2;
  const ranked = pool
    .filter(
      (sheet) =>
        !used.has(sheet.exercise.id) &&
        score(sheet) >= 8 &&
        (!spec.patterns ||
          spec.patterns.some((item) =>
            sheet.exercise.patterns.includes(item),
          )) &&
        (!spec.regions ||
          spec.regions.some((item) => sheet.exercise.regions.includes(item))),
    )
    .sort(
      (a, z) =>
        score(z) - score(a) || a.exercise.id.localeCompare(z.exercise.id),
    );
  const selected: ExerciseTechnique[] = [];
  for (
    let step = 0;
    step < ranked.length * 2 && selected.length < spec.count;
    step++
  ) {
    const candidate = ranked[(seed + step * 7) % ranked.length];
    if (
      candidate &&
      !selected.some((item) => item.exercise.id === candidate.exercise.id)
    )
      selected.push(candidate);
  }
  return selected;
}

function candidatesForSpec(pool: ExerciseTechnique[], spec: BlockSpec) {
  const matches = (sheet: ExerciseTechnique, relaxed = false) =>
    sheet.exercise.goals.some((item) => spec.catalogGoals.includes(item)) &&
    (relaxed ||
      ((!spec.patterns ||
        spec.patterns.some((item) => sheet.exercise.patterns.includes(item))) &&
        (!spec.regions ||
          spec.regions.some((item) => sheet.exercise.regions.includes(item)))));
  const strict = pool.filter((sheet) => matches(sheet));
  return strict.length ? strict : pool.filter((sheet) => matches(sheet, true));
}

export function dailySelectionCandidates(input: DailyTrainingRequest) {
  const pool = classifiedPool(input.profile);
  return dailyStyles.map(([key, name]) => ({
    key,
    name,
    blocks: [
      warmup,
      ...(key === "recommended"
        ? recommendedBlocks(input.profile)
        : (modalityBlocks[key] ?? modalityBlocks.recommended!)),
    ].map((spec, position) => ({
      position,
      title: spec.title,
      goal: spec.goal,
      count: spec.count,
      candidates: candidatesForSpec(pool, spec)
        .slice(0, 18)
        .map((sheet) => ({
          id: sheet.exercise.id,
          name: sheet.exercise.name.en,
          goals: sheet.exercise.goals,
          patterns: sheet.exercise.patterns,
          regions: sheet.exercise.regions,
          impact: sheet.exercise.impact,
        })),
    })),
  }));
}

function prescription(sheet: ExerciseTechnique, spec: BlockSpec): Prescription {
  const dose =
    sheet.prescriptions.find((item) => item.profile === spec.dose) ??
    sheet.prescriptions[0]!;
  return {
    exercise: appExercise(sheet),
    block:
      spec.goal === "warmup"
        ? "warmup"
        : spec.goal === "power"
          ? "power"
          : spec.goal === "transfer"
            ? "transfer"
            : spec.goal === "stability"
              ? "stability"
              : spec.goal === "mobility" || spec.goal === "recovery"
                ? "flexibility"
                : "strength",
    sets: dose.sets,
    reps: dose.workSeconds ?? dose.repsMax ?? dose.repsMin ?? 8,
    restSeconds: dose.restSecondsMin,
    unit:
      dose.workSeconds || sheet.exercise.metric === "seconds"
        ? "seconds"
        : "reps",
    perSide: sheet.exercise.unilateral,
    effort: `${dose.stopRule} RPE ${dose.rpeMin}–${dose.rpeMax}.`,
  };
}

function blockDuration(spec: BlockSpec, position: number) {
  if (position === 0) return 4;
  if (spec.dose === "power") return 8;
  if (spec.dose === "strength") return 12;
  if (spec.dose === "hypertrophy") return 10;
  if (spec.dose === "interval" || spec.dose === "conditioning") return 10;
  if (spec.dose === "core-control") return 8;
  return 7;
}

export function makeDailyRoutines(
  input: DailyTrainingRequest,
  selections: DailyExerciseSelections = {},
  insights: Record<string, string> = {},
) {
  const { date: dateKey, completedCount, profile, orientation } = input;
  const base = template(orientation);
  const pool = classifiedPool(profile);
  const recentSessions = (input.recentSessions ?? []).filter((session) => {
    const elapsed =
      new Date(`${dateKey}T23:59:59`).getTime() -
      new Date(session.finishedAt).getTime();
    return elapsed >= 0 && elapsed <= 72 * 60 * 60 * 1000;
  });
  const recentIds = new Set(
    recentSessions.flatMap((session) => session.exerciseIds),
  );
  const recentActivities = (input.recentActivities ?? []).filter((activity) => {
    const elapsed =
      new Date(`${dateKey}T23:59:59`).getTime() -
      new Date(activity.occurredAt).getTime();
    return (
      (elapsed >= 0 && elapsed <= 72 * 60 * 60 * 1000) ||
      (activity.status === "planned" &&
        elapsed < 0 &&
        elapsed >= -7 * 24 * 60 * 60 * 1000)
    );
  });
  const recentRegions = new Set(
    pool
      .filter((sheet) => recentIds.has(sheet.exercise.id))
      .flatMap((sheet) => sheet.exercise.regions),
  );
  const activityRegions: Partial<
    Record<(typeof recentActivities)[number]["type"], string[]>
  > = {
    workout: [],
    padel: [
      "legs",
      "quads",
      "hamstrings",
      "glutes",
      "calves",
      "hips",
      "core",
      "shoulders",
    ],
    football: ["legs", "quads", "hamstrings", "glutes", "calves", "hips"],
    tennis: ["legs", "calves", "hips", "core", "shoulders"],
    running: ["legs", "quads", "hamstrings", "glutes", "calves"],
    cycling: ["legs", "quads", "glutes", "calves"],
    swimming: ["shoulders", "back", "chest", "core"],
    walking: ["legs", "calves"],
  };
  for (const activity of recentActivities) {
    const focuses = activity.focuses ?? [];
    if (activity.intensity === "low" || focuses.includes("recovery")) continue;
    for (const region of activityRegions[activity.type] ?? [])
      recentRegions.add(region);
    if (
      focuses.some((focus) =>
        ["power", "endurance", "conditioning"].includes(focus),
      )
    )
      for (const region of ["legs", "quads", "hamstrings", "glutes", "calves"])
        recentRegions.add(region);
    if (focuses.includes("strength"))
      for (const region of ["legs", "back", "chest", "shoulders"])
        recentRegions.add(region);
  }
  return dailyStyles.map(([key, name, tag, goal], styleIndex) => {
    const used = new Set<string>();
    const seed = hash(
      `${dateKey}:${completedCount}:${key}:${base.orientation}`,
    );
    const specs = [
      warmup,
      ...(key === "recommended"
        ? recommendedBlocks(profile)
        : (modalityBlocks[key] ?? modalityBlocks.recommended!)),
    ];
    const blocks = specs.map((spec, position): WorkoutBlock => {
      let selected = selectExercises(
        pool,
        spec,
        seed + position * 19 + styleIndex,
        used,
        recentIds,
        recentRegions,
      );
      if (!selected.length)
        selected = selectExercises(
          pool,
          { ...spec, patterns: undefined, regions: undefined },
          seed + position,
          used,
          recentIds,
          recentRegions,
        );
      if (!selected.length)
        selected = pool
          .filter((sheet) => !used.has(sheet.exercise.id))
          .slice(0, Math.max(1, spec.count));
      const permitted = new Map(
        candidatesForSpec(pool, spec).map((sheet) => [
          sheet.exercise.id,
          sheet,
        ]),
      );
      const selectedByAi = (selections[key]?.[position] ?? [])
        .map((id) => permitted.get(id))
        .filter(
          (sheet): sheet is ExerciseTechnique =>
            !!sheet && !used.has(sheet.exercise.id),
        )
        .slice(0, spec.count);
      if (selectedByAi.length === spec.count) {
        selected = selectedByAi;
      }
      selected.forEach((sheet) => used.add(sheet.exercise.id));
      const items = selected.map((sheet) => prescription(sheet, spec));
      return {
        id: `${dateKey}-${key}-${position}`,
        position,
        section:
          position === 0
            ? "warmup"
            : (`block-${position}` as WorkoutBlock["section"]),
        goal: spec.goal,
        title: spec.title,
        purpose: tag,
        format: spec.format ?? "sets",
        durationMinutes: blockDuration(spec, position),
        items,
      };
    });
    const items = blocks.flatMap((block) => block.items);
    const routine = routineSchema.parse({
      ...base,
      id: `daily-${dateKey}-${completedCount}-${key}`,
      name,
      focus: tag,
      blocks,
      items,
      estimatedMinutes: blocks.reduce(
        (total, block) => total + block.durationMinutes,
        0,
      ),
    });
    const purpose = profile.goalNote?.trim() || profile.goals?.join(", ");
    const recoveryContext = recentActivities.some(
      (activity) => activity.intensity === "high",
    )
      ? " La carga considera la actividad intensa que registraste recientemente."
      : input.upcomingSportInDays !== undefined &&
          input.upcomingSportInDays <= 1
        ? " La carga se moderó porque tenés actividad deportiva dentro de las próximas 24 horas."
        : input.readiness === "tired"
          ? " La carga se moderó porque marcaste cansancio."
          : recentIds.size
            ? " Se evitaron los movimientos y regiones más cargados durante las últimas 72 horas."
            : "";
    const fallbackInsight =
      key === "recommended"
        ? `Combina ${blocks
            .slice(1, 4)
            .map((block) => block.title.toLowerCase())
            .join(
              ", ",
            )}${purpose ? ` para acompañar tu objetivo: ${purpose}` : " según tu perfil y el entrenamiento de hoy"}.`
        : `${name} combina bloques de ${blocks
            .slice(1, 4)
            .map((block) => block.title.toLowerCase())
            .join(", ")} con ejercicios compatibles con tu equipamiento.`;
    return {
      key,
      name,
      tag,
      goal,
      insight: `${insights[key] ?? fallbackInsight}${recoveryContext}`.slice(
        0,
        280,
      ),
      routine,
    };
  });
}
