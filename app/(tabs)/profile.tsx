import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CheckCircle2,
  ChevronRight,
  Headphones,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
} from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { BASE } from "../../constants/Api";
import Colors, { Spacing, Typography } from "../../constants/Colors";
import { useSessionUser } from "../../constants/session";
import { useResponsive } from "../../hooks/useResponsive";

export default function Profile() {
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsive();
  const { user, isLoggedIn, logout } = useSessionUser();

  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingStats(true);
    Promise.all([
      fetch(`${BASE}?action=orders&user_id=${user.id}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${BASE}?action=wishlist&user_id=${user.id}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${BASE}?action=cart&user_id=${user.id}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([orders, wishlists, cartItems]) => {
        if (Array.isArray(orders)) setOrderCount(orders.length);
        if (Array.isArray(wishlists)) setWishlistCount(wishlists.length);
        if (Array.isArray(cartItems)) setCartCount(cartItems.length);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [user?.id]);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollRoot}>
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Pusat Akun Pembeli</Text>
            <Text style={styles.title}>Profil Pengguna</Text>
            <Text style={styles.subtitle}>
              Kelola informasi profil, pantau pesanan aktif, dan atur preferensi pengambilan toko di Hong Kong.
            </Text>
          </View>

          {isLoggedIn ? (
            <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
              {/* Left Column: User Card & Stats */}
              <View style={[styles.leftCol, isDesktop && styles.leftColDesktop]}>
                {/* User Card */}
                <View style={styles.userCard}>
                  <View style={styles.avatarRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitials}>
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userMainMeta}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{user?.name}</Text>
                        <CheckCircle2 size={16} color={Colors.verifiedBadge} />
                      </View>
                      <Text style={styles.userEmail}>{user?.email}</Text>
                      {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
                    </View>
                  </View>

                  <View style={styles.memberBadge}>
                    <ShieldCheck size={14} color={Colors.gold} />
                    <Text style={styles.memberBadgeText}>
                      Anggota Terverifikasi Chandra Mall Hong Kong
                    </Text>
                  </View>
                </View>

                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                  <TouchableOpacity
                    style={styles.statBox}
                    onPress={() => router.push("/orders")}
                  >
                    <Package size={22} color={Colors.burgundy} />
                    <Text style={styles.statNumber}>{orderCount}</Text>
                    <Text style={styles.statLabel}>Pesanan Saya</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statBox}
                    onPress={() => router.push("/(tabs)/wishlist")}
                  >
                    <Heart size={22} color={Colors.burgundy} />
                    <Text style={styles.statNumber}>{wishlistCount}</Text>
                    <Text style={styles.statLabel}>Wishlist Favorit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statBox}
                    onPress={() => router.push("/(tabs)/cart")}
                  >
                    <ShoppingCart size={22} color={Colors.burgundy} />
                    <Text style={styles.statNumber}>{cartCount}</Text>
                    <Text style={styles.statLabel}>Di Keranjang</Text>
                  </TouchableOpacity>
                </View>

                {/* Preferred Pickup Location Box */}
                <View style={styles.preferredStoreBox}>
                  <View style={styles.preferredHeader}>
                    <MapPin size={18} color={Colors.goldDark} />
                    <Text style={styles.preferredTitle}>Titik Pengambilan Toko Mitra di HK</Text>
                  </View>
                  <Text style={styles.preferredStoreName}>Toko Chandra - Causeway Bay</Text>
                  <Text style={styles.preferredStoreAddress}>
                    G/F, 12 Sugar Street, Causeway Bay, Hong Kong (Dekat MTR Exit E)
                  </Text>
                  <TouchableOpacity
                    style={styles.changeStoreLink}
                    onPress={() => router.push("/vendors")}
                  >
                    <Text style={styles.changeStoreText}>Lihat Semua Pilihan Toko Mitra →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Column: Menu Links & Logout */}
              <View style={[styles.rightCol, isDesktop && styles.rightColDesktop]}>
                <View style={styles.menuCard}>
                  <Text style={styles.menuSectionHeader}>Aktivitas & Pesanan</Text>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/orders")}
                  >
                    <View style={styles.menuIconCircle}>
                      <Package size={18} color={Colors.burgundy} />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.menuItemTitle}>Riwayat & Lacak Pesanan</Text>
                      <Text style={styles.menuItemSub}>
                        Pantau status 7 langkah pengiriman ekspor hingga ke toko HK
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/(tabs)/wishlist")}
                  >
                    <View style={styles.menuIconCircle}>
                      <Heart size={18} color={Colors.burgundy} />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.menuItemTitle}>Wishlist Produk Favorit</Text>
                      <Text style={styles.menuItemSub}>Daftar produk Indonesia yang telah Anda simpan</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.muted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/(tabs)/cart")}
                  >
                    <View style={styles.menuIconCircle}>
                      <ShoppingCart size={18} color={Colors.burgundy} />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.menuItemTitle}>Keranjang Belanja</Text>
                      <Text style={styles.menuItemSub}>Periksa barang pilihan Anda sebelum checkout</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.muted} />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <Text style={styles.menuSectionHeader}>Informasi & Bantuan</Text>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push("/vendors")}
                  >
                    <View style={styles.menuIconCircle}>
                      <Store size={18} color={Colors.burgundy} />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.menuItemTitle}>Jaringan Toko Mitra di Hong Kong</Text>
                      <Text style={styles.menuItemSub}>
                        Alamat, jam buka, dan nomor telepon lokasi pengambilan
                      </Text>
                    </View>
                    <ChevronRight size={16} color={Colors.muted} />
                  </TouchableOpacity>

                  <View style={styles.menuItemStatic}>
                    <View style={styles.menuIconCircle}>
                      <Headphones size={18} color={Colors.burgundy} />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.menuItemTitle}>Layanan Pelanggan WhatsApp HK</Text>
                      <Text style={styles.menuItemSub}>+852 9123 4567 (Senin - Minggu: 09:00 - 20:00 HKT)</Text>
                    </View>
                  </View>

                  <View style={styles.menuItemStatic}>
                    <View style={styles.menuIconCircle}>
                      <ShieldCheck size={18} color={Colors.goldDark} />
                    </View>
                    <View style={styles.menuMeta}>
                      <Text style={styles.menuItemTitle}>Garansi Produk & Bea Cukai</Text>
                      <Text style={styles.menuItemSub}>
                        Jaminan produk asli dari UMKM Indonesia dengan izin impor resmi
                      </Text>
                    </View>
                  </View>

                  {/* PROMINENT LOGOUT BUTTON */}
                  <View style={styles.logoutWrapper}>
                    <TouchableOpacity
                      style={styles.logoutBtn}
                      onPress={() => setShowLogoutConfirm(true)}
                    >
                      <LogOut size={18} color={Colors.error} />
                      <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            /* Guest / Not logged in state */
            <View style={styles.guestCard}>
              <User size={64} color={Colors.mutedLight} />
              <Text style={styles.guestTitle}>Belum Masuk ke Akun</Text>
              <Text style={styles.guestSub}>
                Masuk atau daftarkan akun Chandra Mall untuk menikmati kemudahan belanja produk asli Indonesia dengan penjemputan di toko mitra Hong Kong.
              </Text>
              <View style={styles.guestActions}>
                <TouchableOpacity
                  style={styles.guestLoginBtn}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.guestLoginText}>Masuk ke Akun</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.guestRegisterBtn}
                  onPress={() => router.push("/register")}
                >
                  <Text style={styles.guestRegisterText}>Daftar Akun Baru</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Footer />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalBox}>
            <View style={styles.logoutModalIcon}>
              <LogOut size={26} color={Colors.burgundy} />
            </View>
            <Text style={styles.logoutModalTitle}>Konfirmasi Keluar Akun</Text>
            <Text style={styles.logoutModalDesc}>
              Apakah Anda yakin ingin keluar dari akun Anda? Anda harus masuk kembali untuk melihat riwayat pesanan dan keranjang belanja.
            </Text>
            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.logoutCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutConfirmBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.logoutConfirmText}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ivory,
  },
  scrollRoot: {
    flexGrow: 1,
  },
  container: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.goldDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.muted,
    maxWidth: 620,
    lineHeight: 18,
  },
  mainLayout: {
    flexDirection: "column",
    gap: 24,
  },
  mainLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftCol: {
    width: "100%",
  },
  leftColDesktop: {
    width: "42%",
  },
  rightCol: {
    width: "100%",
  },
  rightColDesktop: {
    width: "55%",
  },
  userCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
  },
  userMainMeta: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.navy,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.goldDark,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
  preferredStoreBox: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  preferredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  preferredTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.goldDark,
    textTransform: "uppercase",
  },
  preferredStoreName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 2,
  },
  preferredStoreAddress: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
  },
  changeStoreLink: {
    paddingTop: 6,
  },
  changeStoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.burgundy,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuSectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.goldDark,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemStatic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.ivory,
    alignItems: "center",
    justifyContent: "center",
  },
  menuMeta: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
  },
  menuItemSub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 18,
  },
  logoutWrapper: {
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.errorSubtle,
    borderColor: Colors.error,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "700",
  },
  guestCard: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    marginVertical: 32,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 16,
    marginBottom: 8,
  },
  guestSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  guestActions: {
    width: "100%",
    gap: 10,
  },
  guestLoginBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  guestLoginText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  guestRegisterBtn: {
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  guestRegisterText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoutModalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutModalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 8,
  },
  logoutModalDesc: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  logoutModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  logoutCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.ivory,
  },
  logoutCancelText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  logoutConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.burgundy,
    alignItems: "center",
  },
  logoutConfirmText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
