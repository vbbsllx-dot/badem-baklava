"use client";

import React from "react";
import { TrendingUp, ShoppingBag, Package, Tag, CalendarClock } from "lucide-react";

interface AdminStatsProps {
  totalRevenue: number;
  ordersCount: number;
  productsCount: number;
  couponsCount: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({
  totalRevenue,
  ordersCount,
  productsCount,
  couponsCount,
}) => {
  // التاريخ الحالي بصيغة عربية فاخرة
  const currentDate = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-3">
      {/* شريط التاريخ الحي */}
      <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs font-bold text-stone-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#C59B27]" />
          <span>{currentDate}</span>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200/60 font-black">
          النظام يعمل بلحظية التام (Live) 🟢
        </span>
      </div>

      {/* بطاقات الإحصائيات الأربع الحديثة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        {/* 1. المبيعات */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-[#4A0E17]/40 transition">
          <span className="text-[10px] text-stone-400 font-bold block">إجمالي المبيعات</span>
          <div className="flex items-center justify-between">
            <span className="text-lg md:text-xl font-black text-[#4A0E17]">{totalRevenue.toFixed(2)} ر.س</span>
            <div className="w-9 h-9 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17] shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. الطلبات */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-amber-500/40 transition">
          <span className="text-[10px] text-stone-400 font-bold block">عدد الطلبات</span>
          <div className="flex items-center justify-between">
            <span className="text-lg md:text-xl font-black text-stone-800">{ordersCount} طلب</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. الأصناف */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-emerald-500/40 transition">
          <span className="text-[10px] text-stone-400 font-bold block">الأصناف المعروضة</span>
          <div className="flex items-center justify-between">
            <span className="text-lg md:text-xl font-black text-stone-800">{productsCount} صنف</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. الكوبونات */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 hover:border-purple-500/40 transition">
          <span className="text-[10px] text-stone-400 font-bold block">الكوبونات النشطة</span>
          <div className="flex items-center justify-between">
            <span className="text-lg md:text-xl font-black text-stone-800">{couponsCount} كود</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-700 shadow-2xs">
              <Tag className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};