import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  Truck,
} from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { BASE } from "../../constants/Api";
import Colors, { Spacing, Typography } from "../../constants/Colors";
import { formatPrice } from "../../constants/format";
import { useSessionUser } from "../../constants/session";
import { useResponsive } from "../../hooks/useResponsive";

type CartItem = {
  product_id: number;
  name: string;
  price: number | string;
  stock: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  vendor_name?: string;
};

export default function Cart() {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { user } = useSessionUser();

  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCart = async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await fetch(`${BASE}?action=cart&user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
          // Auto select all items by default
          setSelectedIds(new Set(data.map((i: CartItem) => Number(i.product_id))));
        }
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
      loadCart();
    }, [user?.id])
  );

  const handleUpdateQty = async (productId: number, newQty: number) => {
    if (!user?.id || newQty < 1 || updatingId !== null) return;
    setUpdatingId(productId);

    try {
      const res = await fetch(`${BASE}?action=update_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: productId,
          quantity: newQty,
        }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((it) =>
            Number(it.product_id) === productId ? { ...it, quantity: newQty } : it
          )
        );
      }
    } catch {}
    finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${BASE}?action=remove_cart&user_id=${user.id}&product_id=${productId}`
      );
      if (res.ok) {
        setItems((prev) => prev.filter((it) => Number(it.product_id) !== productId));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        setToastMessage("Item berhasil dihapus");
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch {}
  };

  const toggleSelect = (productId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => Number(i.product_id))));
    }
  };

  // Calculations
  const selectedItems = items.filter((it) => selectedIds.has(Number(it.product_id)));
  const subtotal = selectedItems.reduce(
    (acc, it) => acc + Number(it.price) * Number(it.quantity),
    0
  );
  const discount = voucherApplied ? Math.min(20, Math.round(subtotal * 0.1)) : 0;
  const shippingFee = 0; // Free pickup at HK Partner stores
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);

  if (!user?.id) {
    return (
      <View style={styles.centerRoot}>
        <ShoppingCart size={54} color={Colors.mutedLight} />
        <Text style={styles.emptyTitle}>Masuk untuk Melihat Keranjang</Text>
        <Text style={styles.emptySubtitle}>
          Daftar atau masuk ke akun Chandra Mall Anda untuk mengakses keranjang dan riwayat pesanan.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryBtnText}>Masuk ke Akun</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerRoot}>
        <ActivityIndicator size="large" color={Colors.burgundy} />
        <Text style={styles.loadingText}>Memuat keranjang belanja...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
              loadCart();
            }}
            tintColor={Colors.burgundy}
          />
        }
      >
        <View style={styles.container}>
          {/* Header Bar */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageEyebrow}>Pusat Pengambilan Hong Kong</Text>
              <Text style={styles.pageTitle}>Keranjang Belanja ({items.length})</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/explore")}
              style={styles.continueShopBtn}
            >
              <Text style={styles.continueShopText}>Lanjut Belanja →</Text>
            </TouchableOpacity>
          </View>

          {items.length > 0 ? (
            <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
              {/* Left Column: Items List */}
              <View style={[styles.itemsCol, isDesktop && styles.itemsColDesktop]}>
                {/* Select All Bar */}
                <View style={styles.selectAllBar}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={toggleSelectAll}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedIds.size === items.length && styles.checkboxActive,
                      ]}
                    >
                      {selectedIds.size === items.length && (
                        <Check size={12} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.selectAllText}>
                      Pilih Semua ({selectedIds.size}/{items.length} item)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Items List */}
                <View style={styles.itemsList}>
                  {items.map((item) => {
                    const isSelected = selectedIds.has(Number(item.product_id));
                    const isUpdating = updatingId === Number(item.product_id);
                    return (
                      <View key={item.product_id} style={styles.cartCard}>
                        {/* Store / Vendor Tag */}
                        {item.vendor_name && (
                          <View style={styles.storeHeader}>
                            <Store size={14} color={Colors.burgundy} />
                            <Text style={styles.storeName}>{item.vendor_name}</Text>
                            <View style={styles.hkVerifiedPill}>
                              <Text style={styles.hkVerifiedText}>Toko Indonesia</Text>
                            </View>
                          </View>
                        )}

                        <View style={styles.itemRow}>
                          {/* Selection Checkbox */}
                          <TouchableOpacity
                            style={styles.itemCheckbox}
                            onPress={() => toggleSelect(Number(item.product_id))}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxActive,
                              ]}
                            >
                              {isSelected && <Check size={12} color={Colors.white} />}
                            </View>
                          </TouchableOpacity>

                          {/* Image */}
                          <TouchableOpacity
                            onPress={() => router.push(`/product/${item.product_id}`)}
                            style={styles.itemImageWrapper}
                          >
                            {item.image_url ? (
                              <Image
                                source={{ uri: item.image_url }}
                                style={styles.itemImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.itemImage, styles.placeholderImg]}>
                                <ImageIcon size={24} color={Colors.mutedLight} />
                              </View>
                            )}
                          </TouchableOpacity>

                          {/* Details */}
                          <View style={styles.itemInfo}>
                            <TouchableOpacity
                              onPress={() => router.push(`/product/${item.product_id}`)}
                            >
                              <Text style={styles.itemName} numberOfLines={2}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>

                            <Text style={styles.itemPrice}>
                              {formatPrice(item.price)}
                            </Text>

                            {/* Qty & Delete */}
                            <View style={styles.itemActions}>
                              <View style={styles.qtyBox}>
                                <TouchableOpacity
                                  style={styles.qtyBtn}
                                  onPress={() =>
                                    handleUpdateQty(
                                      Number(item.product_id),
                                      Number(item.quantity) - 1
                                    )
                                  }
                                  disabled={isUpdating || Number(item.quantity) <= 1}
                                >
                                  <Minus size={13} color={Colors.navy} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>
                                  {isUpdating ? "..." : item.quantity}
                                </Text>
                                <TouchableOpacity
                                  style={styles.qtyBtn}
                                  onPress={() =>
                                    handleUpdateQty(
                                      Number(item.product_id),
                                      Number(item.quantity) + 1
                                    )
                                  }
                                  disabled={
                                    isUpdating ||
                                    (item.stock !== undefined &&
                                      Number(item.quantity) >= Number(item.stock))
                                  }
                                >
                                  <Plus size={13} color={Colors.navy} />
                                </TouchableOpacity>
                              </View>

                              <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => handleRemove(Number(item.product_id))}
                              >
                                <Trash2 size={16} color={Colors.error} />
                                <Text style={styles.deleteText}>Hapus</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Shipping notice */}
                <View style={styles.pickupGuaranteeBox}>
                  <Truck size={20} color={Colors.burgundy} />
                  <View style={styles.guaranteeTextCol}>
                    <Text style={styles.guaranteeTitle}>
                      Pengambilan Toko Mitra di Hong Kong Bebas Biaya
                    </Text>
                    <Text style={styles.guaranteeDesc}>
                      Semua pesanan dikirim langsung ke toko mitra kami di Causeway Bay & Wan Chai. Anda tidak dikenakan biaya pengiriman lokal tambahan saat mengambil di toko.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right Column: Order Summary Card */}
              <View style={[styles.summaryCol, isDesktop && styles.summaryColDesktop]}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Ringkasan Belanja</Text>

                  {/* Voucher Box */}
                  <View style={styles.voucherBox}>
                    <Tag size={15} color={Colors.goldDark} />
                    <TextInput
                      style={styles.voucherInput}
                      placeholder="Kode Promo (cth: CHANDRAHK)"
                      placeholderTextColor={Colors.muted}
                      value={voucherCode}
                      onChangeText={setVoucherCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.voucherBtn}
                      onPress={() => {
                        if (voucherCode.trim().toUpperCase() === "CHANDRAHK") {
                          setVoucherApplied(true);
                          setToastMessage("Voucher Diskon HK$ 20 Berhasil Digunakan!");
                          setTimeout(() => setToastMessage(null), 3000);
                        } else {
                          setToastMessage("Kode voucher tidak valid.");
                          setTimeout(() => setToastMessage(null), 3000);
                        }
                      }}
                    >
                      <Text style={styles.voucherBtnText}>Pakai</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Breakdown */}
                  <View style={styles.summaryRows}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Harga ({selectedItems.length} barang)</Text>
                      <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
                    </View>

                    {voucherApplied && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, styles.discountLabel]}>Diskon Voucher</Text>
                        <Text style={[styles.summaryValue, styles.discountValue]}>
                          -{formatPrice(discount)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.summaryRow}>
                      <View style={styles.shippingLabelRow}>
                        <Text style={styles.summaryLabel}>Biaya Pickup Toko HK</Text>
                        <Text style={styles.freeBadge}>GRATIS</Text>
                      </View>
                      <Text style={styles.summaryValue}>{formatPrice(0)}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* Total */}
                  <View style={styles.totalRow}>
                    <View>
                      <Text style={styles.totalLabel}>Total Pembayaran</Text>
                      <Text style={styles.currencyNote}>dalam mata uang HK$</Text>
                    </View>
                    <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
                  </View>

                  {/* Checkout Button */}
                  <TouchableOpacity
                    style={[
                      styles.checkoutBtn,
                      selectedItems.length === 0 && styles.checkoutBtnDisabled,
                    ]}
                    onPress={() => {
                      if (selectedItems.length > 0) {
                        router.push("/checkout");
                      }
                    }}
                    disabled={selectedItems.length === 0}
                  >
                    <Text style={styles.checkoutBtnText}>Lanjut ke Checkout ({selectedItems.length})</Text>
                    <ArrowRight size={17} color={Colors.white} />
                  </TouchableOpacity>

                  <View style={styles.securityNote}>
                    <ShieldCheck size={14} color={Colors.success} />
                    <Text style={styles.securityText}>Pembayaran Aman & Verifikasi Resmi HK</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCartBox}>
              <ShoppingBag size={64} color={Colors.mutedLight} />
              <Text style={styles.emptyCartTitle}>Keranjang Belanja Masih Kosong</Text>
              <Text style={styles.emptyCartSub}>
                Temukan aneka Sambal Nusantara, Bumbu Masak, Batik, dan Kuliner Khas Indonesia untuk dikirim ke Hong Kong.
              </Text>
              <TouchableOpacity
                style={styles.startShopBtn}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.startShopText}>Mulai Belanja Sekarang</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Global Footer */}
        <Footer />
      </ScrollView>
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
  emptySubtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 340,
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
  loadingText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  container: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 12,
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
    fontSize: 22,
    fontWeight: "800",
    color: Colors.navy,
    marginTop: 2,
  },
  continueShopBtn: {
    paddingVertical: 4,
  },
  continueShopText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "600",
  },
  mainLayout: {
    flexDirection: "column",
    gap: 24,
  },
  mainLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemsCol: {
    width: "100%",
  },
  itemsColDesktop: {
    width: "64%",
  },
  selectAllBar: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.burgundy,
    borderColor: Colors.burgundy,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  itemsList: {
    gap: 12,
  },
  cartCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  storeName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  hkVerifiedPill: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
    borderWidth: 0.8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: "auto",
  },
  hkVerifiedText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  itemCheckbox: {
    padding: 4,
  },
  itemImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImg: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.burgundy,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.ivory,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  deleteText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "600",
  },
  pickupGuaranteeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  guaranteeDesc: {
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  summaryCol: {
    width: "100%",
  },
  summaryColDesktop: {
    width: "33%",
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.navy,
    marginBottom: 16,
  },
  voucherBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    height: 40,
  },
  voucherInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.navy,
    marginLeft: 6,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  voucherBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  voucherBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryRows: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
  },
  discountLabel: {
    color: Colors.success,
  },
  discountValue: {
    color: Colors.success,
  },
  shippingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  freeBadge: {
    backgroundColor: Colors.successSubtle,
    color: Colors.success,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
  },
  currencyNote: {
    fontSize: 11,
    color: Colors.muted,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.burgundy,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.burgundy,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  securityText: {
    fontSize: 11,
    color: Colors.muted,
  },
  emptyCartBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 24,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    maxWidth: 380,
    lineHeight: 18,
    marginBottom: 20,
  },
  startShopBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  startShopText: {
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
