import {
  routineSchema,
  type BlockGoal,
  type Routine,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";

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

const formats: Partial<Record<BlockGoal, WorkoutBlock["format"]>> = {
  power: "intervals",
  conditioning: "amrap",
  hypertrophy: "rounds",
  mobility: "sets",
  stability: "sets",
};

function rotate<T>(items: T[], amount: number) {
  if (items.length < 2) return items;
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function fiveBlocks(routine: Routine): WorkoutBlock[] {
  const existing = routine.blocks ?? [];
  if (existing.length === 5) return existing;
  if (existing.length === 4) {
    const last = existing[3]!;
    const splitAt = Math.max(1, Math.floor(last.items.length / 2));
    const stabilityItems = last.items.slice(0, splitAt);
    const mobilityItems = last.items.slice(splitAt);
    return [
      ...existing.slice(0, 3),
      {
        ...last,
        id: `${routine.id}-block-3-migrated`,
        position: 3,
        section: "block-3",
        goal: "stability",
        title: "Midline & Stability",
        purpose: "Control del tronco y estabilidad",
        items: stabilityItems,
      },
      {
        ...last,
        id: `${routine.id}-block-4-migrated`,
        position: 4,
        section: "block-4",
        goal: "mobility",
        title: "Mobility & Recovery",
        purpose: "Movilidad y vuelta a la calma",
        items: mobilityItems.length ? mobilityItems : stabilityItems,
      },
    ];
  }
  return existing;
}

/** Builds a stable menu for one calendar day. History advances the recommended
 * option, while the date changes exercise order without changing during the day. */
export function makeDailyRoutines(
  base: Routine,
  dateKey: string,
  completedCount: number,
) {
  const daySeed = [...dateKey].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const ordered = rotate([...dailyStyles], completedCount % dailyStyles.length);
  return ordered.map(([key, name, tag, goal], styleIndex) => {
    const sourceBlocks = fiveBlocks(base);
    const blocks = sourceBlocks.map((block, index): WorkoutBlock => {
      if (index === 0) return { ...block, title: "Warm Up", goal: "warmup" };
      const highlighted = index === 1 + ((daySeed + styleIndex) % 4);
      return {
        ...block,
        id: `${dateKey}-${key}-${block.section}`,
        title: highlighted ? name : block.title,
        goal: highlighted ? goal : block.goal,
        format: highlighted ? (formats[goal] ?? block.format) : block.format,
        items: rotate([...block.items], daySeed + styleIndex + index),
      };
    });
    const routine = routineSchema.parse({
      ...base,
      id: `daily-${dateKey}-${key}`,
      name,
      focus: tag,
      blocks,
      items: blocks.flatMap((block) => block.items),
    });
    return { key, name, tag, goal, routine };
  });
}
