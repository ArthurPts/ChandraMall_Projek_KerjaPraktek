import { Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TopNavbar } from "../components/TopNavbar";
import Colors from "../constants/Colors";
import { initSession } from "../constants/session";

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Initialize persistent user session on launch
  useEffect(() => {
    initSession();
  }, []);

  const hideTopNavbar = pathname === "/login" || pathname === "/register";

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {!hideTopNavbar && <TopNavbar />}
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.ivory },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="category/[slug]" />
            <Stack.Screen name="vendor/[slug]" />
            <Stack.Screen name="vendors" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="checkout" />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ivory,
  },
  content: {
    flex: 1,
  },
});
