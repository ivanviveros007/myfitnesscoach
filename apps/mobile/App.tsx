import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Alert,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
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
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
  useQuery,
} from "@tanstack/react-query";
import { WebView } from "react-native-webview";
import * as Crypto from "expo-crypto";
import { StatusBar } from "expo-status-bar";
import { BottomSheet } from "@expo/ui";
import { Button } from "./src/AppButton";
import { WeekPlanner } from "./src/WeekPlanner";
import { TrainingCalendar, TrainingCalendarCard } from "./src/TrainingCalendar";
import { PlanOverview } from "./src/PlanOverview";
import { Performance } from "./src/Performance";
import { Library } from "./src/Library";
import { AmrapPanel } from "./src/AmrapPanel";
import { FloatingTabs, type AppTab } from "./src/FloatingTabs";
import { TrainingCarousel } from "./src/TrainingCarousel";
import {
  ClassicIntro,
  TrainingModeSelector,
  WorkoutBuilder,
} from "./src/TrainingModeHome";
import {
  ActiveWorkoutCard,
  ActivityTracker,
  CurrentWeek,
} from "./src/HomeActivity";
import { RestTimer, WorkoutClock } from "./src/WorkoutTimer";
import {
  exercises,
  orientations,
  template,
  exerciseStatus,
  currentWeek,
  makeWeeklyPlan,
  blocks,
  routineBlocks,
  amrapTemplate,
  type TrainingProfile,
  type WeeklyPlan,
  type Routine,
  type Orientation,
  type Session,
  type Exercise,
  type PhysicalActivity,
  type ActivityFocus,
  isSessionActive,
  profileSchema,
  type TrainingPreference,
} from "@myfitnesscoach/contracts";
import * as storage from "./src/storage";
import * as api from "./src/api";
import { ExerciseVisual } from "./src/ExerciseVisual";
import {
  availableReplacements,
  replaceRoutineExercise,
} from "./src/replacements";
const labels = {
  pending: "Pendiente",
  partial: "Parcial",
  completed: "Completado",
  skipped: "Omitido",
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnReconnect: true,
    },
  },
});
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Main />
      </SafeAreaProvider>
    </QueryClientProvider>
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [todayMenu, setTodayMenu] = useState(false);
  const [activitySheet, setActivitySheet] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  );
  const [activityType, setActivityType] =
    useState<PhysicalActivity["type"]>("padel");
  const [activityDate, setActivityDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [activityDuration, setActivityDuration] = useState("60");
  const [activityIntensity, setActivityIntensity] =
    useState<PhysicalActivity["intensity"]>("moderate");
  const [activityStatus, setActivityStatus] =
    useState<PhysicalActivity["status"]>("completed");
  const [activityFocuses, setActivityFocuses] = useState<ActivityFocus[]>([]);
  const [activityNotes, setActivityNotes] = useState("");
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapWithoutEquipment, setSwapWithoutEquipment] = useState(false);
  const [swapQuery, setSwapQuery] = useState("");
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
    } else if (showPlan) {
      setShowPlan(false);
    } else if (showCalendar) {
      setShowCalendar(false);
    } else if (tab !== "today") {
      setTab("today");
    } else if (session && isSessionActive(session)) {
      Alert.alert(
        "Entrenamiento en curso",
        "¿Querés pausar la sesión para retomarla después o cancelarla?",
        [
          { text: "Seguir entrenando", style: "cancel" },
          { text: "Pausar", onPress: pauseCurrentSession },
          {
            text: "Cancelar entrenamiento",
            style: "destructive",
            onPress: cancelCurrentSession,
          },
        ],
      );
      return true;
    } else if (session) {
      setSession(null);
    } else return false;
    return true;
  }
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", goBack);
    return () => sub.remove();
  }, [detail, tab, session, planning, library, showPlan, showCalendar]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab, session?.id, planning, showPlan, showCalendar]);
  const owner = account?.userId ?? "guest";
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const rows = ready ? storage.history(owner) : [];
  const physicalActivities = ready ? storage.activities(owner) : [];
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
  const dateKey = new Date().toLocaleDateString("en-CA");
  const recentSessions = finishedForSport
    .slice(0, 14)
    .map(({ session: completed }) => ({
      finishedAt: completed.finishedAt!,
      exerciseIds: completed.items.map((item) => item.exerciseId),
    }));
  const recentActivities = physicalActivities.slice(0, 30).map((activity) => ({
    type: activity.type,
    occurredAt: activity.occurredAt,
    durationMinutes: activity.durationMinutes,
    intensity: activity.intensity,
    status: activity.status,
    focuses: activity.focuses,
  }));
  const todayIndex = (new Date().getDay() + 6) % 7;
  const plannedSportOffsets = physicalActivities
    .filter(
      (activity) =>
        activity.status === "planned" &&
        ["padel", "football", "tennis"].includes(activity.type),
    )
    .map((activity) =>
      Math.ceil(
        (new Date(activity.occurredAt).getTime() - Date.now()) / 86400000,
      ),
    )
    .filter((days) => days >= 0 && days <= 7);
  const planSportOffsets =
    effectivePlan?.input.sportDays.map(
      (sportDay) => (sportDay - todayIndex + 7) % 7,
    ) ?? [];
  const sportOffsets = [...plannedSportOffsets, ...planSportOffsets];
  const upcomingSportInDays = sportOffsets.length
    ? Math.min(...sportOffsets)
    : undefined;
  const profileFingerprint = profile ? JSON.stringify(profile) : "";
  const cachedDailyTraining =
    ready && profile
      ? storage.readDailyTraining(owner, dateKey, orientation)
      : null;
  const dailyTrainingQuery = useQuery({
    queryKey: [
      "daily-training",
      url,
      owner,
      dateKey,
      orientation,
      finishedForSport.length,
      recentSessions
        .map((item) => `${item.finishedAt}:${item.exerciseIds.join(",")}`)
        .join("|"),
      recentActivities
        .map(
          (item) =>
            `${item.occurredAt}:${item.type}:${item.intensity}:${item.status}:${item.focuses.join(",")}`,
        )
        .join("|"),
      upcomingSportInDays,
      effectivePlan?.input.readiness,
      profileFingerprint,
    ],
    queryFn: async () => {
      const response = await api.dailyTraining(url, {
        date: dateKey,
        orientation,
        completedCount: finishedForSport.length,
        profile: profile!,
        recentSessions,
        recentActivities,
        upcomingSportInDays,
        readiness: effectivePlan?.input.readiness,
      });
      storage.cacheDailyTraining(owner, response);
      return response;
    },
    enabled:
      ready && online && !!url && !!profile && profile.limitations !== "review",
    initialData: cachedDailyTraining ?? undefined,
    initialDataUpdatedAt: cachedDailyTraining
      ? new Date(cachedDailyTraining.generatedAt).getTime()
      : undefined,
  });
  const dailyTraining = dailyTrainingQuery.data ?? null;
  const replacementCatalogQuery = useQuery({
    queryKey: [
      "active-replacement-search",
      url,
      swapQuery.trim().toLowerCase(),
    ],
    queryFn: () => api.searchCatalog(url, swapQuery.trim()),
    enabled: swapIndex !== null && !!url && swapQuery.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const experienceColors = ["#173e34", "#ef6d4f", "#397e88", "#7657a8"];
  const experienceImages = [
    "padel",
    "strength",
    "mobility",
    "amrap",
    "landmine",
    "boxJump",
    "dumbbellRdl",
    "battleRopes",
  ] as const;
  const imageOffset = [...dateKey].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const experienceIcons = [
    "sparkles",
    "bolt.fill",
    "dumbbell.fill",
    "figure.highintensity.intervaltraining",
  ] as const;
  const trainingChoices =
    dailyTraining && dailyTraining.date === dateKey
      ? dailyTraining.choices.map((choice, index) => ({
          key: choice.key,
          title:
            choice.key === "recommended" ? "Sesión recomendada" : choice.name,
          tag: choice.tag,
          insight: choice.insight,
          icon: experienceIcons[index % experienceIcons.length]!,
          routine: choice.routine,
          color: experienceColors[index % experienceColors.length]!,
          image:
            experienceImages[(index + imageOffset) % experienceImages.length]!,
        }))
      : [];
  useEffect(() => {
    if (!online)
      setNotice(
        cachedDailyTraining
          ? "Sin conexión · usando el entrenamiento guardado de hoy"
          : "Conectate para descargar el entrenamiento de hoy",
      );
    else if (dailyTrainingQuery.fetchStatus === "fetching")
      setNotice("Actualizando el entrenamiento de hoy…");
    else if (dailyTrainingQuery.isError)
      setNotice(
        cachedDailyTraining
          ? "Sin conexión · usando el entrenamiento guardado de hoy"
          : "Conectate para descargar el entrenamiento de hoy",
      );
    else if (dailyTrainingQuery.data && online)
      setNotice("Entrenamiento de hoy actualizado");
  }, [
    dailyTrainingQuery.fetchStatus,
    dailyTrainingQuery.isError,
    dailyTrainingQuery.dataUpdatedAt,
    online,
    !!cachedDailyTraining,
  ]);
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
    setShowCalendar(false);
    setShowPlan(true);
    setTick((t) => t + 1);
  }
  function savePhysicalActivity() {
    const duration = Number(activityDuration);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
      Alert.alert("Fecha inválida", "Usá el formato AAAA-MM-DD.");
      return;
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
      Alert.alert("Duración inválida", "Ingresá entre 1 y 600 minutos.");
      return;
    }
    const date = new Date(`${activityDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      Alert.alert("Fecha inválida", "Revisá la fecha de la actividad.");
      return;
    }
    const todayKey = new Date().toLocaleDateString("en-CA");
    if (activityDate > todayKey && activityStatus === "completed") {
      Alert.alert("Fecha inválida", "No podés registrar una actividad futura.");
      return;
    }
    const labels: Record<PhysicalActivity["type"], string> = {
      workout: "Entrenamiento",
      padel: "Partido de pádel",
      football: "Partido de fútbol",
      tennis: "Partido de tenis",
      running: "Running",
      cycling: "Ciclismo",
      swimming: "Natación",
      walking: "Caminata",
      other: "Otra actividad",
    };
    try {
      storage.saveActivity(owner, {
        id: editingActivityId ?? Crypto.randomUUID(),
        type: activityType,
        name: labels[activityType],
        occurredAt:
          activityDate === todayKey
            ? new Date().toISOString()
            : date.toISOString(),
        durationMinutes: duration,
        intensity: activityIntensity,
        status: activityStatus,
        focuses: activityFocuses,
        notes: activityNotes.trim() || undefined,
      });
      setActivitySheet(false);
      setEditingActivityId(null);
      setActivityNotes("");
      setActivityFocuses([]);
      setTick((value) => value + 1);
      setNotice("Actividad física registrada");
      void queryClient.invalidateQueries({ queryKey: ["daily-training"] });
    } catch {
      Alert.alert(
        "No se pudo guardar",
        "Intentá registrar la actividad nuevamente.",
      );
    }
  }
  function openNewActivity() {
    setEditingActivityId(null);
    setActivityDate(new Date().toLocaleDateString("en-CA"));
    setActivityStatus("planned");
    setActivityType("padel");
    setActivityDuration("60");
    setActivityIntensity("moderate");
    setActivityFocuses([]);
    setActivityNotes("");
    setActivitySheet(true);
  }
  function changeTrainingPreference(preference: TrainingPreference) {
    if (!profile) {
      setPlanning(true);
      return;
    }
    const next = profileSchema.parse({
      ...profile,
      trainingPreference: preference,
    });
    storage.writeSetting(owner, "profile", next);
    setTick((value) => value + 1);
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
    const unsub = NetInfo.addEventListener((s) => {
      const connected =
        s.isConnected !== false && s.isInternetReachable !== false;
      setOnline(connected);
      onlineManager.setOnline(connected);
    });
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
  function resumedSession(current: Session): Session {
    if (!current.pausedAt) return current;
    const pausedFor = Math.max(
      0,
      Date.now() - new Date(current.pausedAt).getTime(),
    );
    return {
      ...current,
      startedAt: new Date(
        new Date(current.startedAt).getTime() + pausedFor,
      ).toISOString(),
      pausedAt: null,
    };
  }
  function pauseCurrentSession() {
    if (!session || !isSessionActive(session)) return;
    const next = { ...session, pausedAt: new Date().toISOString() };
    try {
      storage.save(owner, next);
      setSession(null);
      setTick((value) => value + 1);
      setNotice("Entrenamiento pausado. Podés retomarlo cuando quieras.");
    } catch {
      Alert.alert(
        "No se pudo pausar",
        "Tu progreso sigue abierto. Intentá nuevamente.",
      );
    }
  }
  function cancelCurrentSession() {
    if (!session || !isSessionActive(session)) return;
    const next = { ...session, cancelledAt: new Date().toISOString() };
    try {
      storage.save(owner, next);
      setSession(null);
      setTick((value) => value + 1);
      setNotice("Entrenamiento cancelado.");
    } catch {
      Alert.alert(
        "No se pudo cancelar",
        "El entrenamiento sigue abierto. Intentá nuevamente.",
      );
    }
  }
  function start(planned?: Routine) {
    if (active) {
      Alert.alert(
        "Ya tenés un entrenamiento pausado",
        "Retomalo antes de comenzar una nueva sesión para conservar correctamente tu progreso.",
        [
          { text: "Ahora no", style: "cancel" },
          {
            text: "Retomar entrenamiento",
            onPress: () => persist(resumedSession(active.session)),
          },
        ],
      );
      return;
    }
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
    const nextRoutine = replaceRoutineExercise(
      session.routine,
      index,
      replacement,
    );
    const nextPrescription = nextRoutine.items[index];
    persist({
      ...session,
      routine: nextRoutine,
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
    setSwapWithoutEquipment(false);
    setSwapQuery("");
    setNotice(`Ejercicio cambiado por ${replacement.name}`);
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
  const active = rows.find(({ session: storedSession }) => {
    if (!isSessionActive(storedSession)) return false;
    if (storedSession.pausedAt) return true;
    return (
      Date.now() - new Date(storedSession.startedAt).getTime() <
      8 * 60 * 60 * 1000
    );
  });
  const sessionBlockStarts = new Map<
    number,
    ReturnType<typeof routineBlocks>[number]
  >();
  if (session) {
    let firstItem = 0;
    for (const block of routineBlocks(session.routine)) {
      sessionBlockStarts.set(firstItem, block);
      firstItem += block.items.length;
    }
  }
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="My Fitness Coach"
          source={require("./assets/icon.png")}
          style={styles.brandMark}
        />
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
      {(session || planning || showPlan || showCalendar || tab !== "today") && (
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
        {tab === "today" &&
          !session &&
          !planning &&
          showCalendar &&
          profile && (
            <TrainingCalendar
              plan={effectivePlan}
              activities={physicalActivities}
              sessions={rows.map((row) => row.session)}
              onAdd={(date) => {
                setEditingActivityId(null);
                setActivityDate(date);
                setActivityStatus("planned");
                setActivityType("workout");
                setActivityDuration("60");
                setActivityIntensity("moderate");
                setActivityFocuses([]);
                setActivityNotes("");
                setActivitySheet(true);
              }}
              onEditPlan={() => setPlanning(true)}
              onViewPlan={() => {
                setShowCalendar(false);
                setShowPlan(true);
              }}
              onStart={start}
              onDeleteRoutine={(routine) => {
                if (!effectivePlan) return;
                Alert.alert(
                  "Quitar entrenamiento",
                  `¿Querés quitar ${routine.name} de esta semana?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Quitar",
                      style: "destructive",
                      onPress: () => {
                        const next = {
                          ...effectivePlan,
                          routines: effectivePlan.routines.filter(
                            (item) => item.id !== routine.id,
                          ),
                        };
                        const key = `plan:${next.input.orientation}:${next.input.week}`;
                        storage.writeSettings(owner, [
                          { key: "profile", value: next.profile },
                          { key, value: next },
                        ]);
                        setTick((value) => value + 1);
                        setNotice("Entrenamiento quitado de la semana");
                        void queryClient.invalidateQueries({
                          queryKey: ["daily-training"],
                        });
                      },
                    },
                  ],
                );
              }}
              onEditActivity={(activity) => {
                setEditingActivityId(activity.id);
                setActivityDate(
                  new Date(activity.occurredAt).toLocaleDateString("en-CA"),
                );
                setActivityType(activity.type);
                setActivityDuration(String(activity.durationMinutes));
                setActivityIntensity(activity.intensity);
                setActivityStatus(activity.status);
                setActivityFocuses(activity.focuses);
                setActivityNotes(activity.notes ?? "");
                setActivitySheet(true);
              }}
              onDeleteActivity={(activity) => {
                Alert.alert(
                  "Eliminar actividad",
                  `¿Querés eliminar ${activity.name.toLowerCase()} del calendario?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      style: "destructive",
                      onPress: () => {
                        storage.deleteActivity(owner, activity.id);
                        setTick((value) => value + 1);
                        setNotice("Actividad eliminada del calendario");
                        void queryClient.invalidateQueries({
                          queryKey: ["daily-training"],
                        });
                      },
                    },
                  ],
                );
              }}
              aiInsight={
                dailyTraining?.choices.find(
                  (choice) => choice.key === "recommended",
                )?.insight
              }
            />
          )}
        {tab === "today" &&
          !session &&
          !planning &&
          showPlan &&
          profile &&
          effectivePlan && (
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
          )}
        {tab === "today" &&
          !session &&
          !planning &&
          !showPlan &&
          !showCalendar && (
            <>
              <CurrentWeek
                sessions={rows.map((row) => row.session)}
                activities={physicalActivities}
              />
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
                <ActiveWorkoutCard
                  session={active.session}
                  onResume={() => {
                    const resumed = resumedSession(active.session);
                    persist(resumed);
                  }}
                />
              )}
              {orientation !== "free" && profile && (
                <TrainingCalendarCard
                  plan={effectivePlan}
                  activities={physicalActivities}
                  onOpen={() => setShowCalendar(true)}
                />
              )}
              {profile && (
                <TrainingModeSelector
                  value={profile.trainingPreference ?? "coach"}
                  goals={profile.goals ?? []}
                  goalNote={profile.goalNote}
                  onChange={changeTrainingPreference}
                  onEditGoal={() => setPlanning(true)}
                />
              )}
              {!!trainingChoices.length &&
                (profile?.trainingPreference ?? "coach") === "coach" && (
                  <TrainingCarousel
                    choices={trainingChoices}
                    equipment={profile?.equipment ?? "gym"}
                    apiUrl={url}
                    isPersonalizing={dailyTrainingQuery.isFetching}
                    onStart={start}
                  />
                )}
              {!!trainingChoices.length &&
                profile?.trainingPreference === "builder" && (
                  <WorkoutBuilder choices={trainingChoices} onStart={start} />
                )}
              {!!trainingChoices.length &&
                profile?.trainingPreference === "classic" && (
                  <>
                    <ClassicIntro days={profile.classicDaysPerWeek ?? 3} />
                    <TrainingCarousel
                      choices={trainingChoices.filter((choice) =>
                        [
                          "hypertrophy",
                          "strength",
                          "upper",
                          "full-body",
                        ].includes(choice.key),
                      )}
                      equipment={profile.equipment}
                      apiUrl={url}
                      isPersonalizing={dailyTrainingQuery.isFetching}
                      onStart={(routine) =>
                        start({ ...routine, trainingMode: "classic" })
                      }
                    />
                  </>
                )}
              {!!trainingChoices.length && (
                <ActivityTracker
                  sessions={rows.map((row) => row.session)}
                  activities={physicalActivities}
                  onAddActivity={() => {
                    setEditingActivityId(null);
                    setActivityDate(new Date().toLocaleDateString("en-CA"));
                    setActivityStatus("completed");
                    setActivityType("padel");
                    setActivityFocuses([]);
                    setActivityNotes("");
                    setActivitySheet(true);
                  }}
                  onOptions={() => setTodayMenu(true)}
                />
              )}
              {orientation !== "free" ? (
                !profile || !effectivePlan || !todayRoutine ? (
                  <View style={styles.card}>
                    <Text style={styles.title}>
                      Primero, queremos conocerte
                    </Text>
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
                ) : null
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
            <WorkoutClock
              startedAt={session.startedAt}
              finishedAt={session.finishedAt}
              onReset={() =>
                Alert.alert(
                  "Reiniciar tiempo",
                  "El contador volverá a 00:00. Tus ejercicios, series y pesos se conservan.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Reiniciar",
                      onPress: () =>
                        persist({
                          ...session,
                          startedAt: new Date().toISOString(),
                        }),
                    },
                  ],
                )
              }
            />
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
              const startingBlock = sessionBlockStarts.get(index);
              const tracksWeight =
                p.unit !== "seconds" && p.exercise.id !== "jump";
              return (
                <React.Fragment key={`${p.exercise.id}-${index}`}>
                  {startingBlock && (
                    <View style={styles.workoutBlockHeader}>
                      <Text style={styles.workoutBlockNumber}>
                        BLOQUE {startingBlock.position + 1}
                      </Text>
                      <Text style={styles.workoutBlockTitle}>
                        {startingBlock.title}
                      </Text>
                      <Text style={styles.workoutBlockPurpose}>
                        {startingBlock.purpose}
                      </Text>
                    </View>
                  )}
                  <View style={styles.card}>
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
                        <ExerciseVisual exercise={p.exercise} />
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
                    {p.restSeconds > 0 && !session.finishedAt && (
                      <RestTimer seconds={p.restSeconds} />
                    )}
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
                          style={[
                            styles.check,
                            serie.done && styles.chipActive,
                          ]}
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
                              series: i.series.map((s) => ({
                                ...s,
                                done: true,
                              })),
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
                </React.Fragment>
              );
            })}
            {!session.finishedAt && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Finalizar y guardar sesión"
                style={({ pressed }) => [
                  styles.finishWorkout,
                  pressed && styles.finishWorkoutPressed,
                ]}
                onPress={() => {
                  const next = {
                    ...session,
                    finishedAt: new Date().toISOString(),
                  };
                  try {
                    storage.save(owner, next);
                    setSession(null);
                    setTick((value) => value + 1);
                    setNotice("Sesión finalizada y guardada.");
                  } catch {
                    Alert.alert(
                      "No se pudo finalizar",
                      "Tu entrenamiento sigue abierto. Intentá nuevamente.",
                    );
                  }
                }}
              >
                <Text style={styles.finishWorkoutText}>
                  Finalizar y guardar sesión
                </Text>
                <Text style={styles.finishWorkoutArrow}>✓</Text>
              </Pressable>
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
              apiUrl={url}
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
      {tab === "today" &&
        !session &&
        !planning &&
        !showPlan &&
        !showCalendar && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar actividad al calendario"
            onPress={openNewActivity}
            style={({ pressed }) => [
              styles.activityFab,
              { bottom: Math.max(insets.bottom, 7) + 94 },
              pressed && styles.activityFabPressed,
            ]}
          >
            <Text style={styles.activityFabPlus}>＋</Text>
          </Pressable>
        )}
      <FloatingTabs value={tab} onChange={setTab} />
      <BottomSheet
        isPresented={todayMenu}
        onDismiss={() => setTodayMenu(false)}
        showDragIndicator
        snapPoints={[{ height: 460 }]}
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
              setEditingActivityId(null);
              setActivityDate(new Date().toLocaleDateString("en-CA"));
              setActivityStatus("completed");
              setActivityType("padel");
              setActivityFocuses([]);
              setActivityNotes("");
              setActivitySheet(true);
            }}
          >
            <Text style={styles.sheetActionText}>
              Registrar actividad física
            </Text>
            <Text style={styles.sheetArrow}>›</Text>
          </Pressable>
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
        isPresented={activitySheet}
        onDismiss={() => setActivitySheet(false)}
        showDragIndicator
        snapPoints={[{ height: 690 }]}
        containerColor="#17211d"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.sheetContent,
            { width: Math.max(280, screenWidth - 32) },
          ]}
        >
          <Text style={styles.sheetEyebrow}>AGENDA DE ENTRENAMIENTO</Text>
          <Text style={styles.sheetTitle}>
            {activityStatus === "planned"
              ? "¿Qué querés planificar?"
              : "¿Qué actividad hiciste?"}
          </Text>
          <Text style={styles.sheetBody}>
            El Coach tendrá en cuenta tanto lo planificado como la carga que
            realmente completaste.
          </Text>
          <Text style={styles.sheetEyebrow}>ESTADO</Text>
          <View style={styles.activityChoices}>
            {(
              [
                ["planned", "Planificada"],
                ["completed", "Realizada"],
              ] as [PhysicalActivity["status"], string][]
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPressIn={() => setActivityStatus(key)}
                style={[
                  styles.activityChoice,
                  activityStatus === key && styles.activityChoiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.activityChoiceText,
                    activityStatus === key && styles.activityChoiceTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.activityChoices}>
            {(
              [
                ["workout", "Entrenamiento"],
                ["padel", "Pádel"],
                ["football", "Fútbol"],
                ["tennis", "Tenis"],
                ["running", "Running"],
                ["cycling", "Bici"],
                ["swimming", "Natación"],
                ["walking", "Caminata"],
                ["other", "Otra"],
              ] as [PhysicalActivity["type"], string][]
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPressIn={() => setActivityType(key)}
                style={[
                  styles.activityChoice,
                  activityType === key && styles.activityChoiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.activityChoiceText,
                    activityType === key && styles.activityChoiceTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sheetEyebrow}>PROPÓSITO</Text>
          <Text style={styles.sheetBody}>
            Podés elegir varias palabras para previsualizar la intención del
            día.
          </Text>
          <View style={styles.activityChoices}>
            {(
              [
                ["power", "Potencia"],
                ["endurance", "Resistencia"],
                ["strength", "Fuerza"],
                ["mobility", "Movilidad"],
                ["recovery", "Recuperación"],
                ["conditioning", "Cardio"],
                ["technique", "Técnica"],
              ] as [ActivityFocus, string][]
            ).map(([key, label]) => {
              const selectedFocus = activityFocuses.includes(key);
              return (
                <Pressable
                  key={key}
                  onPressIn={() =>
                    setActivityFocuses((current) =>
                      selectedFocus
                        ? current.filter((focus) => focus !== key)
                        : current.length < 4
                          ? [...current, key]
                          : current,
                    )
                  }
                  style={[
                    styles.activityChoice,
                    selectedFocus && styles.activityChoiceActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.activityChoiceText,
                      selectedFocus && styles.activityChoiceTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.activityFields}>
            <TextInput
              value={activityDate}
              onChangeText={setActivityDate}
              placeholder="AAAA-MM-DD"
              keyboardType="numbers-and-punctuation"
              style={[styles.input, styles.activityField]}
            />
            <TextInput
              value={activityDuration}
              onChangeText={setActivityDuration}
              placeholder="Minutos"
              keyboardType="number-pad"
              style={[styles.input, styles.activityField]}
            />
          </View>
          <Text style={styles.sheetEyebrow}>INTENSIDAD</Text>
          <View style={styles.activityChoices}>
            {(
              [
                ["low", "Suave"],
                ["moderate", "Moderada"],
                ["high", "Intensa"],
              ] as [PhysicalActivity["intensity"], string][]
            ).map(([key, label]) => (
              <Pressable
                key={key}
                onPressIn={() => setActivityIntensity(key)}
                style={[
                  styles.activityChoice,
                  activityIntensity === key && styles.activityChoiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.activityChoiceText,
                    activityIntensity === key &&
                      styles.activityChoiceTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={activityNotes}
            onChangeText={setActivityNotes}
            placeholder="Notas opcionales"
            maxLength={500}
            style={styles.input}
          />
          <Button
            title={
              activityStatus === "planned"
                ? "Agregar al calendario"
                : "Guardar actividad"
            }
            onPress={savePhysicalActivity}
          />
          {editingActivityId && (
            <Button
              secondary
              title="Eliminar del calendario"
              onPress={() => {
                storage.deleteActivity(owner, editingActivityId);
                setEditingActivityId(null);
                setActivitySheet(false);
                setTick((value) => value + 1);
              }}
            />
          )}
        </ScrollView>
      </BottomSheet>
      <BottomSheet
        isPresented={swapIndex !== null}
        onDismiss={() => {
          setSwapIndex(null);
          setSwapQuery("");
        }}
        showDragIndicator
        snapPoints={[{ height: 560 }]}
        containerColor="#17211d"
      >
        {session &&
          swapIndex !== null &&
          (() => {
            const current = session.routine.items[swapIndex];
            const localReplacements = availableReplacements(
              current.exercise,
              current.block,
              swapWithoutEquipment ? "bodyweight" : profile?.equipment,
              swapQuery,
            ).filter((exercise) => (exercise.imageUrls?.length ?? 0) >= 2);
            const replacements =
              swapQuery.trim().length >= 2
                ? (replacementCatalogQuery.data?.items ?? []).filter(
                    (exercise) => (exercise.imageUrls?.length ?? 0) >= 2,
                  )
                : localReplacements;
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
                <TextInput
                  value={swapQuery}
                  onChangeText={setSwapQuery}
                  placeholder="Buscar ejercicio, músculo o material"
                  placeholderTextColor="#8d9992"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
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
                    accessibilityRole="button"
                    accessibilityLabel={`Elegir ${exercise.name}`}
                    style={styles.replacement}
                    onPress={() => {
                      replaceExercise(swapIndex, exercise);
                    }}
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
                {!replacementCatalogQuery.isFetching &&
                  replacements.length === 0 && (
                    <Text style={styles.sheetBody}>
                      Escribí al menos dos letras. Sólo mostramos ejercicios con
                      demostración visual completa.
                    </Text>
                  )}
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
                <ExerciseVisual exercise={detail} />
                <Text style={styles.muted}>
                  {detail.imageUrls?.length
                    ? "Demostración fotográfica · inicio y movimiento"
                    : "Guía técnica · inicio y movimiento"}
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
const displayFont = Platform.select({
  ios: "Avenir Next Condensed",
  android: "sans-serif-condensed",
  default: undefined,
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#efefed" },
  header: {
    paddingHorizontal: 18,
    minHeight: 72,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f6",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d9d9d5",
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#173e34",
  },
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
  content: { padding: 18, gap: 18, paddingBottom: 132 },
  finishWorkout: {
    minHeight: 68,
    borderRadius: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#c8ff63",
  },
  finishWorkoutPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  finishWorkoutText: {
    flex: 1,
    color: "#173e34",
    fontSize: 17,
    fontWeight: "900",
  },
  finishWorkoutArrow: {
    color: "#173e34",
    fontSize: 24,
    fontWeight: "900",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: "#647d6d",
  },
  hero: {
    fontFamily: displayFont,
    fontSize: 43,
    lineHeight: 45,
    fontWeight: "900",
    letterSpacing: -1.8,
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
  workoutBlockHeader: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 3,
    backgroundColor: "#173e34",
  },
  workoutBlockNumber: {
    color: "#c8ff63",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  workoutBlockTitle: {
    fontFamily: displayFont,
    color: "white",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
  },
  workoutBlockPurpose: { color: "#b9c8be", fontSize: 12, lineHeight: 17 },
  card: {
    backgroundColor: "#fafaf8",
    padding: 20,
    borderRadius: 24,
    gap: 15,
    shadowColor: "#101915",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
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
  title: {
    fontFamily: displayFont,
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: "#193f35",
  },
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
  activityFab: {
    position: "absolute",
    right: 24,
    zIndex: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c8ff63",
    borderWidth: 1,
    borderColor: "rgba(23,62,52,0.16)",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
  },
  activityFabPressed: { opacity: 0.8, transform: [{ scale: 0.94 }] },
  activityFabPlus: {
    color: "#173e34",
    fontSize: 33,
    lineHeight: 36,
    fontWeight: "500",
  },
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
    fontFamily: displayFont,
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
  activityChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityChoice: {
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  activityChoiceActive: { backgroundColor: "#c8ff63" },
  activityChoiceText: {
    color: "#51675c",
    fontSize: 13,
    fontWeight: "800",
  },
  activityChoiceTextActive: { color: "#173e34" },
  activityFields: { flexDirection: "row", gap: 8 },
  activityField: { flex: 1 },
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
