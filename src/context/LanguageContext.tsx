"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ar" | "en";

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

export const translations: Translations = {
  brandName: { ar: "بادَم", en: "BADEM" },
  brandSubtitle: { ar: "بقلاوة تركية فاخرة", en: "BAKLAVA" },
  deliveryTo: { ar: "التوصيل إلى: الرياض - شارع التخصصي", en: "Deliver to: Riyadh - Al Takhassusi St" },
  searchPlaceholder: { ar: "ابحث عن البقلاوة، أصابع الفستق، أو بوكسات الهدايا...", en: "Search baklava, pistachio rolls, gift boxes..." },
  popularPicks: { ar: "المختارات الأكثر طلباً (Popular Picks)", en: "Popular Picks" },
  popularSubtitle: { ar: "مخبوزة طازجة يومياً بأيدي أمهر الحرفيين الأتراك", en: "Freshly baked daily by master Turkish artisans" },
  viewAll: { ar: "عرض الكل", en: "View All" },
  orderNow: { ar: "اطلب الآن", en: "Order Now" },
  ingredients: { ar: "المكونات", en: "Ingredients" },
  showIngredients: { ar: "عرض المكونات", en: "View Ingredients" },
  portionQuarter: { ar: "ربع كيلو (250g)", en: "250g (Quarter Kg)" },
  portionHalf: { ar: "نصف كيلو (500g)", en: "500g (Half Kg)" },
  portionKilo: { ar: "1 كيلو فاخر (صندوق خشبي)", en: "1 Kg Royal Wooden Box" },
  addToCart: { ar: "إضافة للسلة الفاخرة", en: "Add to Luxury Cart" },
  currency: { ar: "ر.س", en: "SAR" },
  cartTitle: { ar: "سلة المشتريات الفاخرة", en: "Luxury Shopping Bag" },
  emptyCart: { ar: "سلتك الفاخرة فارغة حالياً", en: "Your shopping bag is empty" },
  subtotal: { ar: "المجموع الفرعي", en: "Subtotal" },
  discount: { ar: "الخصم الترويجي", en: "Promo Discount" },
  deliveryFee: { ar: "رسوم التوصيل الطازج", en: "Fresh Delivery Fee" },
  total: { ar: "المجموع الكلي", en: "Total Amount" },
  couponPlaceholder: { ar: "كود الخصم (جرب: BADEM20)", en: "Coupon Code (Try: BADEM20)" },
  apply: { ar: "تطبيق", en: "Apply" },
  checkout: { ar: "إتمام الطلب الفاخر", en: "Proceed to Checkout" },
  home: { ar: "الرئيسية", en: "Home" },
  menu: { ar: "المنيو", en: "Menu" },
  rewards: { ar: "المكافآت", en: "Rewards" },
  profile: { ar: "حسابي", en: "Profile" },
  rewardsTitle: { ar: "BADEM REWARDS CLUB", en: "BADEM REWARDS CLUB" },
  rewardsDesc: { ar: "اكسب 10 نقاط مع كل طلب واستبدلها بخصومات وبوكسات مجانية.", en: "Earn 10 points with every order & redeem for royal gift boxes." },
  joinNow: { ar: "انضم الآن مجاناً", en: "Join Now Free" }
};

interface LanguageContextType {
  language: Language;
  dir: "rtl" | "ltr";
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>("ar");

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        dir: language === "ar" ? "rtl" : "ltr",
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};