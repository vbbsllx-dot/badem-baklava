"use client";

import React from "react";
import {
  Globe,
  MapPin,
  ChevronDown,
  Bell,
  User,
  ShoppingBag,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";

export const Navbar: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const { totalItemsCount, setIsCartOpen, isCartBouncing } = useCart();
  const {
    setIsProfileOpen,
    setIsNotificationsOpen,
    unreadNotificationsCount = 0,
    setIsMenuOpen,
  } = useUser();

  const isAr = language === "ar";

  return (
    <header className="w-full bg-[#4A0E17]/95 backdrop-blur-md text-white pt-3 pb-2.5 px-4 space-y-2.5 sticky top-0 z-40 shadow-lg border-b border-[#5E1420] transition-colors duration-300">
      <div className="max-w-md md:max-w-6xl mx-auto flex items-center justify-between gap-2">
        
        {/* الجانب الأيمن: تبديل اللغة وشريط العنوان لسطح المكتب */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* زر تبديل اللغة */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={isAr ? "Switch to English" : "التحويل للغة العربية"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white text-xs font-bold shadow-xs hover:bg-white/20 active:scale-95 transition-all backdrop-blur-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C058]"
          >
            <Globe className="w-3.5 h-3.5 text-[#E5C058]" />
            <span className="leading-none">{isAr ? "English" : "العربية"}</span>
          </button>

          {/* شريط العنوان التفاعلي لسطح المكتب */}
          <div className="hidden md:flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs text-stone-100 shadow-2xs backdrop-blur-xs select-none">
            <MapPin className="w-3.5 h-3.5 text-[#E5C058] shrink-0" />
            <span className="font-medium">
              {isAr ? "الرياض - شارع التخصصي" : "Riyadh - Tahlia St"}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-300 shrink-0" />
          </div>
        </div>

        {/* المنتصف: الشعار الملكي الفاخر */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center select-none cursor-pointer group active:scale-98 transition-transform"
          role="button"
          aria-label={isAr ? "العودة إلى أعلى الصفحة" : "Scroll to top"}
        >
          <h1 className="text-2xl md:text-3xl font-black font-brand text-white tracking-[0.25em] drop-shadow-xs group-hover:text-[#FAF5ED] transition-colors">
            BADEM
          </h1>
          <div className="flex items-center gap-1 -mt-1">
            <span className="w-2 md:w-3 h-[1px] bg-[#C59B27]/60" />
            <span className="text-[8px] md:text-[9px] tracking-[0.35em] text-[#E5C058] font-bold uppercase">
              BAKLAVA
            </span>
            <span className="w-2 md:w-3 h-[1px] bg-[#C59B27]/60" />
          </div>
        </div>

        {/* الجانب الأيسر: الإجراءات السريعة (صمّم بوكسك، الإشعارات، السلة، الحساب) */}
        <div className="flex items-center gap-2 md:gap-2.5">
          
          {/* زر صمّم بوكسك الحصري لأجهزة الكمبيوتر */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label={isAr ? "صمّم بوكسك الخاص" : "Custom Box Studio"}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-[#C59B27]/40 text-[#E5C058] text-xs font-bold transition-all shadow-xs group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C058]"
          >
            <PackagePlus className="w-4 h-4 text-[#E5C058] group-hover:scale-110 transition-transform" />
            <span className="text-white group-hover:text-[#E5C058] transition-colors">
              {isAr ? "صمّم بوكسك" : "Custom Box"}
            </span>
            <Sparkles className="w-3 h-3 text-[#E5C058] animate-pulse" />
          </button>

          {/* جرس الإشعارات مع عداد التنبيهات المباشر */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            aria-label={
              isAr
                ? `التنبيهات (${unreadNotificationsCount} غير مقروءة)`
                : `Notifications (${unreadNotificationsCount} unread)`
            }
            title={isAr ? "التنبيهات المباشرة" : "Notifications"}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-xs hover:bg-white/20 active:scale-90 transition-all relative cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C058]"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-[#4A0E17] animate-pulse">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* زر السلة الذهبي لسطح المكتب */}
          <button
            type="button"
            id="cart-target-desktop"
            onClick={() => setIsCartOpen(true)}
            aria-label={
              isAr
                ? `سلة المشتريات بها ${totalItemsCount} عناصر`
                : `Shopping cart with ${totalItemsCount} items`
            }
            className={`hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#C59B27] hover:bg-[#E5C058] text-[#4A0E17] font-bold rounded-full transition-all shadow-md active:scale-95 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${
              isCartBouncing ? "animate-cart-bounce ring-2 ring-white" : ""
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-black">{totalItemsCount}</span>
          </button>

          {/* زر حساب العميل والملف الشخصي */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            aria-label={isAr ? "حسابي الشخصي" : "My Profile"}
            title={isAr ? "حسابي" : "Profile"}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-xs hover:bg-white/20 active:scale-90 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C058]"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* شريط تحديد وتأكيد الموقع المخصص للهواتف المحمولة */}
      <div className="max-w-md mx-auto md:hidden">
        <div className="bg-white/10 border border-white/15 rounded-2xl px-3.5 py-2 flex items-center justify-between shadow-2xs backdrop-blur-xs text-white">
          <div className="flex items-center gap-2 text-xs truncate">
            <MapPin className="w-4 h-4 text-[#E5C058] shrink-0" />
            <span className="font-medium truncate text-stone-100">
              {isAr
                ? "التوصيل إلى: الرياض - شارع التخصصي"
                : "Deliver to: Riyadh - Tahlia St"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-stone-300 shrink-0" />
        </div>
      </div>
    </header>
  );
};