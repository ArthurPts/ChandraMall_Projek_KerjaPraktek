import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Filter,
  Flame,
  Heart,
  MapPin,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UtensilsCrossed,
  X,
} from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { MarketplaceProduct, MarketplaceProductCard } from "../../components/marketplace-product-card";
import { ResponsiveContainer } from "../../components/ResponsiveContainer";
import { BASE } from "../../constants/Api";
import Colors, { Spacing, Typography } from "../../constants/Colors";
import { useSessionUser } from "../../constants/session";
import { useResponsive } from "../../hooks/useResponsive";

type Category = {
  id: string | number;
  name: string;
  slug: string;
  icon?: string;
};

type SortMode = "newest" | "price_asc" | "price_desc";

const categoryIconMap: Record<string, React.ReactNode> = {
  sambal: <Flame size={20} color={Colors.burgundy} />,
  bumbu: <UtensilsCrossed size={20} color={Colors.burgundy} />,
  batik: <Shirt size={20} color={Colors.burgundy} />,
  cemilan: <ShoppingBag size={20} color={Colors.burgundy} />,
  kopi: <Coffee size={20} color={Colors.burgundy} />,
  herbal: <Sparkles size={20} color={Colors.burgundy} />,
};

function getCategoryIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  if (lower.includes("sambal") || lower.includes("pedas")) return categoryIconMap.sambal;
  if (lower.includes("batik") || lower.includes("baju") || lower.includes("busana")) return categoryIconMap.batik;
  if (lower.includes("kopi") || lower.includes("minum") || lower.includes("teh")) return categoryIconMap.kopi;
  if (lower.includes("jamu") || lower.includes("herbal")) return categoryIconMap.herbal;
  if (lower.includes("bumbu") || lower.includes("dapur") || lower.includes("makan")) return categoryIconMap.bumbu;
  return <ShoppingBag size={20} color={Colors.burgundy} />;
}

export default function Home() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop, columns } = useResponsive();
  const { user } = useSessionUser();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [exportableOnly, setExportableOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Fetch Wishlist
  const loadWishlist = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BASE}?action=wishlist&user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setWishlistIds(new Set(data.map((item) => Number(item.product_id))));
        }
      }
    } catch {}
  }, [user?.id]);

  // Fetch Products
  const loadProducts = useCallback(
    async (
      overrideQuery?: string,
      overrideCategory?: string | null,
      overrideVerified?: boolean,
      overrideExportable?: boolean,
      overrideSort?: SortMode
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ action: "products" });
        const q = overrideQuery !== undefined ? overrideQuery : search;
        const cat = overrideCategory !== undefined ? overrideCategory : selectedCategory;
        const ver = overrideVerified !== undefined ? overrideVerified : verifiedOnly;
        const exp = overrideExportable !== undefined ? overrideExportable : exportableOnly;
        const srt = overrideSort !== undefined ? overrideSort : sortMode;

        if (q.trim()) params.set("q", q.trim());
        if (cat) params.set("category", cat);
        if (ver) params.set("verified_only", "1");
        if (exp) params.set("exportable_only", "1");
        params.set("sort", srt);

        const res = await fetch(`${BASE}?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil data produk");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Products error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, selectedCategory, verifiedOnly, exportableOnly, sortMode]
  );

  useEffect(() => {
    loadProducts();
    loadWishlist();

    // Fetch categories
    fetch(`${BASE}?action=categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
    loadWishlist();
  };

  const handleAddToCart = async (product: MarketplaceProduct) => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`${BASE}?action=add_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        }),
      });
      if (res.ok) {
        setAddedToast(`Berhasil menambahkan ${product.name} ke keranjang!`);
        setTimeout(() => setAddedToast(null), 3000);
      }
    } catch {}
  };

  const handleToggleWishlist = async (productId: number) => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    const isSaved = wishlistIds.has(productId);
    const action = isSaved ? "remove_wishlist" : "add_wishlist";

    try {
      await fetch(`${BASE}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
        }),
      });
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });
    } catch {}
  };

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* Hero Banner Section */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={Colors.gold} />
            <Text style={styles.heroBadgeText}>Platform Resmi Lintas Negara ID ⇄ HK</Text>
          </View>
          <Text style={styles.heroTitle}>
            Pusat Belanja Produk Asli <Text style={styles.heroTitleHighlight}>Indonesia</Text> di Hong Kong
          </Text>
          <Text style={styles.heroDescription}>
            Nikmati kelezatan aneka Sambal Nusantara, Bumbu Masak Tradisional, Kerajinan Batik, dan Cemilan Khas Indonesia. Pesan langsung, bayar dengan HK$, dan ambil dengan mudah di Toko Mitra Hong Kong pilihan Anda.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => router.push("/(tabs)/explore")}
              activeOpacity={0.88}
            >
              <Text style={styles.heroPrimaryText}>Jelajahi Produk Sambal</Text>
              <ArrowRight size={17} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => router.push("/vendors")}
              activeOpacity={0.88}
            >
              <Store size={17} color={Colors.navy} />
              <Text style={styles.heroSecondaryText}>Lokasi Toko Mitra HK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Features Card */}
        <View style={styles.heroFeaturesCard}>
          <View style={styles.heroFeatureRow}>
            <CheckCircle2 size={18} color={Colors.gold} />
            <Text style={styles.heroFeatureText}>100% Produk Halal & Autentik</Text>
          </View>
          <View style={styles.heroFeatureRow}>
            <Truck size={18} color={Colors.gold} />
            <Text style={styles.heroFeatureText}>Ekspor Resmi Bebas Repot</Text>
          </View>
          <View style={styles.heroFeatureRow}>
            <MapPin size={18} color={Colors.gold} />
            <Text style={styles.heroFeatureText}>Pickup di Causeway Bay & Wan Chai</Text>
          </View>
        </View>
      </View>

      {/* HK Store Partner Highlight Bar */}
      <View style={styles.hkPartnerBar}>
        <View style={styles.hkPartnerLeft}>
          <View style={styles.hkPartnerIcon}>
            <Store size={22} color={Colors.burgundy} />
          </View>
          <View>
            <Text style={styles.hkPartnerTitle}>Jaringan Toko Mitra Chandra Mall Hong Kong</Text>
            <Text style={styles.hkPartnerSubtitle}>
              Ambil pesanan Anda tanpa biaya pengiriman tambahan di toko mitra resmi kami di HK.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.hkPartnerBtn}
          onPress={() => router.push("/vendors")}
        >
          <Text style={styles.hkPartnerBtnText}>Lihat Semua Toko</Text>
          <ChevronRight size={16} color={Colors.burgundy} />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      {categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Kategori Populer</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
              <Text style={styles.seeAllText}>Semua Kategori →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === null && styles.categoryCardActive,
              ]}
              onPress={() => {
                setSelectedCategory(null);
                loadProducts(undefined, null);
              }}
            >
              <View style={styles.categoryIconCircle}>
                <ShoppingBag size={20} color={selectedCategory === null ? Colors.white : Colors.burgundy} />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === null && styles.categoryLabelActive,
                ]}
              >
                Semua
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const active = selectedCategory === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, active && styles.categoryCardActive]}
                  onPress={() => {
                    const next = active ? null : cat.slug;
                    setSelectedCategory(next);
                    loadProducts(undefined, next);
                  }}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      active && styles.categoryIconCircleActive,
                    ]}
                  >
                    {getCategoryIcon(cat.name)}
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      active && styles.categoryLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Catalog Title & Quick Filter Bar */}
      <View style={styles.catalogHeader}>
        <View>
          <Text style={styles.catalogTitle}>
            {selectedCategory ? `Koleksi: ${selectedCategory}` : "Koleksi Pilihan Nusantara"}
          </Text>
          <Text style={styles.catalogSubtitle}>
            Menampilkan {products.length} produk siap dikirim ke Hong Kong
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPills}>
          <TouchableOpacity
            style={[styles.filterPill, verifiedOnly && styles.filterPillActive]}
            onPress={() => {
              const next = !verifiedOnly;
              setVerifiedOnly(next);
              loadProducts(undefined, undefined, next);
            }}
          >
            <CheckCircle2
              size={14}
              color={verifiedOnly ? Colors.white : Colors.verifiedBadge}
            />
            <Text
              style={[
                styles.filterPillText,
                verifiedOnly && styles.filterPillTextActive,
              ]}
            >
              Vendor Terverifikasi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, exportableOnly && styles.filterPillActive]}
            onPress={() => {
              const next = !exportableOnly;
              setExportableOnly(next);
              loadProducts(undefined, undefined, undefined, next);
            }}
          >
            <Truck
              size={14}
              color={exportableOnly ? Colors.white : Colors.navy}
            />
            <Text
              style={[
                styles.filterPillText,
                exportableOnly && styles.filterPillTextActive,
              ]}
            >
              Siap Kirim HK
            </Text>
          </TouchableOpacity>

          {/* Sort Selector */}
          <View style={styles.sortContainer}>
            {([
              ["newest", "Terbaru"],
              ["price_asc", "Harga ↑"],
              ["price_desc", "Harga ↓"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.sortBtn,
                  sortMode === val && styles.sortBtnActive,
                ]}
                onPress={() => {
                  setSortMode(val);
                  loadProducts(undefined, undefined, undefined, undefined, val);
                }}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    sortMode === val && styles.sortBtnTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Toast Notification */}
      {addedToast && (
        <View style={styles.toastContainer}>
          <CheckCircle2 size={18} color={Colors.white} />
          <Text style={styles.toastText}>{addedToast}</Text>
        </View>
      )}

      <FlatList
        key={`home-grid-${columns}`}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<Footer />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.burgundy}
            colors={[Colors.burgundy]}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: `${100 / columns}%` }]}>
            <MarketplaceProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              onAddToCart={() => handleAddToCart(item)}
              onToggleWishlist={() => handleToggleWishlist(Number(item.id))}
              isWishlisted={wishlistIds.has(Number(item.id))}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Package size={48} color={Colors.mutedLight} />
              <Text style={styles.emptyTitle}>Tidak ada produk ditemukan</Text>
              <Text style={styles.emptyDesc}>
                Coba sesuaikan kata kunci pencarian atau ubah filter yang dipilih.
              </Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={() => {
                  setSearch("");
                  setSelectedCategory(null);
                  setVerifiedOnly(false);
                  setExportableOnly(false);
                  loadProducts("", null, false, false, "newest");
                }}
              >
                <Text style={styles.emptyResetText}>Reset Semua Filter</Text>
              </TouchableOpacity>
            </View>
          ) : null
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
  listContainer: {
    flexGrow: 1,
  },
  headerBlock: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    backgroundColor: Colors.navy,
    borderRadius: 20,
    padding: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  heroContent: {
    flex: 1,
    minWidth: 300,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201, 160, 53, 0.2)",
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  heroBadgeText: {
    color: Colors.goldLight,
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 12,
  },
  heroTitleHighlight: {
    color: Colors.gold,
  },
  heroDescription: {
    color: Colors.ivoryDark,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 580,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  heroPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.burgundy,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  heroPrimaryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  heroSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.ivory,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  heroSecondaryText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  heroFeaturesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
    gap: 14,
    minWidth: 260,
  },
  heroFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroFeatureText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  hkPartnerBar: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  hkPartnerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  hkPartnerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  hkPartnerTitle: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  hkPartnerSubtitle: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  hkPartnerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.burgundySubtle,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  hkPartnerBtnText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "700",
  },
  categoriesSection: {
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.navy,
    fontSize: 18,
    fontWeight: "700",
  },
  seeAllText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "600",
  },
  categoryScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  categoryCard: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 96,
  },
  categoryCardActive: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
  },
  categoryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryIconCircleActive: {
    backgroundColor: Colors.burgundy,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.navy,
  },
  categoryLabelActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  catalogHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catalogTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.navy,
  },
  catalogSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  filterPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  filterPillActive: {
    backgroundColor: Colors.burgundy,
    borderColor: Colors.burgundy,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.navy,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  sortContainer: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  sortBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sortBtnActive: {
    backgroundColor: Colors.burgundySubtle,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.muted,
  },
  sortBtnTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
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
  toastContainer: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  emptyResetText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
