"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { PackagePlus, Save, Sparkles, Check, Box, Layers, DollarSign, Loader2 } from "lucide-react";

interface BoxTier {
  id: string;
  name_ar: string;
  name_en: string;
  capacity: number;
  price: number;
}

export const BoxBuilderSettings: React.FC = () => {
  const [pricingMode, setPricingMode] = useState<"dynamic" | "fixed">("dynamic");
  const [packagingFee, setPackagingFee] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // قائمة مقاسات البوكسات
  const [tiers, setTiers] = useState<BoxTier[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // جلب إعدادات المتجر ومقاسات البوكسات بأمان
  useEffect(() => {
    let isMounted = true;

    const loadAllSettings = async () => {
      try {
        const [settingsRes, tiersRes] = await Promise.all([
          supabase.from("box_builder_settings").select("*").eq("id", "default").maybeSingle(),
          supabase.from("custom_box_tiers").select("*").order("capacity", { ascending: true }),
        ]);

        if (isMounted) {
          if (settingsRes.data) {
            setPricingMode(settingsRes.data.pricing_mode || "dynamic");
            setPackagingFee(Number(settingsRes.data.packaging_fee) || 0);
            setIsEnabled(settingsRes.data.is_enabled ?? true);
          }

          if (tiersRes.data && tiersRes.data.length > 0) {
            setTiers(tiersRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load box builder settings:", err);
      }
    };

    loadAllSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // تحديث سعر أو سعة بوكس معين محلياً
  const handleTierChange = useCallback((id: string, field: "price" | "capacity", value: number) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }, []);

  // حفظ التعديلات في قاعدة البيانات
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      // 1. تحديث الإعدادات العامة
      const { error: settingsError } = await supabase
        .from("box_builder_settings")
        .upsert({
          id: "default",
          pricing_mode: pricingMode,
          packaging_fee: packagingFee,
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        });

      if (settingsError) throw settingsError;

      // 2. تحديث السعة والأسعار في جدول custom_box_tiers بالتوازي
      const updatePromises = tiers.map((tier) =>
        supabase
          .from("custom_box_tiers")
          .update({
            price: tier.price,
            capacity: tier.capacity,
          })
          .eq("id", tier.id)
      );

      const results = await Promise.all(updatePromises);
      const failed = results.find((res) => res.error);
      if (failed && failed.error) throw failed.error;

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error("Save box settings error:", err);
      alert("حدث خطأ أثناء الحفظ: " + (err.message || "يرجى المحاولة لاحقاً"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xs overflow-hidden p-6 max-w-3xl mx-auto space-y-6 text-stone-800 select-none">
      
      {/* ترويسة اللوحة */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
            <PackagePlus className="w-5 h-5 text-[#C59B27]" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#4A0E17]">إعدادات خدمة &quot;صمّم بوكسك&quot;</h3>
            <p className="text-xs text-stone-400">التحكم في طريقة تسعير البوكسات وسعاتها</p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold bg-[#FAF5ED] px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs">
          <span>{isEnabled ? "الخدمة نشطة 🟢" : "الخدمة معطلة 🔴"}</span>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#4A0E17] rounded-md cursor-pointer"
          />
        </label>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* طريقة التسعير */}
        <div className="space-y-2">
          <label className="text-xs font-black text-stone-700 block">طريقة حساب سعر البوكس:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* خيار التسعير الديناميكي */}
            <div
              onClick={() => setPricingMode("dynamic")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                pricingMode === "dynamic"
                  ? "border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs ring-1 ring-[#4A0E17]/20"
                  : "border-stone-200 hover:border-stone-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4A0E17]">تسعير ديناميكي (تراكمي)</span>
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                يُحسب السعر بجمع أسعار القطع التي يختارها العميل تلقائياً + رسوم التغليف.
              </p>
            </div>

            {/* خيار السعر الثابت */}
            <div
              onClick={() => setPricingMode("fixed")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                pricingMode === "fixed"
                  ? "border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs ring-1 ring-[#4A0E17]/20"
                  : "border-stone-200 hover:border-stone-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4A0E17]">سعر موحد ثابت للبوكس</span>
                <DollarSign className="w-4 h-4 text-[#C59B27]" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                تحديد سعر مقطوع ومحدد لكل مقاس بوكس تدخله أنت بالأسفل بغض النظر عن الأصناف.
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 قسم سعات وأسعار البوكسات */}
        <div className="space-y-3 bg-[#FAF5ED] p-5 rounded-2xl border border-stone-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-stone-200/60 pb-2">
            <span className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
              <Box className="w-4 h-4 text-[#C59B27]" />
              <span>
                {pricingMode === "fixed"
                  ? "تحديد أسعار وسعات البوكسات الموحدة:"
                  : "تحديد سعة البوكسات (عدد القطع المسموحة):"}
              </span>
            </span>
            <span className="text-[10px] text-stone-500 font-bold">
              {pricingMode === "fixed"
                ? "⚠️ السعر المكتوب هنا هو السعر الثابت الذي سيدفعه العميل"
                : "ℹ️ السعر يُحسب آلياً بحسب أصناف العميل المختارة"}
            </span>
          </div>

          <div className="space-y-3">
            {tiers.map((t) => (
              <div
                key={t.id}
                className="bg-white p-3.5 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center font-black text-xs shrink-0">
                    <Layers className="w-4 h-4 text-[#C59B27]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-stone-800">{t.name_ar}</h4>
                    <span className="text-[10px] text-stone-400 font-medium">{t.name_en}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* حقل سعة البوكس */}
                  <div className="flex-1 sm:flex-initial">
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">سعة البوكس (عدد القطع):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={t.capacity}
                        onChange={(e) => handleTierChange(t.id, "capacity", parseInt(e.target.value) || 1)}
                        className="w-28 bg-[#FAF5ED] border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17]"
                      />
                      <span className="absolute left-2.5 top-1.5 text-[10px] text-stone-400 font-bold pointer-events-none">قطع</span>
                    </div>
                  </div>

                  {/* حقل تحديد السعر المباشر للبوكس - يظهر فقط عند اختيار السعر الثابت */}
                  {pricingMode === "fixed" && (
                    <div className="flex-1 sm:flex-initial animate-in fade-in duration-200">
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">سعر البوكس (ر.س):</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={t.price}
                          onChange={(e) => handleTierChange(t.id, "price", parseFloat(e.target.value) || 0)}
                          className="w-28 bg-[#FAF5ED] border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-[#4A0E17] focus:outline-hidden focus:border-[#4A0E17]"
                        />
                        <span className="absolute left-2.5 top-1.5 text-[10px] text-stone-400 font-bold pointer-events-none">ر.س</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* رسوم العلبة والتغليف الملكي */}
        <div>
          <label className="block text-xs font-black text-stone-700 mb-1">
            سعر علبة التغليف الفاخرة (ر.س):
          </label>
          <div className="relative max-w-xs">
            <input
              type="number"
              step="0.5"
              min="0"
              value={packagingFee}
              onChange={(e) => setPackagingFee(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#4A0E17] focus:outline-hidden focus:border-[#4A0E17]"
            />
            <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold pointer-events-none">ر.س</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 font-medium">
            * ضع القيمة (0) إذا كنت تريد تقديم العلبة الفاخرة والتغليف مجاناً كعرض ترويجي.
          </p>
        </div>

        {/* زر الحفظ */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> تم تحديث الإعدادات بنجاح!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-3 bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
            ) : (
              <Save className="w-4 h-4 text-[#C59B27]" />
            )}
            <span>{isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}</span>
          </button>
        </div>

      </form>
    </div>
  );
};