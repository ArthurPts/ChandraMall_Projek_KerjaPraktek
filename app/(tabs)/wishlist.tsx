import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
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

const USER_ID = 1;

export default function Wishlist() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 1240 ? 6 : width >= 1000 ? 5 : width >= 780 ? 4 : width >= 360 ? 3 : 2;

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`${BASE}?action=wishlist&user_id=${USER_ID}`);
      if (!res.ok) throw new Error(`Wishlist request failed (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Wishlist response was not a list");
      setItems(data);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const remove = async (productId: number) => {
    try {
      const response = await fetch(
        `${BASE}?action=remove_wishlist&user_id=${USER_ID}&product_id=${productId}`
      );
      if (!response.ok) throw new Error(`Removing wishlist item failed (${response.status})`);
      await load();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        key={`wishlist-grid-${columns}`}
        data={items}
        keyExtractor={(item) => item.product_id.toString()}
        numColumns={columns}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>SIMPAN FAVORIT</Text>
            <Text style={styles.title}>Wishlist Saya</Text>
            <Text style={styles.subtitle}>Produk pilihan Anda, siap dilihat kembali.</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Ionicons name="sync-outline" size={28} color={Colors.burgundy} />
              <Text style={styles.emptyText}>Memuat wishlist...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={34} color={Colors.muted} />
              <Text style={styles.emptyTitle}>Wishlist tidak dapat dimuat</Text>
              <Text style={styles.emptyText}>Periksa koneksi dan coba lagi.</Text>
              <TouchableOpacity style={styles.retry} onPress={load}>
                <Text style={styles.retryText}>Coba lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={34} color={Colors.muted} />
              <Text style={styles.emptyTitle}>Wishlist kosong</Text>
              <Text style={styles.emptyText}>Simpan produk favorit agar mudah ditemukan.</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 35)}
            style={styles.cardWrap}
          >
            <MarketplaceProductCard
              product={{ ...item, id: item.product_id }}
              compact
              onRemove={() => remove(item.product_id)}
              onPress={() => router.push(`/product/${item.product_id}`)}
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
    maxWidth: 1120,
    paddingHorizontal: 14,
    paddingBottom: 24,
    width: "100%",
  },
  heading: { marginBottom: 18, paddingTop: 16 },
  eyebrow: { color: Colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.3 },
  title: { color: Colors.navy, fontSize: 26, fontWeight: "800", marginTop: 5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 4 },
  productRow: { gap: 10, marginBottom: 10 },
  cardWrap: { flex: 1 },
  empty: { alignItems: "center", marginTop: 48, padding: 20 },
  emptyTitle: { color: Colors.navy, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyText: { color: Colors.muted, fontSize: 12, marginTop: 6, textAlign: "center" },
  retry: { backgroundColor: Colors.burgundy, borderRadius: 9, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
});
