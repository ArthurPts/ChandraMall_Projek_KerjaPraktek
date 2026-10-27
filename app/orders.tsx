import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
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

const USER_ID = 1;

type OrderItem = {
  id?: string | number;
  product_id?: string | number;
  product_name?: string;
  name?: string;
  product?: { name?: string; image_url?: string };
  image_url?: string;
  vendor_name?: string;
  vendor_status?: string;
  notes?: string;
  quantity?: number | string;
  qty?: number | string;
  price?: number | string;
  subtotal?: number | string;
  total?: number | string;
};

type Order = {
  id?: string | number;
  order_number?: string;
  status?: string;
  created_at?: string;
  hk_store_name?: string;
  total_amount?: number | string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  products?: OrderItem[];
  address_line?: string;
  hk_store_address?: string;
  shipping_address?: string;
  payment_method?: string;
  shipping_method?: string;
};

function getOrderItems(order: Order): OrderItem[] {
  const items = order.items ?? order.order_items ?? order.products;
  return Array.isArray(items) ? items : [];
}

function getItemName(item: OrderItem) {
  return item.product_name ?? item.name ?? item.product?.name ?? "Produk";
}

function getItemQuantity(item: OrderItem) {
  return Number(item.quantity ?? item.qty ?? 1);
}

function getItemSubtotal(item: OrderItem) {
  const subtotal = item.subtotal ?? item.total;
  return subtotal === undefined
    ? Number(item.price ?? 0) * getItemQuantity(item)
    : Number(subtotal);
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [detailsByOrder, setDetailsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    fetch(`${BASE}?action=orders&user_id=${USER_ID}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Orders request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Orders response was not a list");
        setOrders(data);
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDetails = async (order: Order, orderKey: string) => {
    if (expandedOrder === orderKey) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderKey);
    if (detailsByOrder[orderKey] || !order.id) return;

    setDetailsLoading(orderKey);
    setDetailsError((current) => {
      const next = { ...current };
      delete next[orderKey];
      return next;
    });
    try {
      const response = await fetch(
        `${BASE}?action=order_details&user_id=${USER_ID}&order_id=${encodeURIComponent(String(order.id))}`
      );
      const data = await response.json();
      if (!response.ok || data?.error || !Array.isArray(data)) {
        throw new Error(data?.error ?? `Order details request failed (${response.status})`);
      }
      setDetailsByOrder((current) => ({ ...current, [orderKey]: data }));
    } catch (error) {
      console.error(error);
      setDetailsError((current) => ({
        ...current,
        [orderKey]: error instanceof Error ? error.message : "Rincian pesanan tidak dapat dimuat.",
      }));
    } finally {
      setDetailsLoading(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>AKTIVITAS BELANJA</Text>
        <Text style={styles.title}>Pesanan Saya</Text>
        <Text style={styles.subtitle}>Lihat status dan rincian setiap pesanan.</Text>
      </View>
      {loadError ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={36} color={Colors.muted} />
          <Text style={styles.emptyTitle}>Pesanan tidak dapat dimuat</Text>
          <Text style={styles.emptyText}>Periksa koneksi dan coba lagi.</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.empty}>
          <Ionicons name="sync-outline" size={32} color={Colors.burgundy} />
          <Text style={styles.emptyText}>Memuat pesanan...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={36} color={Colors.muted} />
          <Text style={styles.emptyTitle}>Belum ada pesanan</Text>
          <Text style={styles.emptyText}>Pesanan Anda akan tampil di halaman ini.</Text>
        </View>
      ) : (
        orders.map((order, index) => {
          const orderKey = String(order.id ?? order.order_number ?? index);
          const items = detailsByOrder[orderKey] ?? getOrderItems(order);
          const isExpanded = expandedOrder === orderKey;
          const storeAddress =
            order.hk_store_address ?? order.address_line ?? order.shipping_address;

          return (
            <Animated.View
              entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 45)}
              key={orderKey}
              style={styles.card}
            >
              <View style={styles.rowBetween}>
                <View style={styles.orderIcon}>
                  <Ionicons name="receipt-outline" size={19} color={Colors.burgundy} />
                </View>
                <View style={styles.orderIdentity}>
                  <Text style={styles.orderLabel}>Nomor pesanan</Text>
                  <Text style={styles.orderNumber}>
                    {order.order_number ?? `Pesanan ${index + 1}`}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.status}>{order.status ?? "Diproses"}</Text>
                </View>
              </View>

              <View style={styles.metadata}>
                <View style={styles.metadataRow}>
                  <Ionicons name="calendar-outline" size={15} color={Colors.muted} />
                  <Text style={styles.metadataText}>
                    {order.created_at ?? "Tanggal tidak tersedia"}
                  </Text>
                </View>
                <View style={styles.metadataRow}>
                  <Ionicons name="location-outline" size={15} color={Colors.muted} />
                  <View style={styles.storeCopy}>
                    <Text style={styles.metadataText}>
                      {order.hk_store_name ?? "Toko tidak tersedia"}
                    </Text>
                    {!!storeAddress && (
                      <Text style={styles.address}>{storeAddress}</Text>
                    )}
                  </View>
                </View>
                {!!order.shipping_method && (
                  <View style={styles.metadataRow}>
                    <Ionicons name="car-outline" size={15} color={Colors.muted} />
                    <Text style={styles.metadataText}>{order.shipping_method}</Text>
                  </View>
                )}
                {!!order.payment_method && (
                  <View style={styles.metadataRow}>
                    <Ionicons name="card-outline" size={15} color={Colors.muted} />
                    <Text style={styles.metadataText}>{order.payment_method}</Text>
                  </View>
                )}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalCaption}>
                  {items.length > 0 ? `${items.length} produk` : "Total pesanan"}
                </Text>
                <Text style={styles.total}>
                  Rp {Number(order.total_amount ?? 0).toLocaleString("id-ID")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.detailsToggle}
                onPress={() => toggleDetails(order, orderKey)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={isExpanded ? "Tutup rincian pesanan" : "Lihat rincian pesanan"}
              >
                <Text style={styles.detailsToggleText}>
                  {isExpanded ? "Tutup rincian" : "Lihat rincian pesanan"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.burgundy}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.details}>
                  <Text style={styles.detailsTitle}>Produk dalam pesanan</Text>
                  {detailsLoading === orderKey ? (
                    <View style={styles.detailsLoading}>
                      <Ionicons name="sync-outline" size={18} color={Colors.burgundy} />
                      <Text style={styles.noItemDetailsText}>Memuat rincian produk...</Text>
                    </View>
                  ) : detailsError[orderKey] ? (
                    <View style={styles.noItemDetails}>
                      <Ionicons name="alert-circle-outline" size={17} color={Colors.burgundy} />
                      <Text style={styles.noItemDetailsText}>{detailsError[orderKey]}</Text>
                    </View>
                  ) : items.length > 0 ? (
                    items.map((item, itemIndex) => {
                      const image = item.image_url ?? item.product?.image_url;
                      return (
                        <View
                          key={String(item.id ?? item.product_id ?? itemIndex)}
                          style={styles.itemRow}
                        >
                          {image ? (
                            <Image source={{ uri: image }} style={styles.itemImage} />
                          ) : (
                            <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                              <Ionicons name="image-outline" size={17} color={Colors.muted} />
                            </View>
                          )}
                          <View style={styles.itemCopy}>
                            <Text numberOfLines={2} style={styles.itemName}>
                              {getItemName(item)}
                            </Text>
                            <Text style={styles.itemQuantity}>
                              Qty {getItemQuantity(item)}
                              {item.price !== undefined
                                ? ` · Rp ${Number(item.price).toLocaleString("id-ID")} / item`
                                : ""}
                            </Text>
                            {!!item.vendor_name && (
                              <Text style={styles.itemVendor}>{item.vendor_name}</Text>
                            )}
                            {!!item.vendor_status && (
                              <Text style={styles.itemVendorStatus}>
                                Status toko: {item.vendor_status}
                              </Text>
                            )}
                            {!!item.notes && (
                              <Text style={styles.itemNote}>Catatan: {item.notes}</Text>
                            )}
                          </View>
                          <Text style={styles.itemSubtotal}>
                            Rp {getItemSubtotal(item).toLocaleString("id-ID")}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.noItemDetails}>
                      <Ionicons name="information-circle-outline" size={17} color={Colors.muted} />
                      <Text style={styles.noItemDetailsText}>
                        Rincian produk belum tersedia dari server untuk pesanan ini.
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailTotalRow}>
                    <Text style={styles.detailTotalLabel}>Total pembayaran</Text>
                    <Text style={styles.detailTotal}>
                      Rp {Number(order.total_amount ?? 0).toLocaleString("id-ID")}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  content: { alignSelf: "center", maxWidth: 900, padding: 16, paddingBottom: 30, width: "100%" },
  heading: { paddingTop: 6, paddingBottom: 18 },
  eyebrow: { color: Colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.3 },
  title: { color: Colors.navy, fontSize: 27, fontWeight: "800", marginTop: 5 },
  subtitle: { color: Colors.muted, fontSize: 13, marginTop: 4 },
  empty: { alignItems: "center", marginTop: 45, padding: 20 },
  emptyTitle: { color: Colors.navy, fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyText: { color: Colors.muted, fontSize: 13, marginTop: 5, textAlign: "center" },
  retry: { backgroundColor: Colors.burgundy, borderRadius: 9, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
  },
  rowBetween: { alignItems: "center", flexDirection: "row" },
  orderIcon: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 11, height: 40, justifyContent: "center", width: 40 },
  orderIdentity: { flex: 1, marginLeft: 10 },
  orderLabel: { color: Colors.muted, fontSize: 10 },
  orderNumber: { color: Colors.navy, fontSize: 13, fontWeight: "700", marginTop: 3 },
  statusBadge: { backgroundColor: Colors.ivory, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  status: { color: Colors.gold, fontSize: 11, fontWeight: "700" },
  metadata: { gap: 9, marginTop: 15 },
  metadataRow: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  metadataText: { color: Colors.muted, flexShrink: 1, fontSize: 12 },
  storeCopy: { flex: 1, gap: 3 },
  address: { color: Colors.muted, fontSize: 11, lineHeight: 16 },
  totalRow: { alignItems: "center", borderTopColor: Colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 12 },
  totalCaption: { color: Colors.muted, fontSize: 12 },
  total: { color: Colors.burgundy, fontSize: 15, fontWeight: "800" },
  detailsToggle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingTop: 13 },
  detailsToggleText: { color: Colors.burgundy, fontSize: 12, fontWeight: "700" },
  details: { borderTopColor: Colors.border, borderTopWidth: 1, marginTop: 12, paddingTop: 13 },
  detailsTitle: { color: Colors.navy, fontSize: 13, fontWeight: "700", marginBottom: 10 },
  itemRow: { alignItems: "center", flexDirection: "row", marginBottom: 10 },
  itemImage: { backgroundColor: Colors.ivory, borderRadius: 8, height: 46, width: 46 },
  itemImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  itemCopy: { flex: 1, marginHorizontal: 10 },
  itemName: { color: Colors.navy, fontSize: 12, fontWeight: "600", lineHeight: 16 },
  itemQuantity: { color: Colors.muted, fontSize: 10, marginTop: 4 },
  itemVendor: { color: Colors.muted, fontSize: 10, marginTop: 3 },
  itemVendorStatus: { color: Colors.gold, fontSize: 10, marginTop: 3 },
  itemNote: { color: Colors.navy, fontSize: 10, marginTop: 3 },
  itemSubtotal: { color: Colors.navy, fontSize: 11, fontWeight: "700" },
  noItemDetails: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 10, flexDirection: "row", gap: 8, padding: 10 },
  detailsLoading: { alignItems: "center", backgroundColor: Colors.ivory, borderRadius: 10, flexDirection: "row", gap: 8, padding: 10 },
  noItemDetailsText: { color: Colors.muted, flex: 1, fontSize: 11, lineHeight: 16 },
  detailTotalRow: { alignItems: "center", borderTopColor: Colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 5, paddingTop: 11 },
  detailTotalLabel: { color: Colors.muted, fontSize: 11 },
  detailTotal: { color: Colors.burgundy, fontSize: 13, fontWeight: "800" },
});
