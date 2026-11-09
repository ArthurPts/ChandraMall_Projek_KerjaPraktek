import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Wallet,
} from "lucide-react-native";
import { Footer } from "../components/Footer";
import { BASE } from "../constants/Api";
import Colors from "../constants/Colors";
import { formatPrice } from "../constants/format";
import { useSessionUser } from "../constants/session";
import { useResponsive } from "../hooks/useResponsive";

type CartItem = {
  product_id: number;
  name: string;
  price: number | string;
  quantity: number;
  image_url?: string | null;
  vendor_id?: number | string;
  vendor_name?: string;
};

type HKStore = {
  id: number;
  name: string;
  district?: string;
  address_line: string;
  phone?: string;
  opening_hours?: string;
  supported_vendor_ids?: string;
};

export type VendorPickupGroup = {
  vendorId: number;
  vendorName: string;
  items: CartItem[];
  supportedStores: HKStore[];
};

export type StoreAssignment = {
  vendor_id: number;
  vendor_name: string;
  hk_store_id: number;
  store_name: string;
  store_address: string;
  store_district?: string;
  items: {
    product_id: number;
    name: string;
    quantity: number;
    price: number | string;
  }[];
};

type PaymentMethod = "fps" | "payme" | "octopus" | "pickup";

type OrderSuccessState = {
  orderNumber: string;
  total: number;
  isSplit: boolean;
  storeName?: string;
  storeAddress?: string;
  storeAssignments?: StoreAssignment[];
};

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams<{ items?: string }>();
  const { isDesktop } = useResponsive();
  const { user, loading: sessionLoading } = useSessionUser();

  const [items, setItems] = useState<CartItem[]>([]);
  const [allStores, setAllStores] = useState<HKStore[]>([]);
  const [commonStores, setCommonStores] = useState<HKStore[]>([]);
  const [vendorGroups, setVendorGroups] = useState<VendorPickupGroup[]>([]);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [vendorStoreSelections, setVendorStoreSelections] = useState<Record<number, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("fps");

  // Contact info
  const [buyerName, setBuyerName] = useState(user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || "");
  const [buyerEmail, setBuyerEmail] = useState(user?.email || "");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessState | null>(null);

  // Helper agar alert tetap muncul di Platform Web maupun Mobile
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        window.alert(`${title}\n\n${message}`);
      } catch {
        // Fallback jika window.alert diblokir
      }
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (user.name) setBuyerName((prev) => prev || user.name);
    if (user.phone) setBuyerPhone((prev) => prev || user.phone || "");
    if (user.email) setBuyerEmail((prev) => prev || user.email);

    setLoading(true);
    setErrorMessage(null);

    Promise.all([
      fetch(`${BASE}?action=cart&user_id=${user.id}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${BASE}?action=hk_stores`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([cartData, storeData]) => {
        const rawCart: CartItem[] = Array.isArray(cartData) ? cartData : [];

        // Filter hanya item yang dichecklist dari cart jika parameter items tersedia
        const selectedPids = params.items
          ? params.items.split(",").map(Number).filter(Boolean)
          : [];
        const checkoutItems =
          selectedPids.length > 0
            ? rawCart.filter((it) => selectedPids.includes(Number(it.product_id)))
            : rawCart;

        setItems(checkoutItems);

        // Normalisasikan daftar semua toko mitra HK
        const normalizedStores: HKStore[] = Array.isArray(storeData)
          ? storeData.map((s: any) => ({ ...s, id: Number(s.id) }))
          : [];
        setAllStores(normalizedStores);

        // Kelompokkan produk berdasarkan vendor_id
        const groupsMap = new Map<number, CartItem[]>();
        checkoutItems.forEach((it) => {
          const vId = Number(it.vendor_id || 1);
          if (!groupsMap.has(vId)) groupsMap.set(vId, []);
          groupsMap.get(vId)!.push(it);
        });

        const vGroups: VendorPickupGroup[] = [];
        groupsMap.forEach((gItems, vId) => {
          const vName = gItems[0]?.vendor_name || `Vendor #${vId}`;
          const supported = normalizedStores.filter((st) => {
            if (!st.supported_vendor_ids) return false;
            const ids = st.supported_vendor_ids.split(",").map(Number);
            return ids.includes(vId);
          });
          vGroups.push({
            vendorId: vId,
            vendorName: vName,
            items: gItems,
            supportedStores: supported,
          });
        });
        setVendorGroups(vGroups);

        // Cari toko bersama yang bermitra dengan SEMUA vendor terpilih
        const common = normalizedStores.filter((st) => {
          if (!st.supported_vendor_ids) return false;
          const ids = st.supported_vendor_ids.split(",").map(Number);
          return vGroups.length > 0 && vGroups.every((vg) => ids.includes(vg.vendorId));
        });
        setCommonStores(common);

        const newSelections: Record<number, number> = {};
        if (common.length > 0) {
          // Kasus A: Ada toko bersama -> gunakan mode 1 toko bersama
          setIsSplitMode(false);
          setSelectedStoreId(common[0].id);
          vGroups.forEach((vg) => {
            newSelections[vg.vendorId] = common[0].id;
          });
        } else {
          // Kasus B: Tidak ada toko bersama -> mode multi-titik pengambilan
          setIsSplitMode(true);
          setSelectedStoreId(null);
          vGroups.forEach((vg) => {
            if (vg.supportedStores.length > 0) {
              newSelections[vg.vendorId] = vg.supportedStores[0].id;
            }
          });
        }
        setVendorStoreSelections(newSelections);
      })
      .catch((err) => {
        console.error("Gagal memuat data checkout:", err);
        setErrorMessage("Gagal memuat data toko / keranjang dari server.");
      })
      .finally(() => setLoading(false));
  }, [user?.id, sessionLoading, params.items]);

  const total = items.reduce(
    (acc, it) => acc + Number(it.price) * Number(it.quantity),
    0
  );

  const selectedStore = allStores.find((s) => Number(s.id) === Number(selectedStoreId));

  const vendorNames = Array.from(
    new Set(items.map((it) => it.vendor_name).filter(Boolean))
  );

  const handleSubmitOrder = async () => {
    setErrorMessage(null);

    const userId = Number(user?.id);
    if (!userId || userId <= 0) {
      const msg = "Sesi Anda tidak valid. Silakan masuk kembali ke akun Anda.";
      setErrorMessage(msg);
      showAlert("Perhatian", msg);
      return;
    }

    if (items.length === 0) {
      const msg = "Keranjang belanja Anda kosong.";
      setErrorMessage(msg);
      showAlert("Perhatian", msg);
      return;
    }

    // Validasi pemilihan toko untuk mode split atau single
    if (isSplitMode) {
      for (const vg of vendorGroups) {
        if (!vendorStoreSelections[vg.vendorId]) {
          const msg = `Silakan pilih titik toko mitra pengambilan untuk produk dari '${vg.vendorName}'.`;
          setErrorMessage(msg);
          showAlert("Perhatian", msg);
          return;
        }
      }
    } else {
      if (!selectedStoreId || commonStores.length === 0) {
        const msg = "Silakan pilih titik Toko Mitra HK untuk pengambilan barang.";
        setErrorMessage(msg);
        showAlert("Perhatian", msg);
        return;
      }
    }

    setSubmitting(true);
    try {
      const selectedPids = items.map((it) => Number(it.product_id));
      const storesPayload = isSplitMode
        ? { ...vendorStoreSelections }
        : vendorGroups.reduce((acc, vg) => ({ ...acc, [vg.vendorId]: selectedStoreId! }), {});

      const res = await fetch(`${BASE}?action=checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_ids: selectedPids,
          hk_store_id: selectedStoreId || Object.values(vendorStoreSelections)[0] || 1,
          vendor_stores: storesPayload,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const errorMsg = data.error || "Terjadi kesalahan saat membuat pesanan.";
        setErrorMessage(errorMsg);
        showAlert("Gagal Membuat Pesanan", errorMsg);
      } else {
        // Notifikasi Toast bahwa pesanan berhasil & otomatis terbayar
        setToastMessage("Pesanan berhasil dibuat & otomatis terbayar!");
        setErrorMessage(null);

        const chosenStore = allStores.find((s) => Number(s.id) === Number(selectedStoreId));

        setOrderSuccess({
          orderNumber: data.order_number,
          total: Number(data.total || total),
          isSplit: isSplitMode,
          storeName: chosenStore?.name || "Toko Mitra Chandra Mall HK",
          storeAddress: chosenStore?.address_line || "Causeway Bay, Hong Kong",
          storeAssignments: data.store_assignments || [],
        });

        // Kosongkan list keranjang di frontend
        setItems([]);
      }
    } catch (err: any) {
      console.error("Checkout submit error:", err);
      const errMsg = err?.message || "Terjadi gangguan koneksi saat membuat pesanan.";
      setErrorMessage(errMsg);
      showAlert("Kesalahan", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading || (loading && user?.id)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.burgundy} />
        <Text style={styles.loadingText}>Menyiapkan halaman checkout...</Text>
      </View>
    );
  }

  if (!user?.id) {
    return (
      <ScrollView contentContainerStyle={styles.scrollRoot}>
        <View style={styles.container}>
          <View style={styles.unauthCard}>
            <View style={styles.unauthIconCircle}>
              <User size={38} color={Colors.burgundy} />
            </View>
            <Text style={styles.unauthTitle}>Silakan Masuk ke Akun Anda</Text>
            <Text style={styles.unauthSub}>
              Anda perlu masuk terlebih dahulu untuk menyelesaikan pesanan dan memilih titik pengambilan di Hong Kong.
            </Text>
            <TouchableOpacity
              style={styles.unauthBtn}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.unauthBtnText}>Masuk ke Akun</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  // Order Success Confirmation Screen
  if (orderSuccess) {
    return (
      <ScrollView contentContainerStyle={styles.scrollRoot}>
        {toastMessage && (
          <View style={styles.toast}>
            <CheckCircle2 size={18} color={Colors.white} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={44} color={Colors.white} />
            </View>
            <Text style={styles.successTitle}>Pesanan Berhasil Dibuat & Terbayar!</Text>
            <Text style={styles.successSub}>
              Nomor Pesanan: <Text style={styles.successBold}>{orderSuccess.orderNumber}</Text>
            </Text>

            {/* Paid status badge banner */}
            <View style={styles.paidBadgeBanner}>
              <ShieldCheck size={18} color={Colors.success} />
              <Text style={styles.paidBadgeBannerText}>
                Pembayaran Berhasil Dikonfirmasi (LUNAS)
              </Text>
            </View>

            <View style={styles.successDetailBox}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Total Pembayaran</Text>
                <Text style={styles.successDetailPrice}>{formatPrice(orderSuccess.total)}</Text>
              </View>

              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Status Transaksi</Text>
                <View style={styles.paidStatusPill}>
                  <Text style={styles.paidStatusPillText}>SUDAH TERBAYAR</Text>
                </View>
              </View>

              {orderSuccess.isSplit && orderSuccess.storeAssignments && orderSuccess.storeAssignments.length > 0 ? (
                <View style={styles.successSplitBox}>
                  <Text style={styles.successSplitTitle}>
                    Titik Pengambilan Pesanan ({orderSuccess.storeAssignments.length} Lokasi Terpisah):
                  </Text>
                  {orderSuccess.storeAssignments.map((assign, aIdx) => (
                    <View key={aIdx} style={styles.successSplitCard}>
                      <View style={styles.successSplitHeader}>
                        <MapPin size={16} color={Colors.burgundy} />
                        <Text style={styles.successSplitStoreName}>
                          {assign.store_name} ({assign.store_district || "Hong Kong"})
                        </Text>
                      </View>
                      <Text style={styles.successSplitStoreAddress}>{assign.store_address}</Text>

                      <View style={styles.successSplitVendorTag}>
                        <Store size={12} color={Colors.navy} />
                        <Text style={styles.successSplitVendorName}>Vendor: {assign.vendor_name}</Text>
                      </View>

                      <View style={styles.successSplitItemsList}>
                        {assign.items.map((it, itIdx) => (
                          <Text key={itIdx} style={styles.successSplitItemText}>
                            • {it.name} <Text style={styles.successSplitItemQty}>({it.quantity}x)</Text>
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Lokasi Pengambilan HK</Text>
                    <Text style={styles.successDetailStore}>{orderSuccess.storeName || "Toko Mitra Chandra Mall HK"}</Text>
                  </View>
                  <Text style={styles.successStoreAddress}>{orderSuccess.storeAddress || "Causeway Bay, Hong Kong"}</Text>
                </>
              )}

              <View style={styles.successNoticeBox}>
                <CheckCircle2 size={16} color={Colors.success} />
                <Text style={styles.successNoticeText}>
                  Stok produk telah dipotong dari gudang vendor, dan barang pesanan otomatis dibersihkan dari keranjang serta wishlist Anda.
                </Text>
              </View>
            </View>

            <View style={styles.successActionBtns}>
              <TouchableOpacity
                style={styles.viewOrderBtn}
                onPress={() => router.replace("/orders")}
              >
                <Text style={styles.viewOrderBtnText}>Lihat Status & Pelacakan Pesanan</Text>
                <ArrowRight size={17} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backHomeBtn}
                onPress={() => router.replace("/(tabs)")}
              >
                <Text style={styles.backHomeBtnText}>Kembali ke Beranda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  // If cart is empty and not just completed an order
  if (items.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.scrollRoot}>
        <View style={styles.container}>
          <View style={styles.unauthCard}>
            <View style={styles.unauthIconCircle}>
              <ShoppingBag size={38} color={Colors.burgundy} />
            </View>
            <Text style={styles.unauthTitle}>Keranjang Belanja Anda Kosong</Text>
            <Text style={styles.unauthSub}>
              Tidak ada produk yang siap di-checkout. Silakan pilih produk favorit Anda dari katalog Chandra Mall.
            </Text>
            <TouchableOpacity
              style={styles.unauthBtn}
              onPress={() => router.push("/(tabs)/explore")}
            >
              <Text style={styles.unauthBtnText}>Jelajahi Katalog Produk</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Footer />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollRoot}>
      {toastMessage && (
        <View style={styles.toast}>
          <CheckCircle2 size={18} color={Colors.white} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <View style={styles.container}>
        {/* Header Breadcrumb */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <ArrowLeft size={16} color={Colors.burgundy} />
            <Text style={styles.backLinkText}>Kembali ke Keranjang</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Konfirmasi Checkout Pesanan</Text>
          <Text style={styles.pageSub}>
            Tentukan toko mitra pengambilan di Hong Kong dan verifikasi rincian pesanan Anda.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorAlertBox}>
            <AlertCircle size={18} color={Colors.error} />
            <Text style={styles.errorAlertText}>{errorMessage}</Text>
          </View>
        )}

        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          {/* Left Column: Form & Options */}
          <View style={[styles.formCol, isDesktop && styles.formColDesktop]}>
            {/* Step 1: HK Store Pickup */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>
                    {isSplitMode
                      ? `Titik Pengambilan Multi-Toko Mitra (${vendorGroups.length} Lokasi Terpisah)`
                      : "Pilih Titik Pengambilan Toko Mitra di Hong Kong"}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {isSplitMode
                      ? "Produk yang Anda checkout berasal dari vendor dengan mitra toko berbeda di Hong Kong. Barang akan diambil di toko mitra masing-masing vendor."
                      : `Menampilkan toko mitra yang bekerjasama dengan seluruh vendor produk terpilih (${vendorNames.join(", ")}). Bebas ongkir ke Hong Kong!`}
                  </Text>
                </View>
              </View>

              {isSplitMode ? (
                // Kasus B: Multi-Titik Pengambilan (Split per Vendor)
                <View style={styles.splitVendorSectionList}>
                  <View style={styles.splitNoticeBox}>
                    <Store size={20} color={Colors.goldDark} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.splitNoticeTitle}>Pengambilan di Beberapa Lokasi Terpisah</Text>
                      <Text style={styles.splitNoticeText}>
                        Vendor dari produk yang Anda pilih bekerjasama dengan toko mitra yang berbeda di Hong Kong. Silakan tentukan lokasi pengambilan untuk masing-masing vendor berikut:
                      </Text>
                    </View>
                  </View>

                  {vendorGroups.map((vg, vgIdx) => {
                    const currentSelectedStoreId = vendorStoreSelections[vg.vendorId];
                    return (
                      <View key={vg.vendorId} style={styles.vendorPickupBlock}>
                        {/* Header Lokasi & Vendor */}
                        <View style={styles.vendorPickupHeader}>
                          <View style={styles.vendorPickupBadge}>
                            <Text style={styles.vendorPickupBadgeText}>Lokasi {vgIdx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vendorPickupName}>{vg.vendorName}</Text>
                            <Text style={styles.vendorPickupCount}>{vg.items.length} produk dari vendor ini</Text>
                          </View>
                        </View>

                        {/* List Produk yang diambil di lokasi ini */}
                        <View style={styles.vendorItemsBox}>
                          <Text style={styles.vendorItemsTitle}>Produk yang Diambil di Lokasi Ini:</Text>
                          <View style={styles.vendorItemsMiniList}>
                            {vg.items.map((it) => (
                              <View key={it.product_id} style={styles.vendorItemMiniRow}>
                                <View style={styles.vendorItemMiniImgBox}>
                                  {it.image_url ? (
                                    <Image source={{ uri: it.image_url }} style={styles.vendorItemMiniImg} resizeMode="cover" />
                                  ) : (
                                    <ImageIcon size={14} color={Colors.muted} />
                                  )}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.vendorItemMiniName} numberOfLines={1}>{it.name}</Text>
                                  <Text style={styles.vendorItemMiniQty}>{it.quantity}x • {formatPrice(it.price)}</Text>
                                </View>
                                <Text style={styles.vendorItemMiniSubtotal}>
                                  {formatPrice(Number(it.price) * Number(it.quantity))}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Pilihan Toko Mitra untuk Vendor ini */}
                        <Text style={styles.chooseStoreSubhead}>
                          Pilih Toko Pengambilan untuk {vg.vendorName}:
                        </Text>
                        {vg.supportedStores.length === 0 ? (
                          <View style={styles.noStoresAlert}>
                            <Store size={18} color={Colors.error} />
                            <Text style={styles.noStoresText}>Tidak ada toko mitra yang aktif untuk vendor ini saat ini.</Text>
                          </View>
                        ) : (
                          <View style={styles.storesGrid}>
                            {vg.supportedStores.map((store) => {
                              const isSelected = Number(currentSelectedStoreId) === Number(store.id);
                              return (
                                <TouchableOpacity
                                  key={store.id}
                                  style={[styles.storeCard, isSelected && styles.storeCardActive]}
                                  onPress={() => {
                                    setVendorStoreSelections((prev) => ({
                                      ...prev,
                                      [vg.vendorId]: Number(store.id),
                                    }));
                                  }}
                                >
                                  <View style={styles.storeCardHeader}>
                                    <View style={styles.storeRadio}>
                                      {isSelected && <View style={styles.storeRadioDot} />}
                                    </View>
                                    <Text style={[styles.storeCardName, isSelected && styles.storeCardNameActive]}>
                                      {store.name}
                                    </Text>
                                    {store.district && (
                                      <View style={styles.districtBadge}>
                                        <Text style={styles.districtText}>{store.district}</Text>
                                      </View>
                                    )}
                                  </View>

                                  <View style={styles.storeAddressRow}>
                                    <MapPin size={15} color={Colors.muted} />
                                    <Text style={styles.storeAddressText}>{store.address_line}</Text>
                                  </View>

                                  {store.phone && (
                                    <View style={styles.storePhoneRow}>
                                      <Phone size={14} color={Colors.muted} />
                                      <Text style={styles.storePhoneText}>{store.phone}</Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                // Kasus A: Toko Bersama (Seluruh vendor bekerjasama dengan toko ini)
                commonStores.length === 0 ? (
                  <View style={styles.noStoresAlert}>
                    <Store size={22} color={Colors.error} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noStoresTitle}>Tidak Ada Titik Pengambilan yang Cocok</Text>
                      <Text style={styles.noStoresText}>
                        Tidak ada toko mitra di Hong Kong yang bekerjasama dengan seluruh vendor dari produk di keranjang Anda saat ini.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.storesGrid}>
                    {commonStores.map((store) => {
                      const isSelected = Number(selectedStoreId) === Number(store.id);
                      return (
                        <TouchableOpacity
                          key={store.id}
                          style={[styles.storeCard, isSelected && styles.storeCardActive]}
                          onPress={() => {
                            setSelectedStoreId(Number(store.id));
                            const newSelections: Record<number, number> = {};
                            vendorGroups.forEach((vg) => {
                              newSelections[vg.vendorId] = Number(store.id);
                            });
                            setVendorStoreSelections(newSelections);
                          }}
                        >
                          <View style={styles.storeCardHeader}>
                            <View style={styles.storeRadio}>
                              {isSelected && <View style={styles.storeRadioDot} />}
                            </View>
                            <Text style={[styles.storeCardName, isSelected && styles.storeCardNameActive]}>
                              {store.name}
                            </Text>
                            {store.district && (
                              <View style={styles.districtBadge}>
                                <Text style={styles.districtText}>{store.district}</Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.partnerBadgeRow}>
                            <Check size={13} color={Colors.success} />
                            <Text style={styles.partnerBadgeText}>
                              Mitra Resmi Seluruh Vendor Terpilih
                            </Text>
                          </View>

                          <View style={styles.storeAddressRow}>
                            <MapPin size={15} color={Colors.muted} />
                            <Text style={styles.storeAddressText}>{store.address_line}</Text>
                          </View>

                          {store.phone && (
                            <View style={styles.storePhoneRow}>
                              <Phone size={14} color={Colors.muted} />
                              <Text style={styles.storePhoneText}>{store.phone}</Text>
                            </View>
                          )}

                          {store.opening_hours && (
                            <View style={styles.storeHoursRow}>
                              <Clock size={14} color={Colors.goldDark} />
                              <Text style={styles.storeHoursText}>{store.opening_hours}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              )}
            </View>

            {/* Step 2: Contact Information */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
                <View>
                  <Text style={styles.sectionTitle}>Informasi Kontak Pembeli</Text>
                  <Text style={styles.sectionSubtitle}>
                    Notifikasi kedatangan barang dan QR Code pengambilan akan dikirim ke kontak ini.
                  </Text>
                </View>
              </View>

              <View style={styles.formFields}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Nama Lengkap Penerima</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nama lengkap"
                    value={buyerName}
                    onChangeText={setBuyerName}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Nomor WhatsApp / Telepon Hong Kong</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="cth: +852 9123 4567 atau 0812..."
                    keyboardType="phone-pad"
                    value={buyerPhone}
                    onChangeText={setBuyerPhone}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Email Konfirmasi</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="alamat@email.com"
                    keyboardType="email-address"
                    value={buyerEmail}
                    onChangeText={setBuyerEmail}
                  />
                </View>
              </View>
            </View>

            {/* Step 3: Payment Method */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
                <View>
                  <Text style={styles.sectionTitle}>Metode Pembayaran (HK$)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Pilih opsi pembayaran cepat dan aman berstandar Hong Kong.
                  </Text>
                </View>
              </View>

              <View style={styles.paymentsGrid}>
                {([
                  {
                    id: "fps" as const,
                    name: "FPS (Faster Payment System)",
                    desc: "Transfer instan via Bank HK / ID FPS",
                    icon: <QrCode size={20} color={Colors.burgundy} />,
                  },
                  {
                    id: "payme" as const,
                    name: "PayMe by HSBC",
                    desc: "Scan QR Code PayMe via ponsel Anda",
                    icon: <Wallet size={20} color={Colors.burgundy} />,
                  },
                  {
                    id: "octopus" as const,
                    name: "Octopus Card (八達通)",
                    desc: "Pembayaran via aplikasi Octopus HK",
                    icon: <CreditCard size={20} color={Colors.burgundy} />,
                  },
                  {
                    id: "pickup" as const,
                    name: "Bayar di Kasir Toko Mitra HK",
                    desc: "Tunai / Kartu saat pengambilan barang",
                    icon: <Store size={20} color={Colors.burgundy} />,
                  },
                ]).map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[styles.paymentCard, isSelected && styles.paymentCardActive]}
                      onPress={() => setPaymentMethod(pm.id)}
                    >
                      <View style={styles.paymentCardHeader}>
                        <View style={styles.storeRadio}>
                          {isSelected && <View style={styles.storeRadioDot} />}
                        </View>
                        {pm.icon}
                        <Text style={[styles.paymentName, isSelected && styles.paymentNameActive]}>
                          {pm.name}
                        </Text>
                      </View>
                      <Text style={styles.paymentDesc}>{pm.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Right Column: Order Summary & Confirmation */}
          <View style={[styles.summaryCol, isDesktop && styles.summaryColDesktop]}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Ringkasan Pesanan</Text>

              {/* Items List Snapshot */}
              <View style={styles.itemsSnapshot}>
                {items.map((it) => (
                  <View key={it.product_id} style={styles.snapshotRow}>
                    <View style={styles.snapshotImgBox}>
                      {it.image_url ? (
                        <Image source={{ uri: it.image_url }} style={styles.snapshotImg} />
                      ) : (
                        <ImageIcon size={18} color={Colors.mutedLight} />
                      )}
                    </View>
                    <View style={styles.snapshotInfo}>
                      <Text style={styles.snapshotName} numberOfLines={1}>{it.name}</Text>
                      <Text style={styles.snapshotQty}>
                        {it.quantity}x • {formatPrice(it.price)}
                      </Text>
                    </View>
                    <Text style={styles.snapshotTotal}>
                      {formatPrice(Number(it.price) * Number(it.quantity))}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Destination preview */}
              <View style={styles.destPreview}>
                <Text style={styles.destLabel}>
                  {isSplitMode
                    ? `Lokasi Pengambilan (${vendorGroups.length} Titik Terpisah):`
                    : "Lokasi Pengambilan Terpilih:"}
                </Text>
                {isSplitMode ? (
                  vendorGroups.map((vg, idx) => {
                    const assignedStoreId = vendorStoreSelections[vg.vendorId];
                    const assignedStore = allStores.find((s) => Number(s.id) === Number(assignedStoreId));
                    return (
                      <View key={vg.vendorId} style={styles.splitDestPreviewRow}>
                        <Text style={styles.splitDestVendorTitle}>
                          Lokasi {idx + 1} ({vg.vendorName}):
                        </Text>
                        <Text style={styles.destStoreName}>{assignedStore?.name || "Belum dipilih"}</Text>
                        {assignedStore?.address_line && (
                          <Text style={styles.destAddress}>{assignedStore.address_line}</Text>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <>
                    <Text style={styles.destStoreName}>{selectedStore?.name || "Toko Mitra HK"}</Text>
                    <Text style={styles.destAddress}>{selectedStore?.address_line}</Text>
                  </>
                )}
              </View>

              <View style={styles.divider} />

              {/* Breakdown */}
              <View style={styles.billRows}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal Barang</Text>
                  <Text style={styles.billValue}>{formatPrice(total)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Biaya Pengambilan di Toko</Text>
                  <Text style={styles.freeHighlight}>GRATIS</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Mata Uang Transaksi</Text>
                  <Text style={styles.billValue}>HK$ (Hong Kong Dollar)</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Total Final */}
              <View style={styles.finalTotalRow}>
                <Text style={styles.finalTotalLabel}>Total Tagihan Akhir</Text>
                <Text style={styles.finalTotalValue}>{formatPrice(total)}</Text>
              </View>

              {/* Error Message Alert Banner */}
              {errorMessage && (
                <View style={styles.errorAlertBox}>
                  <AlertCircle size={18} color={Colors.error} />
                  <Text style={styles.errorAlertText}>{errorMessage}</Text>
                </View>
              )}

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmOrderBtn,
                  submitting && styles.btnDisabled,
                ]}
                onPress={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.confirmOrderText}>Konfirmasi & Buat Pesanan</Text>
                    <CheckCircle2 size={18} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.guaranteeNote}>
                <ShieldCheck size={16} color={Colors.success} />
                <Text style={styles.guaranteeText}>
                  Garansi 100% barang asli dari UMKM Indonesia
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: {
    flexGrow: 1,
    backgroundColor: Colors.ivory,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.navy,
    marginTop: 12,
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
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  backLinkText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "600",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.navy,
  },
  pageSub: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
  },
  mainLayout: {
    flexDirection: "column",
    gap: 24,
  },
  mainLayoutDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  formCol: {
    width: "100%",
  },
  formColDesktop: {
    width: "63%",
  },
  cardSection: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  storesGrid: {
    gap: 12,
  },
  storeCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.ivory,
  },
  storeCardActive: {
    borderColor: Colors.burgundy,
    backgroundColor: Colors.burgundySubtle,
  },
  storeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  storeRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
  },
  storeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.burgundy,
  },
  storeCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    flex: 1,
  },
  storeCardNameActive: {
    color: Colors.burgundy,
  },
  districtBadge: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  districtText: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: "700",
  },
  storeAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  storeAddressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  storePhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  storePhoneText: {
    fontSize: 12,
    color: Colors.muted,
  },
  storeHoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeHoursText: {
    fontSize: 11,
    color: Colors.goldDark,
    fontWeight: "600",
  },
  formFields: {
    gap: 14,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  textInput: {
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.navy,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  paymentsGrid: {
    gap: 12,
  },
  paymentCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.ivory,
  },
  paymentCardActive: {
    borderColor: Colors.burgundy,
    backgroundColor: Colors.burgundySubtle,
  },
  paymentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    flex: 1,
  },
  paymentNameActive: {
    color: Colors.burgundy,
  },
  paymentDesc: {
    fontSize: 12,
    color: Colors.muted,
    marginLeft: 28,
  },
  summaryCol: {
    width: "100%",
  },
  summaryColDesktop: {
    width: "34%",
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
    marginBottom: 14,
  },
  itemsSnapshot: {
    gap: 10,
  },
  snapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  snapshotImgBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  snapshotImg: {
    width: "100%",
    height: "100%",
  },
  snapshotInfo: {
    flex: 1,
  },
  snapshotName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.navy,
  },
  snapshotQty: {
    fontSize: 11,
    color: Colors.muted,
  },
  snapshotTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
  },
  destPreview: {
    gap: 2,
  },
  destLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.muted,
    textTransform: "uppercase",
  },
  destStoreName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  destAddress: {
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },
  billRows: {
    gap: 8,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  freeHighlight: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.success,
  },
  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
  },
  finalTotalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.burgundy,
  },
  confirmOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.burgundy,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmOrderText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  guaranteeNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  guaranteeText: {
    fontSize: 11,
    color: Colors.muted,
  },
  successContainer: {
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    padding: 24,
    marginVertical: 40,
  },
  successCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.navy,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 14,
    color: Colors.muted,
    marginBottom: 20,
  },
  successBold: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  successDetailBox: {
    width: "100%",
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  successDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successDetailLabel: {
    fontSize: 12,
    color: Colors.muted,
    fontWeight: "600",
  },
  successDetailPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.burgundy,
  },
  successDetailStore: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  successStoreAddress: {
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
  },
  successDeadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  successDeadlineText: {
    fontSize: 11,
    color: Colors.goldDark,
    fontWeight: "600",
  },
  successActionBtns: {
    width: "100%",
    gap: 10,
  },
  viewOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.burgundy,
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewOrderBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  backHomeBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  backHomeBtnText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  toast: {
    position: "absolute",
    top: 24,
    alignSelf: "center",
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.navy,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  noStoresAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.errorSubtle,
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  noStoresTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: 4,
  },
  noStoresText: {
    fontSize: 13,
    color: Colors.navy,
    lineHeight: 18,
  },
  partnerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.successSubtle,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginVertical: 4,
  },
  partnerBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
  },
  paidBadgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.successSubtle,
    borderColor: Colors.successBorder,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  paidBadgeBannerText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: "700",
  },
  paidStatusPill: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidStatusPillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  successNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.successSubtle,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  successNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.navy,
    lineHeight: 17,
    fontWeight: "500",
  },
  unauthCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 36,
    alignItems: "center",
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    marginVertical: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  unauthIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.navy,
    textAlign: "center",
    marginBottom: 8,
  },
  unauthSub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  unauthBtn: {
    backgroundColor: Colors.burgundy,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  unauthBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  errorAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.errorSubtle,
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    fontWeight: "600",
    lineHeight: 18,
  },
  splitVendorSectionList: {
    gap: 20,
  },
  splitNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.goldLight,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  splitNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.goldDark,
    marginBottom: 3,
  },
  splitNoticeText: {
    fontSize: 12,
    color: Colors.navy,
    lineHeight: 17,
  },
  vendorPickupBlock: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  vendorPickupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
  },
  vendorPickupBadge: {
    backgroundColor: Colors.burgundy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vendorPickupBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  vendorPickupName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.navy,
  },
  vendorPickupCount: {
    fontSize: 11,
    color: Colors.muted,
  },
  vendorItemsBox: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  vendorItemsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.muted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  vendorItemsMiniList: {
    gap: 8,
  },
  vendorItemMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vendorItemMiniImgBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.ivory,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorItemMiniImg: {
    width: "100%",
    height: "100%",
  },
  vendorItemMiniName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  vendorItemMiniQty: {
    fontSize: 11,
    color: Colors.muted,
  },
  vendorItemMiniSubtotal: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  chooseStoreSubhead: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 4,
  },
  splitDestPreviewRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  splitDestVendorTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.burgundy,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  successSplitBox: {
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
  },
  successSplitTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.navy,
    marginBottom: 4,
  },
  successSplitCard: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  successSplitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  successSplitStoreName: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.navy,
  },
  successSplitStoreAddress: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
  },
  successSplitVendorTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.white,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 2,
  },
  successSplitVendorName: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.navy,
  },
  successSplitItemsList: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 3,
  },
  successSplitItemText: {
    fontSize: 12,
    color: Colors.navy,
  },
  successSplitItemQty: {
    color: Colors.muted,
    fontWeight: "700",
  },
});
