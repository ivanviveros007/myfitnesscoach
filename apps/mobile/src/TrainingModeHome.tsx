import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import {
  routineBlocks,
  routineSchema,
  type FitnessGoal,
  type Routine,
  type TrainingPreference,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";

export const goalLabels: Record<FitnessGoal, string> = {
  speed: "Velocidad",
  power: "Potencia",
  "sport-performance": "Rendimiento deportivo",
  strength: "Fuerza",
  endurance: "Resistencia",
  "muscle-gain": "Ganar músculo",
  mobility: "Movilidad",
  "general-fitness": "Estado físico general",
};

export function TrainingModeSelector({
  value,
  goals,
  goalNote,
  onChange,
  onEditGoal,
}: {
  value: TrainingPreference;
  goals: FitnessGoal[];
  goalNote?: string;
  onChange: (value: TrainingPreference) => void;
  onEditGoal: () => void;
}) {
  const modes: [TrainingPreference, string, string][] = [
    ["coach", "Coach IA", "Recibo una propuesta con un propósito"],
    ["builder", "Armar", "Elijo qué trabajar en cada bloque"],
    ["classic", "Clásico", "Sigo una división semanal de gimnasio"],
  ];
  return (
    <View style={s.section}>
      <View style={s.goalCard}>
        <View style={s.goalIcon}>
          <SymbolView name="target" size={20} tintColor="#173e34" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>TU OBJETIVO</Text>
          <Text style={s.goalTitle} numberOfLines={2}>
            {goalNote?.trim() ||
              goals.map((goal) => goalLabels[goal]).join(" · ") ||
              "Definí qué querés mejorar"}
          </Text>
        </View>
        <Pressable onPress={onEditGoal} style={s.adjust}>
          <Text style={s.adjustText}>Ajustar</Text>
        </Pressable>
      </View>
      <Text style={s.heading}>Elegí cómo entrenar hoy</Text>
      <View style={s.modeRow}>
        {modes.map(([key, title, description]) => {
          const selected = value === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={[s.mode, selected && s.modeActive]}
            >
              <Text style={[s.modeTitle, selected && s.modeTitleActive]}>
                {title}
              </Text>
              <Text style={[s.modeText, selected && s.modeTextActive]}>
                {description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type BuilderChoice = {
  key: string;
  title: string;
  tag: string;
  routine: Routine;
};

export function WorkoutBuilder({
  choices,
  onStart,
}: {
  choices: BuilderChoice[];
  onStart: (routine: Routine) => void;
}) {
  const sources = choices.filter(
    (choice) => routineBlocks(choice.routine).length === 5,
  );
  const [selected, setSelected] = useState<string[]>(() => [
    "recommended",
    "power",
    "strength",
    "hiit",
  ]);
  const blocks = useMemo(() => {
    const warmup = routineBlocks(sources[0]?.routine ?? choices[0]!.routine)[0];
    if (!warmup) return [];
    const chosen: WorkoutBlock[] = [
      { ...warmup, position: 0, section: "warmup" },
    ];
    for (let position = 1; position <= 4; position++) {
      const source =
        sources.find((choice) => choice.key === selected[position - 1]) ??
        sources[(position - 1) % sources.length];
      const block = source
        ? routineBlocks(source.routine)[position]
        : undefined;
      if (block)
        chosen.push({
          ...block,
          id: `builder-${position}-${block.id}`,
          position,
          section: `block-${position}` as WorkoutBlock["section"],
        });
    }
    return chosen;
  }, [choices, selected]);
  if (!sources.length) return null;
  const routine = routineSchema.parse({
    ...sources[0]!.routine,
    id: `builder-${sources[0]!.routine.orientation}-${selected.join("-")}`.slice(
      0,
      80,
    ),
    name: "Mi entrenamiento por bloques",
    trainingMode: "builder",
    blocks,
    items: blocks.flatMap((block) => block.items),
    estimatedMinutes: blocks.reduce(
      (total, block) => total + block.durationMinutes,
      0,
    ),
  });
  return (
    <View style={s.builder}>
      <Text style={s.kicker}>ARMÁ TU ENTRENAMIENTO</Text>
      <Text style={s.builderTitle}>Warm Up + 4 bloques</Text>
      <Text style={s.builderText}>
        Elegí la intención de cada bloque. Los ejercicios y dosis ya están
        clasificados por el servidor.
      </Text>
      {blocks.map((block, index) => (
        <View key={`${block.id}-${index}`} style={s.blockCard}>
          <View style={s.blockTop}>
            <Text style={s.blockNumber}>
              {index === 0 ? "W" : String(index).padStart(2, "0")}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={s.blockLabel}>
                {index === 0 ? "WARM UP" : `BLOQUE ${index}`}
              </Text>
              <Text style={s.blockTitle}>{block.title}</Text>
            </View>
          </View>
          {block.items.map((item) => (
            <Text key={item.exercise.id} style={s.exercise}>
              • {item.exercise.name} · {item.sets} × {item.reps}
              {item.unit === "seconds" ? " s" : " rep."}
            </Text>
          ))}
          {index > 0 && (
            <View style={s.sourceRow}>
              {sources.map((choice) => (
                <Pressable
                  key={`${index}-${choice.key}`}
                  onPress={() =>
                    setSelected((current) =>
                      current.map((value, i) =>
                        i === index - 1 ? choice.key : value,
                      ),
                    )
                  }
                  style={[
                    s.sourceChip,
                    selected[index - 1] === choice.key && s.sourceChipActive,
                  ]}
                >
                  <Text
                    style={[
                      s.sourceText,
                      selected[index - 1] === choice.key && s.sourceTextActive,
                    ]}
                  >
                    {choice.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
      <Pressable onPress={() => onStart(routine)} style={s.start}>
        <Text style={s.startText}>Comenzar mi entrenamiento</Text>
        <Text style={s.startText}>→</Text>
      </Pressable>
    </View>
  );
}

export function ClassicIntro({ days }: { days: number }) {
  const split =
    days <= 2
      ? "Full Body A · Full Body B"
      : days === 3
        ? "Empuje y pecho · Piernas · Tirón y espalda"
        : "Upper · Lower · Empuje · Tirón";
  return (
    <View style={s.classic}>
      <Text style={s.kicker}>PLAN CLÁSICO · {days} DÍAS</Text>
      <Text style={s.builderTitle}>Tu división semanal</Text>
      <Text style={s.builderText}>
        {split}. Elegí abajo la sesión correspondiente y el Coach ajustará
        series, carga y recuperación con tu historial.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  section: { gap: 14, marginTop: 10 },
  goalCard: {
    backgroundColor: "#173e34",
    borderRadius: 28,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: "#7c9185",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  goalTitle: { color: "white", fontSize: 18, fontWeight: "800", marginTop: 3 },
  adjust: {
    backgroundColor: "#c8ff63",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  adjustText: { color: "#173e34", fontWeight: "900" },
  heading: { color: "#173e34", fontSize: 24, fontWeight: "900" },
  modeRow: { flexDirection: "row", gap: 8 },
  mode: {
    flex: 1,
    minHeight: 108,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#e8eee2",
    justifyContent: "space-between",
  },
  modeActive: { backgroundColor: "#173e34" },
  modeTitle: { color: "#173e34", fontSize: 16, fontWeight: "900" },
  modeTitleActive: { color: "#c8ff63" },
  modeText: { color: "#60736a", fontSize: 12, lineHeight: 16 },
  modeTextActive: { color: "#dfe8df" },
  builder: { gap: 14, marginTop: 8 },
  builderTitle: { color: "#173e34", fontSize: 28, fontWeight: "900" },
  builderText: { color: "#536a60", fontSize: 16, lineHeight: 23 },
  blockCard: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 16,
    gap: 8,
  },
  blockTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  blockNumber: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#c8ff63",
    color: "#173e34",
    textAlign: "center",
    textAlignVertical: "center",
    paddingTop: 13,
    fontWeight: "900",
    fontSize: 17,
  },
  blockLabel: {
    color: "#819188",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "900",
  },
  blockTitle: { color: "#173e34", fontSize: 19, fontWeight: "900" },
  exercise: { color: "#536a60", fontSize: 14, lineHeight: 20 },
  sourceRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  sourceChip: {
    backgroundColor: "#edf1e9",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  sourceChipActive: { backgroundColor: "#173e34" },
  sourceText: { color: "#536a60", fontSize: 11, fontWeight: "800" },
  sourceTextActive: { color: "#c8ff63" },
  start: {
    backgroundColor: "#c8ff63",
    borderRadius: 25,
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startText: { color: "#173e34", fontSize: 19, fontWeight: "900" },
  classic: {
    backgroundColor: "#e8eee2",
    borderRadius: 26,
    padding: 20,
    gap: 7,
    marginTop: 8,
  },
});
