"use client";

import React from "react";
import { Home, LayoutGrid, ShoppingBag, Gift, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";

export const BottomNav: React.FC = () => {
  const { totalItemsCount, setIsCartOpen, isCartBouncing } = useCart();
  const { setIsProfileOpen, setIsRewardsOpen } = useUser();
  const { language } = useLanguage();

  return (
    <nav className="fixed z-40 bg-[#FAF5ED]/95 backdrop-blur-md border border-[#4A0E17]/15 shadow-2xl transition-all duration-300
      /* أضفنا md:hidden هنا لكي يختفي تماماً على أجهزة الكمبيوتر ويظهر على الموبايل فقط */
      md:hidden
      bottom-0 left-0 right-0 px-4 py-2 border-t rounded-t-2xl flex items-center justify-around"
    >
      
      {/* 1. الرئيسية (Home) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex flex-col items-center gap-0.5 text-stone-600 hover:text-[#4A0E17] transition group"
      >
        <div className="w-10 h-7 rounded-full bg-[#4A0E17] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
          <Home className="w-4 h-4" />
        </div>
        <span className="text-[9px] font-bold mt-0.5 text-[#4A0E17]">
          {language === "ar" ? "الرئيسية" : "Home"}
        </span>
      </button>

      {/* 2. القائمة (Menu) */}
      <button
        onClick={() => document.getElementById("productsSection")?.scrollIntoView({ behavior: "smooth" })}
        className="flex flex-col items-center gap-0.5 text-stone-500 hover:text-[#4A0E17] transition group"
      >
        <div className="w-8 h-7 flex items-center justify-center group-hover:scale-110 transition">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-bold">
          {language === "ar" ? "المنيو" : "Menu"}
        </span>
      </button>

      {/* 3. زر السلة الأوسط الفاخر (Cart) */}
      <button
        id="cart-target-mobile"
        onClick={() => setIsCartOpen(true)}
        className={`relative -top-3 w-12 h-12 bg-[#4A0E17] text-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#F4ECE1] hover:scale-110 transition transform ${
          isCartBouncing ? "animate-cart-bounce bg-[#36070E]" : ""
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        {totalItemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#4A0E17] font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-[#4A0E17]/20 shadow animate-in zoom-in duration-200">
            {totalItemsCount}
          </span>
        )}
      </button>

      {/* 4. المكافآت (Rewards) */}
      <button
        onClick={() => setIsRewardsOpen(true)}
        className="flex flex-col items-center gap-0.5 text-stone-500 hover:text-[#4A0E17] transition group"
      >
        <div className="w-8 h-7 flex items-center justify-center group-hover:scale-110 transition">
          <Gift className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-bold">
          {language === "ar" ? "المكافآت" : "Rewards"}
        </span>
      </button>

      {/* 5. حسابي (Profile) */}
      <button
        onClick={() => setIsProfileOpen(true)}
        className="flex flex-col items-center gap-0.5 text-stone-500 hover:text-[#4A0E17] transition group"
      >
        <div className="w-8 h-7 flex items-center justify-center group-hover:scale-110 transition">
          <User className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-bold">
          {language === "ar" ? "حسابي" : "Profile"}
        </span>
      </button>
      
    </nav>
  );
};