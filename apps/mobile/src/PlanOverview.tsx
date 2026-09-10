import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  blocks,
  routineBlocks,
  type WeeklyPlan,
  type Routine,
  type Exercise,
} from "@myfitnesscoach/contracts";
import { Button } from "./AppButton";

export function PlanOverview({
  plan,
  onStart,
  onGuide,
  onEdit,
  completed,
}: {
  plan: WeeklyPlan;
  onStart: (r: Routine) => void;
  onGuide: (e: Exercise) => void;
  onEdit: () => void;
  completed: string[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
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
            {routineBlocks(routine).map((block) => (
              <View key={block.id} style={s.blockCard}>
                <View style={s.blockNumber}>
                  <Text style={s.blockNumberText}>
                    {block.section === "warmup" ? "W" : block.section.slice(-1)}
                  </Text>
                </View>
                <View style={s.headerCopy}>
                  <Text style={s.blockTitle}>{block.title}</Text>
                  <Text style={s.meta}>
                    {block.durationMinutes} min · {block.items.length}{" "}
                    movimientos · {block.purpose}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <Button
            secondary
            title={
              expanded === routine.id
                ? "Ocultar movimientos"
                : "Ver movimientos"
            }
            onPress={() =>
              setExpanded(expanded === routine.id ? null : routine.id)
            }
          />
          {expanded === routine.id && (
            <View style={s.movements}>
              {routine.items.map((item, itemIndex) => (
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
                    <Text style={s.itemTitle}>{item.exercise.name}</Text>
                    <Text style={s.meta}>
                      {item.sets} × {item.reps}{" "}
                      {item.unit === "seconds" ? "s" : "rep."}
                      {item.perSide ? " por lado" : ""} · pausa{" "}
                      {item.restSeconds} s
                    </Text>
                    <Text style={s.link}>Ver demostración →</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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
    </View>
  );
}

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
  blockList: { gap: 8 },
  blockCard: {
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: "#f0f4ec",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  blockNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#dff5ba",
    alignItems: "center",
    justifyContent: "center",
  },
  blockNumberText: { fontSize: 14, fontWeight: "900", color: "#173e34" },
  blockTitle: { fontSize: 15, fontWeight: "800", color: "#173e34" },
  movements: { borderTopWidth: 1, borderTopColor: "#e2e8dd" },
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
  done: { fontSize: 14, fontWeight: "800", color: "#2f7657" },
});
