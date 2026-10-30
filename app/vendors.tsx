import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Store,
  Truck,
} from "lucide-react-native";
import { Footer } from "../components/Footer";
import { BASE } from "../constants/Api";
import Colors from "../constants/Colors";
import { formatRating } from "../constants/format";
import { useResponsive } from "../hooks/useResponsive";

type HKStore = {
  id: number;
  name: string;
  district?: string;
  address_line: string;
  phone?: string;
  opening_hours?: string;
};

type Vendor = {
  id: number | string;
  store_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  origin_city?: string;
  rating_avg?: number | string;
  rating_count?: number | string;
};

export default function Vendors() {
  const router = useRouter();
  const { isDesktop } = useResponsive();

  const [activeTab, setActiveTab] = useState<"hk_stores" | "vendors">("hk_stores");
  const [hkStores, setHkStores] = useState<HKStore[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storesRes, vendorsRes] = await Promise.all([
        fetch(`${BASE}?action=hk_stores`),
        fetch(`${BASE}?action=vendors`),
      ]);
      if (storesRes.ok) {
        const storeData = await storesRes.json();
        if (Array.isArray(storeData)) setHkStores(storeData);
      }
      if (vendorsRes.ok) {
        const vendorData = await vendorsRes.json();
        if (Array.isArray(vendorData)) setVendors(vendorData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollRoot}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.burgundy}
          />
        }
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>JARINGAN MITRA RESMI HONG KONG & INDONESIA</Text>
              <Text style={styles.title}>Toko Mitra HK & Vendor Pilihan</Text>
              <Text style={styles.subtitle}>
                Temukan lokasi pengambilan pesanan di Hong Kong atau jelajahi seller UMKM binaan resmi di Indonesia.
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "hk_stores" && styles.tabBtnActive]}
              onPress={() => setActiveTab("hk_stores")}
            >
              <Store size={18} color={activeTab === "hk_stores" ? Colors.white : Colors.navy} />
              <Text style={[styles.tabBtnText, activeTab === "hk_stores" && styles.tabBtnTextActive]}>
                Toko Mitra Hong Kong (Pickup Point)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "vendors" && styles.tabBtnActive]}
              onPress={() => setActiveTab("vendors")}
            >
              <ShieldCheck size={18} color={activeTab === "vendors" ? Colors.white : Colors.navy} />
              <Text style={[styles.tabBtnText, activeTab === "vendors" && styles.tabBtnTextActive]}>
                Vendor Terverifikasi dari Indonesia
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.burgundy} />
              <Text style={styles.loadingText}>Memuat jaringan toko...</Text>
            </View>
          ) : activeTab === "hk_stores" ? (
            /* HK Stores Grid */
            <View style={styles.cardsGrid}>
              {hkStores.map((store) => (
                <View key={store.id} style={[styles.storeCard, isDesktop && styles.storeCardDesktop]}>
                  <View style={styles.storeCardTop}>
                    <View style={styles.storeLogoBox}>
                      <Store size={26} color={Colors.burgundy} />
                    </View>
                    <View style={styles.storeMainMeta}>
                      <View style={styles.storeNameRow}>
                        <Text style={styles.storeName}>{store.name}</Text>
                        <CheckCircle2 size={15} color={Colors.verifiedBadge} />
                      </View>
                      {store.district && (
                        <View style={styles.districtBadge}>
                          <Text style={styles.districtText}>Distrik: {store.district}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.storeInfoRows}>
                    <View style={styles.infoRow}>
                      <MapPin size={16} color={Colors.burgundy} />
                      <Text style={styles.infoText}>{store.address_line}</Text>
                    </View>

                    {store.phone && (
                      <View style={styles.infoRow}>
                        <Phone size={15} color={Colors.muted} />
                        <Text style={styles.infoText}>{store.phone}</Text>
                      </View>
                    )}

                    {store.opening_hours && (
                      <View style={styles.infoRow}>
                        <Clock size={15} color={Colors.goldDark} />
                        <Text style={styles.infoHoursText}>{store.opening_hours}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.pickupPerksRow}>
                    <View style={styles.perkPill}>
                      <Text style={styles.perkText}>✓ Bebas Biaya Ambil</Text>
                    </View>
                    <View style={styles.perkPill}>
                      <Text style={styles.perkText}>✓ Konfirmasi WhatsApp</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            /* Indonesian Vendors Grid */
            <View style={styles.cardsGrid}>
              {vendors.map((vendor) => (
                <View key={vendor.id} style={[styles.vendorCard, isDesktop && styles.storeCardDesktop]}>
                  <View style={styles.vendorCardTop}>
                    <View style={styles.vendorLogoCircle}>
                      <Store size={24} color={Colors.burgundy} />
                    </View>
                    <View style={styles.vendorMetaCol}>
                      <View style={styles.vendorNameRow}>
                        <Text style={styles.vendorCardName}>{vendor.store_name}</Text>
                        <CheckCircle2 size={15} color={Colors.verifiedBadge} />
                      </View>
                      <Text style={styles.vendorOriginCity}>
                        Kota Asal: {vendor.origin_city || "Indonesia"}
                      </Text>
                    </View>

                    <View style={styles.ratingBadge}>
                      <Star size={12} color={Colors.gold} fill={Colors.gold} />
                      <Text style={styles.ratingText}>
                        {formatRating(vendor.rating_avg || "4.9")}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.vendorDesc} numberOfLines={3}>
                    {vendor.description ||
                      "Mitra produsen terpercaya binaan Chandra Mall yang menghadirkan produk pangan, sambal, dan kerajinan khas Indonesia berstandar mutu tinggi."}
                  </Text>

                  <View style={styles.vendorCardFooter}>
                    <View style={styles.exportTag}>
                      <Truck size={13} color={Colors.goldDark} />
                      <Text style={styles.exportTagText}>Siap Kirim ke HK</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.visitStoreBtn}
                      onPress={() => router.push(`/vendor/${vendor.slug || vendor.id}`)}
                    >
                      <Text style={styles.visitStoreBtnText}>Lihat Katalog</Text>
                      <ChevronRight size={15} color={Colors.burgundy} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <Footer />
      </ScrollView>
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
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.goldDark,
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
    lineHeight: 18,
    maxWidth: 620,
  },
  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  tabBtnActive: {
    backgroundColor: Colors.burgundy,
    borderColor: Colors.burgundy,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  tabBtnTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 10,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  storeCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
  },
  storeCardDesktop: {
    width: "48.8%",
  },
  storeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  storeLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  storeMainMeta: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.navy,
  },
  districtBadge: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
    borderWidth: 0.8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  districtText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: "700",
  },
  storeInfoRows: {
    gap: 8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoHoursText: {
    fontSize: 12,
    color: Colors.goldDark,
    fontWeight: "600",
  },
  pickupPerksRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  perkPill: {
    backgroundColor: Colors.ivory,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  perkText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: "600",
  },
  vendorCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vendorCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  vendorLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorMetaCol: {
    flex: 1,
  },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vendorCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.navy,
  },
  vendorOriginCity: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.goldSubtle,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  ratingText: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: "700",
  },
  vendorDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  vendorCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  exportTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exportTagText: {
    fontSize: 11,
    color: Colors.goldDark,
    fontWeight: "700",
  },
  visitStoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.burgundySubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  visitStoreBtnText: {
    color: Colors.burgundy,
    fontSize: 12,
    fontWeight: "700",
  },
});
