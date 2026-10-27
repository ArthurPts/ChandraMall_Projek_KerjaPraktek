import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../constants/Colors";

export type MarketplaceProduct = {
  id: string | number;
  product_id?: string | number;
  image_url?: string | null;
  name: string;
  price: number | string;
  vendor_name?: string | null;
  stock?: number | string;
};

type MarketplaceProductCardProps = {
  product: MarketplaceProduct;
  onPress: () => void;
  onRemove?: () => void;
  compact?: boolean;
};

export function MarketplaceProductCard({
  product,
  onPress,
  onRemove,
  compact = false,
}: MarketplaceProductCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.84}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Lihat ${product.name}`}
    >
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={27} color={Colors.muted} />
        </View>
      )}
      <View style={[styles.details, compact && styles.compactDetails]}>
        {!!product.vendor_name && (
          <Text style={styles.vendor} numberOfLines={1}>
            {product.vendor_name}
          </Text>
        )}
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          Rp {Number(product.price).toLocaleString("id-ID")}
        </Text>
        {product.stock !== undefined && (
          <Text
            style={[
              styles.stock,
              Number(product.stock) <= 0 && styles.stockEmpty,
            ]}
          >
            {Number(product.stock) > 0
              ? `Stok ${Number(product.stock).toLocaleString("id-ID")}`
              : "Stok habis"}
          </Text>
        )}
        {onRemove && (
          <TouchableOpacity
            style={styles.remove}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Hapus ${product.name}`}
          >
            <Ionicons name="trash-outline" size={14} color={Colors.burgundy} />
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
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: { aspectRatio: 1, backgroundColor: Colors.white, width: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  details: { minHeight: 80, padding: 9 },
  compactDetails: { minHeight: 72, padding: 8 },
  vendor: { color: Colors.muted, fontSize: 10, marginBottom: 3 },
  name: { color: Colors.navy, fontSize: 11, fontWeight: "600", lineHeight: 15, minHeight: 30 },
  price: { color: Colors.burgundy, fontSize: 13, fontWeight: "800", marginTop: 5 },
  stock: { color: Colors.muted, fontSize: 9, marginTop: 4 },
  stockEmpty: { color: Colors.burgundy, fontWeight: "700" },
  remove: { alignItems: "center", flexDirection: "row", marginTop: 7 },
  removeText: { color: Colors.burgundy, fontSize: 11, fontWeight: "600", marginLeft: 5 },
});
