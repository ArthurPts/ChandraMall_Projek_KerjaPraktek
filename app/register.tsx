import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

interface RegisterErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

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
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: RegisterErrors = {};
    const { fullName, email, phone, password, confirmPassword } = form;

    // Nama Lengkap
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = "Nama lengkap wajib diisi.";
    } else if (trimmedName.length < 3) {
      newErrors.fullName = "Nama lengkap minimal 3 karakter.";
    }

    // Email
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      newErrors.email = "Email wajib diisi.";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Format email tidak valid (contoh: user@mail.com).";
    }

    // Nomor Telepon (opsional)
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const phoneRegex = /^[\+]?[0-9\s\-]{8,20}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        newErrors.phone =
          "Format telepon tidak valid (contoh: 08123456789 atau +62/+852).";
      }
    }

    // Kata Sandi
    if (!password) {
      newErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      newErrors.password = "Kata sandi minimal 6 karakter.";
    }

    // Konfirmasi Kata Sandi
    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword =
        "Kata sandi dan konfirmasi kata sandi harus sama.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setServerError(null);
    if (!validate()) {
      setServerError("Harap isi semua kolom wajib dengan format yang benar.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE}?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        throw new Error(
          data?.error ?? `Registrasi gagal diproses (${response.status})`,
        );
      }

      setSessionUser({
        id: Number(data.id),
        name: data.name ?? form.fullName.trim(),
        email: data.email ?? form.email.trim(),
        phone: data.phone ?? form.phone.trim(),
        role: data.role ?? "buyer",
      });

      Alert.alert("Registrasi berhasil", "Akun Anda berhasil dibuat.");
      router.replace("/(tabs)");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Tidak dapat membuat akun.";
      setServerError(message);
      Alert.alert("Registrasi gagal", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
                Bergabunglah dengan kami. Kolom dengan tanda{" "}
                <Text style={styles.requiredAsterisk}>*</Text> wajib diisi.
              </Text>

              {serverError ? (
                <View style={styles.alertBanner}>
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color={Colors.error}
                  />
                  <Text style={styles.alertBannerText}>{serverError}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Nama Lengkap <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(errors.fullName) && styles.inputWrapError,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={errors.fullName ? Colors.error : Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor={Colors.muted}
                    value={form.fullName}
                    onChangeText={(value) => updateField("fullName", value)}
                  />
                </View>
                {errors.fullName ? (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={Colors.error}
                    />
                    <Text style={styles.errorText}>{errors.fullName}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(errors.email) && styles.inputWrapError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={errors.email ? Colors.error : Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan email"
                    placeholderTextColor={Colors.muted}
                    value={form.email}
                    onChangeText={(value) => updateField("email", value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {errors.email ? (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={Colors.error}
                    />
                    <Text style={styles.errorText}>{errors.email}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nomor Telepon (opsional)</Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(errors.phone) && styles.inputWrapError,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={errors.phone ? Colors.error : Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 08123456789 atau +852..."
                    placeholderTextColor={Colors.muted}
                    value={form.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    keyboardType="phone-pad"
                  />
                </View>
                {errors.phone ? (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={Colors.error}
                    />
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Kata Sandi <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(errors.password) && styles.inputWrapError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={errors.password ? Colors.error : Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor={Colors.muted}
                    value={form.password}
                    onChangeText={(value) => updateField("password", value)}
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
                {errors.password ? (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={Colors.error}
                    />
                    <Text style={styles.errorText}>{errors.password}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Konfirmasi Kata Sandi{" "}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    Boolean(errors.confirmPassword) && styles.inputWrapError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={errors.confirmPassword ? Colors.error : Colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ulangi kata sandi"
                    placeholderTextColor={Colors.muted}
                    value={form.confirmPassword}
                    onChangeText={(value) =>
                      updateField("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirmPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
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
                {errors.confirmPassword ? (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={Colors.error}
                    />
                    <Text style={styles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Daftar</Text>
                )}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ivory,
  },
  scrollContent: {
    flexGrow: 1,
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
    minHeight: 240,
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
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  requiredAsterisk: {
    color: Colors.error,
    fontWeight: Typography.weights.bold,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorSubtle,
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  alertBannerText: {
    flex: 1,
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    lineHeight: 18,
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
  inputWrapError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSubtle,
  },
  input: {
    color: Colors.navy,
    flex: 1,
    fontSize: Typography.sizes.md,
    minHeight: 48,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 50,
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.65,
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

