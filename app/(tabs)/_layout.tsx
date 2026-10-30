import { Tabs } from "expo-router";
import React from "react";
import { Heart, Search, ShoppingBag, ShoppingCart, User } from "lucide-react-native";
import Colors from "../../constants/Colors";
import { useResponsive } from "../../hooks/useResponsive";

export default function TabsLayout() {
  const { isMobile } = useResponsive();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: isMobile ? "flex" : "none",
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.burgundy,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Kategori",
          tabBarIcon: ({ color, size }) => (
            <Search size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Keranjang",
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <Heart size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Akun",
          tabBarIcon: ({ color, size }) => (
            <User size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
