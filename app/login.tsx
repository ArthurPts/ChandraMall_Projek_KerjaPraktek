    import { useRouter } from "expo-router";
import React, { useState } from "react";
    import { Ionicons } from "@expo/vector-icons";
    import {
      Alert,
      KeyboardAvoidingView,
      Platform,
      ScrollView,
      StyleSheet,
      Text,
      TextInput,
      TouchableOpacity,
      View,
    } from "react-native";
    import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "../constants/Colors";

import { BASE } from "../constants/Api";

export default function Login() {
  const [email, setEmail] = useState("buyer@demo.com");
  const [password, setPassword] = useState("12345");
  const router = useRouter();

  const login = async () => {
    try {
      const res = await fetch(`${BASE}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(`Login request failed (${res.status})`);
      const data = await res.json();
      if (data.error) {
        Alert.alert("Login gagal", data.error);
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      Alert.alert("Error", "Tidak bisa konek ke server");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(500)} style={styles.content}>
          <View style={styles.brandMark}>
            <Ionicons name="storefront" size={31} color={Colors.white} />
          </View>
          <Text style={styles.brand}>Chandra Mall</Text>
          <Text style={styles.subtitle}>Marketplace Indonesia – Hong Kong</Text>

          <View style={styles.formCard}>
            <Text style={styles.welcome}>Selamat datang</Text>
            <Text style={styles.formSubtitle}>Masuk untuk melanjutkan belanja Anda.</Text>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={19} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={19} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={login} activeOpacity={0.85}>
              <Text style={styles.btnText}>Masuk</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.muted} />
            <Text style={styles.footerText}>Belanja nyaman, aman, dan mudah</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 22 },
  content: { alignItems: "center", width: "100%" },
  brandMark: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    marginBottom: 13,
    width: 64,
  },
  brand: { color: Colors.burgundy, fontSize: 29, fontWeight: "800", textAlign: "center" },
  subtitle: { color: Colors.muted, fontSize: 13, marginBottom: 27, marginTop: 5, textAlign: "center" },
  formCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    width: "100%",
  },
  welcome: { color: Colors.navy, fontSize: 21, fontWeight: "800" },
  formSubtitle: { color: Colors.muted, fontSize: 13, marginBottom: 22, marginTop: 5 },
  label: { color: Colors.navy, fontSize: 12, fontWeight: "700", marginBottom: 7 },
  inputWrap: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  input: {
    color: Colors.navy,
    flex: 1,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: 10,
  },
  btn: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
    minHeight: 50,
  },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: "700", marginRight: 8 },
  footer: { alignItems: "center", flexDirection: "row", marginTop: 22 },
  footerText: { color: Colors.muted, fontSize: 12, marginLeft: 6 },
});