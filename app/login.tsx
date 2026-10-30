import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BASE } from "../constants/Api";
import Colors, { Spacing, Typography } from "../constants/Colors";
import { setSessionUser } from "../constants/session";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80";

export default function Login() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const login = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password.trim()) {
      Alert.alert("Perhatian", "Email/telepon dan kata sandi wajib diisi.");
      return;
    }

    try {
      const res = await fetch(`${BASE}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedIdentifier, password }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error ?? `Login request failed (${res.status})`);
      }

      if (!data?.id) {
        throw new Error("Data pengguna tidak lengkap");
      }

      setSessionUser({
        id: Number(data.id),
        name: data.name ?? "Pengguna",
        email: data.email ?? trimmedIdentifier,
        phone: data.phone ?? null,
        role: data.role ?? "buyer",
      });

      Alert.alert("Berhasil", "Login berhasil.");
      router.replace("/(tabs)");
    } catch (error) {
      console.error(error);
      Alert.alert("Login gagal", "Email/telepon atau kata sandi tidak valid.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={[styles.shell, !isDesktop && styles.shellMobile]}
      >
        <ImageBackground
          source={{ uri: HERO_IMAGE }}
          style={[styles.heroPanel, !isDesktop && styles.heroPanelMobile]}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons
                  name="storefront-outline"
                  size={30}
                  color={Colors.white}
                />
              </View>
              <View>
                <Text style={styles.brand}>Chandra Mall</Text>
                <Text style={styles.brandSub}>
                  Produk Indonesia, Detak di Hati
                </Text>
              </View>
            </View>

            <View style={styles.heroTextWrap}>
              <Text
                style={styles.heroTitle}
              >{`Dari Indonesia\nuntuk Hong Kong`}</Text>
              <Text style={styles.heroDescription}>
                Produk pilihan, kualitas terjamin, langsung sampai ke tangan
                Anda.
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={[styles.formPanel, !isDesktop && styles.formPanelMobile]}>
          <Text style={styles.formTitle}>Masuk ke Chandra Mall</Text>
          <Text style={styles.formSubtitle}>
            Selamat datang kembali! Silakan masuk akun Anda.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email atau Nomor Telepon</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan email atau nomor telepon"
                placeholderTextColor={Colors.muted}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={Colors.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan kata sandi"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={Colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberMe((value) => !value)}
              activeOpacity={0.8}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Ingat saya</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8}>
              <Text style={styles.linkText}>Lupa kata sandi?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={login}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Masuk</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>
              Daftar sebagai Pembeli
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Belum punya akun?</Text>
            <TouchableOpacity
              onPress={() => router.push("/register")}
              activeOpacity={0.8}
            >
              <Text style={styles.linkText}>Daftar sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ivory,
  },
  shell: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.white,
    width: "100%",
    minHeight: 640,
  },
  shellMobile: {
    flexDirection: "column",
  },
  heroPanel: {
    flex: 1.12,
    minHeight: 640,
    position: "relative",
  },
  heroPanelMobile: {
    minHeight: 260,
  },
  heroImage: {
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24, 14, 18, 0.38)",
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(123, 29, 63, 0.8)",
  },
  brand: {
    color: Colors.white,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.3,
  },
  brandSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  heroTextWrap: {
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.black,
    lineHeight: 38,
    marginBottom: Spacing.sm,
  },
  heroDescription: {
    color: "rgba(255,255,255,0.9)",
    fontSize: Typography.sizes.md,
    lineHeight: 22,
  },
  formPanel: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  formPanelMobile: {
    paddingTop: Spacing.xl,
  },
  formTitle: {
    color: Colors.navy,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    color: Colors.muted,
    fontSize: Typography.sizes.md,
    marginBottom: Spacing.xl,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.navy,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
  },
  input: {
    color: Colors.navy,
    flex: 1,
    fontSize: Typography.sizes.md,
    minHeight: 48,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  checkboxChecked: {
    backgroundColor: Colors.burgundy,
    borderColor: Colors.burgundy,
  },
  checkboxLabel: {
    color: Colors.navy,
    fontSize: Typography.sizes.sm,
  },
  linkText: {
    color: Colors.burgundy,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 50,
    marginTop: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    backgroundColor: Colors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: Colors.muted,
    fontSize: Typography.sizes.sm,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.burgundy,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  secondaryButtonText: {
    color: Colors.burgundy,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  bottomText: {
    color: Colors.muted,
    fontSize: Typography.sizes.sm,
  },
});
