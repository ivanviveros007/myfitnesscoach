import React, { useState } from "react";
import { Platform, View, Text, StyleSheet, Pressable } from "react-native";
import { BottomSheet } from "@expo/ui";
import {
  blocks,
  routineBlocks,
  type WeeklyPlan,
  type Routine,
  type Exercise,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";
import { Button } from "./AppButton";

const formatLabel: Record<WorkoutBlock["format"], string> = {
  sets: "SERIES",
  amrap: "AMRAP",
  rounds: "RONDAS",
  intervals: "INTERVALOS",
  emom: "EMOM",
  "for-time": "POR TIEMPO",
};
const prescription = (item: WorkoutBlock["items"][number]) =>
  `${item.sets} × ${item.reps}${item.unit === "seconds" ? " s" : " rep."}${item.perSide ? " por lado" : ""}`;

export function PlanOverview({
  plan,
  onStart,
  onGuide,
  onEdit,
  completed,
  favoriteBlocks,
  onFavoriteBlock,
}: {
  plan: WeeklyPlan;
  onStart: (r: Routine) => void;
  onGuide: (e: Exercise) => void;
  onEdit: () => void;
  completed: string[];
  favoriteBlocks: string[];
  onFavoriteBlock: (id: string) => void;
}) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    block: WorkoutBlock;
    routine: Routine;
  } | null>(null);
  const toggleDetails = (id: string) =>
    setExpandedBlock(expandedBlock === id ? null : id);

  return (
    <View style={s.container}>
      <View style={s.weekHeader}>
        <View style={s.headerCopy}>
          <Text style={s.kicker}>
            SEMANA · {plan.input.week.split("-").reverse().join("/")}
          </Text>
          <Text style={s.title}>Tu entrenamiento</Text>
        </View>
        <View style={s.counter}>
          <Text style={s.counterNumber}>{plan.input.days.length}</Text>
          <Text style={s.counterLabel}>DÍAS</Text>
        </View>
      </View>
      <Text style={s.body}>
        Sesiones de hasta {plan.input.minutes} minutos, organizadas por
        capacidad.
      </Text>
      <Button secondary title="Ajustar disponibilidad" onPress={onEdit} />
      {plan.routines.map((routine, index) => (
        <View key={routine.id} style={s.card}>
          <View style={s.sessionTop}>
            <View style={s.sessionNumber}>
              <Text style={s.sessionNumberText}>
                {String(index + 1).padStart(2, "0")}
              </Text>
            </View>
            <View style={s.headerCopy}>
              <Text style={s.title}>{routine.name}</Text>
              <Text style={s.meta}>
                {routine.items.length} movimientos · ≈{" "}
                {routine.estimatedMinutes} min
              </Text>
            </View>
          </View>
          <Text style={s.body}>{routine.focus}</Text>
          <View style={s.blockList}>
            {routineBlocks(routine).map((block) => {
              const expanded = expandedBlock === block.id;
              const favorite = favoriteBlocks.includes(block.id);
              return (
                <View key={block.id} style={s.blockCard}>
                  <View style={s.blockHeader}>
                    <View style={s.blockHeading}>
                      <Text style={s.blockTitle}>{block.title}</Text>
                      <Text style={s.formatPill}>
                        {formatLabel[block.format]} · {block.durationMinutes}{" "}
                        MIN
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Opciones de ${block.title}`}
                      hitSlop={10}
                      onPress={() => setSelected({ block, routine })}
                      style={({ pressed }) => [
                        s.menuButton,
                        pressed && s.pressed,
                      ]}
                    >
                      <Text style={s.menuDots}>•••</Text>
                    </Pressable>
                  </View>
                  <View style={s.prescriptions}>
                    {block.items.map((item) => (
                      <View key={item.exercise.id} style={s.prescriptionRow}>
                        <Text style={s.prescriptionDose}>
                          {prescription(item)}
                        </Text>
                        <Text style={s.prescriptionName}>
                          {item.exercise.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => toggleDetails(block.id)}
                    style={({ pressed }) => [
                      s.detailButton,
                      pressed && s.pressed,
                    ]}
                  >
                    <Text style={s.detailButtonText}>
                      {expanded ? "Ocultar detalle" : "Ver movimientos"}
                    </Text>
                    <Text style={s.detailArrow}>{expanded ? "↑" : "→"}</Text>
                  </Pressable>
                  {expanded && (
                    <View style={s.movements}>
                      <Text style={s.blockPurpose}>{block.purpose}</Text>
                      {block.items.map((item, itemIndex) => (
                        <Pressable
                          key={item.exercise.id}
                          accessibilityRole="button"
                          onPress={() => onGuide(item.exercise)}
                          style={s.item}
                        >
                          <View style={s.itemIndex}>
                            <Text style={s.itemIndexText}>{itemIndex + 1}</Text>
                          </View>
                          <View style={s.itemCopy}>
                            <Text style={s.itemBlock}>
                              {item.block ? blocks[item.block] : "EJERCICIO"}
                            </Text>
                            <Text style={s.itemTitle}>
                              {item.exercise.name}
                            </Text>
                            <Text style={s.meta}>
                              {prescription(item)} · pausa {item.restSeconds} s
                            </Text>
                            <Text style={s.link}>Ver técnica y video →</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {favorite && <Text style={s.saved}>♥ BLOQUE GUARDADO</Text>}
                </View>
              );
            })}
          </View>
          {completed.includes(routine.id) ? (
            <Text style={s.done}>✓ Sesión realizada</Text>
          ) : (
            <Button
              title="Empezar esta sesión"
              onPress={() => onStart(routine)}
            />
          )}
        </View>
      ))}
      <View style={s.noteCard}>
        <Text style={s.label}>CRITERIO DE ESTA SEMANA</Text>
        {plan.notes.map((note) => (
          <Text key={note} style={s.note}>
            • {note}
          </Text>
        ))}
      </View>
      <Text style={s.body}>
        Progresión: primero completá las series con buena técnica. Si en varias
        sesiones quedan 2–3 repeticiones en reserva, revisá una pequeña subida
        de carga.
      </Text>

      <BottomSheet
        isPresented={selected !== null}
        onDismiss={() => setSelected(null)}
        showDragIndicator
        snapPoints={[{ height: 330 }]}
        containerColor="#f5f7f1"
      >
        {selected && (
          <View style={s.sheet}>
            <Text style={s.sheetEyebrow}>OPCIONES DEL BLOQUE</Text>
            <Text style={s.sheetTitle}>{selected.block.title}</Text>
            <Pressable
              style={s.sheetAction}
              onPress={() => {
                toggleDetails(selected.block.id);
                setSelected(null);
              }}
            >
              <Text style={s.sheetActionText}>
                {expandedBlock === selected.block.id
                  ? "Ocultar movimientos"
                  : "Ver movimientos"}
              </Text>
              <Text style={s.sheetIcon}>→</Text>
            </Pressable>
            <Pressable
              style={s.sheetAction}
              onPress={() => {
                onFavoriteBlock(selected.block.id);
                setSelected(null);
              }}
            >
              <Text style={s.sheetActionText}>
                {favoriteBlocks.includes(selected.block.id)
                  ? "Quitar de guardados"
                  : "Guardar bloque"}
              </Text>
              <Text style={s.sheetIcon}>
                {favoriteBlocks.includes(selected.block.id) ? "♡" : "♥"}
              </Text>
            </Pressable>
            <Pressable
              style={[s.sheetAction, s.sheetPrimary]}
              onPress={() => {
                onStart(selected.routine);
                setSelected(null);
              }}
            >
              <Text style={[s.sheetActionText, s.sheetPrimaryText]}>
                Empezar entrenamiento
              </Text>
              <Text style={[s.sheetIcon, s.sheetPrimaryText]}>→</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const displayFont = Platform.select({
  ios: "Arial Rounded MT Bold",
  android: "sans-serif-condensed",
  default: undefined,
});
const s = StyleSheet.create({
  container: { gap: 18 },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: { flex: 1 },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#6a7c70",
    marginBottom: 5,
  },
  counter: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  counterNumber: { fontSize: 25, fontWeight: "900", color: "#173e34" },
  counterLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#42674e",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e1e9de",
  },
  noteCard: {
    backgroundColor: "#e8efe2",
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  note: { fontSize: 13, lineHeight: 19, color: "#526257" },
  sessionTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  sessionNumber: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#173e34",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionNumberText: { fontSize: 17, fontWeight: "800", color: "#c8ff63" },
  title: { fontSize: 23, fontWeight: "700", color: "#173e34" },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#42674e",
  },
  body: { fontSize: 15, lineHeight: 23, color: "#485e50" },
  meta: { fontSize: 12, lineHeight: 18, color: "#768278" },
  blockList: { gap: 14 },
  blockCard: {
    borderRadius: 22,
    backgroundColor: "#f7f8f4",
    padding: 16,
    gap: 15,
    borderWidth: 1,
    borderColor: "#e4e8df",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  blockHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  blockHeading: { flex: 1, gap: 8 },
  blockTitle: {
    fontFamily: displayFont,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: "#173e34",
  },
  formatPill: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "#e8ece5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#4d5b51",
  },
  menuButton: {
    width: 48,
    height: 48,
    marginTop: -8,
    marginRight: -8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuDots: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#173e34",
  },
  prescriptions: { gap: 10 },
  prescriptionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  prescriptionDose: {
    width: 104,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#42674e",
  },
  prescriptionName: { flex: 1, fontSize: 15, lineHeight: 20, color: "#293e34" },
  detailButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 15,
    backgroundColor: "#e7eddf",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailButtonText: { fontSize: 15, fontWeight: "800", color: "#173e34" },
  detailArrow: { fontSize: 20, fontWeight: "800", color: "#173e34" },
  blockPurpose: {
    fontSize: 13,
    lineHeight: 19,
    color: "#526257",
    paddingVertical: 10,
  },
  movements: { borderTopWidth: 1, borderTopColor: "#dce3d7" },
  item: {
    minHeight: 76,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8dd",
  },
  itemIndex: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#dff5ba",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIndexText: { fontSize: 13, fontWeight: "800", color: "#173e34" },
  itemCopy: { flex: 1, gap: 3 },
  itemBlock: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#6b806f",
  },
  itemTitle: { fontSize: 16, fontWeight: "700", color: "#173e34" },
  link: { fontSize: 14, fontWeight: "700", color: "#214d3e", paddingTop: 6 },
  saved: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#2f7657",
  },
  done: { fontSize: 14, fontWeight: "800", color: "#2f7657" },
  pressed: { opacity: 0.62 },
  sheet: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 26, gap: 10 },
  sheetEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#6a7c70",
  },
  sheetTitle: {
    fontFamily: displayFont,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    color: "#173e34",
    marginBottom: 4,
  },
  sheetAction: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetActionText: { fontSize: 16, fontWeight: "800", color: "#173e34" },
  sheetIcon: { fontSize: 20, fontWeight: "800", color: "#2f7657" },
  sheetPrimary: { backgroundColor: "#173e34" },
  sheetPrimaryText: { color: "#c8ff63" },
});
