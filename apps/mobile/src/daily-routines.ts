import {
  routineSchema,
  type BlockGoal,
  type DoseProfile,
  type ExerciseTechnique,
  type Prescription,
  type Routine,
  type TrainingProfile,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";
import { appExercise, classifiedPool } from "./classified-exercises";

export const dailyStyles = [
  ["recommended", "Sesión recomendada", "PARA HOY", "full-body"],
  ["power", "Power", "POTENCIA · VELOCIDAD", "power"],
  ["strength", "Strength", "FUERZA · CONTROL", "strength"],
  ["combined", "Combined Strength", "FUERZA · ACONDICIONAMIENTO", "conditioning"],
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
  title: string; goal: BlockGoal; catalogGoals: string[]; dose: DoseProfile;
  count: number; format?: WorkoutBlock["format"]; patterns?: string[]; regions?: string[];
};

const warmup: BlockSpec = { title: "Warm Up", goal: "warmup", catalogGoals: ["warmup"], dose: "warmup", count: 2 };
const mobility: BlockSpec = { title: "Mobility & Recovery", goal: "mobility", catalogGoals: ["mobility", "recovery"], dose: "mobility", count: 2 };
const stability: BlockSpec = { title: "Midline & Stability", goal: "stability", catalogGoals: ["stability", "midline"], dose: "core-control", count: 2 };
const b = (title: string, goal: BlockGoal, catalogGoals: string[], dose: DoseProfile, count = 2, extra: Partial<BlockSpec> = {}): BlockSpec => ({ title, goal, catalogGoals, dose, count, ...extra });

const modalityBlocks: Record<string, BlockSpec[]> = {
  recommended: [b("Coordinación y transferencia", "transfer", ["transfer", "sport"], "warmup"), b("Fuerza principal", "strength", ["strength", "full-body"], "strength", 3), stability, mobility],
  power: [b("Potencia", "power", ["power"], "power", 2, { format: "intervals" }), b("Transferencia atlética", "transfer", ["transfer", "sport"], "conditioning"), b("Fuerza de soporte", "strength", ["strength"], "strength"), mobility],
  strength: [b("Piernas", "legs", ["strength", "legs"], "strength", 2, { regions: ["quads", "glutes", "hamstrings"] }), b("Empuje y tracción", "upper-body", ["strength", "upper-body"], "strength", 2, { regions: ["chest", "back", "shoulders"] }), b("Fuerza complementaria", "strength", ["strength"], "strength"), stability],
  combined: [b("Fuerza base", "strength", ["strength", "combined-strength"], "strength"), b("Potencia", "power", ["power"], "power", 2, { format: "intervals" }), b("Acondicionamiento", "conditioning", ["conditioning"], "conditioning", 3, { format: "amrap" }), mobility],
  "full-body": [b("Piernas y cadera", "legs", ["full-body", "strength"], "strength", 2, { regions: ["quads", "glutes", "hamstrings", "legs"] }), b("Torso", "upper-body", ["full-body", "upper-body"], "strength", 2, { regions: ["chest", "back", "shoulders"] }), b("Full Body Conditioning", "full-body", ["full-body", "conditioning"], "conditioning", 3, { format: "rounds" }), mobility],
  upper: [b("Empuje", "upper-body", ["upper-body", "strength"], "strength", 2, { patterns: ["horizontal-push", "vertical-push"] }), b("Tracción", "upper-body", ["upper-body", "strength"], "strength", 2, { patterns: ["horizontal-pull", "vertical-pull"] }), b("Musculación", "hypertrophy", ["upper-body", "hypertrophy"], "hypertrophy"), stability],
  midline: [b("Anti extensión", "stability", ["midline", "stability"], "core-control", 2, { patterns: ["anti-extension", "plank"] }), b("Rotación y transferencia", "transfer", ["midline", "transfer", "sport"], "core-control", 2, { patterns: ["rotation", "anti-rotation", "trunk-rotation"] }), b("Core Conditioning", "conditioning", ["midline", "conditioning"], "conditioning", 3, { format: "amrap" }), mobility],
  pilates: [b("Control central", "stability", ["pilates", "midline"], "core-control"), b("Cadera y piernas", "legs", ["pilates", "legs"], "core-control"), b("Estabilidad global", "stability", ["pilates", "stability"], "core-control"), mobility],
  sport: [b("Coordinación y transferencia", "transfer", ["sport", "transfer", "padel"], "warmup"), b("Potencia multidireccional", "power", ["sport", "power"], "power", 2, { format: "intervals" }), b("Fuerza unilateral", "strength", ["sport", "strength"], "strength", 2, { patterns: ["single-leg", "lunge", "hinge"] }), stability],
  cross: [b("Strength", "strength", ["cross-training", "strength"], "strength"), b("Power", "power", ["cross-training", "power"], "power", 2, { format: "intervals" }), b("Metcon", "conditioning", ["cross-training", "conditioning"], "conditioning", 3, { format: "amrap" }), mobility],
  hiit: [b("Activación dinámica", "conditioning", ["hiit", "warmup"], "warmup"), b("Intervalos de potencia", "power", ["hiit", "power"], "interval", 2, { format: "intervals" }), b("HIIT Conditioning", "conditioning", ["hiit", "conditioning"], "interval", 3, { format: "intervals" }), mobility],
  hrx: [b("Fuerza funcional", "strength", ["strength", "full-body"], "strength"), b("Trabajo híbrido", "full-body", ["conditioning", "cross-training"], "conditioning", 3, { format: "rounds" }), b("Resistencia muscular", "hypertrophy", ["hypertrophy", "conditioning"], "hypertrophy"), stability],
  hypertrophy: [b("Lower Body", "legs", ["hypertrophy", "legs"], "hypertrophy", 2, { regions: ["quads", "glutes", "hamstrings"] }), b("Push", "upper-body", ["hypertrophy", "upper-body"], "hypertrophy", 2, { patterns: ["horizontal-push", "vertical-push", "elbow-extension"] }), b("Pull", "upper-body", ["hypertrophy", "upper-body"], "hypertrophy", 2, { patterns: ["horizontal-pull", "vertical-pull", "elbow-flexion"] }), mobility],
};

const hash = (value: string) => [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 17);
function selectExercises(pool: ExerciseTechnique[], spec: BlockSpec, seed: number, used: Set<string>) {
  const score = (sheet: ExerciseTechnique) =>
    sheet.exercise.goals.filter((item) => spec.catalogGoals.includes(item)).length * 8 +
    (spec.patterns?.some((item) => sheet.exercise.patterns.includes(item)) ? 5 : 0) +
    (spec.regions?.some((item) => sheet.exercise.regions.includes(item)) ? 4 : 0) +
    (sheet.prescriptions.some((item) => item.profile === spec.dose) ? 3 : 0);
  const ranked = pool.filter((sheet) =>
    !used.has(sheet.exercise.id) &&
    score(sheet) >= 8 &&
    (!spec.patterns || spec.patterns.some((item) => sheet.exercise.patterns.includes(item))) &&
    (!spec.regions || spec.regions.some((item) => sheet.exercise.regions.includes(item))))
    .sort((a, z) => score(z) - score(a) || a.exercise.id.localeCompare(z.exercise.id));
  const selected: ExerciseTechnique[] = [];
  for (let step = 0; step < ranked.length * 2 && selected.length < spec.count; step++) {
    const candidate = ranked[(seed + step * 7) % ranked.length];
    if (candidate && !selected.some((item) => item.exercise.id === candidate.exercise.id)) selected.push(candidate);
  }
  selected.forEach((sheet) => used.add(sheet.exercise.id));
  return selected;
}

function prescription(sheet: ExerciseTechnique, spec: BlockSpec): Prescription {
  const dose = sheet.prescriptions.find((item) => item.profile === spec.dose) ?? sheet.prescriptions[0]!;
  return {
    exercise: appExercise(sheet),
    block: spec.goal === "warmup" ? "warmup" : spec.goal === "power" ? "power" : spec.goal === "transfer" ? "transfer" : spec.goal === "stability" ? "stability" : spec.goal === "mobility" || spec.goal === "recovery" ? "flexibility" : "strength",
    sets: dose.sets,
    reps: dose.workSeconds ?? dose.repsMax ?? dose.repsMin ?? 8,
    restSeconds: dose.restSecondsMin,
    unit: dose.workSeconds || sheet.exercise.metric === "seconds" ? "seconds" : "reps",
    perSide: sheet.exercise.unilateral,
    effort: `${dose.stopRule} RPE ${dose.rpeMin}–${dose.rpeMax}.`,
  };
}

export function makeDailyRoutines(base: Routine, dateKey: string, completedCount: number, profile: TrainingProfile) {
  const pool = classifiedPool(profile);
  return dailyStyles.map(([key, name, tag, goal], styleIndex) => {
    const used = new Set<string>();
    const seed = hash(`${dateKey}:${completedCount}:${key}:${base.orientation}`);
    const specs = [warmup, ...(modalityBlocks[key] ?? modalityBlocks.recommended!)];
    const blocks = specs.map((spec, position): WorkoutBlock => {
      let selected = selectExercises(pool, spec, seed + position * 19 + styleIndex, used);
      if (!selected.length) selected = selectExercises(pool, { ...spec, patterns: undefined, regions: undefined }, seed + position, used);
      if (!selected.length) selected = pool.filter((sheet) => !used.has(sheet.exercise.id)).slice(0, Math.max(1, spec.count));
      const items = selected.map((sheet) => prescription(sheet, spec));
      return {
        id: `${dateKey}-${key}-${position}`, position,
        section: position === 0 ? "warmup" : `block-${position}` as WorkoutBlock["section"],
        goal: spec.goal, title: spec.title, purpose: tag, format: spec.format ?? "sets",
        durationMinutes: position === 0 ? 5 : Math.max(5, Math.round((base.estimatedMinutes ?? 40) / 5)), items,
      };
    });
    const items = blocks.flatMap((block) => block.items);
    const routine = routineSchema.parse({
      ...base, id: `daily-${dateKey}-${completedCount}-${key}`, name, focus: tag,
      blocks, items, estimatedMinutes: blocks.reduce((total, block) => total + block.durationMinutes, 0),
    });
    return { key, name, tag, goal, routine };
  });
}
