"use client";

import React from "react";
import { Globe, MapPin, ChevronDown, Bell, User, ShoppingBag, PackagePlus, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";

export const Navbar: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { setIsProfileOpen, setIsNotificationsOpen, unreadNotificationsCount, setIsMenuOpen } = useUser();

  return (
    <header className="w-full bg-[#4A0E17] text-white pt-3 pb-2.5 px-4 space-y-2.5 sticky top-0 z-40 shadow-lg border-b border-[#5E1420]">
      <div className="max-w-md md:max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Language Switcher & Desktop Address Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold shadow-xs hover:bg-white/20 transition backdrop-blur-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#E5C058]" />
            <span>{language === "ar" ? "English" : "العربية"}</span>
          </button>

          {/* Desktop Address Pill */}
          <div className="hidden md:flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs text-stone-100 shadow-2xs backdrop-blur-xs">
            <MapPin className="w-3.5 h-3.5 text-[#E5C058]" />
            <span className="font-medium">
              {language === "ar" ? "الرياض - شارع التخصصي" : "Riyadh - Tahlia St"}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-300" />
          </div>
        </div>

        {/* Center Brand Logo (White & Gold Typography) */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center select-none cursor-pointer"
        >
          <h1 className="text-2xl md:text-3xl font-black font-brand text-white tracking-[0.25em] drop-shadow-xs">
            BADEM
          </h1>
          <div className="flex items-center gap-1 -mt-1">
            <span className="w-2 md:w-3 h-[1px] bg-[#C59B27]/60"></span>
            <span className="text-[8px] md:text-[9px] tracking-[0.35em] text-[#E5C058] font-bold uppercase">
              BAKLAVA
            </span>
            <span className="w-2 md:w-3 h-[1px] bg-[#C59B27]/60"></span>
          </div>
        </div>

        {/* Action Buttons (Box Builder, Notification, Cart on Desktop, Profile) */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* 🌟 زر صمّم بوكسك الفاخر لأجهزة الكمبيوتر */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-[#C59B27]/40 text-[#E5C058] text-xs font-bold transition shadow-xs group cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-[#E5C058] group-hover:scale-110 transition-transform" />
            <span className="text-white group-hover:text-[#E5C058] transition">
              {language === "ar" ? "صمّم بوكسك" : "Custom Box"}
            </span>
            <Sparkles className="w-3 h-3 text-[#E5C058] animate-pulse" />
          </button>

          {/* 🔔 جرس الإشعارات مع عداد التنبيهات غير المقروءة */}
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            title="التنبيهات المباشرة"
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-xs hover:bg-white/20 transition relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#4A0E17] animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Desktop Gold Cart Button */}
          <button
            id="cart-target-desktop"
            onClick={() => setIsCartOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#C59B27] text-[#4A0E17] font-bold rounded-full hover:bg-[#E5C058] transition shadow-md cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-black">{totalItemsCount}</span>
          </button>

          {/* 👤 زر حساب العميل والملف الشخصي */}
          <button 
            onClick={() => setIsProfileOpen(true)}
            title="حسابي"
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-xs hover:bg-white/20 transition cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Location Selector Bar */}
      <div className="max-w-md mx-auto md:hidden">
        <div className="bg-white/10 border border-white/15 rounded-2xl px-3.5 py-2 flex items-center justify-between shadow-2xs backdrop-blur-xs text-white">
          <div className="flex items-center gap-2 text-xs truncate">
            <MapPin className="w-4 h-4 text-[#E5C058] shrink-0" />
            <span className="font-medium truncate text-stone-100">
              {language === "ar" ? "التوصيل إلى: الرياض - شارع التخصصي" : "Deliver to: Riyadh - Tahlia St"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-stone-300 shrink-0" />
        </div>
      </div>
    </header>
  );
};