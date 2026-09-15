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
  count: 2,
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
  count: 2,
};
const b = (
  title: string,
  goal: BlockGoal,
  catalogGoals: string[],
  dose: DoseProfile,
  count = 2,
  extra: Partial<BlockSpec> = {},
): BlockSpec => ({ title, goal, catalogGoals, dose, count, ...extra });

const modalityBlocks: Record<string, BlockSpec[]> = {
  recommended: [
    b(
      "Coordinación y transferencia",
      "transfer",
      ["transfer", "sport"],
      "warmup",
    ),
    b("Fuerza principal", "strength", ["strength", "full-body"], "strength", 3),
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
      "warmup",
    ),
    b("Potencia multidireccional", "power", ["sport", "power"], "power", 2, {
      format: "intervals",
    }),
    b("Fuerza unilateral", "strength", ["sport", "strength"], "strength", 2, {
      patterns: ["single-leg", "lunge", "hinge"],
    }),
    stability,
  ],
  cross: [
    b("Strength", "strength", ["cross-training", "strength"], "strength"),
    b("Power", "power", ["cross-training", "power"], "power", 2, {
      format: "intervals",
    }),
    b(
      "Metcon",
      "conditioning",
      ["cross-training", "conditioning"],
      "conditioning",
      3,
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
    (sheet.prescriptions.some((item) => item.profile === spec.dose) ? 3 : 0);
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

export function makeDailyRoutines(
  input: DailyTrainingRequest,
  selections: DailyExerciseSelections = {},
  insights: Record<string, string> = {},
) {
  const { date: dateKey, completedCount, profile, orientation } = input;
  const base = template(orientation);
  const pool = classifiedPool(profile);
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
      );
      if (!selected.length)
        selected = selectExercises(
          pool,
          { ...spec, patterns: undefined, regions: undefined },
          seed + position,
          used,
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
        durationMinutes:
          position === 0
            ? 5
            : Math.max(5, Math.round((base.estimatedMinutes ?? 40) / 5)),
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
      insight: (insights[key] ?? fallbackInsight).slice(0, 280),
      routine,
    };
  });
}
