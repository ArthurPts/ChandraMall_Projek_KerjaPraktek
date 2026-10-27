import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "../../constants/Colors";

import { BASE } from "../../constants/Api";
const USER_ID = 1;

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
  const [product, setProduct] = useState<any>(null);
  const [reviewData, setReviewData] = useState<ProductReviewsResponse | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { width } = useWindowDimensions();
  const desktopLayout = width >= 1050;

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const response = await fetch(`${BASE}?action=reviews&product_id=${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok || data?.error) {
        throw new Error(data?.error ?? `Reviews request failed (${response.status})`);
      }
      if (!data?.summary || !Array.isArray(data.reviews)) {
        throw new Error("Format data ulasan tidak valid.");
      }
      setReviewData(data);
    } catch (error) {
      console.error(error);
      setReviewsError("Ulasan tidak dapat dimuat. Silakan coba lagi.");
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadError(false);
    fetch(`${BASE}?action=product&id=${id}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Product request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setLoadError(false);
      })
      .catch((error) => {
        console.error(error);
        setLoadError(true);
      });
  }, [id]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  if (loadError && !product) {
    return (
      <View style={styles.loadState}>
        <Ionicons name="cloud-offline-outline" size={34} color={Colors.muted} />
        <Text style={styles.loadError}>Produk tidak dapat dimuat.</Text>
        <Text style={styles.loadHint}>Periksa koneksi lalu kembali dan coba lagi.</Text>
      </View>
    );
  }
  if (!product) {
    return <ActivityIndicator style={styles.loader} color={Colors.burgundy} />;
  }
  if (product.error) return <Text style={styles.error}>{product.error}</Text>;

  const addToCart = async () => {
    if (cartBusy) return;
    const availableStock = Number(product.stock ?? 0);
    if (availableStock <= 0 || qty > availableStock) {
      setActionMessage({ type: "error", text: "Stok produk tidak mencukupi." });
      return;
    }
    setCartBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch(`${BASE}?action=add_cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          product_id: product.id,
          quantity: qty,
        }),
      });
      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error ?? `Adding cart item failed (${response.status})`);
      }
      setActionMessage({ type: "success", text: "Produk ditambahkan ke keranjang." });
    } catch (error) {
      console.error(error);
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Tidak dapat menambahkan ke keranjang.",
      });
    } finally {
      setCartBusy(false);
    }
  };

  const addToWishlist = async () => {
    if (wishlistBusy) return;
    setWishlistBusy(true);
    setActionMessage(null);
    try {
      const response = await fetch(`${BASE}?action=add_wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: USER_ID, product_id: product.id }),
      });
      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error ?? `Adding wishlist item failed (${response.status})`);
      }
      setActionMessage({ type: "success", text: "Produk ditambahkan ke wishlist." });
    } catch (error) {
      console.error(error);
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Tidak dapat menambahkan ke wishlist.",
      });
    } finally {
      setWishlistBusy(false);
    }
  };

  const images: string[] = Array.isArray(product.images)
    ? product.images.filter((image: unknown): image is string => typeof image === "string")
    : [];
  const mainImage = selectedImage || images[0] || product.image_url || null;
  const desktop = desktopLayout;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={[styles.productLayout, desktop && styles.productLayoutDesktop]}
      >
        <View
          style={[
            styles.galleryColumn,
            desktop && styles.galleryColumnDesktop,
            !desktop && { width: Math.min(width - 36, 380), alignSelf: "center" },
          ]}
        >
          <View style={styles.imageWrap}>
            {mainImage ? (
              <Image
                source={{ uri: mainImage }}
                style={styles.image}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={Colors.muted} />
              </View>
            )}
            <View style={styles.imageBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={Colors.burgundy}
              />
              <Text style={styles.imageBadgeText}>Pilihan berkualitas</Text>
            </View>
          </View>
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnails}
            >
              {images.map((image: string, index: number) => (
                <TouchableOpacity
                  key={`${image}-${index}`}
                  onPress={() => setSelectedImage(image)}
                  style={[
                    styles.thumbnail,
                    (selectedImage || images[0]) === image && styles.thumbnailActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Lihat gambar produk ${index + 1}`}
                >
                  <Image source={{ uri: image }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.detailsColumn, desktop && styles.detailsColumnDesktop]}>
          <View style={styles.vendorBadge}>
            <Ionicons
              name="storefront-outline"
              size={14}
              color={Colors.burgundy}
            />
            <Text style={styles.vendor}>{product.vendor_name}</Text>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color={Colors.gold} />
            <Text style={styles.ratingText}>
              {reviewsLoading
                ? "Memuat ulasan..."
                : Number(reviewData?.summary.rating_count ?? 0) > 0
                  ? `${Number(reviewData?.summary.average_rating).toFixed(1)} · ${Number(reviewData?.summary.rating_count).toLocaleString("id-ID")} rating`
                  : "Belum ada ulasan"}
            </Text>
            <Text style={styles.ratingDot}>·</Text>
            <Text style={styles.ratingText}>{product.vendor_name}</Text>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Harga</Text>
            <Text style={styles.price}>
              Rp {Number(product.price).toLocaleString("id-ID")}
            </Text>
          </View>
          <View style={styles.separator} />
          <Text style={styles.sectionTitle}>Deskripsi produk</Text>
          <Text style={styles.desc}>{product.description}</Text>
        </View>

        <View style={[styles.purchaseCard, desktop && styles.purchaseCardDesktop]}>
          <Text style={styles.purchaseTitle}>Atur jumlah dan catatan</Text>
          {actionMessage && (
            <View
              accessibilityRole="alert"
              style={[
                styles.actionMessage,
                actionMessage.type === "error" && styles.actionMessageError,
              ]}
            >
              <Ionicons
                name={actionMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={actionMessage.type === "success" ? Colors.burgundy : Colors.navy}
              />
              <Text style={styles.actionMessageText}>{actionMessage.text}</Text>
            </View>
          )}
          <View style={styles.purchaseProduct}>
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.purchaseImage} />
            ) : (
              <View style={[styles.purchaseImage, styles.purchaseImagePlaceholder]}>
                <Ionicons name="image-outline" size={18} color={Colors.muted} />
              </View>
            )}
            <Text style={styles.purchaseProductName} numberOfLines={2}>
              {product.name}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.purchaseRow}>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(Math.max(1, qty - 1))}
                accessibilityRole="button"
                accessibilityLabel="Kurangi jumlah"
              >
                <Ionicons name="remove" size={18} color={Colors.navy} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(qty + 1)}
                disabled={product.stock !== undefined && qty >= Number(product.stock)}
                accessibilityRole="button"
                accessibilityLabel="Tambah jumlah"
              >
                <Ionicons name="add" size={18} color={Colors.burgundy} />
              </TouchableOpacity>
            </View>
            <Text style={styles.stock}>
              {product.stock !== undefined
                ? Number(product.stock) > 0
                  ? `Stok tersedia: ${Number(product.stock).toLocaleString("id-ID")}`
                  : "Stok habis"
                : `Jumlah: ${qty}`}
            </Text>
          </View>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotal}>
              Rp {(Number(product.price) * qty).toLocaleString("id-ID")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btn}
            onPress={addToCart}
            disabled={cartBusy || wishlistBusy || Number(product.stock ?? 0) <= 0}
            activeOpacity={0.85}
          >
            {cartBusy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="cart-outline" size={19} color={Colors.white} />
                <Text style={styles.btnText}>Tambah ke Keranjang</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={addToWishlist}
            disabled={wishlistBusy || cartBusy}
            activeOpacity={0.85}
          >
            {wishlistBusy ? (
              <ActivityIndicator color={Colors.burgundy} />
            ) : (
              <>
                <Ionicons name="heart-outline" size={19} color={Colors.burgundy} />
                <Text style={styles.outlineText}>Tambah ke Wishlist</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.reviewsSection}>
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={styles.reviewsTitle}>Ulasan pembeli</Text>
            <Text style={styles.reviewsSubtitle}>
              {reviewData
                ? `${Number(reviewData.summary.rating_count).toLocaleString("id-ID")} rating · ${Number(reviewData.summary.review_count).toLocaleString("id-ID")} ulasan`
                : "Rating dan pengalaman pembeli"}
            </Text>
          </View>
          {reviewData && Number(reviewData.summary.rating_count) > 0 && (
            <View style={styles.reviewScoreBadge}>
              <Ionicons name="star" size={15} color={Colors.gold} />
              <Text style={styles.reviewScoreText}>
                {Number(reviewData.summary.average_rating).toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {reviewsLoading ? (
          <View style={styles.reviewsState}>
            <ActivityIndicator color={Colors.burgundy} />
            <Text style={styles.reviewsStateText}>Memuat ulasan pembeli...</Text>
          </View>
        ) : reviewsError ? (
          <View style={styles.reviewsState}>
            <Ionicons name="cloud-offline-outline" size={25} color={Colors.muted} />
            <Text style={styles.reviewsStateText}>{reviewsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadReviews()}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : reviewData ? (
          <>
            {Number(reviewData.summary.rating_count) > 0 && (
              <View style={styles.reviewOverview}>
                <View style={styles.reviewAverage}>
                  <Text style={styles.reviewAverageValue}>
                    {Number(reviewData.summary.average_rating).toFixed(1)}
                  </Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(Number(reviewData.summary.average_rating)) ? "star" : "star-outline"}
                        size={16}
                        color={Colors.gold}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewAverageCaption}>
                    dari {Number(reviewData.summary.rating_count).toLocaleString("id-ID")} rating
                  </Text>
                </View>
                <View style={styles.reviewBreakdown}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = Number(reviewData.summary.distribution[String(star)] ?? 0);
                    const total = Number(reviewData.summary.rating_count);
                    const percent = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <View key={star} style={styles.reviewBreakdownRow}>
                        <Text style={styles.reviewBreakdownLabel}>{star}</Text>
                        <Ionicons name="star" size={12} color={Colors.gold} />
                        <View style={styles.reviewBarTrack}>
                          <View style={[styles.reviewBarFill, { width: `${percent}%` }]} />
                        </View>
                        <Text style={styles.reviewBreakdownCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {reviewData.reviews.length > 0 ? (
              <View style={styles.reviewList}>
                {reviewData.reviews.map((review) => {
                  const reviewDate = new Date(review.created_at.replace(" ", "T"));
                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewAuthorRow}>
                        <View style={styles.reviewerAvatar}>
                          <Ionicons name="person" size={16} color={Colors.burgundy} />
                        </View>
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>{review.buyer_name}</Text>
                          <Text style={styles.reviewDate}>
                            {Number.isNaN(reviewDate.getTime())
                              ? review.created_at
                              : reviewDate.toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                          </Text>
                        </View>
                        <View style={styles.reviewRating}>
                          <Ionicons name="star" size={13} color={Colors.gold} />
                          <Text style={styles.reviewRatingText}>{Number(review.rating)}</Text>
                        </View>
                      </View>
                      {review.comment?.trim() ? (
                        <Text style={styles.reviewComment}>{review.comment.trim()}</Text>
                      ) : (
                        <Text style={styles.reviewNoComment}>Pembeli memberikan rating tanpa komentar.</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.reviewsEmpty}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color={Colors.muted} />
                <Text style={styles.reviewsEmptyTitle}>Belum ada ulasan</Text>
                <Text style={styles.reviewsEmptyText}>
                  Rating dan komentar pembeli akan muncul di sini setelah tersedia.
                </Text>
              </View>
            )}
          </>
        ) : null}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.ivory, flex: 1 },
  page: { alignItems: "center", paddingHorizontal: 18, paddingBottom: 30 },
  loader: { marginTop: 40 },
  error: { color: Colors.navy, padding: 20 },
  loadState: { alignItems: "center", flex: 1, justifyContent: "center", padding: 20 },
  loadError: { color: Colors.navy, fontSize: 15, fontWeight: "700", marginTop: 12 },
  loadHint: { color: Colors.muted, fontSize: 12, marginTop: 5, textAlign: "center" },
  productLayout: { maxWidth: 1480, width: "100%" },
  productLayoutDesktop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 22,
    paddingTop: 24,
  },
  galleryColumn: { width: "100%" },
  galleryColumnDesktop: { flex: 1.05, width: 0 },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  image: { height: "100%", width: "100%" },
  imagePlaceholder: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  imageBadge: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 18,
    bottom: 12,
    flexDirection: "row",
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
  },
  imageBadgeText: {
    color: Colors.navy,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 5,
  },
  thumbnails: { gap: 8, paddingTop: 10 },
  thumbnail: {
    borderColor: Colors.border,
    borderRadius: 9,
    borderWidth: 1,
    height: 58,
    overflow: "hidden",
    width: 58,
  },
  thumbnailActive: { borderColor: Colors.burgundy, borderWidth: 2 },
  thumbnailImage: { height: "100%", width: "100%" },
  detailsColumn: { paddingTop: 18, width: "100%" },
  detailsColumnDesktop: { flex: 1.3, paddingTop: 0, width: 0 },
  vendorBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: 18,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vendor: { color: Colors.muted, fontSize: 11, fontWeight: "600", marginLeft: 5 },
  name: {
    color: Colors.navy,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 29,
    marginTop: 12,
  },
  ratingRow: { alignItems: "center", flexDirection: "row", marginTop: 8 },
  ratingText: { color: Colors.muted, fontSize: 12, marginLeft: 5 },
  ratingDot: { color: Colors.muted, marginHorizontal: 7 },
  priceCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 18,
    padding: 13,
  },
  priceLabel: { color: Colors.muted, fontSize: 11 },
  price: { color: Colors.burgundy, fontSize: 22, fontWeight: "800", marginTop: 4 },
  separator: { backgroundColor: Colors.border, height: 1, marginVertical: 15 },
  sectionTitle: { color: Colors.navy, fontSize: 15, fontWeight: "700" },
  desc: { color: Colors.muted, lineHeight: 21, marginTop: 7 },
  purchaseCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 20,
    padding: 15,
    width: "100%",
  },
  purchaseCardDesktop: { flex: 0.9, marginTop: 0, width: 0 },
  purchaseTitle: { color: Colors.navy, fontSize: 16, fontWeight: "800" },
  actionMessage: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 10,
  },
  actionMessageError: { borderColor: Colors.burgundy },
  actionMessageText: { color: Colors.navy, flex: 1, fontSize: 12, lineHeight: 17 },
  purchaseProduct: { alignItems: "center", flexDirection: "row", marginTop: 14 },
  purchaseImage: {
    backgroundColor: Colors.ivory,
    borderRadius: 8,
    height: 58,
    width: 58,
  },
  purchaseImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  purchaseProductName: {
    color: Colors.navy,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 10,
  },
  purchaseRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  qtyControl: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
  },
  qtyBtn: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  qtyValue: { color: Colors.navy, fontSize: 14, fontWeight: "700", minWidth: 26, textAlign: "center" },
  stock: { color: Colors.muted, fontSize: 12, marginLeft: 8 },
  subtotalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 18,
  },
  subtotalLabel: { color: Colors.muted, fontSize: 13 },
  subtotal: { color: Colors.navy, fontSize: 16, fontWeight: "800" },
  btn: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 9,
    minHeight: 48,
  },
  btnText: { color: Colors.white, fontWeight: "700", marginLeft: 8 },
  btnOutline: { backgroundColor: Colors.white, borderColor: Colors.burgundy, borderWidth: 1 },
  outlineText: { color: Colors.burgundy, fontWeight: "700", marginLeft: 8 },
  reviewsSection: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 20,
    maxWidth: 1480,
    padding: 18,
    width: "100%",
  },
  reviewsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewsTitle: { color: Colors.navy, fontSize: 18, fontWeight: "800" },
  reviewsSubtitle: { color: Colors.muted, fontSize: 12, marginTop: 4 },
  reviewScoreBadge: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 9,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reviewScoreText: { color: Colors.navy, fontSize: 14, fontWeight: "800" },
  reviewsState: { alignItems: "center", paddingVertical: 28 },
  reviewsStateText: { color: Colors.muted, fontSize: 13, marginTop: 9, textAlign: "center" },
  retryButton: {
    borderColor: Colors.burgundy,
    borderRadius: 9,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: { color: Colors.burgundy, fontSize: 13, fontWeight: "700" },
  reviewOverview: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 24,
    marginTop: 18,
    paddingBottom: 18,
  },
  reviewAverage: { alignItems: "center", justifyContent: "center", minWidth: 120 },
  reviewAverageValue: { color: Colors.navy, fontSize: 34, fontWeight: "800" },
  reviewStars: { flexDirection: "row", gap: 2, marginTop: 3 },
  reviewAverageCaption: { color: Colors.muted, fontSize: 11, marginTop: 5, textAlign: "center" },
  reviewBreakdown: { flex: 1, justifyContent: "center", gap: 6 },
  reviewBreakdownRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  reviewBreakdownLabel: { color: Colors.navy, fontSize: 11, textAlign: "right", width: 12 },
  reviewBarTrack: { backgroundColor: Colors.ivory, borderRadius: 4, flex: 1, height: 7, overflow: "hidden" },
  reviewBarFill: { backgroundColor: Colors.gold, borderRadius: 4, height: "100%" },
  reviewBreakdownCount: { color: Colors.muted, fontSize: 10, textAlign: "right", width: 24 },
  reviewList: { gap: 10, marginTop: 14 },
  reviewCard: {
    backgroundColor: Colors.ivory,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 13,
  },
  reviewAuthorRow: { alignItems: "center", flexDirection: "row" },
  reviewerAvatar: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  reviewerInfo: { flex: 1, marginLeft: 10 },
  reviewerName: { color: Colors.navy, fontSize: 13, fontWeight: "700" },
  reviewDate: { color: Colors.muted, fontSize: 11, marginTop: 3 },
  reviewRating: {
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 7,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  reviewRatingText: { color: Colors.navy, fontSize: 12, fontWeight: "700" },
  reviewComment: { color: Colors.navy, fontSize: 13, lineHeight: 20, marginTop: 12 },
  reviewNoComment: { color: Colors.muted, fontSize: 12, fontStyle: "italic", marginTop: 12 },
  reviewsEmpty: {
    alignItems: "center",
    backgroundColor: Colors.ivory,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  reviewsEmptyTitle: { color: Colors.navy, fontSize: 14, fontWeight: "700", marginTop: 9 },
  reviewsEmptyText: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 330,
    textAlign: "center",
  },
});
