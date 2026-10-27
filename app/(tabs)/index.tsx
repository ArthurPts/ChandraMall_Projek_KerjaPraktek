import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MarketplaceProductCard } from "../../components/marketplace-product-card";
import Colors from "../../constants/Colors";
import { getProductColumns } from "../../constants/layout";
import { BASE } from "../../constants/Api";

type Product = {
  id: string | number;
  name: string;
  price: number | string;
  image_url?: string | null;
  vendor_name?: string;
};

type Category = { id: string | number; name: string; slug: string };
type SortMode = "newest" | "price_asc" | "price_desc";
const categoryIcons: React.ComponentProps<typeof Ionicons>["name"][] = [
  "grid-outline",
  "shirt-outline",
  "fast-food-outline",
  "phone-portrait-outline",
  "home-outline",
  "sparkles-outline",
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [draftInStockOnly, setDraftInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = getProductColumns(width);

  const load = useCallback(async (
    query = "",
    options: {
      sort?: SortMode;
      minPrice?: string;
      maxPrice?: string;
      inStockOnly?: boolean;
    } = {}
  ) => {
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ action: "products" });
      if (query.trim()) params.set("q", query.trim());
      const nextMin = options.minPrice ?? minPrice;
      const nextMax = options.maxPrice ?? maxPrice;
      const nextStock = options.inStockOnly ?? inStockOnly;
      const nextSort = options.sort ?? sortMode;
      if (nextMin.trim()) params.set("min_price", nextMin.trim());
      if (nextMax.trim()) params.set("max_price", nextMax.trim());
      if (nextStock) params.set("in_stock", "1");
      params.set("sort", nextSort);
      const url = `${BASE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Products request failed (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Products response was not a list");
      setProducts(data);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [inStockOnly, maxPrice, minPrice, sortMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch(`${BASE}?action=categories`)
      .then((response) => {
        if (!response.ok) throw new Error(`Categories request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Categories response was not a list");
        setCategories(data);
      })
      .catch((error) => console.error(error));
  }, []);

  const displayedProducts = products;

  const query = search.trim().toLocaleLowerCase();
  const matchingProducts = query
    ? products.filter((product) => product.name.toLocaleLowerCase().includes(query)).slice(0, 4)
    : [];
  const matchingCategories = query
    ? categories.filter((category) => category.name.toLocaleLowerCase().includes(query)).slice(0, 3)
    : [];

  const submitSearch = (term = search) => {
    const cleaned = term.trim();
    setShowSuggestions(false);
    if (!cleaned) {
      load();
      return;
    }
    setRecentSearches((current) => [
      cleaned,
      ...current.filter((item) => item.toLocaleLowerCase() !== cleaned.toLocaleLowerCase()),
    ].slice(0, 5));
    setSearch(cleaned);
    load(cleaned);
  };

  const openFilters = () => {
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftInStockOnly(inStockOnly);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    const cleanMin = draftMinPrice.trim();
    const cleanMax = draftMaxPrice.trim();
    if (
      (cleanMin && (!Number.isFinite(Number(cleanMin)) || Number(cleanMin) < 0)) ||
      (cleanMax && (!Number.isFinite(Number(cleanMax)) || Number(cleanMax) < 0))
    ) {
      return;
    }
    if (cleanMin && cleanMax && Number(cleanMin) > Number(cleanMax)) return;
    setMinPrice(cleanMin);
    setMaxPrice(cleanMax);
    setInStockOnly(draftInStockOnly);
    setFiltersOpen(false);
    load(search.trim(), {
      sort: sortMode,
      minPrice: cleanMin,
      maxPrice: cleanMax,
      inStockOnly: draftInStockOnly,
    });
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftInStockOnly(false);
    setSortMode("newest");
    setFiltersOpen(false);
    load(search.trim(), {
      sort: "newest",
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
    });
  };

  const refresh = () => {
    setRefreshing(true);
    load(search.trim());
  };

  const suggestionPanelVisible = showSuggestions && search.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={Colors.muted} />
          <TextInput
            style={styles.search}
            placeholder="Cari produk atau kategori..."
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={() => submitSearch()}
            returnKeyType="search"
            accessibilityLabel="Cari produk atau kategori"
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                setShowSuggestions(false);
                load();
              }}
              accessibilityRole="button"
              accessibilityLabel="Hapus pencarian"
            >
              <Ionicons name="close-circle" size={19} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        {suggestionPanelVisible && (
          <View style={styles.suggestionPanel}>
            {matchingProducts.map((product) => (
              <TouchableOpacity
                key={`product-${product.id}`}
                onPress={() => {
                  setShowSuggestions(false);
                  router.push(`/product/${product.id}`);
                }}
                style={styles.suggestionRow}
              >
                <Ionicons name="search-outline" size={16} color={Colors.muted} />
                <Text numberOfLines={1} style={styles.suggestionText}>{product.name}</Text>
                <Ionicons name="arrow-forward" size={15} color={Colors.muted} />
              </TouchableOpacity>
            ))}
            {matchingCategories.map((category) => (
              <TouchableOpacity
                key={`category-${category.id}`}
                onPress={() => {
                  setShowSuggestions(false);
                  router.push(`/category/${category.slug}`);
                }}
                style={styles.suggestionRow}
              >
                <Ionicons name="grid-outline" size={16} color={Colors.burgundy} />
                <Text numberOfLines={1} style={styles.suggestionText}>
                  Kategori: {category.name}
                </Text>
                <Ionicons name="arrow-forward" size={15} color={Colors.muted} />
              </TouchableOpacity>
            ))}
            {matchingProducts.length === 0 && matchingCategories.length === 0 && (
              <TouchableOpacity
                onPress={() => submitSearch()}
                style={styles.suggestionRow}
              >
                <Ionicons name="search-outline" size={16} color={Colors.burgundy} />
                <Text style={styles.suggestionText}>Cari “{search.trim()}”</Text>
                <Ionicons name="arrow-forward" size={15} color={Colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        )}
        {!suggestionPanelVisible && recentSearches.length > 0 && (
          <View style={styles.recentSearches}>
            <Text style={styles.recentLabel}>Terakhir dicari</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentSearches.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.recentChip}
                  onPress={() => submitSearch(term)}
                >
                  <Ionicons name="time-outline" size={13} color={Colors.muted} />
                  <Text style={styles.recentText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        key={`home-grid-${columns}`}
        data={displayedProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.burgundy}
            colors={[Colors.burgundy]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.promoBanner}>
              <View style={styles.promoCopy}>
                <Text style={styles.promoEyebrow}>SELAMAT DATANG</Text>
                <Text style={styles.promoTitle}>Temukan pilihan belanja Anda</Text>
                <Text style={styles.promoCaption}>
                  Jelajahi produk pilihan dari seller Chandra Mall.
                </Text>
              </View>
              <View style={styles.promoIcon}>
                <Ionicons name="bag-handle" size={29} color={Colors.white} />
              </View>
            </View>

            {categories.length > 0 && (
              <View style={styles.categorySection}>
                <View style={styles.sectionHeading}>
                  <View>
                    <Text style={styles.sectionTitle}>Jelajahi kategori</Text>
                    <Text style={styles.sectionCaption}>Temukan yang Anda butuhkan</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/explore")}
                    style={styles.seeAll}
                  >
                    <Text style={styles.seeAllText}>Lihat semua</Text>
                    <Ionicons name="chevron-forward" size={15} color={Colors.burgundy} />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChips}
                >
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryChip}
                      onPress={() => router.push(`/category/${category.slug}`)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.categoryIcon}>
                        <Ionicons
                          name={categoryIcons[index % categoryIcons.length]}
                          size={17}
                          color={Colors.burgundy}
                        />
                      </View>
                      <Text numberOfLines={1} style={styles.categoryName}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.sectionHeading}>
              <View style={styles.titleBlock}>
                <Text style={styles.sectionTitle}>
                  {search.trim() ? "Hasil pencarian" : "Pilihan untuk Anda"}
                </Text>
                <Text style={styles.sectionCaption}>
                  {search.trim()
                    ? `Produk terkait “${search.trim()}”`
                    : "Temukan sesuatu yang Anda sukai"}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{displayedProducts.length} produk</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortOptions}
            >
              {([
                ["newest", "Terbaru"],
                ["price_asc", "Harga terendah"],
                ["price_desc", "Harga tertinggi"],
              ] as const).map(([mode, label]) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    setSortMode(mode);
                    load(search.trim(), { sort: mode });
                  }}
                  style={[styles.sortChip, sortMode === mode && styles.sortChipActive]}
                >
                  <Text style={[styles.sortText, sortMode === mode && styles.sortTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={openFilters}
                style={[
                  styles.sortChip,
                  (minPrice || maxPrice || inStockOnly) && styles.sortChipActive,
                ]}
              >
                <Ionicons
                  name="options-outline"
                  size={13}
                  color={minPrice || maxPrice || inStockOnly ? Colors.white : Colors.muted}
                />
                <Text
                  style={[
                    styles.sortText,
                    (minPrice || maxPrice || inStockOnly) && styles.sortTextActive,
                  ]}
                >
                  Filter
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 2 }, (_, row) => (
                <View key={row} style={styles.skeletonRow}>
                  {Array.from({ length: columns }, (_, column) => (
                    <View key={column} style={styles.skeletonCard}>
                      <View style={styles.skeletonImage} />
                      <View style={styles.skeletonLine} />
                      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                      <View style={[styles.skeletonLine, styles.skeletonPrice]} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : loadError ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={34} color={Colors.muted} />
              <Text style={styles.emptyTitle}>Produk tidak dapat dimuat</Text>
              <Text style={styles.emptyCaption}>Periksa koneksi dan coba lagi.</Text>
              <TouchableOpacity onPress={() => load(search.trim())} style={styles.retryButton}>
                <Text style={styles.retryText}>Coba lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={34} color={Colors.muted} />
              <Text style={styles.emptyTitle}>
                {search.trim() ? "Produk tidak ditemukan" : "Belum ada produk"}
              </Text>
              <Text style={styles.emptyCaption}>
                {search.trim()
                  ? "Coba kata kunci lain untuk menemukan produk."
                  : "Produk yang tersedia akan muncul di sini."}
              </Text>
              {!!search.trim() && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch("");
                    setSortMode("newest");
                    load("", { sort: "newest" });
                  }}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Lihat semua produk</Text>
                </TouchableOpacity>
              )}
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
      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setFiltersOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Tutup filter"
          />
          <View style={styles.filterSheet}>
            <View style={styles.filterHeader}>
              <View>
                <Text style={styles.filterTitle}>Filter produk</Text>
                <Text style={styles.filterSubtitle}>Sesuaikan hasil dengan kebutuhan Anda.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFiltersOpen(false)}
                style={styles.closeFilter}
                accessibilityRole="button"
                accessibilityLabel="Tutup"
              >
                <Ionicons name="close" size={19} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.filterLabel}>Rentang harga (Rp)</Text>
            <View style={styles.priceInputs}>
              <TextInput
                value={draftMinPrice}
                onChangeText={setDraftMinPrice}
                keyboardType="numeric"
                placeholder="Minimum"
                placeholderTextColor={Colors.muted}
                style={styles.priceInput}
                accessibilityLabel="Harga minimum"
              />
              <Text style={styles.priceSeparator}>—</Text>
              <TextInput
                value={draftMaxPrice}
                onChangeText={setDraftMaxPrice}
                keyboardType="numeric"
                placeholder="Maksimum"
                placeholderTextColor={Colors.muted}
                style={styles.priceInput}
                accessibilityLabel="Harga maksimum"
              />
            </View>
            <View style={styles.stockFilter}>
              <View style={styles.stockFilterCopy}>
                <Text style={styles.filterLabel}>Produk tersedia</Text>
                <Text style={styles.filterHint}>Sembunyikan produk yang stoknya habis</Text>
              </View>
              <Switch
                value={draftInStockOnly}
                onValueChange={setDraftInStockOnly}
                trackColor={{ false: Colors.border, true: Colors.burgundy }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearText}>Hapus filter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyText}>Tampilkan produk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  searchHeader: {
    backgroundColor: Colors.burgundy,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingBottom: 13,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 2,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 13,
    flexDirection: "row",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  search: { color: Colors.navy, flex: 1, fontSize: 14, marginLeft: 9, paddingVertical: 9 },
  suggestionPanel: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
  },
  suggestionRow: {
    alignItems: "center",
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  suggestionText: { color: Colors.navy, flex: 1, fontSize: 12 },
  recentSearches: { marginTop: 10 },
  recentLabel: { color: Colors.white, fontSize: 10, marginBottom: 6, opacity: 0.8 },
  recentChip: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 15,
    flexDirection: "row",
    marginRight: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  recentText: { color: Colors.navy, fontSize: 11, marginLeft: 5 },
  productList: {
    alignSelf: "center",
    maxWidth: 1480,
    paddingHorizontal: 18,
    paddingBottom: 28,
    width: "100%",
  },
  promoBanner: {
    alignItems: "center",
    backgroundColor: Colors.burgundyDark,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 17,
  },
  promoCopy: { flex: 1, paddingRight: 12 },
  promoEyebrow: { color: Colors.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  promoTitle: { color: Colors.white, fontSize: 16, fontWeight: "800", marginTop: 5 },
  promoCaption: { color: Colors.white, fontSize: 11, lineHeight: 16, marginTop: 4, opacity: 0.85 },
  promoIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  categorySection: { marginTop: 21 },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleBlock: { flex: 1, paddingRight: 10 },
  sectionTitle: { color: Colors.navy, fontSize: 17, fontWeight: "800" },
  sectionCaption: { color: Colors.muted, fontSize: 11, marginTop: 3 },
  seeAll: { alignItems: "center", flexDirection: "row" },
  seeAllText: { color: Colors.burgundy, fontSize: 11, fontWeight: "700" },
  categoryChips: { paddingBottom: 2 },
  categoryChip: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 13,
    borderWidth: 1,
    marginRight: 9,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: 90,
  },
  categoryIcon: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  categoryName: { color: Colors.navy, fontSize: 10, fontWeight: "600", marginTop: 7 },
  countBadge: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  countText: { color: Colors.muted, fontSize: 10, fontWeight: "600" },
  sortOptions: { gap: 7, paddingBottom: 13 },
  sortChip: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  sortChipActive: { backgroundColor: Colors.burgundy, borderColor: Colors.burgundy },
  sortText: { color: Colors.muted, fontSize: 10, fontWeight: "600" },
  sortTextActive: { color: Colors.white },
  productRow: { gap: 10, marginBottom: 10 },
  cardWrap: { flex: 1 },
  skeletonGrid: { gap: 10, paddingBottom: 20 },
  skeletonRow: { flexDirection: "row", gap: 10 },
  skeletonCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
    paddingBottom: 9,
  },
  skeletonImage: { aspectRatio: 1, backgroundColor: Colors.border, opacity: 0.55 },
  skeletonLine: { backgroundColor: Colors.border, borderRadius: 4, height: 8, marginHorizontal: 8, marginTop: 9 },
  skeletonLineShort: { marginTop: 6, width: "55%" },
  skeletonPrice: { backgroundColor: Colors.gold, marginTop: 9, opacity: 0.45, width: "45%" },
  emptyState: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 36 },
  emptyTitle: { color: Colors.navy, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyCaption: { color: Colors.muted, fontSize: 12, marginTop: 5, textAlign: "center" },
  retryButton: {
    backgroundColor: Colors.burgundy,
    borderRadius: 10,
    marginTop: 13,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  retryText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(28,43,74,0.35)" },
  filterSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 28,
    paddingHorizontal: 19,
    paddingTop: 20,
  },
  filterHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 21 },
  filterTitle: { color: Colors.navy, fontSize: 18, fontWeight: "800" },
  filterSubtitle: { color: Colors.muted, fontSize: 11, marginTop: 4 },
  closeFilter: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 18, height: 34, justifyContent: "center", width: 34 },
  filterLabel: { color: Colors.navy, fontSize: 12, fontWeight: "700" },
  priceInputs: { alignItems: "center", flexDirection: "row", gap: 9, marginTop: 9 },
  priceInput: { backgroundColor: Colors.ivory, borderColor: Colors.border, borderRadius: 10, borderWidth: 1, color: Colors.navy, flex: 1, fontSize: 13, minHeight: 44, paddingHorizontal: 11 },
  priceSeparator: { color: Colors.muted },
  stockFilter: { alignItems: "center", borderTopColor: Colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 19, paddingTop: 16 },
  stockFilterCopy: { flex: 1 },
  filterHint: { color: Colors.muted, fontSize: 10, marginTop: 4 },
  filterActions: { flexDirection: "row", gap: 10, marginTop: 23 },
  clearButton: { alignItems: "center", borderColor: Colors.burgundy, borderRadius: 11, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 46 },
  clearText: { color: Colors.burgundy, fontSize: 12, fontWeight: "700" },
  applyButton: { alignItems: "center", backgroundColor: Colors.burgundy, borderRadius: 11, flex: 1.4, justifyContent: "center", minHeight: 46 },
  applyText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
});
