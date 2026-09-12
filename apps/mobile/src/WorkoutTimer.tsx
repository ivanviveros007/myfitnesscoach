import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

function clock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function WorkoutClock({ startedAt }: { startedAt: string }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => refresh((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  return (
    <View style={s.workout}>
      <View style={s.copy}>
        <Text style={s.eyebrow}>TIEMPO DE ENTRENAMIENTO</Text>
        <Text style={s.help}>Corre desde que comenzaste la sesión</Text>
      </View>
      <Text style={s.workoutClock}>{clock(elapsed)}</Text>
    </View>
  );
}

export function RestTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, running]);
  const reset = () => {
    setRemaining(seconds);
    setRunning(true);
  };
  return (
    <Pressable
      accessibilityRole="timer"
      accessibilityLabel={`Descanso ${clock(remaining)}`}
      onPress={reset}
      style={[s.rest, running && remaining > 0 && s.restRunning]}
    >
      <Text style={s.restLabel}>
        {remaining === 0
          ? "DESCANSO COMPLETO"
          : running
            ? "DESCANSANDO"
            : "INICIAR DESCANSO"}
      </Text>
      <Text style={s.restClock}>{clock(remaining)}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  workout: {
    minHeight: 92,
    borderRadius: 23,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: "#173e34",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: { flex: 1 },
  eyebrow: {
    color: "#c8ff63",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  help: { color: "#b8c7bd", fontSize: 11, marginTop: 4 },
  workoutClock: { color: "white", fontSize: 29, fontWeight: "900" },
  rest: {
    minHeight: 62,
    borderRadius: 18,
    paddingHorizontal: 15,
    backgroundColor: "#e8eddf",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  restRunning: { backgroundColor: "#c8ff63" },
  restLabel: { flex: 1, color: "#173e34", fontSize: 11, fontWeight: "900" },
  restClock: { color: "#173e34", fontSize: 22, fontWeight: "900" },
});
