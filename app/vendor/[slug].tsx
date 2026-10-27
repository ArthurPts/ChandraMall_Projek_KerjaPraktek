import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MarketplaceProductCard } from "../../components/marketplace-product-card";
import Colors from "../../constants/Colors";
import { BASE } from "../../constants/Api";
import { getProductColumns } from "../../constants/layout";

type Vendor = {
  store_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  origin_city?: string;
  rating_avg?: number | string;
  rating_count?: number | string;
};

export default function VendorDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = getProductColumns(width);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setFailed(false);
    Promise.all([
      fetch(`${BASE}?action=vendors`).then((response) => {
        if (!response.ok) throw new Error(`Vendors request failed (${response.status})`);
        return response.json();
      }),
      fetch(`${BASE}?action=products&vendor=${encodeURIComponent(slug)}`).then((response) => {
        if (!response.ok) throw new Error(`Vendor products request failed (${response.status})`);
        return response.json();
      }),
    ])
      .then(([vendorData, productData]) => {
        if (!Array.isArray(vendorData) || !Array.isArray(productData)) {
          throw new Error("Vendor data response was not a list");
        }
        setVendor(vendorData.find((item: Vendor) => item.slug === slug) ?? null);
        setProducts(productData);
      })
      .catch((error) => {
        console.error(error);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <View style={styles.container}>
      <FlatList
        key={`vendor-products-${columns}`}
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Animated.View entering={FadeInDown.duration(320)} style={styles.vendorCard}>
              {vendor?.logo_url ? (
                <Image source={{ uri: vendor.logo_url }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront-outline" size={30} color={Colors.burgundy} />
                </View>
              )}
              <View style={styles.vendorInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.vendorName}>{vendor?.store_name ?? slug}</Text>
                  <Ionicons name="checkmark-circle" size={17} color={Colors.burgundy} />
                </View>
                {!!vendor?.origin_city && (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.muted} />
                    <Text style={styles.meta}>{vendor.origin_city}</Text>
                  </View>
                )}
                {vendor && (
                  <View style={styles.metaRow}>
                    <Ionicons name="star" size={14} color={Colors.gold} />
                    <Text style={styles.meta}>
                      {Number(vendor.rating_avg ?? 0).toFixed(1)} ·{" "}
                      {Number(vendor.rating_count ?? 0).toLocaleString("id-ID")} ulasan
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
            {!!vendor?.description && (
              <Text style={styles.description}>{vendor.description}</Text>
            )}
            <View style={styles.section}>
              <View>
                <Text style={styles.sectionTitle}>Produk toko</Text>
                <Text style={styles.sectionCaption}>
                  {loading ? "Memuat produk..." : `${products.length} produk`}
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Ionicons name="sync-outline" size={28} color={Colors.burgundy} />
              <Text style={styles.emptyText}>Memuat produk toko...</Text>
            </View>
          ) : failed ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyText}>Toko tidak dapat dimuat saat ini.</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyText}>Toko ini belum memiliki produk aktif.</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 35)}
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
  content: { alignSelf: "center", maxWidth: 1300, padding: 16, paddingBottom: 28, width: "100%" },
  vendorCard: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  logo: { backgroundColor: Colors.ivory, borderRadius: 15, height: 66, width: 66 },
  logoPlaceholder: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 15, height: 66, justifyContent: "center", width: 66 },
  vendorInfo: { flex: 1, marginLeft: 13 },
  nameRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  vendorName: { color: Colors.navy, flexShrink: 1, fontSize: 17, fontWeight: "800" },
  metaRow: { alignItems: "center", flexDirection: "row", marginTop: 6 },
  meta: { color: Colors.muted, fontSize: 11, marginLeft: 5 },
  description: { color: Colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  section: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 13, paddingTop: 20 },
  sectionTitle: { color: Colors.navy, fontSize: 17, fontWeight: "800" },
  sectionCaption: { color: Colors.muted, fontSize: 11, marginTop: 3 },
  productRow: { gap: 10, marginBottom: 10 },
  cardWrap: { flex: 1 },
  empty: { alignItems: "center", padding: 28 },
  emptyText: { color: Colors.muted, fontSize: 12, marginTop: 8, textAlign: "center" },
});
