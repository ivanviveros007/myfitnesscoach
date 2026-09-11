import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { routineBlocks, type Routine } from "@myfitnesscoach/contracts";

export function TodayWorkout({
  routine,
  sessionsThisWeek,
  streak,
  onStart,
  onPlan,
  onAdjust,
}: {
  routine: Routine;
  sessionsThisWeek: number;
  streak: number;
  onStart: () => void;
  onPlan: () => void;
  onAdjust: () => void;
}) {
  const workoutBlocks = routineBlocks(routine);
  return (
    <View style={s.container}>
      <View style={s.metrics}>
        <View style={s.metric}>
          <Text style={s.metricNumber}>{sessionsThisWeek}</Text>
          <Text style={s.metricLabel}>ESTA SEMANA</Text>
        </View>
        <View style={s.metric}>
          <Text style={s.metricNumber}>{streak}</Text>
          <Text style={s.metricLabel}>DÍAS SEGUIDOS</Text>
        </View>
      </View>

      <View style={s.heroCard}>
        <View style={s.heroTop}>
          <View style={s.livePill}>
            <Text style={s.liveText}>LISTO PARA HOY</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onAdjust}
            style={s.more}
          >
            <Text style={s.moreText}>•••</Text>
          </Pressable>
        </View>
        <Text style={s.title}>{routine.name.replace(/^.*? · /, "")}</Text>
        <Text style={s.focus}>{routine.focus}</Text>
        <View style={s.summary}>
          <Text style={s.summaryStrong}>≈ {routine.estimatedMinutes} min</Text>
          <Text style={s.summaryText}>{workoutBlocks.length} bloques</Text>
          <Text style={s.summaryText}>{routine.items.length} movimientos</Text>
        </View>
        <View style={s.blockPreview}>
          {workoutBlocks.map((block, index) => (
            <View key={block.id} style={s.blockRow}>
              <View style={s.blockIndex}>
                <Text style={s.blockIndexText}>{index + 1}</Text>
              </View>
              <View style={s.blockCopy}>
                <Text style={s.blockTitle}>{block.title}</Text>
                <Text style={s.blockMeta}>
                  {block.items.map((item) => item.exercise.name).join(" · ")}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [s.start, pressed && s.pressed]}
        >
          <Text style={s.startText}>Entrenar hoy</Text>
          <Text style={s.startArrow}>→</Text>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={onPlan} style={s.planLink}>
        <Text style={s.planLinkText}>Ver estructura y movimientos</Text>
        <Text style={s.planArrow}>›</Text>
      </Pressable>
    </View>
  );
}

const displayFont = Platform.select({
  ios: "Arial Rounded MT Bold",
  android: "sans-serif-condensed",
  default: undefined,
});
const s = StyleSheet.create({
  container: { gap: 16 },
  metrics: { flexDirection: "row", gap: 10 },
  metric: {
    flex: 1,
    minHeight: 88,
    borderRadius: 22,
    padding: 15,
    justifyContent: "space-between",
    backgroundColor: "#e8eddf",
  },
  metricNumber: {
    fontFamily: displayFont,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: "#173e34",
  },
  metricLabel: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#6b7e71",
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: "#173e34",
    padding: 20,
    gap: 16,
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  livePill: {
    borderRadius: 99,
    backgroundColor: "#c8ff63",
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  liveText: {
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "900",
    color: "#173e34",
  },
  more: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
    marginRight: -10,
  },
  moreText: { color: "white", fontSize: 22, fontWeight: "900" },
  title: {
    fontFamily: displayFont,
    fontSize: 35,
    lineHeight: 39,
    letterSpacing: -1.3,
    fontWeight: "900",
    color: "white",
  },
  focus: { fontSize: 14, lineHeight: 21, color: "#c7d4ca" },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryStrong: { color: "#c8ff63", fontSize: 13, fontWeight: "900" },
  summaryText: { color: "#c7d4ca", fontSize: 13 },
  blockPreview: { gap: 11, paddingTop: 2 },
  blockRow: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  blockIndex: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: "#31594d",
    alignItems: "center",
    justifyContent: "center",
  },
  blockIndexText: { color: "#c8ff63", fontSize: 11, fontWeight: "900" },
  blockCopy: { flex: 1, gap: 2 },
  blockTitle: { color: "white", fontSize: 14, fontWeight: "800" },
  blockMeta: { color: "#9fb2a7", fontSize: 11, lineHeight: 16 },
  start: {
    minHeight: 62,
    borderRadius: 20,
    backgroundColor: "#c8ff63",
    paddingHorizontal: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startText: { color: "#173e34", fontSize: 18, fontWeight: "900" },
  startArrow: { color: "#173e34", fontSize: 25, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  planLink: {
    minHeight: 58,
    borderRadius: 19,
    paddingHorizontal: 17,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8dd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planLinkText: { fontSize: 15, fontWeight: "800", color: "#173e34" },
  planArrow: { fontSize: 28, color: "#527061" },
});
