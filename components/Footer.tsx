import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  CreditCard,
  Headphones,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react-native";
import Colors from "../constants/Colors";
import { useResponsive } from "../hooks/useResponsive";

export function Footer() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  return (
    <View style={styles.footerRoot}>
      {/* Trust Badges Bar */}
      <View style={styles.trustBar}>
        <View style={styles.trustContainer}>
          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <ShieldCheck size={20} color={Colors.burgundy} />
            </View>
            <View style={styles.trustTexts}>
              <Text style={styles.trustTitle}>100% Produk Asli</Text>
              <Text style={styles.trustDesc}>Langsung dari UMKM & Seller Indonesia</Text>
            </View>
          </View>

          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <Truck size={20} color={Colors.burgundy} />
            </View>
            <View style={styles.trustTexts}>
              <Text style={styles.trustTitle}>Pengiriman ke Hong Kong</Text>
              <Text style={styles.trustDesc}>Via Jalur Ekspor Resmi & Terlacak</Text>
            </View>
          </View>

          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <MapPin size={20} color={Colors.burgundy} />
            </View>
            <View style={styles.trustTexts}>
              <Text style={styles.trustTitle}>Ambil di Toko Mitra HK</Text>
              <Text style={styles.trustDesc}>Causeway Bay, Wan Chai & lainnya</Text>
            </View>
          </View>

          <View style={styles.trustItem}>
            <View style={styles.trustIconCircle}>
              <CreditCard size={20} color={Colors.burgundy} />
            </View>
            <View style={styles.trustTexts}>
              <Text style={styles.trustTitle}>Pembayaran Mudah</Text>
              <Text style={styles.trustDesc}>FPS, PayMe, Octopus & Transfer</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Footer Links */}
      <View style={styles.mainFooter}>
        <View style={styles.footerContainer}>
          {/* Col 1: About */}
          <View style={[styles.col, isMobile && styles.colFull]}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <ShoppingBag size={18} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.brandTitle}>CHANDRA MALL</Text>
                <Text style={styles.brandSubtitle}>HONG KONG PARTNER</Text>
              </View>
            </View>
            <Text style={styles.aboutText}>
              Platform e-commerce jembatan produk Indonesia untuk WNI, diaspora, dan pecinta kuliner nusantara di Hong Kong. Berbelanja aman dengan sistem pengambilan di toko mitra Hong Kong terdekat.
            </Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>Transaksi Transparan dalam HK$</Text>
            </View>
          </View>

          {/* Col 2: Categories */}
          <View style={[styles.col, isMobile && styles.colHalf]}>
            <Text style={styles.colHeader}>Kategori Pilihan</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Aneka Sambal Nusantara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Batik & Pakaian Tradisional</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Bumbu Dapur & Rempah Alami</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Camilan & Kerupuk Khas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Kopi, Teh & Jamu Herbal</Text>
            </TouchableOpacity>
          </View>

          {/* Col 3: HK Partners */}
          <View style={[styles.col, isMobile && styles.colHalf]}>
            <Text style={styles.colHeader}>Jaringan Toko Mitra HK</Text>
            <TouchableOpacity
              onPress={() => router.push("/vendors")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Toko Chandra - Causeway Bay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/vendors")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Indo Store - Wan Chai</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/vendors")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Batik Kita HK - Tsim Sha Tsui</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/vendors")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Mitra Toko - Tsuen Wan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/vendors")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Semua Lokasi Pengambilan →</Text>
            </TouchableOpacity>
          </View>

          {/* Col 4: Support & Order */}
          <View style={[styles.col, isMobile && styles.colFull]}>
            <Text style={styles.colHeader}>Bantuan & Akun</Text>
            <TouchableOpacity
              onPress={() => router.push("/orders")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Lacak Status Pesanan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/wishlist")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Wishlist Favorit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Pengaturan Profil & Akun</Text>
            </TouchableOpacity>
            <View style={styles.supportBox}>
              <Headphones size={18} color={Colors.gold} />
              <View>
                <Text style={styles.supportTitle}>Layanan Pelanggan HK</Text>
                <Text style={styles.supportTime}>Senin - Minggu: 09:00 - 20:00 HKT</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.copyrightText}>
            © 2026 Chandra Mall Hong Kong. All rights reserved. Platform Cross-Border Indonesia - Hong Kong.
          </Text>
          <View style={styles.legalLinks}>
            <Text style={styles.legalText}>Syarat & Ketentuan</Text>
            <Text style={styles.legalDot}>•</Text>
            <Text style={styles.legalText}>Kebijakan Privasi</Text>
            <Text style={styles.legalDot}>•</Text>
            <Text style={styles.legalText}>Panduan Pengambilan Toko</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRoot: {
    backgroundColor: Colors.navy,
    marginTop: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  trustBar: {
    backgroundColor: Colors.navyLight,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  trustContainer: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 220,
    flex: 1,
  },
  trustIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.ivory,
    alignItems: "center",
    justifyContent: "center",
  },
  trustTexts: {
    flex: 1,
  },
  trustTitle: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  trustDesc: {
    color: Colors.mutedLight,
    fontSize: 11,
    marginTop: 2,
  },
  mainFooter: {
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  footerContainer: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 24,
  },
  col: {
    flex: 1,
    minWidth: 200,
  },
  colFull: {
    width: "100%",
    minWidth: "100%",
  },
  colHalf: {
    width: "46%",
    minWidth: "46%",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: Colors.gold,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  aboutText: {
    color: Colors.mutedLight,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  currencyBadge: {
    backgroundColor: "rgba(201, 160, 53, 0.15)",
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  currencyBadgeText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: "600",
  },
  colHeader: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    paddingLeft: 8,
  },
  linkItem: {
    paddingVertical: 5,
  },
  linkText: {
    color: Colors.mutedLight,
    fontSize: 13,
  },
  supportBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  supportTitle: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  supportTime: {
    color: Colors.gold,
    fontSize: 10,
    marginTop: 2,
  },
  bottomBar: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    marginTop: 36,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  copyrightText: {
    color: Colors.muted,
    fontSize: 11,
  },
  legalLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legalText: {
    color: Colors.mutedLight,
    fontSize: 11,
  },
  legalDot: {
    color: Colors.muted,
    fontSize: 11,
  },
});
