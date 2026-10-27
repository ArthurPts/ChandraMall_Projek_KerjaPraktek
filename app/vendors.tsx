import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "../constants/Colors";
import { BASE } from "../constants/Api";

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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  const load = () => {
    setLoading(true);
    setError(false);
    fetch(`${BASE}?action=vendors`)
      .then((response) => {
        if (!response.ok) throw new Error(`Vendors request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Vendors response was not a list");
        setVendors(data);
      })
      .catch((reason) => {
        console.error(reason);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>SELLER TERVERIFIKASI</Text>
        <Text style={styles.title}>Toko pilihan</Text>
        <Text style={styles.subtitle}>
          Kenali seller terpercaya dan jelajahi koleksi mereka.
        </Text>
      </View>
      {loading ? (
        <View style={styles.empty}>
          <Ionicons name="sync-outline" size={30} color={Colors.burgundy} />
          <Text style={styles.emptyText}>Memuat toko...</Text>
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={34} color={Colors.muted} />
          <Text style={styles.emptyTitle}>Toko tidak dapat dimuat</Text>
          <Text style={styles.emptyText}>Periksa koneksi lalu coba lagi.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : vendors.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="storefront-outline" size={34} color={Colors.muted} />
          <Text style={styles.emptyTitle}>Belum ada toko</Text>
        </View>
      ) : (
        vendors.map((vendor, index) => (
          <Animated.View
            entering={FadeInDown.duration(320).delay(Math.min(index, 6) * 40)}
            key={vendor.id}
          >
            <TouchableOpacity
              style={styles.vendorCard}
              onPress={() =>
                router.push({ pathname: "/vendor/[slug]", params: { slug: vendor.slug } })
              }
              activeOpacity={0.8}
            >
              {vendor.logo_url ? (
                <Image source={{ uri: vendor.logo_url }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront-outline" size={25} color={Colors.burgundy} />
                </View>
              )}
              <View style={styles.vendorCopy}>
                <View style={styles.vendorNameRow}>
                  <Text numberOfLines={1} style={styles.vendorName}>{vendor.store_name}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.burgundy} />
                </View>
                {!!vendor.origin_city && (
                  <View style={styles.cityRow}>
                    <Ionicons name="location-outline" size={13} color={Colors.muted} />
                    <Text style={styles.city}>{vendor.origin_city}</Text>
                  </View>
                )}
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color={Colors.gold} />
                  <Text style={styles.rating}>
                    {Number(vendor.rating_avg ?? 0).toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>
                    ({Number(vendor.rating_count ?? 0).toLocaleString("id-ID")} ulasan)
                  </Text>
                </View>
                {!!vendor.description && (
                  <Text numberOfLines={2} style={styles.description}>
                    {vendor.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
            </TouchableOpacity>
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  content: { alignSelf: "center", maxWidth: 900, padding: 16, paddingBottom: 30, width: "100%" },
  heading: { marginBottom: 18, paddingTop: 6 },
  eyebrow: { color: Colors.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: Colors.navy, fontSize: 26, fontWeight: "800", marginTop: 5 },
  subtitle: { color: Colors.muted, fontSize: 12, marginTop: 5 },
  vendorCard: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 11,
    padding: 13,
  },
  logo: { backgroundColor: Colors.ivory, borderRadius: 13, height: 58, width: 58 },
  logoPlaceholder: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 13,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  vendorCopy: { flex: 1, marginHorizontal: 12 },
  vendorNameRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  vendorName: { color: Colors.navy, flexShrink: 1, fontSize: 14, fontWeight: "700" },
  cityRow: { alignItems: "center", flexDirection: "row", marginTop: 5 },
  city: { color: Colors.muted, fontSize: 10, marginLeft: 3 },
  ratingRow: { alignItems: "center", flexDirection: "row", marginTop: 5 },
  rating: { color: Colors.navy, fontSize: 11, fontWeight: "700", marginLeft: 4 },
  ratingCount: { color: Colors.muted, fontSize: 10, marginLeft: 4 },
  description: { color: Colors.muted, fontSize: 11, lineHeight: 15, marginTop: 6 },
  empty: { alignItems: "center", marginTop: 46, padding: 20 },
  emptyTitle: { color: Colors.navy, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyText: { color: Colors.muted, fontSize: 12, marginTop: 6 },
  retryButton: { backgroundColor: Colors.burgundy, borderRadius: 9, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
});
