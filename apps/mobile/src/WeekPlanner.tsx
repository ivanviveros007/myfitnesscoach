import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import {
  currentWeek,
  dayNames,
  makeWeeklyPlan,
  profileSchema,
  type TrainingProfile,
  type WeekInput,
  type WeeklyPlan,
  type Orientation,
  type FitnessGoal,
  type TrainingPreference,
} from "@myfitnesscoach/contracts";
import { Button } from "./AppButton";
function Choices<T extends string | number>({
  values,
  value,
  onChange,
}: {
  values: [T, string][];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.choices}>
      {values.map(([key, label]) => (
        <Pressable
          key={key}
          accessibilityRole="radio"
          accessibilityState={{ selected: key === value }}
          onPress={() => onChange(key)}
          style={[s.chip, key === value && s.selected]}
        >
          <Text style={[s.text, key === value && { color: "white" }]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function WeekPlanner({
  orientation,
  profile,
  previous,
  onSave,
  onCancel,
}: {
  orientation: Orientation;
  profile: TrainingProfile | null;
  previous: WeeklyPlan | null;
  onSave: (plan: WeeklyPlan) => void;
  onCancel: () => void;
}) {
  const [experience, setExperience] = useState<
    TrainingProfile["experience"] | null
  >(profile?.experience ?? null);
  const [equipment, setEquipment] = useState<
    TrainingProfile["equipment"] | null
  >(profile?.equipment ?? null);
  const [limitations, setLimitations] = useState<
    TrainingProfile["limitations"] | null
  >(profile?.limitations ?? null);
  const [notes, setNotes] = useState(profile?.notes ?? "");
  const [jumpReady, setJumpReady] = useState(profile?.jumpReady ?? false);
  const [trainingPreference, setTrainingPreference] =
    useState<TrainingPreference>(profile?.trainingPreference ?? "coach");
  const [goals, setGoals] = useState<FitnessGoal[]>(profile?.goals ?? []);
  const [goalNote, setGoalNote] = useState(profile?.goalNote ?? "");
  const [week, setWeek] = useState(previous?.input.week ?? currentWeek());
  const [days, setDays] = useState<number[]>(previous?.input.days ?? [0, 2, 4]);
  const [sportDays, setSportDays] = useState<number[]>(
    previous?.input.sportDays ?? [],
  );
  const [minutes, setMinutes] = useState<30 | 45 | 60>(
      previous?.input.minutes ?? 45,
    ),
    [readiness, setReadiness] = useState<WeekInput["readiness"]>(
      previous?.input.readiness ?? "normal",
    );
  const complete =
    experience &&
    equipment &&
    limitations &&
    goals.length > 0 &&
    days.length >= 2 &&
    days.length <= 4;
  function create() {
    if (!complete) return;
    try {
      const plan = makeWeeklyPlan(
        profileSchema.parse({
          experience,
          equipment,
          limitations,
          notes,
          jumpReady,
          trainingPreference,
          goals,
          goalNote,
          classicDaysPerWeek: days.length,
        }),
        { week, orientation, days, sportDays, minutes, readiness },
      );
      onSave(plan);
    } catch (e) {
      Alert.alert("No se pudo guardar la semana", (e as Error).message);
    }
  }
  return (
    <View style={s.container}>
      <Text style={s.title}>Configurá tu entrenador</Text>
      <Text style={s.body}>
        Elegí tus días disponibles y contanos qué querés mejorar. Organizaremos
        la semana completa alrededor de tus entrenamientos y partidos.
      </Text>
      <Text style={s.label}>¿Cómo querés entrenar?</Text>
      <Choices
        values={[
          ["coach", "El Coach decide por mí"],
          ["builder", "Quiero armar los bloques"],
          ["classic", "Rutina clásica de gimnasio"],
        ]}
        value={trainingPreference}
        onChange={setTrainingPreference}
      />
      <Text style={s.label}>¿Qué querés mejorar primero?</Text>
      <Text style={s.body}>
        Elegí hasta tres. El Coach usará esto como propósito de cada propuesta.
      </Text>
      <View style={s.choices}>
        {(
          [
            ["speed", "Velocidad"],
            ["power", "Potencia"],
            ["sport-performance", "Rendimiento deportivo"],
            ["strength", "Fuerza"],
            ["endurance", "Resistencia"],
            ["muscle-gain", "Ganar músculo"],
            ["mobility", "Movilidad"],
            ["general-fitness", "Estado físico general"],
          ] as [FitnessGoal, string][]
        ).map(([key, label]) => {
          const active = goals.includes(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              onPress={() =>
                setGoals((current) =>
                  active
                    ? current.filter((goal) => goal !== key)
                    : current.length < 3
                      ? [...current, key]
                      : current,
                )
              }
              style={[s.chip, active && s.selected]}
            >
              <Text style={[s.text, active && { color: "white" }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        multiline
        value={goalNote}
        onChangeText={setGoalNote}
        maxLength={300}
        placeholder="Ej.: quiero ser más rápido, potente y rematar más fuerte en pádel"
        style={s.input}
      />
      <Text style={s.label}>Experiencia con fuerza</Text>
      <Choices
        values={[
          ["new", "Estoy empezando / retomando"],
          ["regular", "Entreno regularmente"],
        ]}
        value={experience}
        onChange={setExperience}
      />
      <Text style={s.label}>Equipamiento disponible</Text>
      <Choices
        values={[
          ["bodyweight", "Peso corporal"],
          ["dumbbells", "Mancuernas y apoyo firme"],
          ["gym", "Gimnasio completo"],
        ]}
        value={equipment}
        onChange={setEquipment}
      />
      <Text style={s.label}>¿Hay dolor, lesión o una restricción actual?</Text>
      <Choices
        values={[
          ["none", "No"],
          ["review", "Sí, necesito adaptación"],
        ]}
        value={limitations}
        onChange={setLimitations}
      />
      {limitations === "review" && (
        <>
          <TextInput
            multiline
            value={notes}
            onChangeText={setNotes}
            maxLength={1000}
            placeholder="Qué restricción necesitás contemplar (opcional)"
            style={s.input}
          />
          <Text style={s.body}>
            Guardamos tu disponibilidad. La rutina requiere adaptación revisada;
            no vamos a deducir una rehabilitación de este texto.
          </Text>
        </>
      )}
      {experience === "regular" && limitations === "none" && (
        <>
          <Text style={s.label}>
            Potencia: ¿ya practicás saltos y dominás las recepciones sin
            molestias?
          </Text>
          <Choices
            values={[
              ["no", "Todavía no"],
              ["yes", "Sí"],
            ]}
            value={jumpReady ? "yes" : "no"}
            onChange={(v) => setJumpReady(v === "yes")}
          />
        </>
      )}
      <Text style={s.label}>
        Semana que comienza el {week.split("-").reverse().join("/")}
      </Text>
      <Choices
        values={[
          [currentWeek(), "Esta semana"],
          [currentWeek(new Date(Date.now() + 7 * 86400000)), "Próxima semana"],
        ]}
        value={week}
        onChange={setWeek}
      />
      <Text style={s.label}>¿Qué días querés entrenar?</Text>
      <Text style={s.body}>
        Elegí entre 2 y 4 días. Podés volver a ajustar la semana cuando cambien
        tus horarios.
      </Text>
      <View style={s.dayGrid}>
        {dayNames.map((name, i) => {
          const active = days.includes(i);
          const sport = sportDays.includes(i);
          return (
            <Pressable
              key={`training-${name}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              onPress={() =>
                setDays((current) =>
                  active
                    ? current.filter((day) => day !== i)
                    : current.length < 4
                      ? [...current, i].sort((a, b) => a - b)
                      : current,
                )
              }
              style={[s.day, active && s.daySelected]}
            >
              <Text style={[s.dayName, active && s.dayNameSelected]}>
                {name.slice(0, 3)}
              </Text>
              <Text style={[s.dayState, active && s.dayStateSelected]}>
                {active ? "ENTRENO" : sport ? "ACTIVIDAD" : "LIBRE"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {days.length < 2 && (
        <Text style={s.warning}>Elegí al menos 2 días de entrenamiento.</Text>
      )}
      <Text style={s.label}>Tiempo por sesión</Text>
      <Choices
        values={[
          [30, "30 min"],
          [45, "45 min"],
          [60, "60 min"],
        ]}
        value={minutes}
        onChange={setMinutes}
      />
      <Text style={s.label}>
        ¿Qué días jugás, competís o hacés otro entrenamiento intenso?
      </Text>
      <Text style={s.body}>
        Podés dejarlo vacío si esta semana no tenés actividad deportiva.
      </Text>
      <View style={s.choices}>
        {dayNames.map((name, i) => (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: sportDays.includes(i) }}
            key={name}
            style={[s.chip, sportDays.includes(i) && s.selected]}
            onPress={() =>
              setSportDays((d) =>
                d.includes(i) ? d.filter((x) => x !== i) : [...d, i],
              )
            }
          >
            <Text style={[s.text, sportDays.includes(i) && { color: "white" }]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>¿Cómo llegás a esta semana?</Text>
      <Choices
        values={[
          ["normal", "Recuperado"],
          ["tired", "Con fatiga / poco descanso"],
        ]}
        value={readiness}
        onChange={setReadiness}
      />
      <Button
        title="Guardar planificación semanal"
        disabled={!complete}
        onPress={create}
      />
      <Button
        secondary
        title="Volver sin cambiar la semana"
        onPress={onCancel}
      />
    </View>
  );
}

export function WeeklyPlanCard({
  plan,
  saved,
  onEdit,
  onView,
}: {
  plan: WeeklyPlan | null;
  saved: boolean;
  onEdit: () => void;
  onView: () => void;
}) {
  const trainingDays = plan?.input.days ?? [];
  const sportDays = plan?.input.sportDays ?? [];
  return (
    <View style={s.weekCard}>
      <View style={s.weekCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.weekKicker}>TU SEMANA</Text>
          <Text style={s.weekTitle}>
            {saved ? "Entrenamientos planificados" : "Planificá tu semana"}
          </Text>
        </View>
        {!!trainingDays.length && (
          <View style={s.weekCount}>
            <Text style={s.weekCountNumber}>{trainingDays.length}</Text>
            <Text style={s.weekCountLabel}>DÍAS</Text>
          </View>
        )}
      </View>
      <Text style={s.body}>
        {saved
          ? "Revisá cada sesión, tus días de actividad y la distribución de carga."
          : "Elegí cuándo entrenar y cuándo jugás. El Coach distribuirá fuerza, potencia, cardio y recuperación."}
      </Text>
      {!!trainingDays.length && (
        <View style={s.weekDays}>
          {dayNames.map((name, index) => {
            const training = trainingDays.includes(index);
            const sport = sportDays.includes(index);
            return (
              <View
                key={`summary-${name}`}
                style={[
                  s.weekDay,
                  training && s.weekDayTraining,
                  sport && !training && s.weekDaySport,
                ]}
              >
                <Text
                  style={[s.weekDayText, training && s.weekDayTextTraining]}
                >
                  {name.slice(0, 1)}
                </Text>
                {(training || sport) && <View style={s.weekDayDot} />}
              </View>
            );
          })}
        </View>
      )}
      <View style={s.weekActions}>
        <Pressable style={s.weekPrimary} onPress={onEdit}>
          <Text style={s.weekPrimaryText}>
            {saved ? "Ajustar semana" : "Planificar semana"}
          </Text>
        </Pressable>
        {plan && (
          <Pressable style={s.weekSecondary} onPress={onView}>
            <Text style={s.weekSecondaryText}>Ver plan →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container: { gap: 18 },
  title: { fontSize: 28, fontWeight: "700", color: "#173e34" },
  label: { fontSize: 17, fontWeight: "700", color: "#173e34", marginTop: 8 },
  body: { fontSize: 15, lineHeight: 23, color: "#43594b" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  day: {
    width: "22%",
    minWidth: 70,
    minHeight: 70,
    padding: 10,
    borderRadius: 18,
    backgroundColor: "#e8ede5",
    justifyContent: "space-between",
  },
  daySelected: { backgroundColor: "#214d3e" },
  dayName: { color: "#214d3e", fontSize: 17, fontWeight: "800" },
  dayNameSelected: { color: "#c8ff63" },
  dayState: { color: "#738379", fontSize: 9, fontWeight: "800" },
  dayStateSelected: { color: "white" },
  warning: { color: "#9a542e", fontSize: 13, fontWeight: "700" },
  weekCard: {
    padding: 20,
    borderRadius: 26,
    backgroundColor: "#f9faf7",
    gap: 14,
    borderWidth: 1,
    borderColor: "#e1e8de",
  },
  weekCardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  weekKicker: {
    color: "#789083",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  weekTitle: { color: "#173e34", fontSize: 23, fontWeight: "900" },
  weekCount: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  weekCountNumber: { color: "#173e34", fontSize: 23, fontWeight: "900" },
  weekCountLabel: { color: "#173e34", fontSize: 8, fontWeight: "900" },
  weekDays: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: {
    width: 37,
    height: 45,
    borderRadius: 16,
    backgroundColor: "#e8ede5",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  weekDayTraining: { backgroundColor: "#214d3e" },
  weekDaySport: { borderWidth: 2, borderColor: "#9abe66" },
  weekDayText: { color: "#738379", fontSize: 13, fontWeight: "800" },
  weekDayTextTraining: { color: "white" },
  weekDayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#c8ff63",
  },
  weekActions: { flexDirection: "row", gap: 10 },
  weekPrimary: {
    minHeight: 48,
    paddingHorizontal: 17,
    borderRadius: 16,
    backgroundColor: "#214d3e",
    alignItems: "center",
    justifyContent: "center",
  },
  weekPrimaryText: { color: "#c8ff63", fontSize: 14, fontWeight: "900" },
  weekSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#e8ede5",
    alignItems: "center",
    justifyContent: "center",
  },
  weekSecondaryText: { color: "#173e34", fontSize: 14, fontWeight: "800" },
  chip: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#e8ede5",
    justifyContent: "center",
  },
  selected: { backgroundColor: "#214d3e" },
  text: { fontSize: 15, color: "#214d3e" },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#cbd9cb",
    padding: 14,
    borderRadius: 14,
  },
});
