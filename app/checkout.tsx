import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "../constants/Colors";

const BASE = "http://localhost/chandra/db.php";
const USER_ID = 1;

export default function Checkout() {
  const [items, setItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${BASE}?action=cart&user_id=${USER_ID}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Cart request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Cart response was not a list");
        setItems(data);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert("Keranjang tidak tersedia", "Periksa koneksi dan coba checkout lagi.");
      });

    fetch(`${BASE}?action=hk_stores`)
      .then((response) => {
        if (!response.ok) throw new Error(`Store request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Stores response was not a list");
        setStores(data);
        if (data.length > 0) setSelectedStore(data[0].id);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert("Toko tidak tersedia", "Daftar toko Hong Kong tidak dapat dimuat.");
      });
  }, []);

  const total = items.reduce(
    (s, i) => s + Number(i.price) * Number(i.quantity),
    0
  );

  const submit = async () => {
    if (!selectedStore) {
      Alert.alert("Perhatian", "Pilih toko Hong Kong terlebih dahulu");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Perhatian", "Keranjang kosong");
      return;
    }
    try {
      const res = await fetch(`${BASE}?action=checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          hk_store_id: selectedStore,
        }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Gagal", data.error);
      } else {
        Alert.alert("Berhasil", `Order ${data.order_number} dibuat`);
        router.replace("/(tabs)");
      }
    } catch {
      Alert.alert("Error", "Gagal membuat pesanan");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.heading}>
        <Text style={styles.eyebrow}>LANGKAH TERAKHIR</Text>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Periksa pesanan dan pilih toko pengambilan.</Text>
      </Animated.View>

      <Text style={styles.section}>Ringkasan Pesanan</Text>
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cart-outline" size={27} color={Colors.muted} />
          <Text style={styles.empty}>Keranjang kosong</Text>
        </View>
      ) : (
        items.map((item, index) => (
          <Animated.View
            entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 45)}
            key={`item-${index}`}
            style={styles.row}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>{item.quantity} x Rp {Number(item.price).toLocaleString("id-ID")}</Text>
            </View>
            <Text style={styles.itemSubtotal}>
              Rp {(Number(item.price) * Number(item.quantity)).toLocaleString("id-ID")}
            </Text>
          </Animated.View>
        ))
      )}

      <Text style={styles.section}>Pilih Toko Hong Kong</Text>

      {stores.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="storefront-outline" size={27} color={Colors.muted} />
          <Text style={styles.empty}>Belum ada toko tersedia</Text>
        </View>
      ) : (
        stores.map((s, index) => (
          <TouchableOpacity
            key={`store-${s.id ?? index}`}
            style={[
              styles.store,
              selectedStore === s.id && styles.storeActive,
            ]}
            onPress={() => setSelectedStore(s.id)}
            activeOpacity={0.8}
          >
            <View style={styles.storeIcon}>
              <Ionicons name="location-outline" size={19} color={Colors.burgundy} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{s.name}</Text>
              <Text style={styles.storeAddr}>{s.address_line}</Text>
            </View>
            <Ionicons
              name={selectedStore === s.id ? "checkmark-circle" : "ellipse-outline"}
              size={21}
              color={selectedStore === s.id ? Colors.burgundy : Colors.muted}
            />
          </TouchableOpacity>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.totalCaption}>Total pembayaran</Text>
        <Text style={styles.total}>Rp {total.toLocaleString("id-ID")}</Text>
        <TouchableOpacity style={styles.btn} onPress={submit} activeOpacity={0.85}>
          <Text style={styles.btnText}>Buat Pesanan</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ivory,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heading: { paddingTop: 15, paddingBottom: 12 },
  eyebrow: { color: Colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.3 },
  title: { color: Colors.navy, fontSize: 27, fontWeight: "800", marginTop: 5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 4 },
  section: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 14,
    marginBottom: 10,
  },
  empty: {
    color: Colors.muted,
    textAlign: "center",
    marginLeft: 9,
    fontSize: 13,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    padding: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 8,
    padding: 13,
  },
  itemName: {
    fontWeight: "700",
    color: Colors.navy,
    fontSize: 13,
  },
  itemQty: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 5,
  },
  itemSubtotal: {
    color: Colors.burgundy,
    fontWeight: "700",
    fontSize: 13,
  },
  store: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    flexDirection: "row",
    padding: 13,
    borderRadius: 13,
    marginBottom: 8,
  },
  storeActive: {
    borderColor: Colors.burgundy,
    borderWidth: 2,
  },
  storeIcon: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 11, height: 40, justifyContent: "center", width: 40 },
  storeInfo: { flex: 1, marginHorizontal: 11 },
  storeName: {
    fontWeight: "700",
    color: Colors.navy,
    fontSize: 13,
  },
  storeAddr: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  totalCaption: { color: Colors.muted, fontSize: 12 },
  total: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 3,
    marginBottom: 13,
  },
  btn: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 50,
    gap: 8,
  },
  btnText: {
    color: Colors.white,
    fontWeight: "700",
  },
});