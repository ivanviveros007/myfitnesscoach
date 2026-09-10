import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { blocks, routineBlocks, type Session } from "@myfitnesscoach/contracts";

export function Performance({ sessions }: { sessions: Session[] }) {
  const done = sessions.filter((session) => session.finishedAt);
  const minutes = done.reduce(
    (total, session) => total + (session.routine.estimatedMinutes ?? 0),
    0,
  );
  const capacities = new Map<string, number>();
  for (const session of done)
    for (const block of routineBlocks(session.routine))
      for (const item of block.items)
        if (item.block)
          capacities.set(
            blocks[item.block],
            (capacities.get(blocks[item.block]) ?? 0) + 1,
          );
  const top = [...capacities.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <View style={s.container}>
      <Text style={s.kicker}>TU ACTIVIDAD</Text>
      <Text style={s.hero}>Rendimiento</Text>
      <View style={s.metrics}>
        <Metric value={String(done.length)} label="SESIONES" />
        <Metric
          value={
            minutes >= 60
              ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
              : `${minutes}m`
          }
          label="TIEMPO"
        />
      </View>
      <View style={s.card}>
        <Text style={s.title}>Capacidades trabajadas</Text>
        {top.length ? (
          top.map(([name, count]) => (
            <View key={name} style={s.row}>
              <Text style={s.body}>{name}</Text>
              <Text style={s.number}>{count}</Text>
            </View>
          ))
        ) : (
          <Text style={s.body}>
            Cuando completes sesiones vas a ver aquí cómo se distribuye tu
            trabajo.
          </Text>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.title}>Últimas sesiones</Text>
        {done.slice(0, 6).map((session) => (
          <View key={session.id} style={s.history}>
            <View>
              <Text style={s.bodyStrong}>{session.routine.name}</Text>
              <Text style={s.small}>
                {new Date(session.startedAt).toLocaleDateString("es-AR")}
              </Text>
            </View>
            <Text style={s.number}>
              {session.amrap ? `${session.amrap.rounds} rds.` : "✓"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.kicker}>{label}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  container: { gap: 18 },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#718077",
  },
  hero: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#173e34",
  },
  metrics: { flexDirection: "row", gap: 12 },
  metric: {
    flex: 1,
    minHeight: 130,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#c8ff63",
    justifyContent: "space-between",
  },
  metricValue: { fontSize: 34, fontWeight: "900", color: "#173e34" },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e1e9de",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#173e34" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#edf0ea",
    paddingVertical: 10,
  },
  body: { fontSize: 15, color: "#485e50" },
  bodyStrong: { fontSize: 15, fontWeight: "700", color: "#173e34" },
  number: { fontSize: 18, fontWeight: "900", color: "#315d4d" },
  history: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  small: { fontSize: 12, color: "#78857b", marginTop: 3 },
});
