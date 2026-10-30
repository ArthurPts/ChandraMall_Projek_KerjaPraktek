import { useRouter } from "expo-router";
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
  Truck,
  User,
  Wallet,
} from "lucide-react-native";
import { Footer } from "../components/Footer";
import { BASE } from "../constants/Api";
import Colors, { Spacing, Typography } from "../constants/Colors";
import { formatPrice } from "../constants/format";
import { useSessionUser } from "../constants/session";
import { useResponsive } from "../hooks/useResponsive";

type CartItem = {
  product_id: number;
  name: string;
  price: number | string;
  quantity: number;
  image_url?: string | null;
  vendor_name?: string;
};

type HKStore = {
  id: number;
  name: string;
  district?: string;
  address_line: string;
  phone?: string;
  opening_hours?: string;
};

type PaymentMethod = "fps" | "payme" | "octopus" | "pickup";

export default function Checkout() {
  const router = useRouter();
  const { isMobile, isDesktop } = useResponsive();
  const { user } = useSessionUser();

  const [items, setItems] = useState<CartItem[]>([]);
  const [stores, setStores] = useState<HKStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("fps");

  // Contact info
  const [buyerName, setBuyerName] = useState(user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || "");
  const [buyerEmail, setBuyerEmail] = useState(user?.email || "");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    total: number;
    storeName: string;
    storeAddress: string;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) {
      router.replace("/login");
      return;
    }

    if (user.name && !buyerName) setBuyerName(user.name);
    if (user.phone && !buyerPhone) setBuyerPhone(user.phone);
    if (user.email && !buyerEmail) setBuyerEmail(user.email);

    Promise.all([
      fetch(`${BASE}?action=cart&user_id=${user.id}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${BASE}?action=hk_stores`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([cartData, storeData]) => {
        if (Array.isArray(cartData)) setItems(cartData);
        if (Array.isArray(storeData)) {
          setStores(storeData);
          if (storeData.length > 0) setSelectedStoreId(storeData[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const total = items.reduce(
    (acc, it) => acc + Number(it.price) * Number(it.quantity),
    0
  );

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  const handleSubmitOrder = async () => {
    if (!selectedStoreId) {
      Alert.alert("Perhatian", "Silakan pilih titik Toko Mitra HK untuk pengambilan barang.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Perhatian", "Keranjang Anda kosong.");
      return;
    }
    if (!buyerPhone.trim()) {
      Alert.alert("Perhatian", "Nomor telepon / WhatsApp wajib diisi untuk konfirmasi pengambilan di HK.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}?action=checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          hk_store_id: selectedStoreId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        Alert.alert("Gagal Membuat Pesanan", data.error);
      } else {
        setOrderSuccess({
          orderNumber: data.order_number,
          total: data.total || total,
          storeName: selectedStore?.name || "Toko Mitra Chandra Mall HK",
          storeAddress: selectedStore?.address_line || "Causeway Bay, Hong Kong",
        });
      }
    } catch {
      Alert.alert("Kesalahan", "Terjadi gangguan saat membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.burgundy} />
        <Text style={styles.loadingText}>Menyiapkan halaman checkout...</Text>
      </View>
    );
  }

  // Order Success Confirmation Screen
  if (orderSuccess) {
    return (
      <ScrollView contentContainerStyle={styles.scrollRoot}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={44} color={Colors.white} />
            </View>
            <Text style={styles.successTitle}>Pesanan Berhasil Dibuat!</Text>
            <Text style={styles.successSub}>
              Nomor Pesanan: <Text style={styles.successBold}>{orderSuccess.orderNumber}</Text>
            </Text>

            <View style={styles.successDetailBox}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Total Tagihan</Text>
                <Text style={styles.successDetailPrice}>{formatPrice(orderSuccess.total)}</Text>
              </View>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Lokasi Pengambilan HK</Text>
                <Text style={styles.successDetailStore}>{orderSuccess.storeName}</Text>
              </View>
              <Text style={styles.successStoreAddress}>{orderSuccess.storeAddress}</Text>

              <View style={styles.successDeadlineRow}>
                <Clock size={15} color={Colors.goldDark} />
                <Text style={styles.successDeadlineText}>
                  Batas Waktu Pembayaran: 24 Jam sejak pemesanan
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

  return (
    <ScrollView contentContainerStyle={styles.scrollRoot}>
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

        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          {/* Left Column: Form & Options */}
          <View style={[styles.formCol, isDesktop && styles.formColDesktop]}>
            {/* Step 1: HK Store Pickup */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
                <View>
                  <Text style={styles.sectionTitle}>Pilih Titik Pengambilan Toko Mitra di Hong Kong</Text>
                  <Text style={styles.sectionSubtitle}>
                    Barang dikirim ke toko mitra ini untuk Anda ambil dengan bebas ongkir.
                  </Text>
                </View>
              </View>

              <View style={styles.storesGrid}>
                {stores.map((store) => {
                  const isSelected = selectedStoreId === store.id;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.storeCard, isSelected && styles.storeCardActive]}
                      onPress={() => setSelectedStoreId(store.id)}
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
                <Text style={styles.destLabel}>Lokasi Pengambilan Terpilih:</Text>
                <Text style={styles.destStoreName}>{selectedStore?.name || "Toko Mitra HK"}</Text>
                <Text style={styles.destAddress}>{selectedStore?.address_line}</Text>
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

              {/* Confirm Button */}
              <TouchableOpacity
                style={[styles.confirmOrderBtn, submitting && styles.btnDisabled]}
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
});
