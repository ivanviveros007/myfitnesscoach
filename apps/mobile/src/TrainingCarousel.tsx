import React, { useState } from "react";
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { Routine } from "@myfitnesscoach/contracts";

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
  const current =
    choices.find((choice) => choice.key === selected) ?? choices[0];
  if (!current) return null;
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
              onPress={() => setSelected(choice.key)}
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
        onPress={() => onStart(current.routine)}
        style={({ pressed }) => [s.cta, pressed && s.cardPressed]}
      >
        <Text style={s.ctaText}>Entrenar · {current.title}</Text>
        <Text style={s.ctaArrow}>→</Text>
      </Pressable>
    </View>
  );
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
