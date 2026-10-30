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

export default function Register() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = () => {
    const handleRegister = async () => {
      const { fullName, email, password, confirmPassword } = form;

      if (
        !fullName.trim() ||
        !email.trim() ||
        !password.trim() ||
        !confirmPassword.trim()
      ) {
        Alert.alert("Perhatian", "Semua field wajib diisi.");
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          "Perhatian",
          "Kata sandi dan konfirmasi kata sandi harus sama.",
        );
        return;
      }

      try {
        const response = await fetch(`${BASE}?action=register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim(),
            phone: form.phone.trim(),
            password,
          }),
        });
        const data = await response.json();
        if (!response.ok || data?.error) {
          throw new Error(
            data?.error ?? `Register request failed (${response.status})`,
          );
        }

        setSessionUser({
          id: Number(data.id),
          name: data.name ?? fullName.trim(),
          email: data.email ?? email.trim(),
          phone: data.phone ?? form.phone.trim(),
          role: data.role ?? "buyer",
        });

        Alert.alert("Registrasi berhasil", "Akun Anda berhasil dibuat.");
        router.replace("/(tabs)");
      } catch (error) {
        console.error(error);
        Alert.alert(
          "Registrasi gagal",
          error instanceof Error ? error.message : "Tidak dapat membuat akun.",
        );
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

          <View
            style={[styles.rightPanel, !isDesktop && styles.rightPanelMobile]}
          >
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Daftar ke Chandra Mall</Text>
              <Text style={styles.formSubtitle}>
                Bergabunglah dengan kami dan nikmati pengalaman belanja yang
                lebih mudah.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nama lengkap"
                    value={form.fullName}
                    onChangeText={(value) => updateField("fullName", value)}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan email"
                    value={form.email}
                    onChangeText={(value) => updateField("email", value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nomor Telepon (opsional)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nomor telepon"
                    value={form.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    keyboardType="phone-pad"
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
                    placeholder="Minimal 8 karakter"
                    value={form.password}
                    onChangeText={(value) => updateField("password", value)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((value) => !value)}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color={Colors.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Konfirmasi Kata Sandi</Text>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ulangi kata sandi"
                    value={form.confirmPassword}
                    onChangeText={(value) =>
                      updateField("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={19}
                      color={Colors.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRegister}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Daftar</Text>
              </TouchableOpacity>

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>Sudah punya akun?</Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.linkText}>Masuk</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.vendorCard}>
              <Text style={styles.vendorTitle}>
                Tertarik untuk menjadi Vendor?
              </Text>
              <View style={styles.vendorList}>
                {[
                  "Akses ke pasar Hong Kong",
                  "Dukungan tim kami",
                  "Proses verifikasi aman",
                ].map((item) => (
                  <View key={item} style={styles.vendorItem}>
                    <View style={styles.checkBadge}>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={Colors.white}
                      />
                    </View>
                    <Text style={styles.vendorText}>{item}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.vendorButton} activeOpacity={0.8}>
                <Text style={styles.vendorButtonText}>
                  Ajukan sebagai Vendor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  };

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
      flex: 1.2,
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
    rightPanel: {
      flex: 1,
      backgroundColor: Colors.white,
      flexDirection: "row",
      alignItems: "stretch",
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl,
      gap: Spacing.lg,
    },
    rightPanelMobile: {
      flexDirection: "column",
      paddingTop: Spacing.xl,
    },
    formCard: {
      flex: 1.6,
      backgroundColor: Colors.white,
      justifyContent: "center",
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
      lineHeight: 22,
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
    primaryButton: {
      alignItems: "center",
      backgroundColor: Colors.burgundy,
      borderRadius: 12,
      justifyContent: "center",
      minHeight: 50,
      marginTop: Spacing.lg,
    },
    primaryButtonText: {
      color: Colors.white,
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
    linkText: {
      color: Colors.burgundy,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.medium,
    },
    vendorCard: {
      flex: 0.9,
      backgroundColor: Colors.ivory,
      borderColor: Colors.border,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: "center",
      padding: Spacing.lg,
    },
    vendorTitle: {
      color: Colors.navy,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      marginBottom: Spacing.md,
    },
    vendorList: {
      gap: Spacing.sm,
    },
    vendorItem: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: Spacing.sm,
    },
    checkBadge: {
      alignItems: "center",
      backgroundColor: Colors.burgundy,
      borderRadius: 999,
      height: 20,
      justifyContent: "center",
      width: 20,
    },
    vendorText: {
      color: Colors.navy,
      flex: 1,
      fontSize: Typography.sizes.sm,
      lineHeight: 20,
    },
    vendorButton: {
      alignItems: "center",
      backgroundColor: Colors.white,
      borderColor: Colors.burgundy,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: "center",
      marginTop: Spacing.lg,
      minHeight: 48,
    },
    vendorButtonText: {
      color: Colors.burgundy,
      fontWeight: Typography.weights.bold,
      fontSize: Typography.sizes.md,
    },
  });
}
