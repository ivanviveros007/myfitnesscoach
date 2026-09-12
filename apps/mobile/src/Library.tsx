import React, { useState } from "react";
import {
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { exercises, type Exercise } from "@myfitnesscoach/contracts";
import { Button } from "./AppButton";

export function Library({
  favorites,
  selected,
  onFavorite,
  onSelect,
  onGuide,
  onStart,
}: {
  favorites: string[];
  selected: string[];
  onFavorite: (id: string) => void;
  onSelect: (id: string) => void;
  onGuide: (exercise: Exercise) => void;
  onStart: () => void;
}) {
  const [query, setQuery] = useState("");
  const visible = exercises.filter((exercise) =>
    `${exercise.name} ${exercise.muscles} ${exercise.equipment}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <View style={s.container}>
      <Text style={s.kicker}>MI BIBLIOTECA</Text>
      <Text style={s.hero}>Movimientos</Text>
      <Text style={s.body}>
        Guardá ejercicios o elegí varios para una sesión libre.
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por movimiento, músculo o material"
        style={s.search}
      />
      {selected.length > 0 && (
        <View style={s.selection}>
          <Text style={s.selectionText}>{selected.length} seleccionados</Text>
          <Button title="Empezar sesión libre" onPress={onStart} />
        </View>
      )}
      {visible.map((exercise) => (
        <View key={exercise.id} style={s.card}>
          <Pressable style={s.copy} onPress={() => onGuide(exercise)}>
            <Text style={s.title}>{exercise.name}</Text>
            <Text style={s.meta}>{exercise.muscles}</Text>
            <Text style={s.meta}>{exercise.equipment}</Text>
            <Text style={s.link}>Ver demostración →</Text>
          </Pressable>
          <View style={s.actions}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected.includes(exercise.id) }}
              onPress={() => onSelect(exercise.id)}
              style={[s.action, selected.includes(exercise.id) && s.active]}
            >
              <Text style={s.actionText}>
                {selected.includes(exercise.id) ? "✓" : "+"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favorites.includes(exercise.id)
                  ? "Quitar de favoritos"
                  : "Guardar en favoritos"
              }
              onPress={() => onFavorite(exercise.id)}
              style={s.action}
            >
              <Text style={s.actionText}>
                {favorites.includes(exercise.id) ? "★" : "☆"}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  container: { gap: 16 },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#718077",
  },
  hero: {
    fontFamily: Platform.select({ ios: "Avenir Next Condensed" }),
    fontSize: 44,
    lineHeight: 46,
    fontWeight: "900",
    letterSpacing: -1.4,
    color: "#173e34",
  },
  body: { fontSize: 15, lineHeight: 22, color: "#526257" },
  search: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: "#fafaf8",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#173e34",
  },
  selection: {
    backgroundColor: "#e8f8cb",
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  selectionText: { fontSize: 18, fontWeight: "800", color: "#173e34" },
  card: {
    minHeight: 116,
    backgroundColor: "#fafaf8",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#102b24",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  copy: { flex: 1, gap: 4 },
  title: {
    fontFamily: Platform.select({ ios: "Avenir Next Condensed" }),
    fontSize: 21,
    fontWeight: "900",
    color: "#173e34",
  },
  meta: { fontSize: 12, color: "#748178" },
  link: { fontSize: 13, fontWeight: "700", color: "#315d4d", marginTop: 5 },
  actions: { gap: 8 },
  action: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#edf2e8",
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: "#c8ff63" },
  actionText: { fontSize: 21, fontWeight: "800", color: "#173e34" },
});
