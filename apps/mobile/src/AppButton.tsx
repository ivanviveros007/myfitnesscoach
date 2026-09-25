import React from "react";
import { useWindowDimensions } from "react-native";
import { Host, Button as ExpoButton, Text as ExpoText } from "@expo/ui";
export function Button({
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
  const { fontScale } = useWindowDimensions();
  const height = Math.max(64, Math.ceil(24 + 40 * fontScale));
  return (
    <Host
      ignoreSafeArea="all"
      seedColor="#214d3e"
      style={{ width: "100%", height, flexShrink: 0 }}
    >
      <ExpoButton
        onPress={onPress}
        disabled={disabled}
        variant={secondary ? "outlined" : "filled"}
        style={{
          height,
          width: "100%",
          borderRadius: 16,
          paddingHorizontal: 12,
        }}
      >
        <ExpoText
          style={{ width: "100%", height: height - 20 }}
          textStyle={{ fontSize: 17, fontWeight: "600", textAlign: "center" }}
        >
          {title}
        </ExpoText>
      </ExpoButton>
    </Host>
  );
}

export function ChoicePill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  const height = Math.max(44, Math.ceil(34 + 10 * fontScale));
  const width = Math.max(
    76,
    Math.ceil(label.length * 8.2 * Math.min(fontScale, 1.25) + 34),
  );

  return (
    <Host
      ignoreSafeArea="all"
      seedColor={selected ? "#c8ff63" : "#f8faf6"}
      style={{ width, height, flexShrink: 0 }}
    >
      <ExpoButton
        onPress={onPress}
        variant="filled"
        style={{
          width,
          height,
          borderRadius: height / 2,
          paddingHorizontal: 10,
        }}
      >
        <ExpoText
          style={{ width: width - 20, height: height - 14 }}
          textStyle={{
            color: "#173e34",
            fontSize: 13,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {label}
        </ExpoText>
      </ExpoButton>
    </Host>
  );
}
