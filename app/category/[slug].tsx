import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ArrowLeft, Package, Sparkles } from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { MarketplaceProduct, MarketplaceProductCard } from "../../components/marketplace-product-card";
import { BASE } from "../../constants/Api";
import Colors, { Spacing, Typography } from "../../constants/Colors";
import { useResponsive } from "../../hooks/useResponsive";

type SortMode = "newest" | "price_asc" | "price_desc";

export default function Category() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { isMobile, columns } = useResponsive();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const loadProducts = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE}?action=products&category=${encodeURIComponent(slug)}&sort=${sortMode}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [slug, sortMode]);

  const categoryTitle = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Kategori Produk";

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={16} color={Colors.burgundy} />
        <Text style={styles.backBtnText}>Kembali ke Katalog</Text>
      </TouchableOpacity>

      <View style={styles.titleCard}>
        <View style={styles.badgeRow}>
          <Sparkles size={14} color={Colors.gold} />
          <Text style={styles.badgeText}>Koleksi Pilihan Indonesia</Text>
        </View>
        <Text style={styles.categoryTitle}>{categoryTitle}</Text>
        <Text style={styles.categorySub}>
          Menampilkan {products.length} produk siap ekspor ke Hong Kong dalam mata uang HK$.
        </Text>
      </View>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Urutan:</Text>
        {([
          ["newest", "Terbaru"],
          ["price_asc", "Harga Terendah"],
          ["price_desc", "Harga Tertinggi"],
        ] as const).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[styles.sortChip, sortMode === val && styles.sortChipActive]}
            onPress={() => setSortMode(val)}
          >
            <Text style={[styles.sortChipText, sortMode === val && styles.sortChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        key={`cat-grid-${columns}`}
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
              loadProducts();
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
              <Text style={styles.emptyTitle}>Belum Ada Produk di Kategori Ini</Text>
              <Text style={styles.emptySub}>
                Produk untuk kategori {categoryTitle} sedang dipersiapkan oleh seller.
              </Text>
            </View>
          ) : (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.burgundy} />
              <Text style={styles.loadingText}>Memuat produk kategori...</Text>
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
    paddingBottom: 14,
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
  titleCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  badgeText: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.navy,
  },
  categorySub: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: "600",
  },
  sortChip: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  sortChipActive: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
  },
  sortChipText: {
    fontSize: 12,
    color: Colors.navy,
    fontWeight: "500",
  },
  sortChipTextActive: {
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
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 54,
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
    marginTop: 4,
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
