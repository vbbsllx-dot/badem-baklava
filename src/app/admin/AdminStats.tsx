"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, Package, Tag, CalendarClock } from "lucide-react";

interface AdminStatsProps {
  totalRevenue: number;
  ordersCount: number;
  productsCount: number;
  couponsCount: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  totalRevenue = 0,
  ordersCount = 0,
  productsCount = 0,
  couponsCount = 0,
}) => {
  const [currentDate, setCurrentDate] = useState<string>("");

  // تهيئة التاريخ بعد تحميل المتصفح لتفادي خطأ عدم تطابق الخادم مع العميل (Hydration Mismatch)
  useEffect(() => {
    const formatted = new Date().toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formatted);
  }, []);

  return (
    <div className="space-y-3 select-none">
      {/* شريط التاريخ الحي */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs font-bold text-stone-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#C59B27] shrink-0" />
          <span className="min-h-[1rem]">{currentDate}</span>
        </div>
        <span className="text-[10.5px] bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/60 font-black flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>النظام يعمل بلحظية تامة (Live)</span>
        </span>
      </div>

      {/* بطاقات الإحصائيات الأربع */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* 1. المبيعات */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-[#4A0E17]/40 transition-all group">
          <span className="text-[10px] text-stone-400 font-bold block">إجمالي المبيعات</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-[#4A0E17] font-mono tracking-tight truncate">
              {Number(totalRevenue).toFixed(2)} <span className="text-xs font-bold font-sans">ر.س</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#4A0E17]/10 group-hover:scale-105 transition-transform flex items-center justify-center text-[#4A0E17] shadow-2xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. الطلبات */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-amber-500/40 transition-all group">
          <span className="text-[10px] text-stone-400 font-bold block">عدد الطلبات</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-stone-800 font-mono tracking-tight truncate">
              {ordersCount} <span className="text-xs font-bold font-sans">طلب</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 group-hover:scale-105 transition-transform flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. الأصناف */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-emerald-500/40 transition-all group">
          <span className="text-[10px] text-stone-400 font-bold block">الأصناف المعروضة</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-stone-800 font-mono tracking-tight truncate">
              {productsCount} <span className="text-xs font-bold font-sans">صنف</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 group-hover:scale-105 transition-transform flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. الكوبونات */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-purple-500/40 transition-all group">
          <span className="text-[10px] text-stone-400 font-bold block">الكوبونات النشطة</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-stone-800 font-mono tracking-tight truncate">
              {couponsCount} <span className="text-xs font-bold font-sans">كود</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 group-hover:scale-105 transition-transform flex items-center justify-center text-purple-700 shadow-2xs shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};