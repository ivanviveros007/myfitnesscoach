import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "@myfitnesscoach/contracts";

export function ExerciseVisual({ exercise }: { exercise: Exercise }) {
  if (!exercise.imageUrls?.length)
    return (
      <View style={s.pending}>
        <Text style={s.pendingMark}>M</Text>
        <Text style={s.pendingTitle}>Demostración en revisión</Text>
        <Text style={s.pendingBody}>
          Usá las instrucciones técnicas. No mostraremos una imagen genérica que pueda confundirte.
        </Text>
      </View>
    );
  return (
    <View style={s.visuals}>
      {exercise.imageUrls.slice(0, 2).map((uri, index) => (
        <View key={uri} style={s.frame}>
          <Image source={{ uri }} resizeMode="contain" style={s.image} />
          <Text style={s.label}>{index === 0 ? "INICIO" : "MOVIMIENTO"}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  visuals: { flexDirection: "row", gap: 8, width: "100%" },
  frame: { flex: 1, borderRadius: 20, backgroundColor: "#fafaf8", overflow: "hidden" },
  image: { width: "100%", aspectRatio: 0.9, backgroundColor: "#fafaf8" },
  label: { paddingVertical: 8, textAlign: "center", fontSize: 10, fontWeight: "800", color: "#718077", letterSpacing: 1 },
  pending: { width: "100%", minHeight: 190, borderRadius: 22, backgroundColor: "#edf2e8", alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  pendingMark: { fontSize: 34, fontWeight: "900", color: "#173e34" },
  pendingTitle: { fontSize: 17, fontWeight: "900", color: "#173e34" },
  pendingBody: { maxWidth: 290, textAlign: "center", fontSize: 13, lineHeight: 19, color: "#64746b" },
});
