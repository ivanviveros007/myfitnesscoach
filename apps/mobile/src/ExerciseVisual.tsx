import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "@myfitnesscoach/contracts";
import { ExerciseDiagram } from "./ExerciseDiagram";

export function ExerciseVisual({ exercise }: { exercise: Exercise }) {
  if (!exercise.imageUrls?.length)
    return <ExerciseDiagram kind={exercise.illustration} />;
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
});
