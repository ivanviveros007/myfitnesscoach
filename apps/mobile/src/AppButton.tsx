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
