import { useLocalSearchParams, useRouter } from "expo-router";
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
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  Package,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { MarketplaceProduct, MarketplaceProductCard } from "../../components/marketplace-product-card";
import { BASE } from "../../constants/Api";
import Colors, { Spacing, Typography } from "../../constants/Colors";
import { formatPrice } from "../../constants/format";
import { useSessionUser } from "../../constants/session";
import { useResponsive } from "../../hooks/useResponsive";

type Category = {
  id: string | number;
  name: string;
  slug: string;
};

type SortMode = "newest" | "price_asc" | "price_desc";

export default function Explore() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { user } = useSessionUser();

  const [search, setSearch] = useState(params.q || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category || null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [exportableOnly, setExportableOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  // Mobile Filter Drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync route params when navigated via TopNavbar search
  useEffect(() => {
    if (params.q !== undefined && params.q !== search) {
      setSearch(params.q);
    }
    if (params.category !== undefined && params.category !== selectedCategory) {
      setSelectedCategory(params.category);
    }
  }, [params.q, params.category]);

  // Load Categories
  useEffect(() => {
    fetch(`${BASE}?action=categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Load Wishlist
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

  // Load Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ action: "products" });
      if (search.trim()) queryParams.set("q", search.trim());
      if (selectedCategory) queryParams.set("category", selectedCategory);
      if (minPrice.trim()) queryParams.set("min_price", minPrice.trim());
      if (maxPrice.trim()) queryParams.set("max_price", maxPrice.trim());
      if (verifiedOnly) queryParams.set("verified_only", "1");
      if (exportableOnly) queryParams.set("exportable_only", "1");
      if (inStockOnly) queryParams.set("in_stock", "1");
      queryParams.set("sort", sortMode);

      const res = await fetch(`${BASE}?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat produk");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, minPrice, maxPrice, verifiedOnly, exportableOnly, inStockOnly, sortMode]);

  useEffect(() => {
    loadProducts();
    loadWishlist();
  }, [loadProducts, loadWishlist]);

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setExportableOnly(false);
    setInStockOnly(false);
    setSortMode("newest");
    setSearch("");
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
        setToastMessage(`Ditambahkan ke keranjang: ${product.name}`);
        setTimeout(() => setToastMessage(null), 3000);
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

  // Filter Sidebar Content (used both on Desktop & Mobile Drawer)
  const renderFilterPanel = () => (
    <View style={styles.filterSidebar}>
      <View style={styles.filterHeader}>
        <View style={styles.filterHeaderTitle}>
          <SlidersHorizontal size={17} color={Colors.navy} />
          <Text style={styles.filterTitle}>Filter Pencarian</Text>
        </View>
        <TouchableOpacity onPress={handleResetFilters} style={styles.resetBtn}>
          <RotateCcw size={13} color={Colors.burgundy} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.filterGroup}>
        <Text style={styles.groupLabel}>Kategori Produk</Text>
        <TouchableOpacity
          style={[
            styles.filterRadioItem,
            selectedCategory === null && styles.filterRadioActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.filterRadioText,
              selectedCategory === null && styles.filterRadioTextActive,
            ]}
          >
            Semua Kategori
          </Text>
          {selectedCategory === null && <Check size={14} color={Colors.burgundy} />}
        </TouchableOpacity>

        {categories.map((c) => {
          const isSelected = selectedCategory === c.slug;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.filterRadioItem, isSelected && styles.filterRadioActive]}
              onPress={() => setSelectedCategory(isSelected ? null : c.slug)}
            >
              <Text
                style={[
                  styles.filterRadioText,
                  isSelected && styles.filterRadioTextActive,
                ]}
              >
                {c.name}
              </Text>
              {isSelected && <Check size={14} color={Colors.burgundy} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.filterDivider} />

      {/* Price Range HK$ */}
      <View style={styles.filterGroup}>
        <Text style={styles.groupLabel}>Rentang Harga (HK$)</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInputBox}>
            <Text style={styles.pricePrefix}>HK$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
          </View>
          <Text style={styles.priceDash}>—</Text>
          <View style={styles.priceInputBox}>
            <Text style={styles.pricePrefix}>HK$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Maks"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>

        {/* Price Presets */}
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              setMinPrice("");
              setMaxPrice("50");
            }}
          >
            <Text style={styles.presetText}>&lt; HK$ 50</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              setMinPrice("50");
              setMaxPrice("150");
            }}
          >
            <Text style={styles.presetText}>HK$ 50 - 150</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              setMinPrice("150");
              setMaxPrice("");
            }}
          >
            <Text style={styles.presetText}>&gt; HK$ 150</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterDivider} />

      {/* Checkboxes: Verified, Exportable, In Stock */}
      <View style={styles.filterGroup}>
        <Text style={styles.groupLabel}>Kriteria Vendor & Pengiriman</Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
        >
          <View style={[styles.checkbox, verifiedOnly && styles.checkboxActive]}>
            {verifiedOnly && <Check size={12} color={Colors.white} />}
          </View>
          <View style={styles.checkboxLabelRow}>
            <Text style={styles.checkboxLabel}>Vendor Terverifikasi</Text>
            <CheckCircle2 size={13} color={Colors.verifiedBadge} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setExportableOnly(!exportableOnly)}
        >
          <View style={[styles.checkbox, exportableOnly && styles.checkboxActive]}>
            {exportableOnly && <Check size={12} color={Colors.white} />}
          </View>
          <View style={styles.checkboxLabelRow}>
            <Text style={styles.checkboxLabel}>Siap Kirim ke Hong Kong</Text>
            <Truck size={13} color={Colors.navy} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setInStockOnly(!inStockOnly)}
        >
          <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
            {inStockOnly && <Check size={12} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxLabel}>Hanya Stok Tersedia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const productColumns = isMobile ? 2 : isTablet ? 3 : 3;

  return (
    <View style={styles.screen}>
      {/* Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color={Colors.white} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollRoot}
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
      >
        <View style={styles.layoutContainer}>
          {/* Top Breadcrumb & Mobile Filter Button */}
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.pageBreadcrumb}>Katalog & Pencarian</Text>
              <Text style={styles.pageHeading}>
                {search.trim() ? `Hasil untuk: “${search}”` : "Semua Produk Indonesia di Hong Kong"}
              </Text>
            </View>

            {isMobile && (
              <TouchableOpacity
                style={styles.mobileFilterBtn}
                onPress={() => setFilterDrawerOpen(true)}
              >
                <Filter size={16} color={Colors.burgundy} />
                <Text style={styles.mobileFilterBtnText}>Filter Produk</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Layout: Left Sidebar + Right Products Grid */}
          <View style={styles.contentRow}>
            {/* Desktop Left Sidebar */}
            {!isMobile && (
              <View style={styles.sidebarColumn}>{renderFilterPanel()}</View>
            )}

            {/* Right Product Grid Column */}
            <View style={styles.productsColumn}>
              {/* Controls bar */}
              <View style={styles.controlsBar}>
                <Text style={styles.countInfo}>
                  Ditemukan <Text style={styles.countBold}>{products.length}</Text> produk
                </Text>

                {/* Sort selector */}
                <View style={styles.sortWrapper}>
                  <Text style={styles.sortLabel}>Urutkan:</Text>
                  {([
                    ["newest", "Terbaru"],
                    ["price_asc", "Harga Terendah"],
                    ["price_desc", "Harga Tertinggi"],
                  ] as const).map(([mode, label]) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.sortPill,
                        sortMode === mode && styles.sortPillActive,
                      ]}
                      onPress={() => setSortMode(mode)}
                    >
                      <Text
                        style={[
                          styles.sortPillText,
                          sortMode === mode && styles.sortPillTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Active Filter Chips */}
              {(selectedCategory || verifiedOnly || exportableOnly || inStockOnly || minPrice || maxPrice) && (
                <View style={styles.activeFiltersRow}>
                  {selectedCategory && (
                    <View style={styles.activeChip}>
                      <Text style={styles.activeChipText}>Kategori: {selectedCategory}</Text>
                      <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                        <X size={13} color={Colors.navy} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {verifiedOnly && (
                    <View style={styles.activeChip}>
                      <Text style={styles.activeChipText}>Terverifikasi</Text>
                      <TouchableOpacity onPress={() => setVerifiedOnly(false)}>
                        <X size={13} color={Colors.navy} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {exportableOnly && (
                    <View style={styles.activeChip}>
                      <Text style={styles.activeChipText}>Siap Kirim HK</Text>
                      <TouchableOpacity onPress={() => setExportableOnly(false)}>
                        <X size={13} color={Colors.navy} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {inStockOnly && (
                    <View style={styles.activeChip}>
                      <Text style={styles.activeChipText}>Stok Tersedia</Text>
                      <TouchableOpacity onPress={() => setInStockOnly(false)}>
                        <X size={13} color={Colors.navy} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity onPress={handleResetFilters} style={styles.clearAllLink}>
                    <Text style={styles.clearAllText}>Hapus Semua</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Grid of Products */}
              {products.length > 0 ? (
                <View style={styles.productGrid}>
                  {products.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.gridItem,
                        { width: isMobile ? "48%" : isTablet ? "31.5%" : "31.8%" },
                      ]}
                    >
                      <MarketplaceProductCard
                        product={item}
                        onPress={() => router.push(`/product/${item.id}`)}
                        onAddToCart={() => handleAddToCart(item)}
                        onToggleWishlist={() => handleToggleWishlist(Number(item.id))}
                        isWishlisted={wishlistIds.has(Number(item.id))}
                      />
                    </View>
                  ))}
                </View>
              ) : !loading ? (
                <View style={styles.emptyContainer}>
                  <Package size={52} color={Colors.mutedLight} />
                  <Text style={styles.emptyHeading}>Produk Tidak Ditemukan</Text>
                  <Text style={styles.emptySub}>
                    Tidak ada produk yang cocok dengan kombinasi filter yang Anda pilih.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={handleResetFilters}
                  >
                    <Text style={styles.emptyButtonText}>Reset Filter Pencarian</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Global Footer */}
        <Footer />
      </ScrollView>

      {/* Mobile Filter Drawer Modal */}
      <Modal
        visible={filterDrawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterDrawerOpen(false)}
      >
        <View style={styles.drawerModalOverlay}>
          <View style={styles.drawerModalContent}>
            <View style={styles.drawerTopBar}>
              <Text style={styles.drawerTitle}>Filter Produk</Text>
              <TouchableOpacity
                onPress={() => setFilterDrawerOpen(false)}
                style={styles.drawerCloseBtn}
              >
                <X size={20} color={Colors.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerScroll}>
              {renderFilterPanel()}
            </ScrollView>

            <View style={styles.drawerBottomBar}>
              <TouchableOpacity
                style={styles.applyFilterBtn}
                onPress={() => setFilterDrawerOpen(false)}
              >
                <Text style={styles.applyFilterText}>Terapkan Filter ({products.length} Produk)</Text>
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
  layoutContainer: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexWrap: "wrap",
    gap: 12,
  },
  pageBreadcrumb: {
    color: Colors.goldDark,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pageHeading: {
    color: Colors.navy,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  mobileFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  mobileFilterBtnText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "700",
  },
  contentRow: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  sidebarColumn: {
    width: 270,
  },
  productsColumn: {
    flex: 1,
  },
  filterSidebar: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.navy,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resetText: {
    fontSize: 12,
    color: Colors.burgundy,
    fontWeight: "600",
  },
  filterDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 16,
  },
  filterGroup: {
    gap: 10,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 4,
  },
  filterRadioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  filterRadioActive: {
    backgroundColor: Colors.burgundySubtle,
  },
  filterRadioText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterRadioTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 38,
  },
  pricePrefix: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.muted,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.navy,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  priceDash: {
    color: Colors.muted,
    fontSize: 14,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  presetText: {
    fontSize: 11,
    color: Colors.navy,
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.burgundy,
    borderColor: Colors.burgundy,
  },
  checkboxLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.navy,
  },
  controlsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  countInfo: {
    fontSize: 14,
    color: Colors.muted,
  },
  countBold: {
    color: Colors.navy,
    fontWeight: "700",
  },
  sortWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.muted,
    marginRight: 4,
  },
  sortPill: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  sortPillActive: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
  },
  sortPillText: {
    fontSize: 12,
    color: Colors.navy,
    fontWeight: "500",
  },
  sortPillTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.ivoryDark,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  activeChipText: {
    fontSize: 12,
    color: Colors.navy,
    fontWeight: "600",
  },
  clearAllLink: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: Colors.burgundy,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  gridItem: {
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  toast: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  drawerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  drawerModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  drawerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerScroll: {
    padding: 16,
  },
  drawerBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  applyFilterBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyFilterText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
