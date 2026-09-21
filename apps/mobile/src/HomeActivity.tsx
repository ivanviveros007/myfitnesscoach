import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { PhysicalActivity, Session } from "@myfitnesscoach/contracts";

const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function elapsedLabel(session: Session) {
  const end = session.pausedAt
    ? new Date(session.pausedAt).getTime()
    : Date.now();
  const seconds = Math.max(
    0,
    Math.floor((end - new Date(session.startedAt).getTime()) / 1000),
  );
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ActiveWorkoutCard({
  session,
  onResume,
}: {
  session: Session;
  onResume: () => void;
}) {
  const [, refresh] = useState(0);
  useEffect(() => {
    if (session.pausedAt) return;
    const timer = setInterval(() => refresh((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [session.pausedAt]);
  const completed = session.items.filter(
    (item) => item.status === "completed",
  ).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Retomar ${session.routine.name}`}
      onPress={onResume}
      style={({ pressed }) => [s.activeWorkout, pressed && s.activePressed]}
    >
      <View style={s.activeTop}>
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>
            {session.pausedAt ? "PAUSADO" : "EN CURSO"}
          </Text>
        </View>
        <Text style={s.activeClock}>{elapsedLabel(session)}</Text>
      </View>
      <Text style={s.activeTitle}>{session.routine.name}</Text>
      <View style={s.activeBottom}>
        <Text style={s.activeProgress}>
          {completed} de {session.items.length} ejercicios
        </Text>
        <Text style={s.activeAction}>Retomar →</Text>
      </View>
    </Pressable>
  );
}

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekStart(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function completedDays(sessions: Session[], activities: PhysicalActivity[]) {
  return new Set([
    ...activities
      .filter((activity) => activity.status === "completed")
      .map((activity) => localKey(new Date(activity.occurredAt))),
    ...sessions
      .filter((session) => session.finishedAt && !session.cancelledAt)
      .map((session) => localKey(new Date(session.finishedAt!))),
  ]);
}

function weeklyStreak(sessions: Session[], activities: PhysicalActivity[]) {
  const activeWeeks = new Set([
    ...sessions
      .filter((session) => session.finishedAt && !session.cancelledAt)
      .map((session) => localKey(weekStart(new Date(session.finishedAt!)))),
    ...activities
      .filter((activity) => activity.status === "completed")
      .map((activity) => localKey(weekStart(new Date(activity.occurredAt)))),
  ]);
  let cursor = weekStart();
  if (!activeWeeks.has(localKey(cursor))) cursor.setDate(cursor.getDate() - 7);
  let streak = 0;
  while (activeWeeks.has(localKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function CurrentWeek({
  sessions,
  activities = [],
}: {
  sessions: Session[];
  activities?: PhysicalActivity[];
}) {
  const today = new Date();
  const start = weekStart(today);
  const activeDays = completedDays(sessions, activities);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const month = today.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  return (
    <View style={s.calendar}>
      <Text style={s.month}>
        {month.charAt(0).toUpperCase() + month.slice(1)}
      </Text>
      <View style={s.days}>
        {days.map((date, index) => {
          const isToday = localKey(date) === localKey(today);
          const isActive = activeDays.has(localKey(date));
          return (
            <View key={localKey(date)} style={s.day}>
              <Text style={[s.dayName, isToday && s.dayNameToday]}>
                {dayLabels[index]}
              </Text>
              <View style={[s.dateCircle, isToday && s.dateCircleToday]}>
                <Text style={[s.dateNumber, isToday && s.dateNumberToday]}>
                  {date.getDate()}
                </Text>
              </View>
              <View style={[s.activityDot, isActive && s.activityDotActive]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ActivityTracker({
  sessions,
  activities = [],
  onAddActivity,
  onOptions,
}: {
  sessions: Session[];
  activities?: PhysicalActivity[];
  onAddActivity: () => void;
  onOptions: () => void;
}) {
  const activeDays = completedDays(sessions, activities);
  const start = weekStart();
  const thisWeek = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return activeDays.has(localKey(date));
  });
  const count = thisWeek.filter(Boolean).length;
  const streak = weeklyStreak(sessions, activities);
  return (
    <View style={s.tracker}>
      <View style={s.trackerTop}>
        <View style={s.trackerHeading}>
          <Text style={s.kicker}>TU CONSTANCIA</Text>
          <Text style={s.trackerTitle}>
            {count
              ? `${count} ${count === 1 ? "día activo" : "días activos"}`
              : "Tu semana empieza hoy"}
          </Text>
        </View>
        {streak > 0 && (
          <View style={s.streakBadge}>
            <Text style={s.streakText}>
              ● {streak} {streak === 1 ? "semana" : "semanas"}
            </Text>
          </View>
        )}
      </View>
      <View style={s.progressDays}>
        {thisWeek.map((complete, index) => (
          <View key={dayLabels[index]} style={s.progressDay}>
            <View style={[s.progressDot, complete && s.progressDotComplete]}>
              <Text style={s.check}>{complete ? "✓" : ""}</Text>
            </View>
            <Text style={s.progressLabel}>{dayLabels[index][0]}</Text>
          </View>
        ))}
      </View>
      <View style={s.trackerFooter}>
        <Pressable
          accessibilityRole="button"
          onPress={onAddActivity}
          style={s.addActivity}
        >
          <Text style={s.addActivityText}>＋ Registrar actividad</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onOptions}
          style={s.options}
        >
          <Text style={s.optionsText}>Opciones</Text>
        </Pressable>
      </View>
    </View>
  );
}

const displayFont = Platform.select({
  ios: "Avenir Next Condensed",
  android: "sans-serif-condensed",
});
const s = StyleSheet.create({
  activeWorkout: {
    borderRadius: 24,
    padding: 18,
    gap: 10,
    backgroundColor: "#173e34",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  activePressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  activeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveBadge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#263f37",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#c8ff63" },
  liveText: {
    color: "#c8ff63",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  activeClock: { color: "white", fontSize: 22, fontWeight: "900" },
  activeTitle: {
    color: "white",
    fontFamily: Platform.select({
      ios: "Avenir Next Condensed",
      android: "sans-serif-condensed",
    }),
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900",
  },
  activeBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activeProgress: { color: "#b8c7bd", fontSize: 11 },
  activeAction: { color: "#c8ff63", fontSize: 12, fontWeight: "900" },
  calendar: {
    backgroundColor: "white",
    borderRadius: 26,
    padding: 18,
    gap: 14,
  },
  month: { fontSize: 17, fontWeight: "800", color: "#173e34" },
  days: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 5, minWidth: 34 },
  dayName: { fontSize: 11, color: "#9a9f9b", fontWeight: "600" },
  dayNameToday: { color: "#173e34", fontWeight: "800" },
  dateCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleToday: {
    backgroundColor: "#c8ff63",
    borderWidth: 1,
    borderColor: "#9dbf65",
  },
  dateNumber: { fontSize: 17, fontWeight: "700", color: "#a4a9a5" },
  dateNumberToday: { color: "#173e34", fontWeight: "900" },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "transparent",
  },
  activityDotActive: { backgroundColor: "#9cff00" },
  tracker: { backgroundColor: "white", borderRadius: 26, padding: 18, gap: 18 },
  trackerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  trackerHeading: { flex: 1, minWidth: 0 },
  kicker: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#748179",
  },
  trackerTitle: {
    fontFamily: displayFont,
    fontSize: 26,
    lineHeight: 29,
    fontWeight: "900",
    color: "#173e34",
    marginTop: 3,
  },
  streakBadge: {
    flexShrink: 0,
    backgroundColor: "#edf1ea",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  streakText: { fontSize: 11, fontWeight: "800", color: "#3c5147" },
  progressDays: { flexDirection: "row", justifyContent: "space-between" },
  progressDay: { alignItems: "center", gap: 6 },
  progressDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#dfe5dc",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotComplete: { backgroundColor: "#9cff00", borderColor: "#9cff00" },
  check: { fontSize: 16, fontWeight: "900", color: "#173e34" },
  progressLabel: { fontSize: 11, color: "#879087", fontWeight: "700" },
  trackerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  addActivity: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#173e34",
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  addActivityText: { fontSize: 12, fontWeight: "900", color: "#c8ff63" },
  options: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#eef2eb",
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsText: { fontSize: 12, fontWeight: "900", color: "#173e34" },
});
