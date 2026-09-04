"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag, PackagePlus, CheckCircle2, Loader2, Info } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase/supabase";
import { BoxTier } from "@/types/custom-box";

export const CustomBoxModal: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen } = useUser();
  const { addToCart, setIsCartOpen } = useCart();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const defaultTiers: BoxTier[] = [
    { id: "box_500g", name_ar: "بوكس ملكي (نصف كيلو)", name_en: "Royal Box (500g)", capacity: 4, price: 45 },
    { id: "box_1000g", name_ar: "بوكس ديوان (1 كيلو)", name_en: "Diwan Box (1kg)", capacity: 8, price: 85 },
    { id: "box_1500g", name_ar: "بوكس كبار الشخصيات (1.5 كيلو)", name_en: "VIP Luxury Box (1.5kg)", capacity: 12, price: 125 },
  ];

  const [tiers, setTiers] = useState<BoxTier[]>(defaultTiers);
  const [selectedTier, setSelectedTier] = useState<BoxTier>(defaultTiers[0]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [boxSelections, setBoxSelections] = useState<{ [id: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);

  // إعدادات البوكس القادمة من لوحة التحكم
  const [boxSettings, setBoxSettings] = useState<{
    pricing_mode: "dynamic" | "fixed";
    packaging_fee: number;
    is_enabled: boolean;
  }>({
    pricing_mode: "dynamic",
    packaging_fee: 0,
    is_enabled: true,
  });

  // جلب الإعدادات والمنتجات والأحجام عند فتح النافذة
  useEffect(() => {
    if (!isMenuOpen) return;

    let isMounted = true;

    const fetchBuilderData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: settingsData },
          { data: tiersData },
          { data: prodsData, error: prodsErr }
        ] = await Promise.all([
          supabase.from("box_builder_settings").select("*").eq("id", "default").maybeSingle(),
          supabase.from("custom_box_tiers").select("*").eq("is_active", true).order("price"),
          supabase.from("products").select("*")
        ]);

        if (isMounted) {
          if (settingsData) {
            setBoxSettings({
              pricing_mode: settingsData.pricing_mode || "dynamic",
              packaging_fee: Number(settingsData.packaging_fee) || 0,
              is_enabled: settingsData.is_enabled ?? true,
            });
          }

          if (tiersData && tiersData.length > 0) {
            setTiers(tiersData);
            setSelectedTier(tiersData[0]);
          }

          if (prodsErr) {
            console.error("خطأ في جلب المنتجات للبوكس:", prodsErr);
          } else if (prodsData && prodsData.length > 0) {
            setAvailableProducts(prodsData);
          }
        }
      } catch (err) {
        console.error("Failed to load box builder data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBuilderData();

    return () => {
      isMounted = false;
    };
  }, [isMenuOpen]);

  if (!isMenuOpen || !selectedTier) return null;

  // استخراج سعر القطعة الفعلي للصنف
  const getProductPrice = (prod: any): number => {
    return Number(prod?.base_price || prod?.price || 0);
  };

  // استخراج اسم الصنف
  const getProductName = (prod: any): string => {
    if (isAr) {
      return prod?.title_ar || prod?.name_ar || prod?.title || prod?.name || "صنف فاخر";
    }
    return prod?.title_en || prod?.name_en || prod?.title || prod?.name || prod?.title_ar || "Luxury Sweet";
  };

  // الحسابات الرياضية
  const currentCount = Object.values(boxSelections).reduce((sum, count) => sum + count, 0);
  const remainingSlots = selectedTier.capacity - currentCount;
  const isReady = currentCount === selectedTier.capacity;

  // حساب مجموع ثمن المنتجات المختارة فعلياً
  const itemsTotalPrice = Object.entries(boxSelections).reduce((sum, [id, qty]) => {
    const prod = availableProducts.find((p) => String(p.id) === String(id));
    return sum + getProductPrice(prod) * qty;
  }, 0);

  // السعر النهائي المعتمد (ديناميكي أو ثابت حسب خيار التاجر)
  const finalCalculatedPrice =
    boxSettings.pricing_mode === "dynamic"
      ? itemsTotalPrice + boxSettings.packaging_fee
      : Number(selectedTier.price);

  const handleAdd = (id: string) => {
    if (remainingSlots <= 0) return;
    setBoxSelections((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    if (!boxSelections[id]) return;
    setBoxSelections((prev) => {
      const updated = { ...prev };
      if (updated[id] === 1) delete updated[id];
      else updated[id] -= 1;
      return updated;
    });
  };

  const handleAddToCartSecure = () => {
    if (!isReady) return;

    const structuredItems = Object.entries(boxSelections).map(([productId, quantity]) => {
      const prod = availableProducts.find((p) => String(p.id) === String(productId));
      return {
        productId,
        productName: getProductName(prod),
        unitPrice: getProductPrice(prod),
        quantity,
      };
    });

    const summaryText = structuredItems
      .map((it) => `${it.quantity}× ${it.productName}`)
      .join(" + ");

    const customBoxPayload = {
      id: `box-${selectedTier.id}-${Date.now()}`,
      type: "custom_box",
      tierId: selectedTier.id,
      title: isAr ? selectedTier.name_ar : selectedTier.name_en,
      title_ar: selectedTier.name_ar,
      title_en: selectedTier.name_en,
      price: finalCalculatedPrice,
      quantity: 1,
      image_url: availableProducts[0]?.image_url || availableProducts[0]?.image || "/hero-baklava.png",
      portion: `تشكيلة: ${summaryText}`,
      portionNote: `بوكس مخصص (${selectedTier.capacity} قطع)${boxSettings.pricing_mode === "dynamic" && boxSettings.packaging_fee > 0 ? ` + تغليف ${boxSettings.packaging_fee} ر.س` : ""}`,
      items: structuredItems,
      summaryText,
    };

    addToCart(customBoxPayload as any);
    setIsMenuOpen(false);
    setIsCartOpen(true);
    setBoxSelections({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

      <div className="relative w-full max-w-xl bg-[#FAF5ED] rounded-t-3xl sm:rounded-3xl border border-[#4A0E17]/20 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        
        {/* الترويسة */}
        <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4A0E17] text-[#C59B27] flex items-center justify-center shadow-sm">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#4A0E17]">
                {isAr ? "صانع البوكسات الملكية المخصص" : "Royal Custom Box Studio"}
              </h2>
              <p className="text-[10px] text-stone-500 font-bold">
                {isAr ? "شكّل بوكسك وادفع قيمة ما تختاره فقط" : "Build your box and pay only for what you choose"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* محتوى الاختيار */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* اختيار حجم البوكس */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#4A0E17] block">
              1. {isAr ? "اختر سعة البوكس الملكي:" : "Select Box Size:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTier(t);
                    setBoxSelections({});
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedTier.id === t.id
                      ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-md"
                      : "bg-white border-stone-200/90 text-stone-800 hover:border-[#4A0E17]/30"
                  }`}
                >
                  <span className="text-[11px] font-black block leading-tight">{isAr ? t.name_ar : t.name_en}</span>
                  <span className={`text-[10px] font-bold block mt-1 ${selectedTier.id === t.id ? "text-[#C59B27]" : "text-[#4A0E17]"}`}>
                    {boxSettings.pricing_mode === "dynamic"
                      ? (isAr ? `سعة ${t.capacity} قطع` : `${t.capacity} pcs`)
                      : `${t.price} ر.س`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* شريط الامتلاء */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-stone-700">
                {isAr ? "اكتمال البوكس:" : "Box Progress:"} ({currentCount} / {selectedTier.capacity})
              </span>
              <span className={isReady ? "text-emerald-700 font-bold" : "text-[#4A0E17]"}>
                {isReady ? (isAr ? "مكتمل وجاهز ✨" : "Ready ✨") : (isAr ? `متبقي ${remainingSlots} قطع` : `${remainingSlots} items left`)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full bg-gradient-to-r from-[#C59B27] to-[#4A0E17] transition-all duration-300"
                style={{ width: `${(currentCount / selectedTier.capacity) * 100}%` }}
              />
            </div>
          </div>

          {/* قائمة الحلويات المتاحة مع أسعارها */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#4A0E17]">
                2. {isAr ? "حدد الأصناف وتشكيلتك المفضلة:" : "Select your sweets:"}
              </label>
              {boxSettings.pricing_mode === "dynamic" && (
                <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#C59B27]" />
                  {isAr ? "السعر يحسب بحسب الأصناف" : "Price calculates per item"}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#4A0E17]" />
                <span className="text-xs font-bold">{isAr ? "جاري تحميل الأصناف..." : "Loading sweets..."}</span>
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500 font-bold">
                {isAr ? "لا توجد أصناف مسجلة حالياً." : "No products found."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableProducts.map((prod) => {
                  const count = boxSelections[prod.id] || 0;
                  const name = getProductName(prod);
                  const price = getProductPrice(prod);
                  const img = prod.image_url || prod.image || "/hero-baklava.png";

                  return (
                    <div key={prod.id} className="p-2.5 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between gap-2 shadow-2xs hover:border-[#4A0E17]/20 transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* استخدام Image السريع بدلاً من img العادي */}
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-stone-100">
                          <Image
                            src={img}
                            alt={name}
                            fill
                            sizes="40px"
                            quality={75}
                            loading="lazy"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-800 truncate block">{name}</span>
                          {boxSettings.pricing_mode === "dynamic" && (
                            <span className="text-[10px] text-[#C59B27] font-black block">
                              {price.toFixed(2)} ر.س
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRemove(prod.id)}
                          disabled={count === 0}
                          className="w-7 h-7 rounded-lg bg-stone-100 disabled:opacity-30 flex items-center justify-center text-stone-700 cursor-pointer hover:bg-stone-200 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-4 text-center font-mono font-black text-xs text-[#4A0E17]">{count}</span>
                        <button
                          onClick={() => handleAdd(prod.id)}
                          disabled={remainingSlots === 0}
                          className="w-7 h-7 rounded-lg bg-[#4A0E17] disabled:opacity-30 text-white flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#380E14] transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ذيل النافذة: تفصيل السعر التراكمي وزر الإضافة */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400 font-bold">{isAr ? "الإجمالي المطلوب" : "Total"}</span>
              {boxSettings.pricing_mode === "dynamic" && (
                <span className="text-[9px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  {boxSettings.packaging_fee > 0 ? `+ ${boxSettings.packaging_fee} ر.س تغليف` : "التغليف مجاناً"}
                </span>
              )}
            </div>
            <span className="text-lg font-black text-[#4A0E17]">
              {finalCalculatedPrice.toFixed(2)} ر.س
            </span>
          </div>

          <button
            onClick={handleAddToCartSecure}
            disabled={!isReady}
            className="flex-1 py-3 px-5 rounded-2xl bg-[#4A0E17] hover:bg-[#36070E] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isReady ? <CheckCircle2 className="w-4 h-4 text-[#E5C058]" /> : <ShoppingBag className="w-4 h-4" />}
            <span>
              {isReady
                ? (isAr ? "إضافة البوكس للسلة 🛒" : "Add Box to Cart 🛒")
                : (isAr ? `أكمل ${remainingSlots} قطع إضافية` : `Add ${remainingSlots} more items`)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};