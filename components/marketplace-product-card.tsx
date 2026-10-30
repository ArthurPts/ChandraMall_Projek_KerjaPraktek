import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2, Heart, Image as ImageIcon, ShoppingCart, Star, Trash2 } from "lucide-react-native";
import Colors from "../constants/Colors";
import { formatPrice } from "../constants/format";

export type MarketplaceProduct = {
  id: string | number;
  product_id?: string | number;
  image_url?: string | null;
  name: string;
  price: number | string;
  vendor_name?: string | null;
  vendor_is_verified?: number | boolean | string;
  vendor_rating?: number | string;
  vendor_origin_city?: string | null;
  stock?: number | string;
  weight_grams?: number | string;
  is_exportable?: number | boolean | string;
};

type MarketplaceProductCardProps = {
  product: MarketplaceProduct;
  onPress: () => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  onRemove?: () => void;
  compact?: boolean;
};

export function MarketplaceProductCard({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  onRemove,
  compact = false,
}: MarketplaceProductCardProps) {
  const isVerified =
    product.vendor_is_verified === 1 ||
    product.vendor_is_verified === "1" ||
    product.vendor_is_verified === true;

  const isExportReady =
    product.is_exportable === undefined ||
    product.is_exportable === 1 ||
    product.is_exportable === "1" ||
    product.is_exportable === true;

  const rating = product.vendor_rating ? Number(product.vendor_rating).toFixed(1) : "4.9";
  const stockNum = product.stock !== undefined ? Number(product.stock) : 99;
  const isOutOfStock = stockNum <= 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Lihat detail ${product.name}`}
    >
      {/* Product Image + Badges */}
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <ImageIcon size={32} color={Colors.mutedLight} />
          </View>
        )}

        {/* Export to HK Badge */}
        {isExportReady && (
          <View style={styles.exportBadge}>
            <Text style={styles.exportBadgeText}>Siap Kirim HK</Text>
          </View>
        )}

        {/* Wishlist Button Overlay */}
        {onToggleWishlist && (
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
            accessibilityRole="button"
            accessibilityLabel="Simpan ke wishlist"
          >
            <Heart
              size={16}
              color={isWishlisted ? Colors.burgundy : Colors.muted}
              fill={isWishlisted ? Colors.burgundy : "transparent"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Details Container */}
      <View style={[styles.details, compact && styles.compactDetails]}>
        {/* Vendor Row */}
        {!!product.vendor_name && (
          <View style={styles.vendorRow}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {product.vendor_name}
            </Text>
            {isVerified && (
              <CheckCircle2 size={12} color={Colors.verifiedBadge} style={styles.verifiedIcon} />
            )}
          </View>
        )}

        {/* Title */}
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>

        {/* Rating and Weight Meta */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Star size={11} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          {!!product.weight_grams && (
            <Text style={styles.weightText}>{product.weight_grams}g</Text>
          )}
        </View>

        {/* Price & Action Row */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {isOutOfStock ? (
              <Text style={styles.stockEmpty}>Stok Habis</Text>
            ) : (
              <Text style={styles.stockText}>Tersedia</Text>
            )}
          </View>

          {onAddToCart && !isOutOfStock && (
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Tambah ${product.name} ke keranjang`}
            >
              <ShoppingCart size={15} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Remove Button (for Wishlist page) */}
        {onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Hapus ${product.name}`}
          >
            <Trash2 size={13} color={Colors.error} />
            <Text style={styles.removeText}>Hapus</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    width: "100%",
    backgroundColor: Colors.ivory,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.ivoryDark,
  },
  exportBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(28, 43, 74, 0.9)",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  exportBadgeText: {
    color: Colors.goldLight,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  wishlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  details: {
    padding: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  compactDetails: {
    padding: 8,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  vendorName: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: "85%",
  },
  verifiedIcon: {
    marginTop: 1,
  },
  name: {
    color: Colors.navy,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    minHeight: 36,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.goldSubtle,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.goldLight,
  },
  ratingText: {
    color: Colors.goldDark,
    fontSize: 10,
    fontWeight: "700",
  },
  weightText: {
    color: Colors.muted,
    fontSize: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 4,
  },
  price: {
    color: Colors.burgundy,
    fontSize: 15,
    fontWeight: "800",
  },
  stockText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  stockEmpty: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  cartBtn: {
    backgroundColor: Colors.burgundy,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    justifyContent: "center",
  },
  removeText: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: "600",
  },
});
