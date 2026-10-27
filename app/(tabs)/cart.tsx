import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "../../constants/Colors";

import { BASE } from "../../constants/Api";
const USER_ID = 1;

export default function Cart() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingProduct, setUpdatingProduct] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    setLoadError(false);
    try {
      const res = await fetch(`${BASE}?action=cart&user_id=${USER_ID}`);
      if (!res.ok) throw new Error(`Cart request failed (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Cart response was not a list");
      setItems(data);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const remove = async (productId: number) => {
    try {
      const response = await fetch(`${BASE}?action=remove_cart&user_id=${USER_ID}&product_id=${productId}`);
      if (!response.ok) throw new Error(`Removing cart item failed (${response.status})`);
      setActionMessage("Produk dihapus dari keranjang.");
      await load();
    } catch (error) {
      console.error(error);
      setActionMessage(error instanceof Error ? error.message : "Tidak dapat menghapus produk.");
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1 || updatingProduct !== null) return;
    setUpdatingProduct(productId);
    try {
      const response = await fetch(`${BASE}?action=update_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, product_id: productId, quantity }),
      });
      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error ?? `Updating cart item failed (${response.status})`);
      }
      setActionMessage("Jumlah produk berhasil diperbarui.");
      await load();
    } catch (error) {
      console.error(error);
      setActionMessage(
        error instanceof Error ? error.message : "Jumlah tidak dapat diperbarui."
      );
    } finally {
      setUpdatingProduct(null);
    }
  };

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.product_id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.burgundy}
            colors={[Colors.burgundy]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>BELANJA ANDA</Text>
              <Text style={styles.title}>Keranjang Saya</Text>
              <Text style={styles.caption}>{items.length} produk di keranjang</Text>
            </View>
            {!!actionMessage && (
              <View style={styles.actionMessage} accessibilityRole="alert">
                <Ionicons name="information-circle-outline" size={17} color={Colors.burgundy} />
                <Text style={styles.actionMessageText}>{actionMessage}</Text>
                <TouchableOpacity
                  onPress={() => setActionMessage(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup pesan"
                >
                  <Ionicons name="close" size={16} color={Colors.muted} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={loadError ? "cloud-offline-outline" : loading ? "sync-outline" : "cart-outline"}
              size={36}
              color={Colors.muted}
            />
            <Text style={styles.emptyTitle}>
              {loadError ? "Keranjang tidak dapat dimuat" : loading ? "Memuat keranjang..." : "Keranjang kosong"}
            </Text>
            <Text style={styles.emptyCaption}>
              {loadError
                ? "Periksa koneksi dan tarik ke bawah untuk mencoba lagi."
                : "Produk yang Anda tambahkan akan muncul di sini."}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 45)}
            style={styles.row}
          >
            <Image source={{ uri: item.image_url }} style={styles.img} />
            <View style={styles.itemInfo}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.vendor}>{item.vendor_name}</Text>
              <Text style={styles.price}>Rp {Number(item.price).toLocaleString("id-ID")}</Text>
              <View style={styles.itemFooter}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product_id, Number(item.quantity) - 1)}
                    disabled={updatingProduct !== null}
                    accessibilityRole="button"
                    accessibilityLabel={`Kurangi ${item.name}`}
                  >
                    <Ionicons name="remove" size={15} color={Colors.navy} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>Qty: {item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product_id, Number(item.quantity) + 1)}
                    disabled={
                      updatingProduct !== null ||
                      (item.stock !== undefined && Number(item.quantity) >= Number(item.stock))
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Tambah ${item.name}`}
                  >
                    <Ionicons name="add" size={15} color={Colors.burgundy} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => remove(item.product_id)}
                  style={styles.removeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus ${item.name} dari keranjang`}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.burgundy} />
                  <Text style={styles.removeText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      />
      {items.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.totalCaption}>Total belanja</Text>
            <Text style={styles.total}>Rp {total.toLocaleString("id-ID")}</Text>
          </View>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.btnText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  list: { paddingHorizontal: 14, paddingBottom: 16 },
  heading: { paddingTop: 18, paddingBottom: 18 },
  eyebrow: { color: Colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.3 },
  title: { color: Colors.navy, fontSize: 26, fontWeight: "800", marginTop: 5 },
  caption: { color: Colors.muted, fontSize: 13, marginTop: 4 },
  actionMessage: { alignItems: "center", backgroundColor: Colors.white, borderColor: Colors.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 7, marginBottom: 12, padding: 10 },
  actionMessageText: { color: Colors.navy, flex: 1, fontSize: 11 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 11,
    padding: 12,
  },
  img: { width: 88, height: 88, borderRadius: 12, backgroundColor: Colors.ivory },
  itemInfo: { flex: 1, marginLeft: 13 },
  name: { color: Colors.navy, fontSize: 14, fontWeight: "700" },
  vendor: { color: Colors.muted, fontSize: 11, marginTop: 3 },
  price: { color: Colors.burgundy, fontSize: 14, fontWeight: "800", marginTop: 7 },
  itemFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  quantityControl: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 9, flexDirection: "row", paddingHorizontal: 3 },
  quantityButton: { alignItems: "center", height: 28, justifyContent: "center", width: 27 },
  quantityText: { color: Colors.navy, fontSize: 10, fontWeight: "600", minWidth: 40, textAlign: "center" },
  removeButton: { alignItems: "center", flexDirection: "row" },
  removeText: { color: Colors.burgundy, fontSize: 11, fontWeight: "600", marginLeft: 4 },
  empty: { alignItems: "center", marginTop: 46, padding: 20 },
  emptyTitle: { color: Colors.navy, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyCaption: { color: Colors.muted, fontSize: 13, marginTop: 5, textAlign: "center" },
  footer: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  totalCaption: { color: Colors.muted, fontSize: 11 },
  total: { color: Colors.navy, fontSize: 16, fontWeight: "800", marginTop: 3 },
  btn: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  btnText: { color: Colors.white, fontWeight: "700" },
});