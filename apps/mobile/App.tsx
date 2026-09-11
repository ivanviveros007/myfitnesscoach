import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Alert,
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { WebView } from "react-native-webview";
import * as Crypto from "expo-crypto";
import { StatusBar } from "expo-status-bar";
import { BottomSheet } from "@expo/ui";
import { Button } from "./src/AppButton";
import { WeekPlanner } from "./src/WeekPlanner";
import { PlanOverview } from "./src/PlanOverview";
import { Performance } from "./src/Performance";
import { Library } from "./src/Library";
import { AmrapPanel } from "./src/AmrapPanel";
import { FloatingTabs, type AppTab } from "./src/FloatingTabs";
import { TrainingCarousel } from "./src/TrainingCarousel";
import {
  exercises,
  orientations,
  template,
  exerciseStatus,
  currentWeek,
  makeWeeklyPlan,
  blocks,
  amrapTemplate,
  type TrainingProfile,
  type WeeklyPlan,
  type Routine,
  type Orientation,
  type Session,
  type Exercise,
} from "@myfitnesscoach/contracts";
import * as storage from "./src/storage";
import * as api from "./src/api";
import { ExerciseDiagram } from "./src/ExerciseDiagram";
const labels = {
  pending: "Pendiente",
  partial: "Parcial",
  completed: "Completado",
  skipped: "Omitido",
};
const replacementGroups = {
  warmup: ["leg-swing", "shuffle", "calf-stretch", "child"],
  power: ["jump", "shuffle", "squat"],
  transfer: ["shuffle", "jump", "leg-swing"],
  strength: [
    "squat",
    "goblet",
    "rdl",
    "bridge",
    "incline-push",
    "machine-row",
    "dumbbell-row",
  ],
  stability: ["bird-dog", "bridge", "squat"],
  flexibility: ["child", "calf-stretch", "leg-swing"],
};
function availableReplacements(
  current: Exercise,
  block: keyof typeof replacementGroups | undefined,
  equipment: TrainingProfile["equipment"] = "gym",
) {
  const ids = block
    ? replacementGroups[block]
    : exercises.map((exercise) => exercise.id);
  return ids
    .map((id) => exercises.find((exercise) => exercise.id === id))
    .filter(
      (exercise): exercise is Exercise =>
        !!exercise && exercise.id !== current.id,
    )
    .filter(
      (exercise) => equipment === "gym" || !/máquina/i.test(exercise.equipment),
    )
    .filter(
      (exercise) =>
        equipment !== "bodyweight" ||
        !/mancuerna|kettlebell/i.test(exercise.equipment),
    )
    .slice(0, 5);
}
function currentTrainingStreak(sessions: Session[]) {
  const days = [
    ...new Set(
      sessions
        .filter((session) => session.finishedAt)
        .map((session) => session.finishedAt!.slice(0, 10)),
    ),
  ]
    .sort()
    .reverse();
  if (!days.length) return 0;
  const cursor = new Date(`${days[0]}T12:00:00`);
  let streak = 0;
  for (const day of days) {
    if (day !== cursor.toISOString().slice(0, 10)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
function Main() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [account, setAccount] = useState<api.Account | null>(null),
    [ready, setReady] = useState(false),
    [orientation, setOrientation] = useState<Orientation>("padel");
  const [tab, setTab] = useState<AppTab>("today"),
    [session, setSession] = useState<Session | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Exercise | null>(null),
    [video, setVideo] = useState(false),
    [expandedExercise, setExpandedExercise] = useState<string | null>(null),
    [online, setOnline] = useState(true),
    [notice, setNotice] = useState("Guardado en este dispositivo");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [url, setUrl] = useState(process.env.EXPO_PUBLIC_API_URL ?? ""),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [library, setLibrary] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [todayMenu, setTodayMenu] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapWithoutEquipment, setSwapWithoutEquipment] = useState(false);
  const [planWeek, setPlanWeek] = useState(currentWeek());
  const scrollRef = useRef<ScrollView>(null);
  function goBack() {
    if (detail) {
      setDetail(null);
      setVideo(false);
    } else if (library) {
      setLibrary(false);
    } else if (planning) {
      setPlanning(false);
    } else if (tab !== "today") {
      setTab("today");
    } else if (session) {
      setSession(null);
    } else return false;
    return true;
  }
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => sub.remove();
  }, [detail, tab, session, planning, library]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab, session?.id, planning]);
  const owner = account?.userId ?? "guest";
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const rows = ready ? storage.history(owner) : [];
  const count = ready
    ? storage.pending(owner).length + storage.pendingData(owner).length
    : 0;
  const favoriteMovements = ready ? storage.favorites(owner, "movement") : [];
  const favoriteBlocks = ready ? storage.favorites(owner, "block") : [];
  const profile = ready
    ? storage.readSetting<TrainingProfile>(owner, "profile")
    : null;
  const plan = ready
    ? storage.readSetting<WeeklyPlan>(owner, `plan:${orientation}:${planWeek}`)
    : null;
  const effectivePlan =
    plan ??
    (profile && orientation !== "free"
      ? makeWeeklyPlan(profile, {
          week: currentWeek(),
          orientation,
          days: [0, 2, 4, 6],
          sportDays: [],
          minutes: 45,
          readiness: "normal",
        })
      : null);
  const finishedForSport = rows.filter(
    (row) =>
      row.session.finishedAt && row.session.routine.orientation === orientation,
  );
  const baseRoutine = effectivePlan?.routines.length
    ? effectivePlan.routines[
        finishedForSport.length % effectivePlan.routines.length
      ]
    : null;
  const todayRoutine = baseRoutine
    ? {
        ...baseRoutine,
        id: `today-${orientation}-${planWeek}-${finishedForSport.length}`,
        name: `Hoy · ${baseRoutine.name.replace(/^.*? · /, "")}`,
        scheduledDay: undefined,
      }
    : null;
  const weekStart = new Date(`${currentWeek()}T00:00:00`).getTime();
  const sessionsThisWeek = rows.filter(
    (row) =>
      row.session.finishedAt &&
      new Date(row.session.startedAt).getTime() >= weekStart,
  ).length;
  const trainingChoices =
    todayRoutine && effectivePlan && profile
      ? [
          {
            key: "recommended",
            title: "Sesión recomendada",
            tag: "PARA HOY",
            icon: "sparkles" as const,
            routine: todayRoutine,
            color: "#173e34",
            image: "padel" as const,
          },
          {
            key: "strength",
            title: "Fuerza total",
            tag: "FUERZA · CONTROL",
            icon: "dumbbell.fill" as const,
            routine:
              effectivePlan.routines.find((candidate) =>
                candidate.name.includes("Fuerza"),
              ) ?? todayRoutine,
            color: "#ef6d4f",
            image: "strength" as const,
          },
          {
            key: "mobility",
            title: "Mover y recuperar",
            tag: "MOVILIDAD",
            icon: "figure.flexibility" as const,
            routine:
              effectivePlan.routines[effectivePlan.routines.length - 1] ??
              todayRoutine,
            color: "#397e88",
            image: "mobility" as const,
          },
          {
            key: "amrap",
            title: "AMRAP corto",
            tag: "12 MIN · A TU RITMO",
            icon: "timer" as const,
            routine: amrapTemplate(orientation, 12, profile.equipment),
            color: "#7657a8",
            image: "amrap" as const,
          },
        ]
      : [];
  function savePlan(next: WeeklyPlan) {
    const key = `plan:${next.input.orientation}:${next.input.week}`;
    const old = storage.readSetting<WeeklyPlan>(owner, key);
    storage.writeSettings(owner, [
      ...(old ? [{ key: `${key}:revision:${Date.now()}`, value: old }] : []),
      { key: "profile", value: next.profile },
      { key, value: next },
    ]);
    setPlanWeek(next.input.week);
    setPlanning(false);
    setTick((t) => t + 1);
  }
  useEffect(() => {
    api
      .restore()
      .then((a) => {
        setAccount(a);
        if (a) setUrl(a.url);
        setReady(true);
      })
      .catch(() => {
        setNotice(
          "No se pudo recuperar el acceso. Podés iniciar sesión nuevamente.",
        );
        setReady(true);
      });
    const unsub = NetInfo.addEventListener((s) =>
      setOnline(s.isConnected !== false && s.isInternetReachable !== false),
    );
    return unsub;
  }, []);
  async function synchronize() {
    if (!account || !online) return;
    const syncOwner = account.userId;
    try {
      await api.sync(account);
      if (ownerRef.current === syncOwner) {
        setNotice("Entrenamientos sincronizados");
        setSession((current) =>
          current
            ? (storage
                .history(syncOwner)
                .find((r) => r.session.id === current.id)?.session ?? current)
            : null,
        );
        setTick((t) => t + 1);
      }
    } catch (e) {
      const error = e as Error & { status?: number; sessionId?: string };
      if (ownerRef.current !== syncOwner) return;
      setNotice(
        error.status === 409
          ? "Hay una sesión con cambios en otro dispositivo"
          : error.status === 401
            ? "Iniciá sesión nuevamente para sincronizar"
            : "Servidor no disponible. Tus cambios están guardados.",
      );
      if (error.status === 409 && error.sessionId)
        Alert.alert(
          "Conservar ambos registros",
          "Guardaremos tu versión como una copia y recuperaremos la del servidor.",
          [
            { text: "Más tarde", style: "cancel" },
            {
              text: "Conservar ambos",
              onPress: () => {
                storage.preserveConflict(syncOwner, error.sessionId!);
                setSession(null);
                setTick((t) => t + 1);
              },
            },
          ],
        );
    }
  }
  useEffect(() => {
    if (!ready) return;
    void synchronize();
    const timer = setInterval(() => void synchronize(), 20000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void synchronize();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [account, online, ready]);
  function persist(next: Session) {
    try {
      storage.save(owner, next);
      setSession(next);
      setTick((t) => t + 1);
      setNotice("Cambios guardados en el dispositivo");
    } catch {
      Alert.alert(
        "No se pudo guardar",
        "Tu cambio no quedó guardado. Revisá el espacio disponible e intentá de nuevo.",
      );
    }
  }
  function start(planned?: Routine) {
    const routine = planned ?? template(orientation, selected);
    const next: Session = {
      id: Crypto.randomUUID(),
      routine,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      ...(routine.trainingMode === "amrap"
        ? {
            amrap: {
              durationSeconds:
                (routine.blocks?.find((block) => block.format === "amrap")
                  ?.durationMinutes ?? 12) * 60,
              startedAt: null,
              rounds: 0,
              extraReps: 0,
            },
          }
        : {}),
      items: routine.items.map((p) => ({
        exerciseId: p.exercise.id,
        status: "pending",
        comment: "",
        series: Array.from({ length: p.sets }, () => ({
          reps: p.reps,
          weight: 0,
          done: false,
        })),
      })),
    };
    persist(next);
  }
  function updateItem(
    index: number,
    change: (item: Session["items"][number]) => Session["items"][number],
  ) {
    if (!session) return;
    persist({
      ...session,
      items: session.items.map((item, i) =>
        i === index ? change(item) : item,
      ),
    });
  }
  function replaceExercise(index: number, replacement: Exercise) {
    if (!session) return;
    const previous = session.routine.items[index];
    const nextPrescription = { ...previous, exercise: replacement };
    let seen = -1;
    const nextBlocks = session.routine.blocks?.map((block) => ({
      ...block,
      items: block.items.map((item) => {
        seen++;
        return seen === index ? nextPrescription : item;
      }),
    }));
    persist({
      ...session,
      routine: {
        ...session.routine,
        items: session.routine.items.map((item, itemIndex) =>
          itemIndex === index ? nextPrescription : item,
        ),
        ...(nextBlocks ? { blocks: nextBlocks } : {}),
      },
      items: session.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              exerciseId: replacement.id,
              status: "pending" as const,
              comment: "",
              series: Array.from({ length: nextPrescription.sets }, () => ({
                reps: nextPrescription.reps,
                weight: 0,
                done: false,
              })),
            }
          : item,
      ),
    });
    setExpandedExercise(null);
    setSwapIndex(null);
  }
  async function authenticate(register: boolean) {
    if (busy) return;
    try {
      const parsed = new URL(url);
      if (
        parsed.protocol !== "https:" &&
        !(
          parsed.protocol === "http:" &&
          /^(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.test(
            parsed.hostname,
          )
        )
      )
        throw new Error();
    } catch {
      Alert.alert(
        "Dirección inválida",
        "Ingresá la URL HTTPS del backend o una dirección local de desarrollo.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await api.request(
        url,
        register ? "/auth/register" : "/auth/login",
        undefined,
        { email, password },
      );
      const next = { ...result, url: url.replace(/\/$/, "") };
      storage.claimGuest(next.userId);
      await api.remember(next);
      setAccount(next);
      setPassword("");
      setSession(null);
      setTab("today");
    } catch (e) {
      Alert.alert("No se pudo ingresar", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  const active = rows.find((r) => !r.session.finishedAt);
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>M</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>MY FITNESS COACH</Text>
          <Text style={styles.subtitle}>
            {session ? "ENTRENAMIENTO EN CURSO" : "TU PRÓXIMA SESIÓN"}
          </Text>
        </View>
        <View style={styles.pill}>
          <View
            style={[styles.statusDot, !online && styles.statusDotOffline]}
          />
        </View>
      </View>
      {(session || planning || tab !== "today") && (
        <View style={styles.backBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Volver</Text>
          </Pressable>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {tab === "today" && !session && planning && (
          <WeekPlanner
            key={`${owner}:${orientation}:${planWeek}`}
            orientation={orientation}
            profile={profile}
            previous={plan}
            onSave={savePlan}
            onCancel={() => setPlanning(false)}
          />
        )}
        {tab === "today" && !session && !planning && (
          <>
            <Text style={styles.eyebrow}>TU ENTRENAMIENTO, A TU RITMO</Text>
            <Text style={styles.hero}>Hoy también{"\n"}cuenta.</Text>
            <View style={styles.wrap}>
              {(Object.keys(orientations) as Orientation[]).map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: orientation === key }}
                  onPress={() => {
                    setOrientation(key);
                    setShowPlan(false);
                  }}
                  style={[
                    styles.chip,
                    orientation === key && styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      orientation === key && { color: "white" },
                    ]}
                  >
                    {orientations[key].name}
                  </Text>
                </Pressable>
              ))}
            </View>
            {active && (
              <Button
                secondary
                title="Retomar entrenamiento guardado"
                onPress={() => setSession(active.session)}
              />
            )}
            {!!trainingChoices.length && (
              <TrainingCarousel choices={trainingChoices} onStart={start} />
            )}
            {!!trainingChoices.length && (
              <View style={styles.todaySummary}>
                <View>
                  <Text style={styles.summaryNumber}>{sessionsThisWeek}</Text>
                  <Text style={styles.summaryLabel}>ESTA SEMANA</Text>
                </View>
                <View>
                  <Text style={styles.summaryNumber}>
                    {currentTrainingStreak(rows.map((row) => row.session))}
                  </Text>
                  <Text style={styles.summaryLabel}>RACHA ACTUAL</Text>
                </View>
                <Pressable
                  onPress={() => setTodayMenu(true)}
                  style={styles.summaryAction}
                >
                  <Text style={styles.summaryActionText}>Opciones</Text>
                </Pressable>
              </View>
            )}
            {orientation !== "free" ? (
              profile && effectivePlan && todayRoutine ? (
                showPlan ? (
                  <PlanOverview
                    plan={effectivePlan}
                    onStart={start}
                    onEdit={() => setPlanning(true)}
                    onGuide={(e) => {
                      setDetail(e);
                      setVideo(false);
                    }}
                    completed={rows
                      .filter((r) => r.session.finishedAt)
                      .map((r) => r.session.routine.id)}
                    favoriteBlocks={favoriteBlocks}
                    onFavoriteBlock={(id) => {
                      storage.toggleFavorite(owner, "block", id);
                      setTick((value) => value + 1);
                    }}
                  />
                ) : null
              ) : (
                <View style={styles.card}>
                  <Text style={styles.title}>Primero, queremos conocerte</Text>
                  <Text style={styles.body}>
                    Contanos tu experiencia, el material habitual y tus
                    limitaciones. Después podés entrenar todos los días que
                    quieras: iremos adaptando la próxima sesión.
                  </Text>
                  <Button
                    title="Configurar mi entrenador"
                    onPress={() => setPlanning(true)}
                  />
                </View>
              )
            ) : (
              <View style={styles.card}>
                <Text style={styles.title}>Armá tu sesión</Text>
                <Text style={styles.body}>
                  {orientations[orientation].focus}
                </Text>
                <Text style={styles.muted}>
                  Elegí tus ejercicios y consultá siempre la guía.
                </Text>
                {orientation === "free"
                  ? exercises.map((e) => (
                      <View key={e.id} style={styles.preview}>
                        <Pressable
                          style={{ flex: 1 }}
                          onPress={() =>
                            setSelected((s) =>
                              s.includes(e.id)
                                ? s.filter((id) => id !== e.id)
                                : [...s, e.id],
                            )
                          }
                        >
                          <Text style={styles.body}>
                            {selected.includes(e.id) ? "✓" : "○"} {e.name}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setDetail(e);
                            setVideo(false);
                          }}
                        >
                          <Text style={styles.link}>Guía</Text>
                        </Pressable>
                      </View>
                    ))
                  : template(orientation).items.map((p) => (
                      <Pressable
                        key={p.exercise.id}
                        onPress={() => {
                          setDetail(p.exercise);
                          setVideo(false);
                        }}
                        style={styles.preview}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.body}>{p.exercise.name}</Text>
                          <Text style={styles.muted}>
                            {p.sets} series × {p.reps} rep.{" "}
                            {(p.perSide ?? p.exercise.id === "bird-dog")
                              ? "por lado"
                              : ""}
                          </Text>
                        </View>
                        <Text style={styles.link}>Cómo hacerlo ↗</Text>
                      </Pressable>
                    ))}
                <Button
                  title={"Comenzar sesión libre"}
                  disabled={!selected.length}
                  onPress={() => start()}
                />
              </View>
            )}
            <View style={styles.softCard}>
              <Text style={styles.title}>Una sesión a la vez</Text>
              <Text style={styles.body}>
                {!online
                  ? "Tu entrenador vuelve cuando recuperes la conexión. Podés seguir entrenando y registrar tu progreso."
                  : "Cada vez que vuelvas, elegiremos la próxima carga según lo que ya hiciste. Tu historial guía el entrenamiento; una meta semanal no te limita."}
              </Text>
            </View>
          </>
        )}
        {tab === "today" && session && (
          <>
            <Text style={styles.hero}>{session.routine.name}</Text>
            <Text style={styles.body}>
              {session.items.filter((i) => i.status === "completed").length} de{" "}
              {session.items.length} ejercicios completos
            </Text>
            <AmrapPanel
              session={session}
              onStart={() =>
                persist({
                  ...session,
                  amrap: session.amrap
                    ? { ...session.amrap, startedAt: new Date().toISOString() }
                    : undefined,
                })
              }
              onRound={() =>
                persist({
                  ...session,
                  amrap: session.amrap
                    ? { ...session.amrap, rounds: session.amrap.rounds + 1 }
                    : undefined,
                })
              }
            />
            {session.routine.items.map((p, index) => {
              const item = session.items[index];
              const tracksWeight =
                p.unit !== "seconds" && p.exercise.id !== "jump";
              return (
                <View style={styles.card} key={p.exercise.id}>
                  <Text style={styles.eyebrow}>
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {p.block ? blocks[p.block] : "Ejercicio"} /{" "}
                    {labels[item.status]}
                  </Text>
                  <Text style={styles.title}>{p.exercise.name}</Text>
                  {!session.finishedAt && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setSwapWithoutEquipment(false);
                        setSwapIndex(index);
                      }}
                      style={styles.swapButton}
                    >
                      <Text style={styles.swapButtonText}>
                        ↻ Reemplazar este ejercicio
                      </Text>
                    </Pressable>
                  )}
                  {p.effort && <Text style={styles.body}>{p.effort}</Text>}
                  <Button
                    secondary
                    title={
                      expandedExercise === p.exercise.id
                        ? "Ocultar demostración"
                        : "Ver demostración"
                    }
                    onPress={() =>
                      setExpandedExercise(
                        expandedExercise === p.exercise.id
                          ? null
                          : p.exercise.id,
                      )
                    }
                  />
                  {expandedExercise === p.exercise.id && (
                    <View style={styles.demoPanel}>
                      <ExerciseDiagram kind={p.exercise.illustration} />
                      <Text style={styles.body}>{p.exercise.steps[0]}</Text>
                      <Pressable
                        onPress={() => {
                          setDetail(p.exercise);
                          setVideo(false);
                        }}
                        style={styles.guideLink}
                      >
                        <Text style={styles.guideLinkText}>
                          Técnica completa y video →
                        </Text>
                      </Pressable>
                    </View>
                  )}
                  <Text style={styles.muted}>
                    Descanso previsto: {p.restSeconds} s{" "}
                    {tracksWeight
                      ? "· Peso adicional en kg"
                      : p.unit === "seconds"
                        ? "· Tiempo por serie"
                        : "· Solo peso corporal"}
                    {(p.perSide ?? p.exercise.id === "bird-dog")
                      ? " · Repeticiones por lado"
                      : ""}
                  </Text>
                  {item.series.map((serie, n) => (
                    <View key={n} style={styles.series}>
                      <Text style={styles.body}>
                        {session.routine.trainingMode === "amrap" &&
                        p.block !== "warmup"
                          ? "Por ronda"
                          : p.block === "warmup"
                            ? p.sets === 1
                              ? "Preparación"
                              : `Ronda ${n + 1}`
                            : `Serie ${n + 1}`}
                      </Text>
                      <TextInput
                        editable={!session.finishedAt}
                        accessibilityLabel={`${p.unit === "seconds" ? "Segundos" : "Repeticiones"} serie ${n + 1}`}
                        style={styles.number}
                        keyboardType="number-pad"
                        value={String(serie.reps)}
                        onChangeText={(text) => {
                          if (/^\d{0,3}$/.test(text))
                            updateItem(index, (i) => ({
                              ...i,
                              series: i.series.map((s, j) =>
                                j === n ? { ...s, reps: Number(text) } : s,
                              ),
                            }));
                        }}
                      />
                      <Text style={styles.muted}>
                        {p.unit === "seconds" ? "s" : "rep."}
                      </Text>
                      {tracksWeight && (
                        <>
                          <TextInput
                            editable={!session.finishedAt}
                            accessibilityLabel={`Peso serie ${n + 1}`}
                            style={styles.number}
                            keyboardType="decimal-pad"
                            value={String(serie.weight)}
                            onChangeText={(text) => {
                              const value = Number(text.replace(",", "."));
                              if (
                                Number.isFinite(value) &&
                                value >= 0 &&
                                value <= 1000
                              )
                                updateItem(index, (i) => ({
                                  ...i,
                                  series: i.series.map((s, j) =>
                                    j === n ? { ...s, weight: value } : s,
                                  ),
                                }));
                            }}
                          />
                          <Text style={styles.muted}>kg</Text>
                        </>
                      )}
                      <Pressable
                        disabled={!!session.finishedAt}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: serie.done }}
                        accessibilityLabel={`Completar serie ${n + 1}`}
                        style={[styles.check, serie.done && styles.chipActive]}
                        onPress={() =>
                          updateItem(index, (i) => {
                            const series = i.series.map((s, j) =>
                              j === n ? { ...s, done: !s.done } : s,
                            );
                            return {
                              ...i,
                              series,
                              status: exerciseStatus(series),
                            };
                          })
                        }
                      >
                        <Text
                          style={{ color: serie.done ? "white" : "#143f37" }}
                        >
                          {serie.done ? "✓" : "○"}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  {!session.finishedAt && (
                    <View style={styles.wrap}>
                      <Button
                        secondary
                        title="Completar ejercicio"
                        onPress={() =>
                          updateItem(index, (i) => ({
                            ...i,
                            status: "completed",
                            series: i.series.map((s) => ({ ...s, done: true })),
                          }))
                        }
                      />
                      <Button
                        secondary
                        title="Omitir"
                        onPress={() =>
                          updateItem(index, (i) => ({
                            ...i,
                            status: i.series.some((s) => s.done)
                              ? "partial"
                              : "skipped",
                          }))
                        }
                      />
                    </View>
                  )}
                  <TextInput
                    editable={!session.finishedAt}
                    multiline
                    accessibilityLabel="Comentario del ejercicio"
                    placeholder="¿Cómo te fue? Podés dejar un comentario…"
                    style={styles.input}
                    value={item.comment}
                    maxLength={2000}
                    onChangeText={(comment) =>
                      updateItem(index, (i) => ({ ...i, comment }))
                    }
                  />
                </View>
              );
            })}
            {!session.finishedAt && (
              <Button
                title="Finalizar y guardar sesión"
                onPress={() => {
                  const next = {
                    ...session,
                    finishedAt: new Date().toISOString(),
                  };
                  persist(next);
                }}
              />
            )}
            {!!session.finishedAt && (
              <Text style={styles.title}>
                Sesión guardada. Cada avance cuenta.
              </Text>
            )}
          </>
        )}
        {tab === "history" && (
          <Performance sessions={rows.map((row) => row.session)} />
        )}
        {tab === "account" &&
          (library ? (
            <Library
              favorites={favoriteMovements}
              selected={selected}
              onFavorite={(id) => {
                storage.toggleFavorite(owner, "movement", id);
                setTick((value) => value + 1);
              }}
              onSelect={(id) =>
                setSelected((value) =>
                  value.includes(id)
                    ? value.filter((item) => item !== id)
                    : [...value, id],
                )
              }
              onGuide={(exercise) => {
                setDetail(exercise);
                setVideo(false);
              }}
              onStart={() => {
                setOrientation("free");
                start();
                setLibrary(false);
                setTab("today");
              }}
            />
          ) : (
            <>
              <Text style={styles.hero}>Tu espacio.</Text>
              <Text style={styles.body}>
                Podés entrenar sin cuenta. Al ingresar, las sesiones locales se
                vinculan a tu cuenta y se sincronizan.
              </Text>
              <View style={styles.profileCard}>
                <View style={styles.profileIcon}>
                  <Text style={styles.profileIconText}>★</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Mi biblioteca</Text>
                  <Text style={styles.muted}>
                    Movimientos favoritos y sesión libre
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLibrary(true)}
                  style={styles.profileArrow}
                >
                  <Text style={styles.profileArrowText}>›</Text>
                </Pressable>
              </View>
              {account ? (
                <>
                  <Text style={styles.muted}>{account.url}</Text>
                  <Button
                    title="Sincronizar ahora"
                    onPress={() => void synchronize()}
                  />
                  <Button
                    secondary
                    title="Cerrar sesión"
                    onPress={() => {
                      void api.logout().then(() => {
                        setAccount(null);
                        setSession(null);
                        setNotice(
                          "Acceso cerrado. Tus registros permanecen asociados a tu cuenta.",
                        );
                      });
                    }}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    accessibilityLabel="URL del backend"
                    style={styles.input}
                    autoCapitalize="none"
                    placeholder="https://tu-api.ngrok-free.dev"
                    value={url}
                    onChangeText={setUrl}
                  />
                  <TextInput
                    accessibilityLabel="Correo"
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <TextInput
                    accessibilityLabel="Contraseña"
                    style={styles.input}
                    secureTextEntry
                    placeholder="Contraseña · mínimo 12 caracteres"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Button
                    disabled={busy || !online}
                    title={busy ? "Conectando…" : "Crear cuenta y sincronizar"}
                    onPress={() => void authenticate(true)}
                  />
                  <Button
                    secondary
                    disabled={busy || !online}
                    title="Ya tengo cuenta"
                    onPress={() => void authenticate(false)}
                  />
                </>
              )}
            </>
          ))}
        <Text style={styles.sync}>
          {!online ? "Sin conexión · " : ""}
          {notice}
          {count ? ` · ${count} cambios pendientes` : ""}
        </Text>
      </ScrollView>
      <FloatingTabs value={tab} onChange={setTab} />
      <BottomSheet
        isPresented={todayMenu}
        onDismiss={() => setTodayMenu(false)}
        showDragIndicator
        snapPoints={[{ height: 380 }]}
        containerColor="#17211d"
      >
        <View
          style={[
            styles.sheetContent,
            { width: Math.max(280, screenWidth - 32) },
          ]}
        >
          <Text style={styles.sheetEyebrow}>SESIÓN DE HOY</Text>
          <Text style={styles.sheetTitle}>¿Querés ajustar algo?</Text>
          <Pressable
            style={styles.sheetAction}
            onPress={() => {
              setTodayMenu(false);
              setPlanning(true);
            }}
          >
            <Text style={styles.sheetActionText}>
              Cambiar perfil o equipamiento
            </Text>
            <Text style={styles.sheetArrow}>›</Text>
          </Pressable>
          <Pressable
            style={styles.sheetAction}
            onPress={() => {
              setShowPlan((value) => !value);
              setTodayMenu(false);
            }}
          >
            <Text style={styles.sheetActionText}>
              {showPlan ? "Ocultar plan completo" : "Ver plan completo"}
            </Text>
            <Text style={styles.sheetArrow}>›</Text>
          </Pressable>
          <Pressable
            style={styles.sheetAction}
            onPress={() => {
              if (profile)
                start(amrapTemplate(orientation, 12, profile.equipment));
              setTodayMenu(false);
            }}
          >
            <Text style={styles.sheetActionText}>
              Hacer un AMRAP de 12 minutos
            </Text>
            <Text style={styles.sheetArrow}>›</Text>
          </Pressable>
        </View>
      </BottomSheet>
      <BottomSheet
        isPresented={swapIndex !== null}
        onDismiss={() => setSwapIndex(null)}
        showDragIndicator
        snapPoints={[{ height: 560 }]}
        containerColor="#17211d"
      >
        {session &&
          swapIndex !== null &&
          (() => {
            const current = session.routine.items[swapIndex];
            const replacements = availableReplacements(
              current.exercise,
              current.block,
              swapWithoutEquipment ? "bodyweight" : profile?.equipment,
            );
            return (
              <View
                style={[
                  styles.sheetContent,
                  { width: Math.max(280, screenWidth - 32) },
                ]}
              >
                <Text style={styles.sheetEyebrow}>CAMBIAR MOVIMIENTO</Text>
                <Text style={styles.sheetTitle}>{current.exercise.name}</Text>
                <Text style={styles.sheetBody}>
                  Elegí una alternativa para el mismo bloque. Conservaremos las
                  series y el objetivo de la sesión.
                </Text>
                <View style={styles.reasonRow}>
                  <Pressable
                    onPress={() => setSwapWithoutEquipment((value) => !value)}
                  >
                    <Text
                      style={[
                        styles.reasonPill,
                        swapWithoutEquipment && styles.reasonPillActive,
                      ]}
                    >
                      {swapWithoutEquipment ? "✓ " : ""}No tengo material
                    </Text>
                  </Pressable>
                  <Text style={styles.reasonPill}>
                    Mismo objetivo del bloque
                  </Text>
                </View>
                {replacements.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    style={styles.replacement}
                    onPress={() => replaceExercise(swapIndex, exercise)}
                  >
                    <View style={styles.replacementIcon}>
                      <Text style={styles.replacementIconText}>↻</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.replacementTitle}>
                        {exercise.name}
                      </Text>
                      <Text style={styles.muted}>
                        {exercise.muscles} · {exercise.equipment}
                      </Text>
                    </View>
                    <Text style={styles.sheetArrow}>›</Text>
                  </Pressable>
                ))}
              </View>
            );
          })()}
      </BottomSheet>
      <Modal
        visible={!!detail}
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <View style={[styles.screen, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.backBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al entrenamiento"
              style={styles.backButton}
              onPress={() => {
                setDetail(null);
                setVideo(false);
              }}
            >
              <Text style={styles.backText}>← Volver al entrenamiento</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {detail && (
              <>
                <Text style={styles.hero}>{detail.name}</Text>
                <Text style={styles.muted}>
                  {detail.muscles} · {detail.equipment}
                </Text>
                <ExerciseDiagram kind={detail.illustration} />
                <Text style={styles.muted}>
                  Ilustración esquemática · inicio y movimiento
                </Text>
                {detail.steps.map((step, i) => (
                  <View style={styles.preview} key={i}>
                    <Text style={styles.link}>{i + 1}.</Text>
                    <Text style={[styles.body, { flex: 1 }]}>{step}</Text>
                  </View>
                ))}
                <Text style={styles.title}>Cuidá la técnica</Text>
                {detail.cues.map((c) => (
                  <Text key={c} style={styles.body}>
                    • {c}
                  </Text>
                ))}
                <Button
                  disabled={!online}
                  title={
                    online
                      ? "Ver video de referencia"
                      : "Video disponible cuando vuelva la conexión"
                  }
                  onPress={() => setVideo((v) => !v)}
                />
                {video && online && (
                  <>
                    <WebView
                      style={{ height: 240, backgroundColor: "#edf4ef" }}
                      source={{
                        uri: detail.videoId
                          ? `https://www.youtube.com/embed/${detail.videoId}`
                          : detail.videoUrl!,
                      }}
                      allowsFullscreenVideo
                      javaScriptEnabled
                      onError={() =>
                        Alert.alert(
                          "No se pudo cargar el video",
                          "Podés abrir la referencia en YouTube.",
                        )
                      }
                    />
                    <Button
                      secondary
                      title={
                        detail.videoId
                          ? "Abrir en YouTube"
                          : "Abrir video en navegador"
                      }
                      onPress={() =>
                        void Linking.openURL(
                          detail.videoId
                            ? `https://www.youtube.com/watch?v=${detail.videoId}`
                            : detail.videoUrl!,
                        )
                      }
                    />
                  </>
                )}
                <Pressable
                  onPress={() => void Linking.openURL(detail.sourceUrl)}
                >
                  <Text style={styles.link}>Fuente de técnica y video ↗</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f7f1" },
  header: {
    paddingHorizontal: 22,
    minHeight: 68,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { fontSize: 19, fontWeight: "900", color: "#143f37" },
  brandCopy: { flex: 1, paddingHorizontal: 12 },
  brand: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "800",
    color: "#143f37",
  },
  subtitle: { fontSize: 10, letterSpacing: 1, color: "#738379", marginTop: 3 },
  pill: {
    width: 34,
    height: 34,
    backgroundColor: "#e3ece3",
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3c966e",
  },
  statusDotOffline: { backgroundColor: "#c59044" },
  content: { padding: 22, gap: 18, paddingBottom: 40 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: "#647d6d",
  },
  hero: {
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: "#173e34",
  },
  wrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#e8ede5",
  },
  chipActive: { backgroundColor: "#214d3e" },
  chipText: { fontSize: 14, color: "#355a49", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    gap: 15,
    borderWidth: 1,
    borderColor: "#e8ece3",
  },
  demoPanel: {
    backgroundColor: "#f2f5ee",
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  guideLink: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#dff5ba",
  },
  guideLinkText: { color: "#173e34", fontWeight: "700", fontSize: 15 },
  swapButton: {
    minHeight: 50,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: "#edf2e8",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  swapButtonText: { color: "#173e34", fontSize: 14, fontWeight: "800" },
  softCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#e8eddc",
    gap: 10,
  },
  quickCard: {
    backgroundColor: "#173e34",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickAction: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: { fontSize: 14, fontWeight: "800", color: "#173e34" },
  quickTitle: { fontSize: 21, fontWeight: "800", color: "white" },
  quickMuted: { fontSize: 12, lineHeight: 18, color: "#c3d0c7" },
  todaySummary: {
    minHeight: 92,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#e8eddf",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryNumber: {
    fontSize: 29,
    lineHeight: 32,
    fontWeight: "900",
    color: "#173e34",
  },
  summaryLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: "900",
    color: "#6a7c70",
  },
  summaryAction: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryActionText: { color: "#173e34", fontSize: 12, fontWeight: "900" },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e1e9de",
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  profileIconText: { fontSize: 20, color: "#173e34" },
  profileArrow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  profileArrowText: { fontSize: 32, color: "#315d4d" },
  title: { fontSize: 21, fontWeight: "700", color: "#193f35" },
  body: { fontSize: 15, lineHeight: 23, color: "#3f554b" },
  muted: { fontSize: 12, lineHeight: 18, color: "#778379" },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eff2ec",
  },
  link: { color: "#33684e", fontWeight: "600", fontSize: 13 },
  button: {
    backgroundColor: "#214d3e",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
  },
  secondary: { backgroundColor: "#edf2e8" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#dce4d8",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#193f35",
    backgroundColor: "white",
  },
  series: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    paddingVertical: 6,
  },
  number: {
    width: 56,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#dce4d8",
    borderRadius: 9,
    padding: 8,
    textAlign: "center",
    color: "#143f37",
  },
  check: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8ede5",
  },
  sync: { fontSize: 11, lineHeight: 17, color: "#778379", textAlign: "center" },
  backBar: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    backgroundColor: "#f6f7f1",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8dd",
  },
  backButton: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#e5eddf",
  },
  backText: { fontSize: 17, fontWeight: "700", color: "#214d3e" },
  sheetContent: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 26,
    gap: 12,
  },
  sheetEyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "900",
    color: "#c8ff63",
  },
  sheetTitle: {
    alignSelf: "stretch",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: "white",
  },
  sheetBody: { fontSize: 14, lineHeight: 20, color: "#b8c7bd" },
  sheetAction: {
    alignSelf: "stretch",
    minHeight: 62,
    paddingHorizontal: 17,
    borderRadius: 18,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#173e34",
  },
  sheetArrow: { fontSize: 28, color: "#527061" },
  reasonRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  reasonPill: {
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: "white",
    paddingVertical: 7,
    paddingHorizontal: 10,
    color: "#426052",
    fontSize: 11,
    fontWeight: "700",
  },
  reasonPillActive: { backgroundColor: "#173e34", color: "#c8ff63" },
  replacement: {
    minHeight: 70,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  replacementIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#c8ff63",
    alignItems: "center",
    justifyContent: "center",
  },
  replacementIconText: { fontSize: 20, fontWeight: "900", color: "#173e34" },
  replacementTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#173e34",
  },
});
