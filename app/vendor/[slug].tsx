import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  ShieldCheck,
  Star,
  Store,
  Truck,
} from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { MarketplaceProduct, MarketplaceProductCard } from "../../components/marketplace-product-card";
import { BASE } from "../../constants/Api";
import Colors from "../../constants/Colors";
import { formatRating } from "../../constants/format";
import { useResponsive } from "../../hooks/useResponsive";

type Vendor = {
  id?: number | string;
  store_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  origin_city?: string;
  rating_avg?: number | string;
  rating_count?: number | string;
  is_verified?: number | boolean;
};

export default function VendorDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { columns } = useResponsive();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVendorData = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [vendorsRes, prodsRes] = await Promise.all([
        fetch(`${BASE}?action=vendors`),
        fetch(`${BASE}?action=products&vendor=${encodeURIComponent(slug)}`),
      ]);

      if (vendorsRes.ok) {
        const vList = await vendorsRes.json();
        if (Array.isArray(vList)) {
          const match = vList.find((v: Vendor) => v.slug === slug || String(v.id) === slug);
          if (match) setVendor(match);
          else {
            setVendor({
              store_name: decodeURIComponent(slug).replace(/-/g, " "),
              slug: slug,
              origin_city: "Indonesia",
              rating_avg: "4.9",
            });
          }
        }
      }

      if (prodsRes.ok) {
        const pList = await prodsRes.json();
        if (Array.isArray(pList)) setProducts(pList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, [slug]);

  const renderHeader = () => {
    if (!vendor) return null;
    return (
      <View style={styles.headerContainer}>
        {/* Back Link */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={Colors.burgundy} />
          <Text style={styles.backBtnText}>Kembali ke Daftar Toko</Text>
        </TouchableOpacity>

        {/* Store Banner Card */}
        <View style={styles.storeHeroCard}>
          <View style={styles.storeHeroTop}>
            <View style={styles.storeAvatarBox}>
              <Store size={36} color={Colors.burgundy} />
            </View>
            <View style={styles.storeHeroInfo}>
              <View style={styles.storeTitleRow}>
                <Text style={styles.storeHeroName}>{vendor.store_name}</Text>
                <CheckCircle2 size={18} color={Colors.verifiedBadge} />
              </View>
              <Text style={styles.storeHeroBadge}>
                Toko Mitra Resmi Chandra Mall Hong Kong
              </Text>
              <View style={styles.storeMetaRow}>
                <View style={styles.ratingBadge}>
                  <Star size={13} color={Colors.gold} fill={Colors.gold} />
                  <Text style={styles.ratingText}>{formatRating(vendor.rating_avg || "4.9")}</Text>
                </View>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.metaCity}>
                  Asal: {vendor.origin_city || "Indonesia"} (Jalur Ekspor HK)
                </Text>
              </View>
            </View>
          </View>

          {vendor.description && (
            <Text style={styles.storeHeroDesc}>{vendor.description}</Text>
          )}

          <View style={styles.storeGuaranteesRow}>
            <View style={styles.guaranteePill}>
              <Truck size={14} color={Colors.goldDark} />
              <Text style={styles.guaranteePillText}>Pengiriman Terjamin ke Toko Mitra HK</Text>
            </View>
            <View style={styles.guaranteePill}>
              <ShieldCheck size={14} color={Colors.success} />
              <Text style={styles.guaranteePillText}>100% Produk Asli & Berizin Resmi</Text>
            </View>
          </View>
        </View>

        {/* Catalog Title */}
        <View style={styles.catalogHeadingRow}>
          <Text style={styles.catalogHeadingTitle}>
            Katalog Produk dari {vendor.store_name} ({products.length})
          </Text>
          <Text style={styles.catalogHeadingSub}>Semua harga tertera dalam HK$</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        key={`vendor-grid-${columns}`}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<Footer />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadVendorData();
            }}
            tintColor={Colors.burgundy}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: `${100 / columns}%` }]}>
            <MarketplaceProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Package size={52} color={Colors.mutedLight} />
              <Text style={styles.emptyTitle}>Belum Ada Produk Ditampilkan</Text>
              <Text style={styles.emptySub}>
                Toko ini sedang memperbarui katalog produk untuk jalur ekspor ke Hong Kong.
              </Text>
            </View>
          ) : (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.burgundy} />
              <Text style={styles.loadingText}>Memuat katalog toko...</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ivory,
  },
  listContent: {
    flexGrow: 1,
  },
  headerContainer: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backBtnText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "600",
  },
  storeHeroCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  storeHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 16,
  },
  storeAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeHeroInfo: {
    flex: 1,
  },
  storeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storeHeroName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.navy,
  },
  storeHeroBadge: {
    fontSize: 12,
    color: Colors.goldDark,
    fontWeight: "700",
    marginTop: 2,
  },
  storeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.goldSubtle,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  ratingText: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: "700",
  },
  metaDivider: {
    color: Colors.borderDark,
  },
  metaCity: {
    fontSize: 12,
    color: Colors.muted,
  },
  storeHeroDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  storeGuaranteesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  guaranteePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.ivory,
    borderColor: Colors.borderLight,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  guaranteePillText: {
    fontSize: 11,
    color: Colors.navy,
    fontWeight: "600",
  },
  catalogHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexWrap: "wrap",
    gap: 8,
  },
  catalogHeadingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.navy,
  },
  catalogHeadingSub: {
    fontSize: 12,
    color: Colors.muted,
  },
  gridRow: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  cardWrapper: {
    paddingBottom: 14,
    paddingHorizontal: 4,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 320,
    marginTop: 6,
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
});
