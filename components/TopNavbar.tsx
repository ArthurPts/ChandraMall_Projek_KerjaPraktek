import { useRouter, usePathname, type Href } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  User as UserIcon,
  X,
} from "lucide-react-native";
import Colors from "../constants/Colors";
import { BASE } from "../constants/Api";
import { useSessionUser } from "../constants/session";
import { useResponsive } from "../hooks/useResponsive";

type TopNavbarProps = {
  onToggleDrawer?: () => void;
  cartCount?: number;
};

export function TopNavbar({ onToggleDrawer, cartCount: propCartCount }: TopNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const { user, isLoggedIn, logout } = useSessionUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [internalCartCount, setInternalCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch cart count when user is logged in
  useEffect(() => {
    if (propCartCount !== undefined) {
      setInternalCartCount(propCartCount);
      return;
    }
    if (!user?.id) {
      setInternalCartCount(0);
      return;
    }
    fetch(`${BASE}?action=cart&user_id=${user.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const count = data.reduce(
            (acc, it) => acc + (Number(it.quantity) || 1),
            0
          );
          setInternalCartCount(count);
        }
      })
      .catch(() => {});
  }, [user?.id, propCartCount, pathname]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/(tabs)/explore",
        params: { q: searchQuery.trim() },
      });
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace("/(tabs)");
  };

  const navLinks: { label: string; href: Href; icon: React.ReactNode }[] = [
    {
      label: "Beranda",
      href: "/(tabs)",
      icon: <ShoppingBag size={18} color={Colors.burgundy} />,
    },
    {
      label: "Katalog Sambal & Produk",
      href: "/(tabs)/explore",
      icon: <Search size={18} color={Colors.burgundy} />,
    },
    {
      label: "Toko Mitra HK",
      href: "/vendors",
      icon: <Store size={18} color={Colors.burgundy} />,
    },
    {
      label: "Pesanan Saya",
      href: "/orders",
      icon: <Package size={18} color={Colors.burgundy} />,
    },
  ];

  return (
    <View style={styles.headerWrapper}>
      {/* Top Banner Bar (Desktop/Tablet) */}
      {!isMobile && (
        <View style={styles.topNoticeBar}>
          <View style={styles.topNoticeContent}>
            <View style={styles.noticeLeft}>
              <ShieldCheck size={14} color={Colors.gold} />
              <Text style={styles.noticeText}>
                Official Hub Produk Asli Indonesia ke Hong Kong • Pickup di Causeway Bay & Wan Chai
              </Text>
            </View>
            <View style={styles.noticeRight}>
              <Text style={styles.noticeCurrency}>Mata Uang: HK$ (Hong Kong Dollar)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Navigation Bar */}
      <View style={styles.mainNav}>
        <View style={styles.navContainer}>
          {/* Left: Brand / Logo */}
          <View style={styles.brandRow}>
            {isMobile && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => (onToggleDrawer ? onToggleDrawer() : setMobileMenuOpen(true))}
                accessibilityRole="button"
                accessibilityLabel="Menu"
              >
                <Menu size={22} color={Colors.burgundy} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.brandContainer}
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.8}
            >
              <View style={styles.logoBadge}>
                <ShoppingBag size={20} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.brandTitle}>
                  CHANDRA <Text style={styles.brandTitleHighlight}>MALL</Text>
                </Text>
                <Text style={styles.brandSubtitle}>HONG KONG PARTNER</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Center: Search Bar (Desktop / Tablet) */}
          {!isMobile && (
            <View style={styles.searchWrapper}>
              <View style={styles.searchBox}>
                <Search size={18} color={Colors.muted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari sambal nusantara, batik, cemilan..."
                  placeholderTextColor={Colors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.searchClear}
                  >
                    <X size={15} color={Colors.muted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.searchSubmitBtn}
                  onPress={handleSearchSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.searchSubmitText}>Cari</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Right: Actions (Wishlist, Cart, User) */}
          <View style={styles.navActions}>
            {!isMobile && (
              <TouchableOpacity
                style={[
                  styles.navActionBtn,
                  pathname.includes("wishlist") && styles.navActionBtnActive,
                ]}
                onPress={() => router.push("/(tabs)/wishlist")}
              >
                <Heart
                  size={20}
                  color={pathname.includes("wishlist") ? Colors.burgundy : Colors.navy}
                />
                <Text style={styles.navActionLabel}>Wishlist</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.navActionBtn,
                pathname.includes("cart") && styles.navActionBtnActive,
              ]}
              onPress={() => router.push("/(tabs)/cart")}
              accessibilityRole="button"
              accessibilityLabel="Keranjang Belanja"
            >
              <View style={styles.cartIconWrapper}>
                <ShoppingCart
                  size={21}
                  color={pathname.includes("cart") ? Colors.burgundy : Colors.navy}
                />
                {internalCartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {internalCartCount > 99 ? "99+" : internalCartCount}
                    </Text>
                  </View>
                )}
              </View>
              {!isMobile && <Text style={styles.navActionLabel}>Keranjang</Text>}
            </TouchableOpacity>

            {/* Profile or Login */}
            {isLoggedIn ? (
              <View style={styles.userSection}>
                <TouchableOpacity
                  style={styles.userProfileBtn}
                  onPress={() => router.push("/(tabs)/profile")}
                >
                  <View style={styles.userAvatar}>
                    <UserIcon size={16} color={Colors.burgundy} />
                  </View>
                  {!isMobile && (
                    <View style={styles.userMeta}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user?.name || "Akun Saya"}
                      </Text>
                      <Text style={styles.userRole}>Pembeli</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Logout Button */}
                {!isMobile && (
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => setShowLogoutConfirm(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Keluar"
                  >
                    <LogOut size={17} color={Colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.push("/login")}
                activeOpacity={0.85}
              >
                <UserIcon size={16} color={Colors.white} />
                <Text style={styles.loginBtnText}>Masuk</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Desktop Quick Category Links Sub-bar */}
        {!isMobile && (
          <View style={styles.subNavBar}>
            <View style={styles.subNavContainer}>
              <View style={styles.linksRow}>
                {navLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href === "/(tabs)" && (pathname === "/" || pathname === "/(tabs)"));
                  return (
                    <TouchableOpacity
                      key={link.label}
                      style={[styles.subNavLink, active && styles.subNavLinkActive]}
                      onPress={() => router.push(link.href)}
                    >
                      <Text
                        style={[
                          styles.subNavLinkText,
                          active && styles.subNavLinkTextActive,
                        ]}
                      >
                        {link.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>Pengiriman Terjamin HK$</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Mobile Drawer Menu Modal */}
      <Modal
        visible={mobileMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMobileMenuOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMobileMenuOpen(false)}
        >
          <Pressable style={styles.mobileDrawer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandContainer}>
                <View style={styles.logoBadge}>
                  <ShoppingBag size={18} color={Colors.white} />
                </View>
                <View>
                  <Text style={styles.brandTitle}>CHANDRA MALL</Text>
                  <Text style={styles.brandSubtitle}>HONG KONG PARTNER</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setMobileMenuOpen(false)}
                style={styles.closeDrawerBtn}
              >
                <X size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Mobile Search */}
            <View style={styles.mobileSearchBox}>
              <Search size={16} color={Colors.muted} />
              <TextInput
                style={styles.mobileSearchInput}
                placeholder="Cari produk di Chandra Mall..."
                placeholderTextColor={Colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
              />
            </View>

            {/* Links */}
            <View style={styles.drawerLinks}>
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <TouchableOpacity
                    key={link.label}
                    style={[styles.drawerItem, active && styles.drawerItemActive]}
                    onPress={() => {
                      setMobileMenuOpen(false);
                      router.push(link.href);
                    }}
                  >
                    {link.icon}
                    <Text
                      style={[
                        styles.drawerItemText,
                        active && styles.drawerItemTextActive,
                      ]}
                    >
                      {link.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMobileMenuOpen(false);
                  router.push("/(tabs)/wishlist");
                }}
              >
                <Heart size={18} color={Colors.burgundy} />
                <Text style={styles.drawerItemText}>Wishlist Saya</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  setMobileMenuOpen(false);
                  router.push("/(tabs)/profile");
                }}
              >
                <UserIcon size={18} color={Colors.burgundy} />
                <Text style={styles.drawerItemText}>Profil Pengguna</Text>
              </TouchableOpacity>
            </View>

            {/* Mobile Footer / Auth */}
            <View style={styles.drawerFooter}>
              {isLoggedIn ? (
                <TouchableOpacity
                  style={styles.drawerLogoutBtn}
                  onPress={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <LogOut size={18} color={Colors.error} />
                  <Text style={styles.drawerLogoutText}>Keluar dari Akun</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.drawerLoginBtn}
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push("/login");
                  }}
                >
                  <Text style={styles.drawerLoginText}>Masuk / Daftar Akun</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalCenterOverlay}>
          <View style={styles.logoutModalBox}>
            <View style={styles.logoutModalIcon}>
              <LogOut size={26} color={Colors.burgundy} />
            </View>
            <Text style={styles.logoutModalTitle}>Konfirmasi Keluar</Text>
            <Text style={styles.logoutModalDesc}>
              Apakah Anda yakin ingin keluar dari akun Chandra Mall? Anda harus masuk kembali untuk melihat riwayat pesanan.
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
                onPress={handleLogout}
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
  headerWrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 100,
  },
  topNoticeBar: {
    backgroundColor: Colors.navy,
    paddingVertical: 6,
    paddingHorizontal: 24,
  },
  topNoticeContent: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noticeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeText: {
    color: Colors.ivory,
    fontSize: 12,
    fontWeight: "500",
  },
  noticeRight: {},
  noticeCurrency: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mainNav: {
    backgroundColor: Colors.white,
  },
  navContainer: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.ivory,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  brandTitle: {
    color: Colors.navy,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandTitleHighlight: {
    color: Colors.burgundy,
  },
  brandSubtitle: {
    color: Colors.goldDark,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: -2,
  },
  searchWrapper: {
    flex: 1,
    maxWidth: 520,
    marginHorizontal: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 4,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.navy,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  searchClear: {
    padding: 6,
  },
  searchSubmitBtn: {
    backgroundColor: Colors.burgundy,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginLeft: 6,
  },
  searchSubmitText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  navActionBtnActive: {
    backgroundColor: Colors.burgundySubtle,
  },
  navActionLabel: {
    color: Colors.navy,
    fontSize: 13,
    fontWeight: "600",
  },
  cartIconWrapper: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: Colors.burgundy,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  userProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.burgundySubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  userMeta: {},
  userName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.navy,
    maxWidth: 90,
  },
  userRole: {
    fontSize: 10,
    color: Colors.muted,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.ivory,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.burgundy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  subNavBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.ivory,
  },
  subNavContainer: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  subNavLink: {
    paddingVertical: 4,
  },
  subNavLinkActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.burgundy,
  },
  subNavLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  subNavLinkTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  tagBadge: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    flexDirection: "row",
  },
  mobileDrawer: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: Colors.white,
    height: "100%",
    padding: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  closeDrawerBtn: {
    padding: 6,
  },
  mobileSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  mobileSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.navy,
    padding: 0,
  },
  drawerLinks: {
    gap: 6,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  drawerItemActive: {
    backgroundColor: Colors.burgundySubtle,
  },
  drawerItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.navy,
  },
  drawerItemTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  drawerFooter: {
    marginTop: "auto",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  drawerLoginBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  drawerLoginText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  drawerLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.errorSubtle,
  },
  drawerLogoutText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "700",
  },
  modalCenterOverlay: {
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
