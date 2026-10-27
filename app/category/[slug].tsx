import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MarketplaceProductCard } from "../../components/marketplace-product-card";
import Colors from "../../constants/Colors";
import { BASE } from "../../constants/Api";
import { getProductColumns } from "../../constants/layout";

type SortMode = "recommended" | "price-asc" | "price-desc";

export default function Category() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = getProductColumns(width);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setLoadError(false);
    fetch(`${BASE}?action=products&category=${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Category products request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Category products response was not a list");
        setProducts(data);
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const sortedProducts = useMemo(() => {
    if (sortMode === "recommended") return products;
    return [...products].sort((a, b) => {
      const difference = Number(a.price) - Number(b.price);
      return sortMode === "price-asc" ? difference : -difference;
    });
  }, [products, sortMode]);

  const categoryTitle = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Kategori";

  return (
    <View style={styles.container}>
      <FlatList
        key={`category-grid-${columns}`}
        data={sortedProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.heading}>
              <View style={styles.iconBox}>
                <Ionicons name="grid-outline" size={22} color={Colors.burgundy} />
              </View>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>JELAJAHI KATEGORI</Text>
                <Text style={styles.title}>{categoryTitle}</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.count}>{sortedProducts.length}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortOptions}
            >
              {([
                ["recommended", "Rekomendasi"],
                ["price-asc", "Harga terendah"],
                ["price-desc", "Harga tertinggi"],
              ] as const).map(([mode, label]) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setSortMode(mode)}
                  style={[styles.sortChip, sortMode === mode && styles.sortChipActive]}
                >
                  <Text style={[styles.sortText, sortMode === mode && styles.sortTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Ionicons name="sync-outline" size={28} color={Colors.burgundy} />
              <Text style={styles.emptyText}>Memuat produk...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyTitle}>Kategori tidak dapat dimuat</Text>
              <Text style={styles.emptyText}>Periksa koneksi dan coba lagi.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyTitle}>Belum ada produk</Text>
              <Text style={styles.emptyText}>Coba jelajahi kategori lainnya.</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 35)}
            style={styles.cardWrap}
          >
            <MarketplaceProductCard
              product={item}
              compact
              onPress={() => router.push(`/product/${item.id}`)}
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  productList: {
    alignSelf: "center",
    maxWidth: 1480,
    paddingHorizontal: 18,
    paddingBottom: 24,
    width: "100%",
  },
  heading: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 12,
    padding: 15,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 13,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  headingCopy: { flex: 1, marginLeft: 12 },
  eyebrow: { color: Colors.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: Colors.navy, fontSize: 19, fontWeight: "800", marginTop: 3 },
  countBadge: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 8,
  },
  count: { color: Colors.burgundy, fontSize: 12, fontWeight: "700" },
  sortOptions: { gap: 7, paddingBottom: 12 },
  sortChip: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  sortChipActive: { backgroundColor: Colors.burgundy, borderColor: Colors.burgundy },
  sortText: { color: Colors.muted, fontSize: 10, fontWeight: "600" },
  sortTextActive: { color: Colors.white },
  productRow: { gap: 10, marginBottom: 10 },
  cardWrap: { flex: 1 },
  empty: { alignItems: "center", marginTop: 48, padding: 20 },
  emptyTitle: { color: Colors.navy, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyText: { color: Colors.muted, fontSize: 12, marginTop: 6, textAlign: "center" },
});
