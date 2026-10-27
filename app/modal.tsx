import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import Colors from "../constants/Colors";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="sparkles-outline" size={30} color={Colors.burgundy} />
        </View>
        <ThemedText type="title" style={styles.title}>Selamat datang</ThemedText>
        <ThemedText style={styles.description}>
          Jelajahi Chandra Mall dan temukan produk pilihan untuk Anda.
        </ThemedText>
        <Link href="/" dismissTo style={styles.link}>
          <ThemedText style={styles.linkText}>Kembali ke toko</ThemedText>
          <Ionicons name="arrow-forward" size={17} color={Colors.white} />
        </Link>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 25,
    width: "100%",
  },
  icon: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 27,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  title: { color: Colors.navy, marginTop: 16, textAlign: "center" },
  description: { color: Colors.muted, marginTop: 8, textAlign: "center" },
  link: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 48,
    paddingHorizontal: 18,
  },
  linkText: { color: Colors.white, fontWeight: "700" },
});
