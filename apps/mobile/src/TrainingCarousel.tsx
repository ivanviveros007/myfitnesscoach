import React, { useState } from "react";
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { BottomSheet, RNHostView } from "@expo/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  routineBlocks,
  type Routine,
  type Prescription,
  type WorkoutBlock,
} from "@myfitnesscoach/contracts";

type CardImage = "padel" | "strength" | "mobility" | "amrap";
type Choice = {
  key: string;
  title: string;
  tag: string;
  icon: SymbolViewProps["name"];
  routine: Routine;
  color: string;
  image: CardImage;
};
const cardImages = {
  padel: require("../assets/training/padel-conditioning.jpg"),
  strength: require("../assets/training/strength.jpg"),
  mobility: require("../assets/training/mobility.jpg"),
  amrap: require("../assets/training/amrap.jpg"),
};

export function TrainingCarousel({
  choices,
  onStart,
}: {
  choices: Choice[];
  onStart: (routine: Routine) => void;
}) {
  const [selected, setSelected] = useState(choices[0]?.key ?? "");
  const [preview, setPreview] = useState<Choice | null>(null);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const current =
    choices.find((choice) => choice.key === selected) ?? choices[0];
  if (!current) return null;
  const selectNext = () => {
    const index = choices.findIndex((choice) => choice.key === current.key);
    setSelected(choices[(index + 1) % choices.length]?.key ?? current.key);
  };
  return (
    <View style={s.section}>
      <View>
        <Text style={s.eyebrow}>ELEGÍ TU EXPERIENCIA</Text>
        <Text style={s.heading}>¿Qué querés entrenar?</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={236}
        contentContainerStyle={s.track}
      >
        {choices.map((choice) => {
          const active = choice.key === current.key;
          const content = (
            <>
              <View style={s.imageShade} />
              <View style={[s.icon, active && s.iconActive]}>
                <SymbolView
                  name={choice.icon}
                  size={23}
                  tintColor={active ? "#173e34" : "white"}
                  weight="bold"
                />
              </View>
              <View style={s.cardCopy}>
                <Text style={s.tag}>{choice.tag}</Text>
                <Text style={s.cardTitle}>{choice.title}</Text>
                <Text style={s.cardMeta}>
                  ≈ {choice.routine.estimatedMinutes} min ·{" "}
                  {choice.routine.items.length} movimientos
                </Text>
              </View>
            </>
          );
          return (
            <Pressable
              key={choice.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setSelected(choice.key);
                setPreview(choice);
              }}
              style={({ pressed }) => [
                s.card,
                { backgroundColor: choice.color },
                active && s.cardActive,
                pressed && s.cardPressed,
              ]}
            >
              <ImageBackground
                source={cardImages[choice.image]}
                resizeMode="cover"
                imageStyle={s.cardImage}
                style={s.image}
              >
                {content}
              </ImageBackground>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar rutina propuesta"
        onPress={selectNext}
        style={({ pressed }) => [s.changeRoutine, pressed && s.cardPressed]}
      >
        <SymbolView
          name="arrow.trianglehead.2.clockwise.rotate.90"
          size={18}
          tintColor="#173e34"
          weight="bold"
        />
        <View style={s.changeRoutineCopy}>
          <Text style={s.changeRoutineTitle}>Cambiar rutina</Text>
          <Text style={s.changeRoutineText}>
            Ver otra propuesta para entrenar hoy
          </Text>
        </View>
        <Text style={s.changeRoutineArrow}>›</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => setPreview(current)}
        style={({ pressed }) => [s.cta, pressed && s.cardPressed]}
      >
        <Text style={s.ctaText}>Ver ejercicios</Text>
        <Text style={s.ctaArrow}>→</Text>
      </Pressable>
      <BottomSheet
        isPresented={preview !== null}
        onDismiss={() => setPreview(null)}
        showDragIndicator
        snapPoints={["full"]}
        containerColor="#17211d"
      >
        {preview && (
          <RNHostView
            style={{
              width: screenWidth,
              height: Math.max(560, screenHeight - Math.max(insets.top, 12)),
              backgroundColor: "#17211d",
            }}
          >
            <View
              style={[
                s.sheet,
                {
                  width: Math.max(280, screenWidth - 24),
                  paddingBottom: Math.max(insets.bottom, 18),
                },
              ]}
            >
              <View style={s.sheetTag}>
                <Text style={s.sheetEyebrow}>{preview.tag}</Text>
              </View>
              <Text style={s.sheetTitle}>{preview.title}</Text>
              <Text style={s.sheetMeta}>
                ≈ {preview.routine.estimatedMinutes} min ·{" "}
                {preview.routine.items.length} movimientos
              </Text>
              <ScrollView
                style={s.sheetList}
                contentContainerStyle={s.sheetListContent}
                showsVerticalScrollIndicator={false}
              >
                {routineBlocks(preview.routine).map((block, blockIndex) => (
                  <View key={block.id} style={s.sheetBlock}>
                    <Text style={s.sheetBlockTitle}>
                      {String(blockIndex + 1).padStart(2, "0")} · {block.title}
                    </Text>
                    {block.items.map((item) => (
                      <View key={item.exercise.id} style={s.sheetExercise}>
                        <Text style={s.sheetExerciseName}>
                          {item.exercise.name}
                        </Text>
                        <Text style={s.sheetPrescription}>
                          {prescriptionLabel(item, block.format)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const routine = preview.routine;
                  setPreview(null);
                  onStart(routine);
                }}
                style={({ pressed }) => [
                  s.sheetStart,
                  pressed && s.cardPressed,
                ]}
              >
                <Text style={s.sheetStartText}>Iniciar entrenamiento</Text>
                <Text style={s.sheetStartArrow}>→</Text>
              </Pressable>
            </View>
          </RNHostView>
        )}
      </BottomSheet>
    </View>
  );
}

function prescriptionLabel(item: Prescription, format: WorkoutBlock["format"]) {
  const amount = `${item.reps} ${item.unit === "seconds" ? "s" : "rep."}`;
  if (format === "amrap") return `${amount} por ronda`;
  return `${item.sets} ${item.sets === 1 ? "serie" : "series"} × ${amount}${item.perSide ? " por lado" : ""}`;
}

const displayFont = Platform.select({
  ios: "Avenir Next Condensed",
  android: "sans-serif-condensed",
  default: undefined,
});
const s = StyleSheet.create({
  section: { gap: 15, marginHorizontal: -22 },
  eyebrow: {
    paddingHorizontal: 22,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "900",
    color: "#708477",
  },
  heading: {
    paddingHorizontal: 22,
    marginTop: 4,
    fontFamily: displayFont,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: "#173e34",
  },
  track: { gap: 12, paddingHorizontal: 22, paddingVertical: 4 },
  card: {
    width: 224,
    height: 280,
    borderRadius: 25,
    overflow: "hidden",
    padding: 17,
    justifyContent: "space-between",
    borderWidth: 3,
    borderColor: "transparent",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  cardActive: { borderColor: "#c8ff63", transform: [{ translateY: -3 }] },
  cardPressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  changeRoutine: {
    minHeight: 64,
    marginHorizontal: 22,
    borderRadius: 19,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#e8eddf",
  },
  changeRoutineCopy: { flex: 1, gap: 2 },
  changeRoutineTitle: { color: "#173e34", fontSize: 15, fontWeight: "900" },
  changeRoutineText: { color: "#62766a", fontSize: 11 },
  changeRoutineArrow: { color: "#173e34", fontSize: 28, lineHeight: 30 },
  sheet: {
    flex: 1,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  sheetTag: {
    alignSelf: "flex-start",
    borderRadius: 7,
    backgroundColor: "#c8ff63",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sheetEyebrow: {
    color: "#173e34",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sheetTitle: {
    color: "white",
    fontFamily: displayFont,
    fontSize: 33,
    lineHeight: 37,
    fontWeight: "900",
  },
  sheetMeta: { color: "#b8c7bd", fontSize: 13, marginBottom: 6 },
  sheetList: { flex: 1, width: "100%", alignSelf: "stretch" },
  sheetListContent: { gap: 15, paddingBottom: 12 },
  sheetBlock: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 18,
    padding: 14,
    gap: 8,
    backgroundColor: "#f8f9f4",
    borderWidth: 1,
    borderColor: "#e1e7dd",
  },
  sheetBlockTitle: {
    color: "#173e34",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sheetExercise: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetExerciseName: { flex: 1, color: "#284a40", fontSize: 14 },
  sheetPrescription: { color: "#708277", fontSize: 11, textAlign: "right" },
  sheetStart: {
    width: "100%",
    alignSelf: "stretch",
    minHeight: 62,
    borderRadius: 20,
    backgroundColor: "#c8ff63",
    paddingHorizontal: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetStartText: { color: "#173e34", fontSize: 17, fontWeight: "900" },
  sheetStartArrow: { color: "#173e34", fontSize: 25, fontWeight: "900" },
  image: { flex: 1, margin: -17, padding: 17, justifyContent: "space-between" },
  cardImage: { borderRadius: 22 },
  imageShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(7,30,24,0.38)",
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: { backgroundColor: "#c8ff63" },
  cardCopy: { gap: 6 },
  tag: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "rgba(13,37,31,0.62)",
    color: "#c8ff63",
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: "900",
  },
  cardTitle: {
    fontFamily: displayFont,
    fontSize: 29,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
    color: "white",
  },
  cardMeta: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  },
  cta: {
    minHeight: 60,
    marginHorizontal: 22,
    borderRadius: 19,
    paddingHorizontal: 18,
    backgroundColor: "#c8ff63",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaText: { flex: 1, fontSize: 16, fontWeight: "900", color: "#173e34" },
  ctaArrow: { fontSize: 24, fontWeight: "900", color: "#173e34" },
});
