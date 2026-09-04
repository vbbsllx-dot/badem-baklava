"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Search, Gift, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { PromoCarousel } from "@/components/banner/PromoCarousel";
import { ProductCard } from "@/components/product/ProductCard";
import { IngredientModal } from "@/components/product/IngredientModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutSystem } from "@/components/checkout/CheckoutSystem";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { RewardsModal } from "@/components/rewards/RewardsModal";
import { NotificationModal } from "@/components/notifications/NotificationModal";
import { CustomBoxModal } from "@/components/box-builder/CustomBoxModal";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { Product } from "@/types";
import { supabase } from "@/lib/supabase/supabase";

interface CategoryItem {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  image_url: string;
}

export default function Home() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const { setIsRewardsOpen } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // حالات البيانات الحقيقية
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب المنتجات والتصنيفات من قاعدة البيانات
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [{ data: prodData, error: prodError }, { data: catData }] = await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        ]);

        if (isMounted) {
          if (prodData && !prodError) {
            const formatted: Product[] = prodData.map((d: any) => ({
              id: d.id,
              titleAr: d.title_ar,
              titleEn: d.title_en,
              category: d.category_slug,
              basePrice: parseFloat(d.base_price),
              originalPrice: d.original_price ? parseFloat(d.original_price) : undefined,
              hasDiscount: Boolean(d.has_discount),
              image: d.image_url,
              descriptionAr: d.description_ar,
              descriptionEn: d.description_en,
              ingredients: d.ingredients || [],
            }));
            setProductsData(formatted);
          }

          if (catData && catData.length > 0) {
            setCategories(catData);
          }
        }
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // فلترة المنتجات بالبحث والتصنيف باستخدام useMemo لسرعة المعالجة
  const filteredProducts = useMemo(() => {
    return productsData.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.titleAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.titleEn?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productsData, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4ECE1] text-[#2D2321] pb-28 md:pb-0 flex flex-col justify-between font-sans">
      {/* Header Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="w-full max-w-md md:max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-6 flex-1">
        {/* Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? "ابحث عن البقلاوة، أصابع الفستق، أو بوكسات الهدايا..."
                : "Search baklava, pistachio rolls, gift boxes..."
            }
            className="w-full bg-[#FAF5ED] border border-[#4A0E17]/15 rounded-2xl py-3 pr-11 pl-4 rtl:pr-11 rtl:pl-4 ltr:pl-11 ltr:pr-4 text-xs md:text-sm font-medium focus:outline-hidden focus:border-[#4A0E17] shadow-2xs placeholder:text-stone-400"
          />
          <Search className="w-4 h-4 md:w-5 md:h-5 text-stone-400 absolute top-1/2 -translate-y-1/2 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
        </div>

        {/* Promo Banner */}
        <PromoCarousel />

        {/* ✨ شريط الأقسام ثلاثي الأبعاد الفاخر */}
        {categories.length > 0 && (
          <section className="pt-1" id="categories-section">
            <div className="w-full bg-[#FAF5ED]/95 backdrop-blur-md rounded-2xl sm:rounded-[2rem] border border-[#EADBCE] shadow-[0_8px_25px_-8px_rgba(74,14,23,0.06)] p-3 sm:p-5">
              <div className="flex items-center justify-start sm:justify-center gap-5 sm:gap-8 md:gap-10 overflow-x-auto no-scrollbar px-1 py-1">
                {/* زر عرض الكل */}
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="group flex flex-col items-center justify-between min-w-[64px] sm:min-w-[80px] shrink-0 cursor-pointer transition-all select-none"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                    <div className="absolute bottom-1 w-3/4 h-2.5 bg-[#4A0E17]/15 rounded-full blur-[4px] pointer-events-none" />
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                        selectedCategory === "All"
                          ? "bg-[#4A0E17] text-[#E5C058] scale-110 shadow-lg"
                          : "bg-white text-stone-700 border border-stone-200 group-hover:scale-105"
                      }`}
                    >
                      <Sparkles className="w-6 h-6" />
                    </div>
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-serif transition-colors tracking-wide ${
                      selectedCategory === "All"
                        ? "text-[#4A0E17] font-black underline decoration-[#C59B27] decoration-2 underline-offset-4"
                        : "text-stone-600 font-bold group-hover:text-[#4A0E17]"
                    }`}
                  >
                    {isAr ? "الكل" : "All"}
                  </span>
                </button>

                {/* قائمة الأقسام المرفوعة مع مجسمات الـ 3D وصور فائقة السرعة */}
                {categories.map((cat, index) => {
                  const isSelected = selectedCategory === cat.slug;
                  const catTitle = isAr ? cat.name_ar : cat.name_en;

                  return (
                    <button
                      key={cat.id || cat.slug}
                      onClick={() => setSelectedCategory(isSelected ? "All" : cat.slug)}
                      className="group flex flex-col items-center justify-between min-w-[68px] sm:min-w-[85px] shrink-0 cursor-pointer transition-all select-none"
                    >
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          <Image
                            src={cat.image_url}
                            alt={catTitle}
                            fill
                            sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                            priority={index < 4}
                            quality={85}
                            className={`object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] transition-all duration-300 ${
                              isSelected
                                ? "scale-115 -translate-y-1.5 drop-shadow-[0_10px_15px_rgba(197,155,39,0.35)]"
                                : "group-hover:scale-105 group-hover:-translate-y-1"
                            }`}
                          />
                        </div>
                      </div>

                      <span
                        className={`mt-2 text-[11px] sm:text-xs font-serif transition-colors tracking-wide ${
                          isSelected
                            ? "text-[#4A0E17] font-black underline decoration-[#C59B27] decoration-2 underline-offset-4"
                            : "text-stone-600 font-bold group-hover:text-[#4A0E17]"
                        }`}
                      >
                        {catTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section className="space-y-3 pt-2" id="productsSection">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-xl text-[#2D2321] font-serif">
              {isAr ? "المختارات الأكثر طلباً" : "Popular Picks"}
            </h3>
            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="text-xs md:text-sm font-bold text-[#4A0E17] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{isAr ? "عرض الكل" : "View All"}</span>
                {dir === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#4A0E17]" />
              <p className="text-xs font-bold text-stone-600">
                {isAr ? "جاري تحميل قائمة الحلويات الملكية..." : "Loading royal menu..."}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 bg-white rounded-3xl border border-stone-200 text-center text-stone-400 space-y-2 p-6 shadow-2xs">
              <p className="font-bold text-sm text-stone-700">
                {isAr ? "لا توجد منتجات مضافة حالياً في هذا القسم." : "No items found in this section."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={(p) => setActiveProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Rewards Club Banner */}
        <section className="bg-[#FAF5ED] border border-[#4A0E17]/10 rounded-3xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 md:w-7 md:h-7 text-[#4A0E17]" />
            </div>
            <div>
              <h4 className="font-black text-xs md:text-base text-[#4A0E17] font-brand tracking-wider">
                BADEM ROYAL REWARDS
              </h4>
              <p className="text-[10px] md:text-xs text-stone-500 leading-tight mt-0.5">
                {isAr
                  ? "اكسب نقاطاً مع كل طلب واستبدلها بكوبونات خصم فورية."
                  : "Earn royal points with every order and redeem instant discounts."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRewardsOpen(true)}
            className="bg-[#4A0E17] hover:bg-[#36070E] text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer shrink-0"
          >
            {isAr ? "استعراض المكافآت" : "Explore Rewards"}
          </button>
        </section>
      </main>

      {/* Desktop Footer */}
      <Footer />

      {/* Mobile/Desktop Navigation Bar */}
      <BottomNav />

      {/* Modals & Triggers */}
      <IngredientModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutSystem isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      {/* Profile, Rewards, Notifications, and Custom Box Modals */}
      <ProfileModal />
      <RewardsModal />
      <NotificationModal />
      <CustomBoxModal />
    </div>
  );
}