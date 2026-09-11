import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

export type AppTab = "today" | "history" | "account";

const tabs: { key: AppTab; label: string; icon: SymbolViewProps["name"] }[] = [
  { key: "today", label: "Entrenar", icon: "figure.run" },
  { key: "history", label: "Rendimiento", icon: "chart.bar.fill" },
  { key: "account", label: "Perfil", icon: "person.fill" },
];

function TabButton({
  item,
  active,
  onPress,
}: {
  item: (typeof tabs)[number];
  active: boolean;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      damping: 16,
      stiffness: 210,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [active, progress]);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      onPress={onPress}
      style={({ pressed }) => [s.tab, pressed && s.pressed]}
    >
      <Animated.View
        style={[
          s.activeSurface,
          {
            opacity: progress,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.78, 1],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          s.iconWrap,
          {
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, -1],
                }),
              },
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          },
        ]}
      >
        <SymbolView
          name={item.icon}
          size={23}
          tintColor={active ? "#c8ff63" : "#65766c"}
          weight={active ? "bold" : "medium"}
        />
      </Animated.View>
      <Text numberOfLines={1} style={[s.label, active && s.labelActive]}>
        {item.label}
      </Text>
      {active && <View style={s.dot} />}
    </Pressable>
  );
}

export function FloatingTabs({
  value,
  onChange,
}: {
  value: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <View style={s.outer}>
      <BlurView intensity={72} tint="systemChromeMaterialLight" style={s.blur}>
        <View style={s.bar}>
          {tabs.map((item) => (
            <TabButton
              key={item.key}
              item={item}
              active={value === item.key}
              onPress={() => onChange(item.key)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    paddingHorizontal: 14,
    paddingTop: 7,
    paddingBottom: 7,
    backgroundColor: "transparent",
  },
  blur: {
    overflow: "hidden",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    shadowColor: "#173e34",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  bar: {
    height: 72,
    padding: 6,
    flexDirection: "row",
    backgroundColor: "rgba(237,241,233,0.68)",
  },
  tab: {
    flex: 1,
    minWidth: 0,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  activeSurface: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 21,
    backgroundColor: "#173e34",
  },
  iconWrap: { height: 26, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700", color: "#65766c" },
  labelActive: { color: "white", fontWeight: "900" },
  dot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#c8ff63",
  },
  pressed: { opacity: 0.72 },
});
