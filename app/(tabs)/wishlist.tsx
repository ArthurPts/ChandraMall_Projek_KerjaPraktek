import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle2, Heart, Package, ShoppingBag, ShoppingCart } from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { MarketplaceProduct, MarketplaceProductCard } from "../../components/marketplace-product-card";
import { BASE } from "../../constants/Api";
import Colors, { Spacing, Typography } from "../../constants/Colors";
import { useSessionUser } from "../../constants/session";
import { useResponsive } from "../../hooks/useResponsive";

export default function Wishlist() {
  const router = useRouter();
  const { isMobile, columns } = useResponsive();
  const { user } = useSessionUser();

  const [items, setItems] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadWishlist = async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await fetch(`${BASE}?action=wishlist&user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [user?.id])
  );

  const handleRemove = async (productId: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BASE}?action=remove_wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
        }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => Number(it.product_id || it.id) !== productId));
        setToastMessage("Item dihapus dari Wishlist");
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch {}
  };

  const handleAddToCart = async (product: MarketplaceProduct) => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    const pid = Number(product.product_id || product.id);
    try {
      const res = await fetch(`${BASE}?action=add_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: pid,
          quantity: 1,
        }),
      });
      if (res.ok) {
        setToastMessage(`Ditambahkan ke Keranjang: ${product.name}`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch {}
  };

  if (!user?.id) {
    return (
      <View style={styles.centerRoot}>
        <Heart size={54} color={Colors.mutedLight} />
        <Text style={styles.emptyTitle}>Masuk untuk Melihat Wishlist</Text>
        <Text style={styles.emptySub}>
          Simpan aneka produk sambal, batik, dan makanan khas Indonesia favorit Anda di sini.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login")}>
          <Text style={styles.primaryBtnText}>Masuk ke Akun</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageEyebrow}>Koleksi Disimpan</Text>
          <Text style={styles.pageTitle}>Wishlist Saya ({items.length})</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity
            style={styles.exploreMoreBtn}
            onPress={() => router.push("/(tabs)/explore")}
          >
            <Text style={styles.exploreMoreText}>+ Tambah Produk Lain</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {toastMessage && (
        <View style={styles.toast}>
          <CheckCircle2 size={16} color={Colors.white} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <FlatList
        key={`wishlist-grid-${columns}`}
        data={items}
        keyExtractor={(item) => String(item.product_id || item.id)}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<Footer />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadWishlist();
            }}
            tintColor={Colors.burgundy}
          />
        }
        renderItem={({ item }) => {
          const pid = Number(item.product_id || item.id);
          return (
            <View style={[styles.cardWrapper, { width: `${100 / columns}%` }]}>
              <MarketplaceProductCard
                product={item}
                onPress={() => router.push(`/product/${pid}`)}
                onAddToCart={() => handleAddToCart(item)}
                onRemove={() => handleRemove(pid)}
                isWishlisted={true}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Heart size={54} color={Colors.mutedLight} />
              <Text style={styles.emptyTitle}>Wishlist Anda Masih Kosong</Text>
              <Text style={styles.emptySub}>
                Belum ada produk yang disimpan. Jelajahi katalog produk Indonesia kami dan klik tanda hati untuk menyimpannya.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.browseBtnText}>Jelajahi Produk Sekarang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.burgundy} />
              <Text style={styles.loadingText}>Memuat wishlist...</Text>
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
  listContainer: {
    flexGrow: 1,
  },
  centerRoot: {
    flex: 1,
    backgroundColor: Colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
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
  primaryBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  headerBlock: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pageEyebrow: {
    fontSize: 12,
    color: Colors.goldDark,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 2,
  },
  exploreMoreBtn: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  exploreMoreText: {
    color: Colors.burgundy,
    fontSize: 12,
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
  loadingBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 10,
  },
  emptyContainer: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 24,
    marginVertical: 40,
  },
  browseBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  browseBtnText: {
    color: Colors.white,
    fontSize: 14,
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
});
