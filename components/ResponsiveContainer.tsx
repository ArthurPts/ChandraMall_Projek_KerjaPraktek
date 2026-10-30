import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useResponsive } from "../hooks/useResponsive";

type ResponsiveContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
};

export function ResponsiveContainer({
  children,
  style,
  maxWidth = 1240,
}: ResponsiveContainerProps) {
  const { horizontalPadding } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth,
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center",
  },
});

export default ResponsiveContainer;
