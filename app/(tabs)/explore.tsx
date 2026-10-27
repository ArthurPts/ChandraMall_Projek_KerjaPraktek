import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "../../constants/Colors";
import { BASE } from "../../constants/Api";

const categoryIcons: React.ComponentProps<typeof Ionicons>["name"][] = [
  "grid-outline",
  "shirt-outline",
  "fast-food-outline",
  "phone-portrait-outline",
  "home-outline",
  "sparkles-outline",
];

export default function Explore() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();

  const loadCategories = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    fetch(`${BASE}?action=categories`)
      .then((response) => {
        if (!response.ok) throw new Error(`Categories request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Categories response was not a list");
        setCats(data);
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <View style={styles.container}>
      <FlatList
        data={cats}
        keyExtractor={(i) => i.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>JELAJAHI TOKO</Text>
            <Text style={styles.title}>Kategori</Text>
            <Text style={styles.subtitle}>Temukan produk berdasarkan yang Anda cari.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={loadError ? "cloud-offline-outline" : loading ? "sync-outline" : "grid-outline"}
              size={30}
              color={Colors.muted}
            />
            <Text style={styles.emptyTitle}>
              {loadError ? "Kategori tidak dapat dimuat" : loading ? "Memuat kategori..." : "Belum ada kategori"}
            </Text>
            {loadError && (
              <>
                <Text style={styles.emptyText}>Periksa koneksi dan coba lagi.</Text>
                <TouchableOpacity style={styles.retry} onPress={loadCategories}>
                  <Text style={styles.retryText}>Coba lagi</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 45)}
            style={styles.cardWrap}
          >
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.78}
              onPress={() => router.push(`/category/${item.slug}`)}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name={categoryIcons[index % categoryIcons.length]}
                  size={23}
                  color={Colors.burgundy}
                />
              </View>
              <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={15} color={Colors.burgundy} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  list: { alignSelf: "center", maxWidth: 1100, padding: 16, paddingBottom: 28, width: "100%" },
  heading: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 18,
    padding: 17,
  },
  eyebrow: { color: Colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  title: { color: Colors.navy, fontSize: 28, fontWeight: "800", marginTop: 5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 5 },
  row: { gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1 },
  card: {
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 17,
    borderWidth: 1,
    minHeight: 150,
    padding: 15,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  catName: { color: Colors.navy, flex: 1, fontSize: 14, fontWeight: "700", marginTop: 14 },
  arrow: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: Colors.ivory,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  empty: { alignItems: "center", marginTop: 50 },
  emptyTitle: { color: Colors.navy, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyText: { color: Colors.muted, marginTop: 6 },
  retry: { backgroundColor: Colors.burgundy, borderRadius: 9, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
});
