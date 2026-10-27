import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, SlideInLeft } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../constants/Colors";

const drawerItems: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  href: Href;
}[] = [
  { label: "Beranda", icon: "home-outline", href: "/(tabs)" },
  { label: "Kategori", icon: "grid-outline", href: "/(tabs)/explore" },
  { label: "Toko", icon: "storefront-outline", href: "/vendors" },
  { label: "Keranjang", icon: "cart-outline", href: "/(tabs)/cart" },
  { label: "Wishlist", icon: "heart-outline", href: "/(tabs)/wishlist" },
  { label: "Pesanan Saya", icon: "receipt-outline", href: "/orders" },
  { label: "Profil", icon: "person-outline", href: "/(tabs)/profile" },
];

export default function RootLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const showCartAction = !pathname.includes("cart") && pathname !== "/login";

  const headerLeft = ({ canGoBack }: { canGoBack?: boolean }) => (
    <View style={styles.headerActions}>
      {canGoBack && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Ionicons name="arrow-back" size={21} color={Colors.burgundy} />
        </TouchableOpacity>
      )}
      {!canGoBack && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Buka menu navigasi"
        >
          <Ionicons name="menu-outline" size={25} color={Colors.burgundy} />
        </TouchableOpacity>
      )}
    </View>
  );
  const headerRight = ({ canGoBack }: { canGoBack?: boolean }) => (
    !canGoBack && showCartAction ? (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push("/(tabs)/cart")}
          accessibilityRole="button"
          accessibilityLabel="Buka keranjang"
        >
          <Ionicons name="cart-outline" size={22} color={Colors.burgundy} />
        </TouchableOpacity>
    ) : null
  );

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.ivory },
          headerTintColor: Colors.burgundy,
          headerTitleStyle: { color: Colors.navy, fontWeight: "700" },
          headerShadowVisible: false,
          headerLeft,
          headerRight,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ title: "Chandra Mall" }} />
        <Stack.Screen
          name="category/[slug]"
          options={{ title: "Kategori" }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{ title: "Detail Produk" }}
        />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="orders" options={{ title: "Pesanan Saya" }} />
        <Stack.Screen name="vendors" options={{ title: "Toko Pilihan" }} />
        <Stack.Screen name="vendor/[slug]" options={{ title: "Detail Toko" }} />
        <Stack.Screen name="modal" options={{ title: "Chandra Mall" }} />
      </Stack>

      <Modal
        animationType="none"
        onRequestClose={() => setDrawerOpen(false)}
        transparent
        visible={drawerOpen}
        statusBarTranslucent
      >
        <Animated.View entering={FadeIn.duration(180)} style={styles.drawerOverlay}>
          <Animated.View
            entering={SlideInLeft.duration(220)}
            style={[styles.drawer, { width: Math.min(width * 0.84, 330) }]}
          >
            <SafeAreaView edges={["top", "bottom"]} style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandMark}>
                <Ionicons name="storefront" size={21} color={Colors.burgundy} />
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brand}>Chandra Mall</Text>
                <Text style={styles.brandSubtitle}>Belanja jadi lebih mudah</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDrawerOpen(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Tutup menu navigasi"
              >
                <Ionicons name="close" size={21} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />
            <Text style={styles.sectionLabel}>MENU UTAMA</Text>
            <View style={styles.items}>
              {drawerItems.map((item) => {
                const selected =
                  pathname === item.href ||
                  (item.href === "/(tabs)" && pathname === "/");
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.drawerItem, selected && styles.drawerItemSelected]}
                    onPress={() => {
                      setDrawerOpen(false);
                      router.navigate(item.href);
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={selected ? Colors.burgundy : Colors.muted}
                    />
                    <Text
                      style={[
                        styles.drawerLabel,
                        selected && styles.drawerLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={selected ? Colors.burgundy : Colors.border}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.drawerFooter}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={Colors.gold}
              />
              <Text style={styles.footerText}>Belanja nyaman dan terpercaya</Text>
            </View>
            </SafeAreaView>
          </Animated.View>
          <Pressable
            style={styles.backdrop}
            onPress={() => setDrawerOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Tutup menu"
          />
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerActions: { alignItems: "center", flexDirection: "row", marginLeft: 4 },
  menuButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    marginRight: 4,
    width: 42,
  },
  drawerOverlay: {
    backgroundColor: "rgba(28, 43, 74, 0.34)",
    flex: 1,
    flexDirection: "row",
  },
  drawer: {
    elevation: 12,
    shadowColor: Colors.navy,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  drawerContent: {
    backgroundColor: Colors.white,
    flex: 1,
    paddingHorizontal: 18,
  },
  drawerHeader: { alignItems: "center", flexDirection: "row", paddingTop: 12, paddingBottom: 18 },
  brandMark: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 13,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  brandCopy: { flex: 1, marginLeft: 11 },
  brand: { color: Colors.navy, fontSize: 16, fontWeight: "800" },
  brandSubtitle: { color: Colors.muted, fontSize: 11, marginTop: 3 },
  closeButton: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  separator: { backgroundColor: Colors.border, height: 1 },
  sectionLabel: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 22,
  },
  items: { gap: 5 },
  drawerItem: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  drawerItemSelected: { backgroundColor: Colors.ivory },
  drawerLabel: { color: Colors.navy, flex: 1, fontSize: 14, marginLeft: 12 },
  drawerLabelSelected: { color: Colors.burgundy, fontWeight: "700" },
  drawerFooter: {
    alignItems: "center",
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    marginTop: "auto",
    paddingVertical: 17,
  },
  footerText: { color: Colors.muted, fontSize: 11, marginLeft: 8 },
  backdrop: { flex: 1 },
});
