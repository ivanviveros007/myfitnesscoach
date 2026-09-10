import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Session } from "@myfitnesscoach/contracts";
import { Button } from "./AppButton";

export function AmrapPanel({
  session,
  onStart,
  onRound,
}: {
  session: Session;
  onStart: () => void;
  onRound: () => void;
}) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => refresh((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!session.amrap) return null;
  const elapsed = session.amrap.startedAt
    ? Math.floor(
        (Date.now() - new Date(session.amrap.startedAt).getTime()) / 1000,
      )
    : 0;
  const remaining = Math.max(0, session.amrap.durationSeconds - elapsed);
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  return (
    <View style={s.panel}>
      <Text style={s.kicker}>
        {session.amrap.startedAt ? "AMRAP EN CURSO" : "DESPUÉS DEL WARM UP"}
      </Text>
      <Text style={s.clock}>{clock}</Text>
      <View style={s.row}>
        <View>
          <Text style={s.number}>{session.amrap.rounds}</Text>
          <Text style={s.label}>RONDAS COMPLETAS</Text>
        </View>
      </View>
      {!session.amrap.startedAt ? (
        <Button title="Iniciar reloj AMRAP" onPress={onStart} />
      ) : remaining > 0 ? (
        <Button title="Completar una ronda" onPress={onRound} />
      ) : (
        <Text style={s.finished}>
          Tiempo cumplido · guardá cómo terminaste la sesión.
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  panel: { backgroundColor: "#173e34", borderRadius: 26, padding: 20, gap: 14 },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#c8ff63",
  },
  clock: { fontSize: 58, fontWeight: "900", letterSpacing: -2, color: "white" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  number: { fontSize: 32, fontWeight: "900", color: "#c8ff63" },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#c5d0c8",
  },
  finished: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: "white" },
});
