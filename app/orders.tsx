import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Image as ImageIcon,
  MapPin,
  Package,
  QrCode,
  ShoppingBag,
  X,
} from "lucide-react-native";
import { Footer } from "../components/Footer";
import { BASE } from "../constants/Api";
import Colors from "../constants/Colors";
import { formatDate, formatPrice } from "../constants/format";
import { useSessionUser } from "../constants/session";

type OrderItem = {
  id?: number | string;
  product_id?: number | string;
  product_name?: string;
  name?: string;
  image_url?: string | null;
  vendor_name?: string;
  vendor_status?: string;
  quantity?: number | string;
  price?: number | string;
  subtotal?: number | string;
};

type Order = {
  id: number;
  order_number: string;
  status: string;
  created_at: string;
  total_amount: number | string;
  hk_store_name?: string;
  hk_store_district?: string;
  hk_store_address?: string;
  hk_store_phone?: string;
};

type TimelineStep = {
  step: number;
  title: string;
  desc: string;
  timestamp?: string;
  isDone: boolean;
  isCurrent: boolean;
};

type TrackingData = {
  order: any;
  groups: any[];
};

type FilterStatus = "all" | "pending" | "processing" | "shipping" | "ready" | "completed";

export default function Orders() {
  const router = useRouter();
  const { user } = useSessionUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Expanded items for details
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderItem[]>>({});
  const [detailsLoading, setDetailsLoading] = useState<number | null>(null);

  // Tracking Modal
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}?action=orders&user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleExpand = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);

    if (!orderDetails[orderId] && user?.id) {
      setDetailsLoading(orderId);
      try {
        const res = await fetch(
          `${BASE}?action=order_details&user_id=${user.id}&order_id=${orderId}`
        );
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            setOrderDetails((prev) => ({ ...prev, [orderId]: items }));
          }
        }
      } catch {}
      finally {
        setDetailsLoading(null);
      }
    }
  };

  const openTracking = async (order: Order) => {
    setTrackingOrder(order);
    setTrackingModalOpen(true);
    setTrackingLoading(true);

    try {
      const res = await fetch(
        `${BASE}?action=order_tracking&user_id=${user?.id}&order_id=${order.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch {}
    finally {
      setTrackingLoading(false);
    }
  };

  // Helper to build 7-step timeline
  const buildTimeline = (order: Order, track?: TrackingData | null): TimelineStep[] => {
    const rawStatus = (order.status || "").toLowerCase();
    const groupStatus = (track?.groups?.[0]?.status || "").toLowerCase();
    const effectiveStatus = groupStatus || rawStatus;

    // Define sequence order
    // 1: pending_payment
    // 2: paid / awaiting_confirmation
    // 3: packed
    // 4: in_customs
    // 5: shipped
    // 6: arrived_at_hk_store
    // 7: completed / picked_up

    let currentStepNum = 1;
    if (effectiveStatus === "pending_payment") currentStepNum = 1;
    else if (effectiveStatus === "paid" || effectiveStatus === "awaiting_confirmation") currentStepNum = 2;
    else if (effectiveStatus === "packed") currentStepNum = 3;
    else if (effectiveStatus === "in_customs") currentStepNum = 4;
    else if (effectiveStatus === "shipped") currentStepNum = 5;
    else if (effectiveStatus === "arrived_at_hk_store") currentStepNum = 6;
    else if (effectiveStatus === "completed" || effectiveStatus === "picked_up") currentStepNum = 7;

    const group = track?.groups?.[0];

    return [
      {
        step: 1,
        title: "Pesanan Dibuat",
        desc: "Pesanan berhasil tercatat di sistem Chandra Mall.",
        timestamp: formatDate(order.created_at),
        isDone: currentStepNum >= 1,
        isCurrent: currentStepNum === 1,
      },
      {
        step: 2,
        title: "Pembayaran Terkonfirmasi",
        desc: "Dana pembayaran dalam HK$ telah terverifikasi.",
        timestamp: group?.paid_at ? formatDate(group.paid_at) : undefined,
        isDone: currentStepNum >= 2,
        isCurrent: currentStepNum === 2,
      },
      {
        step: 3,
        title: "Diproses & Dikemas Seller di Indonesia",
        desc: "Seller menyiapkan produk dengan standar kemasan ekspor.",
        timestamp: group?.packed_at ? formatDate(group.packed_at) : undefined,
        isDone: currentStepNum >= 3,
        isCurrent: currentStepNum === 3,
      },
      {
        step: 4,
        title: "Pemeriksaan Kepabeanan (Customs Clearance)",
        desc: "Proses verifikasi izin ekspor dan dokumen bea cukai resmi.",
        isDone: currentStepNum >= 4,
        isCurrent: currentStepNum === 4,
      },
      {
        step: 5,
        title: "Pengiriman Udara/Laut ke Hong Kong",
        desc: group?.courier_name
          ? `Dalam perjalanan via ${group.courier_name} (Resi: ${group.tracking_number || "-"})`
          : "Kargo internasional menuju transit bandara/pelabuhan HK.",
        timestamp: group?.shipped_at ? formatDate(group.shipped_at) : undefined,
        isDone: currentStepNum >= 5,
        isCurrent: currentStepNum === 5,
      },
      {
        step: 6,
        title: "Tiba di Toko Mitra HK (Siap Diambil!)",
        desc: `Pesanan telah tiba di ${order.hk_store_name || "Toko Mitra HK"}. Siap diambil oleh pembeli.`,
        timestamp: group?.arrived_at_store_at ? formatDate(group.arrived_at_store_at) : undefined,
        isDone: currentStepNum >= 6,
        isCurrent: currentStepNum === 6,
      },
      {
        step: 7,
        title: "Pesanan Selesai / Telah Diambil",
        desc: "Barang telah berhasil diserahkan kepada pembeli.",
        timestamp: group?.picked_up_at ? formatDate(group.picked_up_at) : undefined,
        isDone: currentStepNum >= 7,
        isCurrent: currentStepNum === 7,
      },
    ];
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("pending")) {
      return { text: "Menunggu Pembayaran", bg: Colors.warningSubtle, color: Colors.warning };
    }
    if (s.includes("packed") || s.includes("awaiting")) {
      return { text: "Diproses Seller", bg: Colors.infoSubtle, color: Colors.info };
    }
    if (s.includes("shipped") || s.includes("customs")) {
      return { text: "Dalam Pengiriman ke HK", bg: Colors.burgundySubtle, color: Colors.burgundy };
    }
    if (s.includes("arrived")) {
      return { text: "Siap Diambil di Toko", bg: Colors.goldSubtle, color: Colors.goldDark };
    }
    if (s.includes("completed") || s.includes("picked_up")) {
      return { text: "Pesanan Selesai", bg: Colors.successSubtle, color: Colors.success };
    }
    return { text: status, bg: Colors.ivoryDark, color: Colors.navy };
  };

  const filteredOrders = orders.filter((o) => {
    const s = o.status.toLowerCase();
    if (filter === "all") return true;
    if (filter === "pending") return s.includes("pending");
    if (filter === "processing") return s.includes("packed") || s.includes("awaiting");
    if (filter === "shipping") return s.includes("shipped") || s.includes("customs");
    if (filter === "ready") return s.includes("arrived");
    if (filter === "completed") return s.includes("completed") || s.includes("picked_up");
    return true;
  });

  if (!user?.id) {
    return (
      <View style={styles.centerRoot}>
        <ShoppingBag size={54} color={Colors.mutedLight} />
        <Text style={styles.emptyTitle}>Masuk untuk Melihat Riwayat Pesanan</Text>
        <Text style={styles.emptySub}>
          Silakan masuk ke akun Chandra Mall Anda untuk memantau status pengiriman dan pengambilan barang di Hong Kong.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login")}>
          <Text style={styles.primaryBtnText}>Masuk ke Akun</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollRoot}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOrders();
            }}
            tintColor={Colors.burgundy}
          />
        }
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageEyebrow}>Dasbor Pembeli</Text>
              <Text style={styles.pageTitle}>Riwayat & Lacak Pesanan</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explore")} style={styles.newOrderBtn}>
              <Text style={styles.newOrderBtnText}>+ Belanja Produk Lain</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Status Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {([
              ["all", "Semua Pesanan"],
              ["pending", "Menunggu Bayar"],
              ["processing", "Diproses Seller"],
              ["shipping", "Dikirim ke HK"],
              ["ready", "Siap Diambil di Toko"],
              ["completed", "Selesai"],
            ] as const).map(([key, label]) => {
              const active = filter === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setFilter(key)}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Orders List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.burgundy} />
              <Text style={styles.loadingText}>Memuat riwayat pesanan...</Text>
            </View>
          ) : filteredOrders.length > 0 ? (
            <View style={styles.ordersList}>
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                const isExpanded = expandedId === order.id;
                const items = orderDetails[order.id] || [];
                const isItemsLoading = detailsLoading === order.id;

                return (
                  <View key={order.id} style={styles.orderCard}>
                    {/* Card Top: Order Number, Date, Status */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.orderNumRow}>
                          <Package size={17} color={Colors.navy} />
                          <Text style={styles.orderNumber}>{order.order_number}</Text>
                        </View>
                        <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    </View>

                    {/* HK Store Pickup Info */}
                    <View style={styles.pickupStoreBox}>
                      <MapPin size={15} color={Colors.burgundy} />
                      <View style={styles.pickupStoreMeta}>
                        <Text style={styles.pickupStoreTitle}>
                          Titik Ambil: {order.hk_store_name || "Toko Mitra Chandra Mall HK"}
                        </Text>
                        <Text style={styles.pickupStoreAddress}>
                          {order.hk_store_address || "Causeway Bay, Hong Kong"}
                        </Text>
                      </View>
                    </View>

                    {/* Order Total & Action Buttons */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.totalLabel}>Total Tagihan</Text>
                        <Text style={styles.totalAmount}>{formatPrice(order.total_amount)}</Text>
                      </View>

                      <View style={styles.cardActions}>
                        {/* 7-Step Tracking Button */}
                        <TouchableOpacity
                          style={styles.trackBtn}
                          onPress={() => openTracking(order)}
                        >
                          <Compass size={15} color={Colors.white} />
                          <Text style={styles.trackBtnText}>Lacak Pengiriman</Text>
                        </TouchableOpacity>

                        {/* Expand Details Button */}
                        <TouchableOpacity
                          style={styles.detailsToggleBtn}
                          onPress={() => toggleExpand(order.id)}
                        >
                          <Text style={styles.detailsToggleText}>
                            {isExpanded ? "Tutup" : "Rincian"}
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={16} color={Colors.navy} />
                          ) : (
                            <ChevronDown size={16} color={Colors.navy} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Expanded Items Section */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <Text style={styles.expandedTitle}>Daftar Produk yang Dipesan:</Text>
                        {isItemsLoading ? (
                          <ActivityIndicator size="small" color={Colors.burgundy} style={{ padding: 12 }} />
                        ) : items.length > 0 ? (
                          <View style={styles.expandedItemsList}>
                            {items.map((item, idx) => (
                              <View key={idx} style={styles.expandedItemRow}>
                                <View style={styles.expandedImgBox}>
                                  {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={styles.expandedImg} />
                                  ) : (
                                    <ImageIcon size={18} color={Colors.mutedLight} />
                                  )}
                                </View>
                                <View style={styles.expandedItemMeta}>
                                  <Text style={styles.expandedItemName}>
                                    {item.product_name || item.name}
                                  </Text>
                                  <Text style={styles.expandedItemSub}>
                                    {item.quantity} barang • {formatPrice(item.price)}
                                  </Text>
                                </View>
                                <Text style={styles.expandedItemTotal}>
                                  {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.noItemsNotice}>Tidak ada rincian item tambahan.</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Package size={54} color={Colors.mutedLight} />
              <Text style={styles.emptyStateTitle}>Tidak Ada Pesanan</Text>
              <Text style={styles.emptyStateSub}>
                Belum ada pesanan yang sesuai dengan filter “{filter}”.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.browseBtnText}>Jelajahi Produk Indonesia</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Footer />
      </ScrollView>

      {/* 7-Step Tracking Timeline Modal */}
      <Modal
        visible={trackingModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTrackingModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>PELACAKAN LINTAS NEGARA ID ⇄ HK</Text>
                <Text style={styles.modalTitle}>Status Pengiriman Pesanan</Text>
                <Text style={styles.modalOrderNumber}>{trackingOrder?.order_number}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTrackingModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {trackingLoading ? (
                <View style={styles.timelineLoading}>
                  <ActivityIndicator size="large" color={Colors.burgundy} />
                  <Text style={styles.loadingText}>Menghubungkan data kargo internasional...</Text>
                </View>
              ) : trackingOrder ? (
                <View style={styles.timelineWrapper}>
                  {/* Pickup Destination Info Banner */}
                  <View style={styles.timelineDestBanner}>
                    <MapPin size={20} color={Colors.burgundy} />
                    <View style={styles.timelineDestTexts}>
                      <Text style={styles.timelineDestTitle}>
                        Toko Mitra Pengambilan di Hong Kong:
                      </Text>
                      <Text style={styles.timelineDestName}>
                        {trackingOrder.hk_store_name || "Toko Chandra HK"}
                      </Text>
                      <Text style={styles.timelineDestAddress}>
                        {trackingOrder.hk_store_address || "Causeway Bay, Hong Kong"}
                      </Text>
                    </View>
                  </View>

                  {/* 7-Step Timeline */}
                  <View style={styles.stepsTimeline}>
                    {buildTimeline(trackingOrder, trackingData).map((step, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      return (
                        <View key={step.step} style={styles.timelineStepRow}>
                          {/* Indicator Column */}
                          <View style={styles.indicatorCol}>
                            <View
                              style={[
                                styles.stepIndicatorCircle,
                                step.isDone && styles.stepIndicatorDone,
                                step.isCurrent && styles.stepIndicatorCurrent,
                              ]}
                            >
                              {step.isDone ? (
                                <Check size={14} color={Colors.white} />
                              ) : (
                                <Text style={styles.stepNumInactive}>{step.step}</Text>
                              )}
                            </View>
                            {!isLast && (
                              <View
                                style={[
                                  styles.stepLine,
                                  step.isDone && styles.stepLineDone,
                                ]}
                              />
                            )}
                          </View>

                          {/* Content Column */}
                          <View style={styles.stepContentCol}>
                            <View style={styles.stepHeaderRow}>
                              <Text
                                style={[
                                  styles.stepRowTitle,
                                  step.isCurrent && styles.stepRowTitleCurrent,
                                ]}
                              >
                                {step.title}
                              </Text>
                              {step.isCurrent && (
                                <View style={styles.currentBadge}>
                                  <Text style={styles.currentBadgeText}>Status Saat Ini</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.stepRowDesc}>{step.desc}</Text>
                            {step.timestamp && (
                              <Text style={styles.stepRowTime}>{step.timestamp}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Pickup Code Box */}
                  <View style={styles.pickupCodeCard}>
                    <View style={styles.qrIconCircle}>
                      <QrCode size={26} color={Colors.burgundy} />
                    </View>
                    <View style={styles.pickupCodeTexts}>
                      <Text style={styles.pickupCodeTitle}>Kode Ambil Pesanan di Kasir</Text>
                      <Text style={styles.pickupCodeValue}>{trackingOrder.order_number}</Text>
                      <Text style={styles.pickupCodeHint}>
                        Tunjukkan nomor pesanan ini kepada staf toko mitra saat mengambil barang.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>
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
  container: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
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
  newOrderBtn: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  newOrderBtnText: {
    color: Colors.burgundy,
    fontSize: 12,
    fontWeight: "700",
  },
  tabsScroll: {
    gap: 8,
    marginBottom: 20,
  },
  tabChip: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  tabChipActive: {
    backgroundColor: Colors.burgundy,
    borderColor: Colors.burgundy,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  tabChipTextActive: {
    color: Colors.white,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 10,
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    gap: 4,
  },
  orderNumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.navy,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.muted,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pickupStoreBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.ivory,
    borderColor: Colors.borderLight,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  pickupStoreMeta: {
    flex: 1,
  },
  pickupStoreTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  pickupStoreAddress: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexWrap: "wrap",
    gap: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.burgundy,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.burgundy,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  trackBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  detailsToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.navy,
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 8,
  },
  expandedItemsList: {
    gap: 8,
  },
  expandedItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.ivory,
    borderRadius: 8,
    padding: 8,
  },
  expandedImgBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  expandedImg: {
    width: "100%",
    height: "100%",
  },
  expandedItemMeta: {
    flex: 1,
  },
  expandedItemName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.navy,
  },
  expandedItemSub: {
    fontSize: 11,
    color: Colors.muted,
  },
  expandedItemTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  noItemsNotice: {
    fontSize: 12,
    color: Colors.muted,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 18,
  },
  browseBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  browseBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: "100%",
    maxWidth: 620,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.ivory,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.goldDark,
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 2,
  },
  modalOrderNumber: {
    fontSize: 13,
    color: Colors.burgundy,
    fontWeight: "700",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: Colors.white,
    borderRadius: 16,
  },
  modalScroll: {
    padding: 20,
  },
  timelineLoading: {
    paddingVertical: 48,
    alignItems: "center",
  },
  timelineWrapper: {
    gap: 20,
  },
  timelineDestBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  timelineDestTexts: {
    flex: 1,
  },
  timelineDestTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.burgundy,
    textTransform: "uppercase",
  },
  timelineDestName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 2,
  },
  timelineDestAddress: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
  },
  stepsTimeline: {
    paddingVertical: 6,
  },
  timelineStepRow: {
    flexDirection: "row",
    gap: 14,
  },
  indicatorCol: {
    alignItems: "center",
    width: 28,
  },
  stepIndicatorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stepIndicatorDone: {
    backgroundColor: Colors.success,
  },
  stepIndicatorCurrent: {
    backgroundColor: Colors.burgundy,
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepNumInactive: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.muted,
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 36,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  stepLineDone: {
    backgroundColor: Colors.success,
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 20,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stepRowTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  stepRowTitleCurrent: {
    color: Colors.burgundy,
    fontSize: 14,
  },
  currentBadge: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
    borderWidth: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  stepRowDesc: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  stepRowTime: {
    fontSize: 10,
    color: Colors.goldDark,
    fontWeight: "600",
    marginTop: 4,
  },
  pickupCodeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  qrIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupCodeTexts: {
    flex: 1,
  },
  pickupCodeTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
  },
  pickupCodeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.burgundy,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  pickupCodeHint: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
});
