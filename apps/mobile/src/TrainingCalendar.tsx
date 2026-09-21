import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  dayNames,
  routineBlocks,
  type PhysicalActivity,
  type Routine,
  type Session,
  type WeeklyPlan,
} from "@myfitnesscoach/contracts";

const activityLabels: Record<PhysicalActivity["type"], string> = {
  workout: "Entrenamiento",
  padel: "Pádel",
  football: "Fútbol",
  tennis: "Tenis",
  running: "Running",
  cycling: "Ciclismo",
  swimming: "Natación",
  walking: "Caminata",
  other: "Actividad",
};
const focusLabels: Record<string, string> = {
  power: "Potencia",
  endurance: "Resistencia",
  strength: "Fuerza",
  mobility: "Movilidad",
  recovery: "Recuperación",
  conditioning: "Cardio",
  technique: "Técnica",
  warmup: "Warm up",
  transfer: "Transferencia",
  stability: "Estabilidad",
  "full-body": "Full body",
  hypertrophy: "Musculación",
  upper: "Upper body",
  legs: "Piernas",
  midline: "Midline",
  sport: "Deporte",
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function weekDates(week: string) {
  const [year, month, day] = week.split("-").map(Number);
  const start = new Date(year!, month! - 1, day!);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}
function routineTags(routine: Routine) {
  return [
    ...new Set(
      routineBlocks(routine)
        .slice(1)
        .map((block) => block.goal)
        .filter((goal): goal is NonNullable<typeof goal> => !!goal),
    ),
  ]
    .map((goal) => focusLabels[goal] ?? goal)
    .slice(0, 4);
}
function activityTags(activity: PhysicalActivity) {
  const tags = activity.focuses.map((focus) => focusLabels[focus] ?? focus);
  if (tags.length) return tags;
  if (["padel", "tennis", "football"].includes(activity.type))
    return ["Partido", "Resistencia"];
  return [activity.intensity === "high" ? "Carga alta" : "Actividad"];
}
function loadInsight(activities: PhysicalActivity[], sessions: Session[]) {
  const high = activities.filter((activity) => activity.intensity === "high");
  const racket = activities.filter((activity) =>
    ["padel", "tennis"].includes(activity.type),
  );
  const legHeavy = activities.filter(
    (activity) =>
      ["padel", "tennis", "football", "running", "cycling"].includes(
        activity.type,
      ) ||
      activity.focuses.some((focus) =>
        ["power", "endurance", "conditioning"].includes(focus),
      ),
  );
  const strengthSessions = sessions.filter(
    (session) =>
      routineBlocks(session.routine).some(
        (block) => block.goal === "strength",
      ) && !session.cancelledAt,
  );
  if (racket.length >= 4)
    return {
      level: "attention" as const,
      title: "Carga alta de partidos",
      text: `Tenés ${racket.length} partidos esta semana. Hombros y piernas acumulan trabajo; conviene priorizar movilidad, estabilidad y una sesión liviana entre partidos.`,
    };
  if (legHeavy.length >= 4)
    return {
      level: "attention" as const,
      title: "Revisemos la carga de piernas",
      text: "Hay varios estímulos de carrera, cambios de dirección o potencia. Evitá sumar otra sesión intensa seguida y reservá un espacio de recuperación.",
    };
  if (high.length >= 3 || strengthSessions.length >= 3)
    return {
      level: "attention" as const,
      title: "Semana exigente",
      text: "Concentraste varios estímulos intensos. El Coach puede reemplazar una sesión por movilidad, cardio suave o recuperación.",
    };
  return {
    level: "balanced" as const,
    title: "Semana equilibrada",
    text: "Todavía hay margen para distribuir fuerza, potencia, resistencia y movilidad sin concentrar toda la carga en los mismos días.",
  };
}

export function TrainingCalendar({
  plan,
  activities,
  sessions,
  onAdd,
  onEditPlan,
  onViewPlan,
  onStart,
  onEditActivity,
  aiInsight,
}: {
  plan: WeeklyPlan | null;
  activities: PhysicalActivity[];
  sessions: Session[];
  onAdd: (date: string) => void;
  onEditPlan: () => void;
  onViewPlan: () => void;
  onStart: (routine: Routine) => void;
  onEditActivity: (activity: PhysicalActivity) => void;
  aiInsight?: string;
}) {
  const week =
    plan?.input.week ??
    (() => {
      const today = new Date();
      today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      return dateKey(today);
    })();
  const dates = weekDates(week);
  const startKey = dateKey(dates[0]!);
  const endKey = dateKey(dates[6]!);
  const weekActivities = activities.filter((activity) => {
    const key = dateKey(new Date(activity.occurredAt));
    return key >= startKey && key <= endKey;
  });
  const weekSessions = sessions.filter((session) => {
    const key = dateKey(new Date(session.finishedAt ?? session.startedAt));
    return key >= startKey && key <= endKey;
  });
  const insight = loadInsight(weekActivities, weekSessions);

  return (
    <View style={s.container}>
      <View style={s.heading}>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>TU AGENDA DE ENTRENAMIENTO</Text>
          <Text style={s.title}>Planificá sin límites</Text>
          <Text style={s.body}>
            Sumá entrenamientos, partidos y recuperación. Podés tener varias
            actividades el mismo día.
          </Text>
        </View>
        <Pressable onPress={onEditPlan} style={s.editButton}>
          <Text style={s.editButtonText}>Editar</Text>
        </Pressable>
      </View>

      <View
        style={[
          s.coachCard,
          insight.level === "attention" && s.coachCardAttention,
        ]}
      >
        <Text style={s.coachLabel}>✦ COACH IA · ANÁLISIS SEMANAL</Text>
        <Text style={s.coachTitle}>{insight.title}</Text>
        <Text style={s.coachText}>{aiInsight?.trim() || insight.text}</Text>
      </View>

      <View style={s.weekStrip}>
        {dates.map((date, index) => {
          const key = dateKey(date);
          const count =
            weekActivities.filter(
              (activity) => dateKey(new Date(activity.occurredAt)) === key,
            ).length +
            (plan?.routines.filter((routine) => routine.scheduledDay === index)
              .length ?? 0);
          const today = key === dateKey(new Date());
          return (
            <View key={key} style={s.stripDay}>
              <Text style={[s.stripName, today && s.stripNameToday]}>
                {dayNames[index]!.slice(0, 1)}
              </Text>
              <View style={[s.stripDate, today && s.stripDateToday]}>
                <Text style={[s.stripNumber, today && s.stripNumberToday]}>
                  {date.getDate()}
                </Text>
              </View>
              <Text style={s.stripCount}>{count ? `${count}` : "·"}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.agenda}>
        {dates.map((date, index) => {
          const key = dateKey(date);
          const dayActivities = weekActivities.filter(
            (activity) => dateKey(new Date(activity.occurredAt)) === key,
          );
          const routines =
            plan?.routines.filter(
              (routine) => routine.scheduledDay === index,
            ) ?? [];
          return (
            <View key={`agenda-${key}`} style={s.dayRow}>
              <View style={s.dayLabel}>
                <Text style={s.dayLabelName}>
                  {dayNames[index]!.slice(0, 3)}
                </Text>
                <Text style={s.dayLabelNumber}>{date.getDate()}</Text>
              </View>
              <View style={s.dayEvents}>
                {routines.map((routine) => (
                  <Pressable
                    key={routine.id}
                    onPress={() => onStart(routine)}
                    style={s.workoutEvent}
                  >
                    <Text style={s.eventState}>ENTRENAMIENTO PROPUESTO</Text>
                    <Text style={s.eventTitle}>{routine.name}</Text>
                    <View style={s.tags}>
                      {routineTags(routine).map((tag) => (
                        <Text key={tag} style={s.tag}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                  </Pressable>
                ))}
                {dayActivities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    onPress={() => onEditActivity(activity)}
                    style={s.activityEvent}
                  >
                    <View style={s.eventTop}>
                      <Text style={s.eventState}>
                        {activity.status === "planned"
                          ? "PLANIFICADO"
                          : "REALIZADO"}
                      </Text>
                      <Text style={s.duration}>
                        {activity.durationMinutes} min
                      </Text>
                    </View>
                    <Text style={s.activityTitle}>
                      {activity.name || activityLabels[activity.type]}
                    </Text>
                    <View style={s.tags}>
                      {activityTags(activity).map((tag) => (
                        <Text key={tag} style={s.activityTag}>
                          {tag}
                        </Text>
                      ))}
                    </View>
                    <Text style={s.editHint}>Tocar para editar</Text>
                  </Pressable>
                ))}
                {!routines.length && !dayActivities.length && (
                  <Text style={s.empty}>Sin actividades planificadas</Text>
                )}
                <Pressable onPress={() => onAdd(key)} style={s.addButton}>
                  <Text style={s.addText}>＋ Agregar al día</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
      {plan && (
        <Pressable onPress={onViewPlan} style={s.planButton}>
          <Text style={s.planButtonText}>
            Previsualizar sesiones y bloques →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const displayFont = Platform.select({
  ios: "Avenir Next Condensed",
  android: "sans-serif-condensed",
});
const s = StyleSheet.create({
  container: { gap: 16 },
  heading: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  kicker: {
    color: "#789083",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: displayFont,
    color: "#173e34",
    fontSize: 34,
    fontWeight: "900",
  },
  body: { color: "#546b5e", fontSize: 14, lineHeight: 20 },
  editButton: {
    backgroundColor: "#e8ede5",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  editButtonText: { color: "#173e34", fontWeight: "800" },
  coachCard: {
    borderRadius: 24,
    padding: 18,
    gap: 6,
    backgroundColor: "#173e34",
  },
  coachCardAttention: { backgroundColor: "#553d24" },
  coachLabel: {
    color: "#c8ff63",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  coachTitle: { color: "white", fontSize: 21, fontWeight: "900" },
  coachText: { color: "#dfe9e2", fontSize: 14, lineHeight: 21 },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 22,
    padding: 12,
  },
  stripDay: { alignItems: "center", gap: 4 },
  stripName: { color: "#8a978f", fontSize: 11, fontWeight: "800" },
  stripNameToday: { color: "#173e34" },
  stripDate: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  stripDateToday: { backgroundColor: "#c8ff63" },
  stripNumber: { color: "#66766c", fontWeight: "800" },
  stripNumberToday: { color: "#173e34" },
  stripCount: { color: "#83b437", fontSize: 10, fontWeight: "900" },
  agenda: { borderRadius: 26, backgroundColor: "white", padding: 14, gap: 4 },
  dayRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#edf1eb",
    paddingVertical: 12,
    gap: 12,
  },
  dayLabel: { width: 42, alignItems: "center" },
  dayLabelName: {
    color: "#7b8d82",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dayLabelNumber: { color: "#173e34", fontSize: 22, fontWeight: "900" },
  dayEvents: { flex: 1, gap: 8 },
  workoutEvent: {
    borderRadius: 18,
    backgroundColor: "#173e34",
    padding: 13,
    gap: 5,
  },
  activityEvent: {
    borderRadius: 18,
    backgroundColor: "#edf2e8",
    padding: 13,
    gap: 5,
  },
  eventTop: { flexDirection: "row", justifyContent: "space-between" },
  eventState: {
    color: "#9fb0a5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  eventTitle: { color: "white", fontSize: 16, fontWeight: "900" },
  activityTitle: { color: "#173e34", fontSize: 16, fontWeight: "900" },
  duration: { color: "#728278", fontSize: 11, fontWeight: "800" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: "#173e34",
    backgroundColor: "#c8ff63",
    fontSize: 10,
    fontWeight: "800",
  },
  activityTag: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: "#365247",
    backgroundColor: "white",
    fontSize: 10,
    fontWeight: "800",
  },
  editHint: { color: "#728278", fontSize: 10, fontWeight: "700" },
  empty: { color: "#98a59d", fontSize: 13, paddingVertical: 4 },
  addButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c9d4ca",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#456456", fontSize: 12, fontWeight: "800" },
  planButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  planButtonText: { color: "#173e34", fontSize: 14, fontWeight: "900" },
});
