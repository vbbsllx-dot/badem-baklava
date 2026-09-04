"use client";

import React from "react";
import { Home, PackagePlus, ShoppingBag, Gift, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";

export const BottomNav: React.FC = () => {
  const { totalItemsCount, setIsCartOpen, isCartBouncing } = useCart();
  const { setIsProfileOpen, setIsRewardsOpen, setIsMenuOpen } = useUser();
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#FAF5ED]/95 backdrop-blur-md border-t border-[#4A0E17]/15 shadow-[0_-8px_25px_rgba(74,14,23,0.08)] px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] rounded-t-3xl flex items-center justify-around touch-manipulation select-none"
    >
      {/* 1. الرئيسية (Home) */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={isAr ? "الرئيسية" : "Home"}
        className="flex flex-col items-center gap-1 text-stone-600 hover:text-[#4A0E17] transition-all cursor-pointer group active:scale-95"
      >
        <div className="w-10 h-7 rounded-full bg-[#4A0E17] text-[#E5C058] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
          <Home className="w-4 h-4" />
        </div>
        <span className="text-[9.5px] font-black text-[#4A0E17] tracking-tight">
          {isAr ? "الرئيسية" : "Home"}
        </span>
      </button>

      {/* 2. صمّم بوكسك (Custom Box) */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(true)}
        aria-label={isAr ? "صمّم بوكسك" : "Custom Box"}
        className="flex flex-col items-center gap-1 text-stone-500 hover:text-[#4A0E17] transition-all cursor-pointer group active:scale-95"
      >
        <div className="w-9 h-7 flex items-center justify-center group-hover:scale-110 transition-transform">
          <PackagePlus
            className="w-5 h-5 text-stone-600 group-hover:text-[#4A0E17]"
            strokeWidth={2}
          />
        </div>
        <span className="text-[9.5px] font-bold text-stone-600 group-hover:text-[#4A0E17] tracking-tight">
          {isAr ? "صمّم بوكسك" : "Custom Box"}
        </span>
      </button>

      {/* 3. زر السلة الأوسط العائم (Cart Floating Target) */}
      <button
        type="button"
        id="cart-target-mobile"
        onClick={() => setIsCartOpen(true)}
        aria-label={isAr ? "سلة المشتريات" : "Shopping Cart"}
        className={`relative -top-3.5 w-12 h-12 bg-[#4A0E17] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(74,14,23,0.35)] border-4 border-[#F4ECE1] ring-1 ring-[#C59B27]/30 hover:scale-105 active:scale-90 transition-all cursor-pointer ${
          isCartBouncing ? "animate-cart-bounce bg-[#36070E] ring-2 ring-[#E5C058]" : ""
        }`}
      >
        <ShoppingBag className="w-5 h-5 text-[#E5C058]" />
        {totalItemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#4A0E17] font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#4A0E17] shadow-sm animate-in zoom-in duration-200">
            {totalItemsCount}
          </span>
        )}
      </button>

      {/* 4. المكافآت (Rewards) */}
      <button
        type="button"
        onClick={() => setIsRewardsOpen(true)}
        aria-label={isAr ? "نقاط المكافآت" : "Rewards"}
        className="flex flex-col items-center gap-1 text-stone-500 hover:text-[#4A0E17] transition-all cursor-pointer group active:scale-95"
      >
        <div className="w-9 h-7 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Gift className="w-5 h-5 text-stone-600 group-hover:text-[#4A0E17]" strokeWidth={2} />
        </div>
        <span className="text-[9.5px] font-bold text-stone-600 group-hover:text-[#4A0E17] tracking-tight">
          {isAr ? "المكافآت" : "Rewards"}
        </span>
      </button>

      {/* 5. حسابي (Profile) */}
      <button
        type="button"
        onClick={() => setIsProfileOpen(true)}
        aria-label={isAr ? "حسابي" : "Profile"}
        className="flex flex-col items-center gap-1 text-stone-500 hover:text-[#4A0E17] transition-all cursor-pointer group active:scale-95"
      >
        <div className="w-9 h-7 flex items-center justify-center group-hover:scale-110 transition-transform">
          <User className="w-5 h-5 text-stone-600 group-hover:text-[#4A0E17]" strokeWidth={2} />
        </div>
        <span className="text-[9.5px] font-bold text-stone-600 group-hover:text-[#4A0E17] tracking-tight">
          {isAr ? "حسابي" : "Profile"}
        </span>
      </button>
    </nav>
  );
};