import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "../../constants/Colors";

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress: () => void;
};

function MenuItem({ icon, title, subtitle, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={Colors.burgundy} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>CHANDRAMALL</Text>
        <Text style={styles.screenTitle}>Profil</Text>
        <Text style={styles.intro}>
          Kelola akun dan aktivitas belanja Anda.
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color={Colors.burgundy} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Buyer Demo</Text>
          <Text style={styles.email}>buyer@demo.com</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.role}>Buyer</Text>
          </View>
        </View>
        <Ionicons name="sparkles-outline" size={20} color={Colors.gold} />
      </View>

      <Text style={styles.sectionTitle}>Aktivitas belanja</Text>
      <View style={styles.menuCard}>
        <MenuItem
          icon="heart-outline"
          title="Wishlist Saya"
          subtitle="Produk yang Anda simpan"
          onPress={() => router.push("/(tabs)/wishlist")}
        />
        <View style={styles.divider} />
        <MenuItem
          icon="bag-handle-outline"
          title="Keranjang Saya"
          subtitle="Lanjutkan belanja Anda"
          onPress={() => router.push("/(tabs)/cart")}
        />
        <View style={styles.divider} />
        <MenuItem
          icon="receipt-outline"
          title="Pesanan Saya"
          subtitle="Lihat riwayat pesanan"
          onPress={() => router.push("/orders")}
        />
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => router.replace("/login")}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  content: { padding: 20, paddingBottom: 32 },
  heading: { marginBottom: 22 },
  eyebrow: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  screenTitle: { color: Colors.navy, fontSize: 28, fontWeight: "800" },
  intro: { color: Colors.muted, fontSize: 14, marginTop: 5 },
  profileCard: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 28,
    padding: 18,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    marginRight: 14,
    width: 56,
  },
  profileInfo: { flex: 1 },
  name: { color: Colors.navy, fontSize: 18, fontWeight: "700" },
  email: { color: Colors.muted, fontSize: 13, marginTop: 3 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.ivory,
    borderRadius: 20,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  role: { color: Colors.gold, fontSize: 11, fontWeight: "700" },
  sectionTitle: {
    color: Colors.navy,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 22,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 76,
  },
  menuIcon: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    marginRight: 13,
    width: 42,
  },
  menuCopy: { flex: 1 },
  menuTitle: { color: Colors.navy, fontSize: 14, fontWeight: "700" },
  menuSubtitle: { color: Colors.muted, fontSize: 12, marginTop: 4 },
  divider: { backgroundColor: Colors.border, height: 1, marginLeft: 55 },
  logoutButton: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 52,
  },
  logoutText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 9,
  },
});
