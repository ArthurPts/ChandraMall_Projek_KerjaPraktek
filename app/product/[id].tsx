import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react-native";
import { Footer } from "../../components/Footer";
import { BASE } from "../../constants/Api";
import Colors from "../../constants/Colors";
import { formatPrice, formatRating } from "../../constants/format";
import { useSessionUser } from "../../constants/session";
import { useResponsive } from "../../hooks/useResponsive";

type ProductReview = {
  id: number | string;
  buyer_name: string;
  rating: number | string;
  comment: string | null;
  created_at: string;
};

type ProductReviewsResponse = {
  summary: {
    average_rating: number | string;
    rating_count: number | string;
    review_count: number | string;
    distribution: Record<string, number | string>;
  };
  reviews: ProductReview[];
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { user } = useSessionUser();

  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "shipping" | "reviews">("desc");

  const [reviewData, setReviewData] = useState<ProductReviewsResponse | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Product Data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(false);

    fetch(`${BASE}?action=product&id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data produk");
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          setProduct(data);
          const firstImg = data.images?.[0] || data.image_url;
          if (firstImg) setSelectedImage(firstImg);
        } else {
          setLoadError(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Load Reviews
  const loadReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${BASE}?action=reviews&product_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.summary) setReviewData(data);
      }
    } catch {}
  }, [id]);

  // Check Wishlist Status
  useEffect(() => {
    if (!user?.id || !id) return;
    fetch(`${BASE}?action=wishlist&user_id=${user.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => {
        if (Array.isArray(items)) {
          const found = items.some((it) => String(it.product_id) === String(id));
          setIsWishlisted(found);
        }
      })
      .catch(() => {});
  }, [user?.id, id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleToggleWishlist = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      await fetch(`${BASE}?action=${nextState ? "add_wishlist" : "remove_wishlist"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: Number(id),
        }),
      });
      setToastMessage({
        type: "success",
        text: nextState ? "Ditambahkan ke Wishlist" : "Dihapus dari Wishlist",
      });
      setTimeout(() => setToastMessage(null), 2500);
    } catch {}
  };

  const handleAddToCart = async (goToCheckout = false) => {
    if (!user?.id) {
      router.push("/login");
      return;
    }
    if (cartBusy) return;
    const stock = Number(product?.stock ?? 0);
    if (stock <= 0) {
      setToastMessage({ type: "error", text: "Stok produk habis." });
      return;
    }

    setCartBusy(true);
    try {
      const res = await fetch(`${BASE}?action=add_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          product_id: Number(id),
          quantity: qty,
        }),
      });
      if (res.ok) {
        if (goToCheckout) {
          router.push("/(tabs)/cart");
        } else {
          setToastMessage({
            type: "success",
            text: `Berhasil menambahkan ${qty} item ke keranjang.`,
          });
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    } catch {
      setToastMessage({ type: "error", text: "Gagal menambahkan ke keranjang." });
    } finally {
      setCartBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.burgundy} />
        <Text style={styles.loadingText}>Memuat detail produk...</Text>
      </View>
    );
  }

  if (loadError || !product) {
    return (
      <View style={styles.centerContainer}>
        <Package size={48} color={Colors.muted} />
        <Text style={styles.errorTitle}>Produk Tidak Ditemukan</Text>
        <Text style={styles.errorSub}>Produk mungkin sudah tidak aktif atau tautan salah.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={16} color={Colors.white} />
          <Text style={styles.backBtnText}>Kembali ke Katalog</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = (product.images && product.images.length > 0)
    ? product.images
    : product.image_url
    ? [product.image_url]
    : [];

  const mainImage = selectedImage || images[0] || null;
  const isVerified = Number(product.vendor_is_verified) === 1 || product.vendor_is_verified === true;
  const isExportable = Number(product.is_exportable) === 1 || product.is_exportable === undefined;
  const ratingAvg = reviewData?.summary?.average_rating || product.vendor_rating || "4.9";
  const reviewCount = reviewData?.summary?.review_count || 32;
  const stock = Number(product.stock ?? 0);

  return (
    <View style={styles.screen}>
      {/* Toast */}
      {toastMessage && (
        <View
          style={[
            styles.toast,
            toastMessage.type === "error" ? styles.toastError : styles.toastSuccess,
          ]}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={16} color={Colors.white} />
          ) : (
            <Package size={16} color={Colors.white} />
          )}
          <Text style={styles.toastText}>{toastMessage.text}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollRoot}>
        <View style={styles.container}>
          {/* Breadcrumb Navigation */}
          <View style={styles.breadcrumbBar}>
            <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.crumbItem}>
              <Text style={styles.crumbLink}>Beranda</Text>
            </TouchableOpacity>
            <ChevronRight size={14} color={Colors.muted} />
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(tabs)/explore", params: { category: product.category_slug } })}
              style={styles.crumbItem}
            >
              <Text style={styles.crumbLink}>{product.category_name || "Kategori"}</Text>
            </TouchableOpacity>
            <ChevronRight size={14} color={Colors.muted} />
            <Text style={styles.crumbCurrent} numberOfLines={1}>
              {product.name}
            </Text>
          </View>

          {/* Main Product Showcase Row (Desktop: 2 columns, Mobile: 1 column) */}
          <View style={[styles.mainProductRow, isDesktop && styles.mainProductRowDesktop]}>
            {/* Left: Gallery Column */}
            <View style={[styles.galleryCol, isDesktop && styles.galleryColDesktop]}>
              <View style={styles.mainImageWrapper}>
                {mainImage ? (
                  <Image source={{ uri: mainImage }} style={styles.mainImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.mainImage, styles.placeholderImage]}>
                    <ImageIcon size={64} color={Colors.mutedLight} />
                  </View>
                )}
                {isExportable && (
                  <View style={styles.exportBadge}>
                    <Truck size={14} color={Colors.goldLight} />
                    <Text style={styles.exportBadgeText}>Siap Kirim ke Hong Kong</Text>
                  </View>
                )}
              </View>

              {/* Thumbnails */}
              {images.length > 1 && (
                <View style={styles.thumbnailsRow}>
                  {images.map((img: string, idx: number) => {
                    const isSelected = mainImage === img;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.thumbBox, isSelected && styles.thumbBoxSelected]}
                        onPress={() => setSelectedImage(img)}
                      >
                        <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Right: Info & Purchase Column */}
            <View style={[styles.infoCol, isDesktop && styles.infoColDesktop]}>
              {/* Category & Status */}
              <View style={styles.badgeRow}>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{product.category_name || "Produk Indonesia"}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={[styles.stockBadgeText, stock <= 0 && styles.stockEmptyText]}>
                    {stock > 0 ? `Stok: ${stock} ${product.unit || "pcs"}` : "Stok Habis"}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.productTitle}>{product.name}</Text>

              {/* Rating & Reviews summary */}
              <View style={styles.ratingBar}>
                <View style={styles.starCluster}>
                  <Star size={16} color={Colors.gold} fill={Colors.gold} />
                  <Text style={styles.ratingValue}>{formatRating(ratingAvg)}</Text>
                </View>
                <Text style={styles.ratingDivider}>•</Text>
                <TouchableOpacity onPress={() => setActiveTab("reviews")}>
                  <Text style={styles.reviewCountText}>{reviewCount} Ulasan Pelanggan</Text>
                </TouchableOpacity>
                {product.weight_grams && (
                  <>
                    <Text style={styles.ratingDivider}>•</Text>
                    <Text style={styles.metaWeight}>{product.weight_grams} gram</Text>
                  </>
                )}
              </View>

              {/* Price Banner */}
              <View style={styles.priceBanner}>
                <View>
                  <Text style={styles.priceLabel}>Harga Penjualan</Text>
                  <Text style={styles.priceValue}>{formatPrice(product.price)}</Text>
                </View>
                <View style={styles.hkCurrencyTag}>
                  <Text style={styles.hkCurrencyText}>HKD / Hong Kong Dollar</Text>
                </View>
              </View>

              {/* Vendor Info Box */}
              {product.vendor_name && (
                <View style={styles.vendorBox}>
                  <View style={styles.vendorAvatar}>
                    <Store size={20} color={Colors.burgundy} />
                  </View>
                  <View style={styles.vendorMeta}>
                    <View style={styles.vendorNameRow}>
                      <Text style={styles.vendorName}>{product.vendor_name}</Text>
                      {isVerified && (
                        <CheckCircle2 size={15} color={Colors.verifiedBadge} />
                      )}
                    </View>
                    <Text style={styles.vendorOrigin}>
                      Asal: {product.vendor_origin_city || "Indonesia"} • Terpercaya
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.visitVendorBtn}
                    onPress={() => router.push(`/vendor/${product.vendor_slug || product.vendor_id}`)}
                  >
                    <Text style={styles.visitVendorText}>Lihat Toko</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* HK Shipping & Pickup Notice */}
              <View style={styles.shippingNoticeBox}>
                <View style={styles.shippingNoticeRow}>
                  <Truck size={18} color={Colors.burgundy} />
                  <View style={styles.shippingNoticeTextCol}>
                    <Text style={styles.shippingNoticeTitle}>Pengiriman Terjamin ke Hong Kong</Text>
                    <Text style={styles.shippingNoticeDesc}>
                      Dikemas higienis & dikirim via kargo udara/laut resmi. Estimasi tiba di HK: 3-5 hari kerja.
                    </Text>
                  </View>
                </View>

                <View style={styles.shippingNoticeRow}>
                  <MapPin size={18} color={Colors.goldDark} />
                  <View style={styles.shippingNoticeTextCol}>
                    <Text style={styles.shippingNoticeTitle}>Ambil Langsung di Toko Mitra HK</Text>
                    <Text style={styles.shippingNoticeDesc}>
                      Pilih titik pickup di Causeway Bay, Wan Chai, atau Tsuen Wan saat checkout (Bebas Biaya Ambil).
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quantity Selector & Wishlist */}
              <View style={styles.purchaseControls}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                    onPress={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus size={15} color={qty <= 1 ? Colors.mutedLight : Colors.navy} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, qty >= stock && styles.qtyBtnDisabled]}
                    onPress={() => setQty(Math.min(stock, qty + 1))}
                    disabled={qty >= stock}
                  >
                    <Plus size={15} color={qty >= stock ? Colors.mutedLight : Colors.navy} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.wishlistActionBtn, isWishlisted && styles.wishlistActionBtnActive]}
                  onPress={handleToggleWishlist}
                >
                  <Heart
                    size={20}
                    color={isWishlisted ? Colors.burgundy : Colors.navy}
                    fill={isWishlisted ? Colors.burgundy : "transparent"}
                  />
                  <Text style={[styles.wishlistActionText, isWishlisted && styles.wishlistActionTextActive]}>
                    {isWishlisted ? "Tersimpan" : "Wishlist"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.addToCartBtn, stock <= 0 && styles.btnDisabled]}
                  onPress={() => handleAddToCart(false)}
                  disabled={stock <= 0 || cartBusy}
                >
                  <ShoppingCart size={18} color={Colors.burgundy} />
                  <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.buyNowBtn, stock <= 0 && styles.btnDisabled]}
                  onPress={() => handleAddToCart(true)}
                  disabled={stock <= 0 || cartBusy}
                >
                  <ShoppingBag size={18} color={Colors.white} />
                  <Text style={styles.buyNowText}>Beli Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Lower Section: Tabs (Deskripsi, Pengiriman HK, Ulasan) */}
          <View style={styles.tabSection}>
            <View style={styles.tabHeader}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "desc" && styles.tabBtnActive]}
                onPress={() => setActiveTab("desc")}
              >
                <Text style={[styles.tabBtnText, activeTab === "desc" && styles.tabBtnTextActive]}>
                  Deskripsi Lengkap
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "shipping" && styles.tabBtnActive]}
                onPress={() => setActiveTab("shipping")}
              >
                <Text style={[styles.tabBtnText, activeTab === "shipping" && styles.tabBtnTextActive]}>
                  Panduan Pickup Hong Kong
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === "reviews" && styles.tabBtnActive]}
                onPress={() => setActiveTab("reviews")}
              >
                <Text style={[styles.tabBtnText, activeTab === "reviews" && styles.tabBtnTextActive]}>
                  Ulasan Pembeli ({reviewCount})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabBody}>
              {activeTab === "desc" && (
                <View style={styles.descContent}>
                  <Text style={styles.descText}>
                    {product.description ||
                      "Produk khas Indonesia bermutu tinggi yang diproduksi secara higienis oleh mitra UMKM binaan Chandra Mall. Sangat cocok untuk mengobati kerinduan rasa kuliner Nusantara di Hong Kong."}
                  </Text>

                  <View style={styles.specsTable}>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Nama Produk</Text>
                      <Text style={styles.specValue}>{product.name}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Kategori</Text>
                      <Text style={styles.specValue}>{product.category_name || "Produk Makanan / Kerajinan"}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Satuan / Berat</Text>
                      <Text style={styles.specValue}>
                        {product.weight_grams ? `${product.weight_grams} gram` : product.unit || "1 pcs"}
                      </Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Asal Pengiriman</Text>
                      <Text style={styles.specValue}>{product.vendor_origin_city || "Indonesia"} (Jalur Ekspor HK)</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Mata Uang Pembayaran</Text>
                      <Text style={styles.specValue}>HK$ (Hong Kong Dollar)</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "shipping" && (
                <View style={styles.shippingContent}>
                  <Text style={styles.shippingSectionHeading}>Sistem Pengambilan Toko Mitra di Hong Kong</Text>
                  <Text style={styles.shippingParagraph}>
                    Pesanan Anda dikirimkan langsung dari gudang seller di Indonesia, melalui proses kepabeanan resmi, dan kemudian didistribusikan ke Toko Mitra Hong Kong yang Anda tentukan saat checkout.
                  </Text>

                  <View style={styles.pickupSteps}>
                    <View style={styles.stepCard}>
                      <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                      <Text style={styles.stepTitle}>Pilih Toko Mitra HK</Text>
                      <Text style={styles.stepDesc}>Tentukan toko terdekat (Causeway Bay, Wan Chai, Tsuen Wan).</Text>
                    </View>

                    <View style={styles.stepCard}>
                      <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                      <Text style={styles.stepTitle}>Notifikasi Kedatangan</Text>
                      <Text style={styles.stepDesc}>Anda akan menerima notifikasi status pesanan saat barang tiba di toko.</Text>
                    </View>

                    <View style={styles.stepCard}>
                      <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                      <Text style={styles.stepTitle}>Ambil & Tunjukkan Kode</Text>
                      <Text style={styles.stepDesc}>Tunjukkan Nomor Pesanan atau QR Code Anda di kasir toko mitra.</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeTab === "reviews" && (
                <View style={styles.reviewsContent}>
                  {/* Reviews Summary */}
                  {reviewData?.summary && (
                    <View style={styles.ratingSummaryBox}>
                      <View style={styles.ratingScoreCol}>
                        <Text style={styles.bigScore}>{formatRating(reviewData.summary.average_rating)}</Text>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={15} color={Colors.gold} fill={Colors.gold} />
                          ))}
                        </View>
                        <Text style={styles.summaryTotalText}>
                          Berdasarkan {reviewData.summary.rating_count} penilaian
                        </Text>
                      </View>

                      {/* Bars */}
                      <View style={styles.distributionCol}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = Number(reviewData.summary.distribution[String(star)] || 0);
                          const total = Number(reviewData.summary.rating_count) || 1;
                          const pct = Math.min(100, Math.round((count / total) * 100));
                          return (
                            <View key={star} style={styles.distRow}>
                              <Text style={styles.distStarLabel}>{star} ★</Text>
                              <View style={styles.distTrack}>
                                <View style={[styles.distFill, { width: `${pct}%` }]} />
                              </View>
                              <Text style={styles.distCount}>{count}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Review List */}
                  {reviewData?.reviews && reviewData.reviews.length > 0 ? (
                    <View style={styles.reviewsList}>
                      {reviewData.reviews.map((rev) => (
                        <View key={rev.id} style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <View style={styles.reviewerMeta}>
                              <Text style={styles.reviewerName}>{rev.buyer_name}</Text>
                              <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={12}
                                    color={s <= Number(rev.rating) ? Colors.gold : Colors.border}
                                    fill={s <= Number(rev.rating) ? Colors.gold : "transparent"}
                                  />
                                ))}
                              </View>
                            </View>
                            <Text style={styles.reviewDate}>{rev.created_at}</Text>
                          </View>
                          {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noReviewsBox}>
                      <Star size={32} color={Colors.goldLight} />
                      <Text style={styles.noReviewsTitle}>Belum ada ulasan untuk produk ini</Text>
                      <Text style={styles.noReviewsSub}>
                        Jadilah yang pertama memberikan ulasan setelah pesanan Anda selesai diambil!
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.navy,
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    color: Colors.muted,
    marginVertical: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.burgundy,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 12,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  container: {
    maxWidth: 1240,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  breadcrumbBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  crumbItem: {},
  crumbLink: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: "500",
  },
  crumbCurrent: {
    fontSize: 13,
    color: Colors.navy,
    fontWeight: "700",
    flex: 1,
  },
  mainProductRow: {
    flexDirection: "column",
    gap: 24,
  },
  mainProductRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  galleryCol: {
    width: "100%",
  },
  galleryColDesktop: {
    width: "48%",
  },
  mainImageWrapper: {
    position: "relative",
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.ivoryDark,
  },
  exportBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(28, 43, 74, 0.92)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  exportBadgeText: {
    color: Colors.goldLight,
    fontSize: 12,
    fontWeight: "700",
  },
  thumbnailsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  thumbBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
    backgroundColor: Colors.white,
  },
  thumbBoxSelected: {
    borderColor: Colors.burgundy,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  infoCol: {
    width: "100%",
  },
  infoColDesktop: {
    width: "50%",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  catBadge: {
    backgroundColor: Colors.burgundySubtle,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  catBadgeText: {
    color: Colors.burgundy,
    fontSize: 12,
    fontWeight: "700",
  },
  stockBadge: {
    backgroundColor: Colors.ivoryDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "700",
  },
  stockEmptyText: {
    color: Colors.error,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.navy,
    lineHeight: 32,
    marginBottom: 10,
  },
  ratingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  starCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: {
    color: Colors.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  ratingDivider: {
    color: Colors.borderDark,
  },
  reviewCountText: {
    color: Colors.burgundy,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  metaWeight: {
    color: Colors.muted,
    fontSize: 13,
  },
  priceBanner: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.burgundy,
    marginTop: 2,
  },
  hkCurrencyTag: {
    backgroundColor: Colors.goldSubtle,
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  hkCurrencyText: {
    color: Colors.goldDark,
    fontSize: 11,
    fontWeight: "700",
  },
  vendorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  vendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.burgundySubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorMeta: {
    flex: 1,
  },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
  },
  vendorOrigin: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  visitVendorBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  visitVendorText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.navy,
  },
  shippingNoticeBox: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  shippingNoticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  shippingNoticeTextCol: {
    flex: 1,
  },
  shippingNoticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  shippingNoticeDesc: {
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  purchaseControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 36,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.ivory,
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.navy,
    paddingHorizontal: 16,
  },
  wishlistActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  wishlistActionBtnActive: {
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
  },
  wishlistActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  wishlistActionTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.burgundySubtle,
    borderColor: Colors.burgundy,
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addToCartText: {
    color: Colors.burgundy,
    fontSize: 14,
    fontWeight: "700",
  },
  buyNowBtn: {
    flex: 1,
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
  buyNowText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  tabSection: {
    marginTop: 40,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  tabHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.ivory,
  },
  tabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: Colors.burgundy,
    backgroundColor: Colors.white,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.muted,
  },
  tabBtnTextActive: {
    color: Colors.burgundy,
    fontWeight: "700",
  },
  tabBody: {
    padding: 24,
  },
  descContent: {},
  descText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  specsTable: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  specRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  specLabel: {
    width: 160,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.navy,
  },
  specValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  shippingContent: {},
  shippingSectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 8,
  },
  shippingParagraph: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  pickupSteps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  stepCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.burgundy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  stepNumText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.navy,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 16,
  },
  reviewsContent: {},
  ratingSummaryBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    backgroundColor: Colors.ivory,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },
  ratingScoreCol: {
    alignItems: "center",
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  bigScore: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.navy,
  },
  starsRow: {
    flexDirection: "row",
    gap: 3,
    marginVertical: 4,
  },
  summaryTotalText: {
    fontSize: 12,
    color: Colors.muted,
  },
  distributionCol: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  distStarLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.navy,
    width: 24,
  },
  distTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: "hidden",
  },
  distFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },
  distCount: {
    fontSize: 11,
    color: Colors.muted,
    width: 30,
    textAlign: "right",
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerMeta: {
    gap: 2,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.navy,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.muted,
  },
  reviewComment: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noReviewsBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  noReviewsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.navy,
  },
  noReviewsSub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
  },
  toast: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: Colors.navy,
  },
  toastError: {
    backgroundColor: Colors.error,
  },
  toastText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
