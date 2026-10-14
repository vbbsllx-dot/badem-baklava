"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  PackagePlus,
  CheckCircle2,
  Loader2,
  Info,
  RotateCcw,
  Search,
  Sparkles,
  PackageX,
  Layers,
  Scale
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase/supabase";
import { BoxTier } from "@/types/custom-box";

interface ProductItem {
  id: string | number;
  title_ar?: string;
  title_en?: string;
  title?: string;
  name?: string;
  name_ar?: string; 
  name_en?: string; 
  base_price?: number;
  price?: number;
  piece_price?: number;
  image_url?: string;
  image?: string;
  category?: string;
  category_ar?: string;
  category_id?: string | number;
  is_available?: boolean;
  in_stock?: boolean;
  is_active?: boolean;
  stock_status?: string;
  stock?: number;
  stock_quantity?: number;
  [key: string]: unknown;
}

interface BoxSettings {
  pricing_mode: "dynamic" | "fixed";
  packaging_fee: number;
  is_enabled: boolean;
  allowed_categories: string[];
}

// 🛡️ فحص ذكي وشامل لحالة التوفر لاستبعاد المنتجات النافذة
const isProductInStock = (prod: ProductItem): boolean => {
  if (prod.is_available === false || prod.is_available === "false" || prod.is_available === 0) return false;
  if (prod.in_stock === false || prod.in_stock === "false" || prod.in_stock === 0) return false;
  if (prod.is_active === false || prod.is_active === "false" || prod.is_active === 0) return false;
  if (prod.stock_status === "out_of_stock" || prod.status === "out_of_stock") return false;
  if (prod.out_of_stock === true) return false;
  if (typeof prod.stock === "number" && prod.stock <= 0) return false;
  if (typeof prod.stock_quantity === "number" && prod.stock_quantity <= 0) return false;
  return true;
};

// 🎯 استخراج الحد الأدنى والأعلى لعدد القطع من ملاحظة المقاس (مثال: "6 - 8 قطعة")
const parseCapacityRange = (tier: BoxTier | null): { min: number; max: number } => {
  if (!tier) return { min: 0, max: 0 };
  const defaultCap = Number(tier.capacity) || 1;
  const sub = String(tier.subtitle_ar || "");

  const matches = sub.match(/(\d+)\s*[-–—إلى]+\s*(\d+)/);
  if (matches && matches.length >= 3) {
    const first = parseInt(matches[1], 10);
    const second = parseInt(matches[2], 10);
    const minVal = Math.min(first, second);
    const maxVal = Math.max(first, second);
    if (minVal > 0 && maxVal >= minVal) {
      return { min: minVal, max: Number(tier.capacity) || maxVal };
    }
  }

  return { min: defaultCap, max: defaultCap };
};

export const CustomBoxModal: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen } = useUser();
  const { addToCart, setIsCartOpen } = useCart();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [tiers, setTiers] = useState<BoxTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<BoxTier | null>(null);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [boxSelections, setBoxSelections] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [boxSettings, setBoxSettings] = useState<BoxSettings>({
    pricing_mode: "dynamic",
    packaging_fee: 0,
    is_enabled: true,
    allowed_categories: [],
  });

  useEffect(() => {
    if (!isMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, setIsMenuOpen]);

  // 🎯 استدعاء وفلترة الأقسام والمنتجات بحماية هندسية صارمة
  useEffect(() => {
    if (!isMenuOpen) return;

    let isMounted = true;

    const fetchBuilderData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: settingsData },
          { data: tiersData },
          { data: prodsData, error: prodsErr },
          { data: catsData }
        ] = await Promise.all([
          supabase.from("box_builder_settings").select("*").eq("id", "default").maybeSingle(),
          supabase.from("custom_box_tiers").select("*").eq("is_active", true).order("capacity", { ascending: true }),
          supabase.from("products").select("*"),
          supabase.from("categories").select("*"),
        ]);

        if (isMounted) {
          const allowedCats: string[] = Array.isArray(settingsData?.allowed_categories)
            ? settingsData.allowed_categories
            : [];

          if (settingsData) {
            setBoxSettings({
              pricing_mode: settingsData.pricing_mode || "dynamic",
              packaging_fee: Number(settingsData.packaging_fee) || 0,
              is_enabled: settingsData.is_enabled ?? true,
              allowed_categories: allowedCats,
            });
          }

          const activeTiers = tiersData || [];
          setTiers(activeTiers);
          setSelectedTier(activeTiers.length > 0 ? activeTiers[0] : null);

          if (prodsErr) {
            console.error("Error loading products:", prodsErr);
          } else if (prodsData && prodsData.length > 0) {
            
            // 1. استبعاد الأصناف النافذة أولاً
            const inStockProds = (prodsData as ProductItem[]).filter(isProductInStock);

            // 2. الفلترة الهندسية للأقسام المعتمدة
            if (allowedCats.length > 0 && catsData && Array.isArray(catsData)) {
              const allowedKeys = new Set<string>();
              const disallowedKeys = new Set<string>();

              catsData.forEach((c: { 
                id?: string | number; 
                name_ar?: string; 
                title_ar?: string; 
                name?: string; 
                title?: string;
                slug?: string;
              }) => {
                const cNameAr = String(c.name_ar || c.title_ar || c.name || c.title || "").trim();
                const cSlug = String(c.slug || "").trim();
                const cId = String(c.id || "").trim();

                const isAllowed = 
                  allowedCats.includes(cNameAr) || 
                  allowedCats.includes(cSlug) || 
                  allowedCats.includes(cId) ||
                  allowedCats.some((a) => a.includes(cNameAr) || cNameAr.includes(a));

                const targetSet = isAllowed ? allowedKeys : disallowedKeys;

                if (cId) targetSet.add(cId.toLowerCase());
                if (cSlug) targetSet.add(cSlug.toLowerCase());
                if (cNameAr) {
                  targetSet.add(cNameAr.toLowerCase());
                  targetSet.add(cNameAr.replace(/^(قسم|section)\s+/gi, "").trim().toLowerCase());
                }
              });

              const strictlyFiltered = inStockProds.filter((p) => {
                const pCatId = String(p.category_id || p.categoryId || p.cat_id || "").trim().toLowerCase();
                const pCatName = String(p.category_ar || p.category || p.category_name || "").trim().toLowerCase();
                const pCleanName = pCatName.replace(/^(قسم|section)\s+/gi, "").trim();

                const isExplicitlyDisallowed = 
                  (pCatId && disallowedKeys.has(pCatId)) ||
                  (pCatName && disallowedKeys.has(pCatName)) ||
                  (pCleanName && disallowedKeys.has(pCleanName));

                if (isExplicitlyDisallowed) return false;

                const isExplicitlyAllowed = 
                  (pCatId && allowedKeys.has(pCatId)) ||
                  (pCatName && allowedKeys.has(pCatName)) ||
                  (pCleanName && allowedKeys.has(pCleanName));

                if (isExplicitlyAllowed) return true;

                const pTitle = String(p.title_ar || p.name_ar || p.title || "").trim();
                const isDrinkItem = /شاي|قهوة|قهوه|ماء|مشروب|بيبسي|عصير/i.test(pTitle);
                if (isDrinkItem && disallowedKeys.size > 0) return false;

                return true;
              });

              setAvailableProducts(strictlyFiltered);
            } else {
              setAvailableProducts(inStockProds);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load box builder data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchBuilderData();

    return () => {
      isMounted = false;
    };
  }, [isMenuOpen]);

  // ⚖️ حساب سعر القطعة الواحدة بدقة عالية في حال تفعيل الوضع الديناميكي
  const getProductPrice = useCallback(
    (prod?: ProductItem): number => {
      if (!prod) return 0;

      if (Number(prod.piece_price) > 0) {
        return Number(prod.piece_price);
      }

      // السعر الأساسي في المتجر يمثل سعر الربع كيلو (250g)
      const quarterKiloPrice = Number(prod.base_price || prod.price || 0);

      // إيجاد سعة بوكس الربع كيلو لمعرفة عدد الحبات في الربع كيلو
      const quarterTier = tiers.find((t) => t.id === "box_250g" || t.name_ar?.includes("ربع"));
      const piecesPerQuarter = Number(quarterTier?.capacity) || 8;

      if (selectedTier && (selectedTier.id === "box_500g" || selectedTier.name_ar?.includes("نصف"))) {
        const halfKiloPrice = quarterKiloPrice * 2;
        return halfKiloPrice / (Number(selectedTier.capacity) || 15);
      }

      if (selectedTier && (selectedTier.id === "box_1000g" || selectedTier.name_ar?.includes("كيلو"))) {
        const oneKiloPrice = quarterKiloPrice * 4;
        return oneKiloPrice / (Number(selectedTier.capacity) || 30);
      }

      return quarterKiloPrice / piecesPerQuarter;
    },
    [tiers, selectedTier]
  );

  const getProductName = useCallback(
    (prod?: ProductItem): string => {
      if (isAr) {
        return prod?.title_ar || prod?.name_ar || prod?.title || prod?.name || "صنف فاخر";
      }
      return prod?.title_en || prod?.name_en || prod?.title || prod?.name || prod?.title_ar || "Luxury Sweet";
    },
    [isAr]
  );

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    availableProducts.forEach((p) => {
      const cat = isAr ? (p.category_ar || p.category) : (p.category || p.category_ar);
      if (cat && cat.trim()) cats.add(cat.trim());
    });
    return Array.from(cats);
  }, [availableProducts, isAr]);

  const currentCount = useMemo(() => {
    return Object.values(boxSelections).reduce((sum, count) => sum + count, 0);
  }, [boxSelections]);

  // ⚖️ حساب المدى المرن للقطع (مثلاً من 6 إلى 8 قطع) حسب حجم الصنف في الميزان
  const { min: minCapacity, max: maxCapacity } = useMemo(
    () => parseCapacityRange(selectedTier),
    [selectedTier]
  );

  const remainingToMin = Math.max(0, minCapacity - currentCount);
  const remainingSlots = Math.max(0, maxCapacity - currentCount);
  const isReady = maxCapacity > 0 && currentCount >= minCapacity && currentCount <= maxCapacity;

  const itemsTotalPrice = useMemo(() => {
    return Object.entries(boxSelections).reduce((sum, [id, qty]) => {
      const prod = availableProducts.find((p) => String(p.id) === String(id));
      return sum + getProductPrice(prod) * qty;
    }, 0);
  }, [boxSelections, availableProducts, getProductPrice]);

  const finalCalculatedPrice = useMemo(() => {
    if (!selectedTier) return 0;
    if (boxSettings.pricing_mode === "dynamic") {
      return itemsTotalPrice + boxSettings.packaging_fee;
    }
    return Number(selectedTier.price);
  }, [boxSettings, itemsTotalPrice, selectedTier]);

  const filteredProducts = useMemo(() => {
    let list = availableProducts;

    if (selectedCategory !== "all") {
      list = list.filter((prod) => {
        const cat = isAr ? (prod.category_ar || prod.category) : (prod.category || prod.category_ar);
        return cat === selectedCategory;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((prod) => {
        const name = getProductName(prod).toLowerCase();
        return name.includes(query);
      });
    }

    return list;
  }, [availableProducts, selectedCategory, searchQuery, getProductName, isAr]);

  const handleAdd = (id: string | number) => {
    const strId = String(id);
    if (remainingSlots <= 0) return;
    setBoxSelections((prev) => ({ ...prev, [strId]: (prev[strId] || 0) + 1 }));
  };

  const handleRemove = (id: string | number) => {
    const strId = String(id);
    if (!boxSelections[strId]) return;
    setBoxSelections((prev) => {
      const updated = { ...prev };
      if (updated[strId] === 1) delete updated[strId];
      else updated[strId] -= 1;
      return updated;
    });
  };

  const handleResetSelections = () => {
    setBoxSelections({});
  };

  const handleAddToCartSecure = () => {
    if (!isReady || !selectedTier) return;

    const structuredItems = Object.entries(boxSelections).map(([productId, quantity]) => {
      const prod = availableProducts.find((p) => String(p.id) === String(productId));
      return {
        productId,
        productName: getProductName(prod),
        unitPrice: getProductPrice(prod),
        quantity,
      };
    });

    const summaryText = structuredItems.map((it) => `${it.quantity}× ${it.productName}`).join(" + ");
    const rangeLabel = selectedTier.subtitle_ar || `${selectedTier.capacity} قطع`;

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
      portion: `تشكيلة بالميزان (${rangeLabel}): ${summaryText}`,
      portionNote: `بوكس مخصص حسب الوزن (${rangeLabel})${
        boxSettings.pricing_mode === "dynamic" && boxSettings.packaging_fee > 0
          ? ` + تغليف ${boxSettings.packaging_fee} ر.س`
          : ""
      }`,
      items: structuredItems,
      summaryText,
    };

    addToCart(customBoxPayload as unknown as Parameters<typeof addToCart>[0]);
    setIsMenuOpen(false);
    setIsCartOpen(true);
    setBoxSelections({});
  };

  if (!isMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

      <div className="relative w-full max-w-2xl bg-[#FAF5ED] rounded-t-3xl sm:rounded-3xl border border-[#4A0E17]/20 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        
        {/* الترويسة الفاخرة */}
        <div className="p-4 sm:p-5 border-b border-[#C59B27]/30 bg-[#4A0E17] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#E5C058] flex items-center justify-center shadow-inner">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide">
                  {isAr ? "صانع البوكسات المخصص" : "Royal Custom Box Studio"}
                </h2>
                <span className="text-[10px] bg-[#E5C058]/20 text-[#E5C058] border border-[#E5C058]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>طازج يومياً</span>
                </span>
              </div>
              <p className="text-[10.5px] text-stone-300 font-medium">
                {isAr
                  ? "اختر تشكيلتك الفاخرة حسب ذوقك ويتم ضبطها بالميزان الصافي"
                  : "Curate your exclusive selection weighed to perfection"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم النافذة الرئيسي */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#4A0E17]" />
            <span className="text-xs font-bold text-stone-600">
              {isAr ? "جاري تحميل تفاصيل البوكسات والأصناف المتوفرة..." : "Loading available box items..."}
            </span>
          </div>
        ) : tiers.length === 0 || !boxSettings.is_enabled || !selectedTier ? (
          <div className="p-12 sm:p-16 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center mx-auto border border-[#C59B27]/30 shadow-inner">
              <PackageX className="w-8 h-8 text-[#C59B27]" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-sm sm:text-base font-black text-stone-900">
                {isAr ? "خدمة البوكسات المخصصة متوقفة مؤقتاً" : "Custom Box Service Currently Unavailable"}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-medium">
                {isAr 
                  ? "نقوم حالياً بتجهيز وإعداد بوكسات ضيافة جديدة. يرجى تصفح بقية الأصناف المتوفرة بالمتجر." 
                  : "We are currently preparing fresh packaging collections. Please browse our signature catalogue."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="px-6 py-2.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold hover:bg-[#34050D] transition cursor-pointer shadow-md"
            >
              {isAr ? "العودة لقائمة الأصناف" : "Back to Menu"}
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4">
              
              {/* 1. اختيار الحجم والوزن */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                    <span>1.</span>
                    <span>{isAr ? "اختر وزن وحجم البوكس:" : "Select Box Weight & Size:"}</span>
                  </label>
                  {currentCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetSelections}
                      className="text-[11px] font-bold text-stone-500 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isAr ? "تفريغ البوكس" : "Reset"}</span>
                    </button>
                  )}
                </div>

                <div className={`grid gap-2 sm:gap-2.5 ${
                  tiers.length === 1 ? "grid-cols-1" : tiers.length === 2 ? "grid-cols-2" : "grid-cols-3"
                }`}>
                  {tiers.map((t) => {
                    const isSelected = selectedTier.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (selectedTier.id !== t.id) {
                            setSelectedTier(t);
                            setBoxSelections({});
                          }
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-md scale-[1.02]"
                            : "bg-white border-stone-200/90 text-stone-800 hover:border-[#4A0E17]/40"
                        }`}
                      >
                        <span className="text-[11px] sm:text-xs font-black block leading-tight">
                          {isAr ? t.name_ar : t.name_en}
                        </span>

                        {t.subtitle_ar && (
                          <span className={`text-[10px] font-bold block mt-0.5 ${
                            isSelected ? "text-[#E5C058]" : "text-stone-500"
                          }`}>
                            {t.subtitle_ar} (حسب حجم الصنف)
                          </span>
                        )}

                        <span
                          className={`text-[10px] sm:text-[11px] font-black block mt-1 ${
                            isSelected ? "text-white" : "text-[#4A0E17]"
                          }`}
                        >
                          {boxSettings.pricing_mode === "fixed"
                            ? `${t.price} ر.س`
                            : isAr
                            ? `حتى ${t.capacity} قطع`
                            : `Up to ${t.capacity} pcs`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ⚖️ تنبيه معيار الميزان والوزن الصافي لتوضيح اختلاف عدد القطع للزبون */}
              <div className="bg-[#C59B27]/10 border border-[#C59B27]/35 rounded-2xl p-3 flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-[#4A0E17] shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-stone-700 font-bold leading-relaxed">
                  {isAr ? (
                    <>
                      <strong className="text-[#4A0E17]">معيار التعبئة بالميزان: </strong>
                      يتم تجهيز البوكس حسب <span className="underline">الوزن الصافي المعتمد</span>؛ لذلك يتراوح عدد القطع ({selectedTier.subtitle_ar || `${minCapacity} - ${maxCapacity} قطع`}) بالزيادة أو النقصان حسب حجم ووزن الأصناف التي تختارها.
                    </>
                  ) : (
                    "Boxes are packed by net weight on the scale; piece count varies slightly based on the size and weight of selected items."
                  )}
                </p>
              </div>

              {/* 2. مؤشر الامتلاء التفاعلي */}
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-stone-800 flex items-center gap-1.5">
                    <span>{isAr ? "تشكيلة البوكس:" : "Box Selection:"}</span>
                    <span className="font-mono text-[#4A0E17] bg-[#FAF5ED] px-2 py-0.5 rounded-md border border-stone-200/60">
                      {currentCount} من {minCapacity !== maxCapacity ? `${minCapacity}-${maxCapacity}` : maxCapacity} قطع
                    </span>
                  </span>

                  <span
                    className={`text-[11px] font-black ${
                      isReady ? "text-emerald-700 flex items-center gap-1" : "text-[#4A0E17]"
                    }`}
                  >
                    {isReady ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {currentCount < maxCapacity
                            ? isAr
                              ? `جاهز للإضافة (أو أضف ${remainingSlots}) ✨`
                              : "Ready to add ✨"
                            : isAr
                            ? "البوكس مكتمل ✨"
                            : "Box Complete ✨"}
                        </span>
                      </>
                    ) : isAr ? (
                      `اختر ${remainingToMin} قطع على الأقل`
                    ) : (
                      `Select at least ${remainingToMin} more`
                    )}
                  </span>
                </div>

                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${maxCapacity}, minmax(0, 1fr))` }}>
                  {Array.from({ length: maxCapacity }).map((_, index) => {
                    const isFilled = index < currentCount;
                    const isOptionalRange = index >= minCapacity;
                    return (
                      <div
                        key={index}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isFilled
                            ? "bg-linear-to-r from-[#C59B27] to-[#4A0E17] shadow-xs"
                            : isOptionalRange
                            ? "bg-amber-200/60 border border-amber-300/60"
                            : "bg-stone-200/80"
                        }`}
                      />
                    );
                  })}
                </div>

                {currentCount > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
                    <span className="text-[10px] text-stone-400 font-bold ml-1">
                      {isAr ? "المختار:" : "Selected:"}
                    </span>

                    {Object.entries(boxSelections).map(([id, qty]) => {
                      const prod = availableProducts.find((p) => String(p.id) === String(id));
                      const name = getProductName(prod);
                      return (
                        <div
                          key={id}
                          className="inline-flex items-center gap-1.5 bg-[#FAF5ED] border border-[#4A0E17]/15 text-[#4A0E17] text-[10.5px] font-bold px-2.5 py-1 rounded-xl shadow-2xs animate-in zoom-in-95 duration-150"
                        >
                          <span className="font-mono font-black text-amber-800">{qty}×</span>
                          <span className="truncate max-w-30">{name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemove(id)}
                            className="text-stone-400 hover:text-rose-600 transition cursor-pointer pr-0.5"
                            title={isAr ? "حذف حبة" : "Remove one"}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. تحديد الأصناف والتشكيلة */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                    <span>2.</span>
                    <span>{isAr ? "حدد أصنافك وتشكيلتك المفضلة:" : "Select your sweets:"}</span>
                  </label>

                  <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1 bg-[#FAF5ED] px-2 py-1 rounded-lg border border-stone-200/60 w-fit">
                    <Info className="w-3 h-3 text-[#C59B27]" />
                    <span>
                      {boxSettings.pricing_mode === "fixed"
                        ? isAr
                          ? `سعر البوكس ثابت (${selectedTier.price} ر.س)`
                          : `Fixed box price (${selectedTier.price} SAR)`
                        : isAr
                        ? "يحسب السعر حسب الأصناف المختارة"
                        : "Price calculates per selected item"}
                    </span>
                  </span>
                </div>

                {/* شريط تبويبات الأقسام السريع */}
                {availableCategories.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                        selectedCategory === "all"
                          ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-xs"
                          : "bg-white text-stone-600 border-stone-200 hover:border-[#4A0E17]/40"
                      }`}
                    >
                      {isAr ? "جميع الأصناف" : "All Items"}
                    </button>
                    {availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                          selectedCategory === cat
                            ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-xs"
                            : "bg-white text-stone-600 border-stone-200 hover:border-[#4A0E17]/40"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* حقل البحث السريع */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? "ابحث عن نوع معين (برمة، شوكولاتة، أصابع...)" : "Search sweets..."}
                    className="w-full bg-white border border-stone-200 rounded-xl pr-8 pl-3 rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3 py-2 text-xs font-bold text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-[#4A0E17] transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 rtl:left-2.5 rtl:right-auto ltr:right-2.5 ltr:left-auto text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-400 font-bold space-y-1">
                    <Layers className="w-8 h-8 text-stone-300 mx-auto mb-1 stroke-1" />
                    <p>{isAr ? "لا توجد أصناف متوفرة مطابقة حالياً." : "No matching items currently available."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[34vh] overflow-y-auto no-scrollbar pr-0.5">
                    {filteredProducts.map((prod) => {
                      const count = boxSelections[String(prod.id)] || 0;
                      const name = getProductName(prod);
                      const piecePrice = getProductPrice(prod);
                      const img = prod.image_url || prod.image || "/hero-baklava.png";

                      return (
                        <div
                          key={prod.id}
                          className={`p-2.5 bg-white rounded-2xl border flex items-center justify-between gap-2 shadow-2xs transition-all ${
                            count > 0 ? "border-[#4A0E17]/40 bg-[#FAF5ED]/30" : "border-stone-200/80 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-stone-100">
                              <Image
                                src={img}
                                alt={name}
                                fill
                                sizes="44px"
                                quality={80}
                                loading="lazy"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-stone-900 truncate block">{name}</span>
                              {boxSettings.pricing_mode === "dynamic" ? (
                                <span className="text-[10px] text-[#C59B27] font-black block">
                                  ~{piecePrice.toFixed(2)} ر.س / للقطعة
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-medium block">
                                  {isAr ? "ضمن وزن البوكس" : "Included in box weight"}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemove(prod.id)}
                              disabled={count === 0}
                              className="w-7 h-7 rounded-lg bg-stone-100 disabled:opacity-25 flex items-center justify-center text-stone-700 cursor-pointer hover:bg-stone-200 active:scale-95 transition"
                              aria-label="Decrease"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-4 text-center font-mono font-black text-xs text-[#4A0E17]">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdd(prod.id)}
                              disabled={remainingSlots === 0}
                              className="w-7 h-7 rounded-lg bg-[#4A0E17] disabled:opacity-25 text-white flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#34050D] active:scale-95 transition"
                              aria-label="Increase"
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

            {/* شريط السعر والإضافة للسلة */}
            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-4 shadow-md">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 font-bold">{isAr ? "المبلغ الإجمالي" : "Total Price"}</span>
                  <span className="text-[9px] text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    {boxSettings.pricing_mode === "dynamic" && boxSettings.packaging_fee > 0
                      ? `+ ${boxSettings.packaging_fee} ر.س تغليف`
                      : isAr
                      ? "شامل التغليف الفاخر"
                      : "Free packaging"}
                  </span>
                </div>
                <span className="text-lg font-black text-[#4A0E17]">
                  {finalCalculatedPrice.toFixed(2)} ر.س
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddToCartSecure}
                disabled={!isReady}
                className={`flex-1 py-3.5 px-5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  isReady
                    ? "bg-[#4A0E17] hover:bg-[#34050D] text-white active:scale-98 shadow-[#4A0E17]/20"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                }`}
              >
                {isReady ? <CheckCircle2 className="w-4 h-4 text-[#E5C058]" /> : <ShoppingBag className="w-4 h-4" />}
                <span>
                  {isReady
                    ? isAr
                      ? "إضافة البوكس المخصص للسلة 🛒"
                      : "Add Custom Box to Cart 🛒"
                    : isAr
                    ? `اختر ${remainingToMin} قطع إضافية للوصول للوزن`
                    : `Select ${remainingToMin} more pieces`}
                </span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
