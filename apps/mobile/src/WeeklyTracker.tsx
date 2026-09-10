import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  dayNames,
  type WeeklyPlan,
  type Session,
} from "@myfitnesscoach/contracts";

export function WeeklyTracker({
  plan,
  sessions,
}: {
  plan: WeeklyPlan;
  sessions: Session[];
}) {
  const completed = plan.routines.filter((routine) =>
    sessions.some(
      (session) => session.routine.id === routine.id && session.finishedAt,
    ),
  ).length;
  return (
    <View style={s.card}>
      <View style={s.top}>
        <View>
          <Text style={s.kicker}>OBJETIVO SEMANAL</Text>
          <Text style={s.title}>
            {completed === plan.routines.length
              ? "¡Objetivo cumplido!"
              : `${completed} de ${plan.routines.length} sesiones`}
          </Text>
        </View>
        <Text style={s.score}>
          {completed}/{plan.routines.length}
        </Text>
      </View>
      <View style={s.days}>
        {dayNames.map((name, day) => {
          const routine = plan.routines.find(
            (item) => item.scheduledDay === day,
          );
          const session = routine
            ? sessions.find((item) => item.routine.id === routine.id)
            : undefined;
          const state = session?.finishedAt
            ? "complete"
            : session
              ? "partial"
              : routine
                ? "planned"
                : "empty";
          return (
            <View key={name} style={s.day}>
              <View style={[s.dot, s[state]]}>
                <Text
                  style={[s.dotText, state === "complete" && s.completeText]}
                >
                  {state === "complete" ? "✓" : state === "partial" ? "◐" : ""}
                </Text>
              </View>
              <Text style={s.dayText}>{name.slice(0, 1)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: "#e2e8dd",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#718077",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#173e34", marginTop: 4 },
  score: { fontSize: 30, fontWeight: "900", color: "#173e34" },
  days: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 7 },
  dot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { borderColor: "#e0e5de", backgroundColor: "#f7f8f4" },
  planned: { borderColor: "#8ca092", backgroundColor: "white" },
  partial: { borderColor: "#a9cf63", backgroundColor: "#e8f8cb" },
  complete: { borderColor: "#b7ff45", backgroundColor: "#b7ff45" },
  dotText: { fontSize: 17, fontWeight: "800", color: "#52705c" },
  completeText: { color: "#173e34" },
  dayText: { fontSize: 12, fontWeight: "700", color: "#6f7b73" },
});
