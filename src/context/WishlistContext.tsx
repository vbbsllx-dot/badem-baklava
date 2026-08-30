"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WishlistContextType {
  favorites: (string | number)[];
  toggleFavorite: (productId: string | number) => boolean;
  isFavorite: (productId: string | number) => boolean;
  favoritesCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. استرجاع المفضلة الحقيقية من ذاكرة المتصفح عند فتح الموقع
  useEffect(() => {
    try {
      const saved = localStorage.getItem("badem_wishlist");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load wishlist from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // 2. حفظ المفضلة تلقائياً في ذاكرة المتصفح عند أي إضافة أو حذف
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("badem_wishlist", JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = (productId: string | number): boolean => {
    let isAdded = false;
    setFavorites((prev) => {
      if (prev.includes(productId)) {
        isAdded = false;
        return prev.filter((id) => id !== productId);
      } else {
        isAdded = true;
        return [...prev, productId];
      }
    });
    return isAdded;
  };

  const isFavorite = (productId: string | number) => favorites.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};