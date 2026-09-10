import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { WebView } from "react-native-webview";
import * as Crypto from "expo-crypto";
import { StatusBar } from "expo-status-bar";
import { Host, Button as ExpoButton } from "@expo/ui";
import {
  exercises,
  orientations,
  template,
  exerciseStatus,
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
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Host matchContents>
      <ExpoButton
        label={title}
        onPress={onPress}
        disabled={disabled}
        variant={secondary ? "outlined" : "filled"}
      />
    </Host>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
function Main() {
  const [account, setAccount] = useState<api.Account | null>(null),
    [ready, setReady] = useState(false),
    [orientation, setOrientation] = useState<Orientation>("padel");
  const [tab, setTab] = useState<"today" | "history" | "account">("today"),
    [session, setSession] = useState<Session | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Exercise | null>(null),
    [video, setVideo] = useState(false),
    [online, setOnline] = useState(true),
    [notice, setNotice] = useState("Guardado en este dispositivo");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [url, setUrl] = useState(process.env.EXPO_PUBLIC_API_URL ?? ""),
    [busy, setBusy] = useState(false),
    [tick, setTick] = useState(0);
  const owner = account?.userId ?? "guest";
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const rows = ready ? storage.history(owner) : [];
  const count = ready ? storage.pending(owner).length : 0;
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
        setNotice("Todo sincronizado");
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
  function start() {
    const routine = template(orientation, selected);
    const next: Session = {
      id: Crypto.randomUUID(),
      routine,
      startedAt: new Date().toISOString(),
      finishedAt: null,
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
        <View>
          <Text style={styles.brand}>MY FITNESS COACH</Text>
          <Text style={styles.subtitle}>Un entrenamiento a la vez.</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {online ? "● En línea" : "○ Sin conexión"}
          </Text>
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {tab === "today" && !session && (
          <>
            <Text style={styles.eyebrow}>TU PRÓXIMA SESIÓN</Text>
            <Text style={styles.hero}>Entrená para{"\n"}lo que te mueve.</Text>
            <View style={styles.wrap}>
              {(Object.keys(orientations) as Orientation[]).map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: orientation === key }}
                  onPress={() => setOrientation(key)}
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
            <View style={styles.card}>
              <Text style={styles.title}>
                {orientation === "free"
                  ? "Armá tu sesión"
                  : `Base ${orientations[orientation].name}`}
              </Text>
              <Text style={styles.body}>{orientations[orientation].focus}</Text>
              <Text style={styles.muted}>
                Plantilla de demostración · sin personalización todavía
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
                          {p.exercise.id === "bird-dog" ? "por lado" : ""}
                        </Text>
                      </View>
                      <Text style={styles.link}>Cómo hacerlo ↗</Text>
                    </Pressable>
                  ))}
              <Button
                title={
                  active ? "Retomar sesión pendiente" : "Comenzar entrenamiento"
                }
                disabled={!active && orientation === "free" && !selected.length}
                onPress={() => (active ? setSession(active.session) : start())}
              />
            </View>
            <View style={styles.softCard}>
              <Text style={styles.title}>Tu entrenador</Text>
              <Text style={styles.body}>
                {!online
                  ? "Tu entrenador vuelve cuando recuperes la conexión. Podés seguir entrenando y registrar tu progreso."
                  : "Estamos preparando tu asistente. Por ahora podés explorar las rutinas y registrar tus sesiones."}
              </Text>
            </View>
          </>
        )}
        {tab === "today" && session && (
          <>
            <Pressable onPress={() => setSession(null)}>
              <Text style={styles.link}>← Volver al inicio</Text>
            </Pressable>
            <Text style={styles.hero}>{session.routine.name}</Text>
            <Text style={styles.body}>
              {session.items.filter((i) => i.status === "completed").length} de{" "}
              {session.items.length} ejercicios completos
            </Text>
            {session.routine.items.map((p, index) => {
              const item = session.items[index];
              return (
                <View style={styles.card} key={p.exercise.id}>
                  <Text style={styles.eyebrow}>
                    {String(index + 1).padStart(2, "0")} / {labels[item.status]}
                  </Text>
                  <Text style={styles.title}>{p.exercise.name}</Text>
                  <ExerciseDiagram kind={p.exercise.illustration} />
                  <Text style={styles.body}>{p.exercise.steps[0]}</Text>
                  <Button
                    secondary
                    title="Ver técnica, pasos y video"
                    onPress={() => {
                      setDetail(p.exercise);
                      setVideo(false);
                    }}
                  />
                  <Text style={styles.muted}>
                    Descanso previsto: {p.restSeconds} s · Peso adicional en kg
                    {p.exercise.id === "bird-dog"
                      ? " · Repeticiones por lado"
                      : ""}
                  </Text>
                  {item.series.map((serie, n) => (
                    <View key={n} style={styles.series}>
                      <Text style={styles.body}>Serie {n + 1}</Text>
                      <TextInput
                        editable={!session.finishedAt}
                        accessibilityLabel={`Repeticiones serie ${n + 1}`}
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
                      <Text style={styles.muted}>rep.</Text>
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
          <>
            <Text style={styles.hero}>Tu recorrido.</Text>
            <Text style={styles.body}>
              Tus sesiones completas y parciales, siempre a mano.
            </Text>
            {!rows.length && (
              <Text style={styles.muted}>
                Todavía no registraste entrenamientos.
              </Text>
            )}
            {rows.map(({ session: s }) => (
              <Pressable
                key={s.id}
                style={styles.card}
                onPress={() => {
                  setSession(s);
                  setTab("today");
                }}
              >
                <Text style={styles.eyebrow}>
                  {new Date(s.startedAt).toLocaleDateString("es-AR")}
                </Text>
                <Text style={styles.title}>{s.routine.name}</Text>
                <Text style={styles.body}>
                  {s.items.filter((i) => i.status === "completed").length}/
                  {s.items.length} completos ·{" "}
                  {s.finishedAt ? "Finalizada" : "En curso"}
                </Text>
              </Pressable>
            ))}
          </>
        )}
        {tab === "account" && (
          <>
            <Text style={styles.hero}>Tu espacio.</Text>
            <Text style={styles.body}>
              Podés entrenar sin cuenta. Al ingresar, las sesiones locales se
              vinculan a tu cuenta y se sincronizan.
            </Text>
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
        )}
        <Text style={styles.sync}>
          {!online ? "Sin conexión · " : ""}
          {notice}
          {count ? ` · ${count} cambios pendientes` : ""}
        </Text>
      </ScrollView>
      <View style={styles.nav}>
        {(
          [
            ["today", "Entrenar"],
            ["history", "Historial"],
            ["account", "Mi cuenta"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={styles.navItem}
          >
            <Text
              style={[
                styles.navText,
                tab === key && { color: "#143f37", fontWeight: "800" },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Modal
        visible={!!detail}
        animationType="slide"
        onRequestClose={() => setDetail(null)}
      >
        <SafeAreaView style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content}>
            <Button
              secondary
              title="Cerrar guía"
              onPress={() => {
                setDetail(null);
                setVideo(false);
              }}
            />
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
                        uri: `https://www.youtube.com/embed/${detail.videoId}`,
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
                      title="Abrir en YouTube"
                      onPress={() =>
                        void Linking.openURL(
                          `https://www.youtube.com/watch?v=${detail.videoId}`,
                        )
                      }
                    />
                  </>
                )}
                <Pressable
                  onPress={() => void Linking.openURL(detail.sourceUrl)}
                >
                  <Text style={styles.link}>
                    Fuente de técnica y video: NASM ↗
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f7f1" },
  header: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "800",
    color: "#143f37",
  },
  subtitle: { fontSize: 12, color: "#738379", marginTop: 5 },
  pill: { backgroundColor: "#e3ece3", padding: 8, borderRadius: 20 },
  pillText: { fontSize: 11, color: "#315d4d" },
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
  softCard: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#e8eddc",
    gap: 10,
  },
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
  series: { flexDirection: "row", gap: 7, alignItems: "center" },
  number: {
    width: 45,
    borderWidth: 1,
    borderColor: "#dce4d8",
    borderRadius: 9,
    padding: 8,
    textAlign: "center",
    color: "#143f37",
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8ede5",
  },
  sync: { fontSize: 11, lineHeight: 17, color: "#778379", textAlign: "center" },
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8dd",
    paddingVertical: 16,
  },
  navItem: { flex: 1, alignItems: "center" },
  navText: { color: "#8b958c", fontSize: 13 },
});
