"use client";

import React, { useState, useEffect, useId, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Star,
  MessageSquare,
  CheckCircle,
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase/supabase";

export interface ExtendedProduct extends Product {
  images?: string[];
  image_urls?: string[];
  image_url?: string;
  is_available?: boolean; 
  is_out_of_stock?: boolean;
  isOutOfStock?: boolean;
  base_price?: number | string;
  price?: number | string;
  price_250g?: number | string;
  price_500g?: number | string;
  price_1kg?: number | string;
  title_ar?: string;
  title_en?: string;
  description_ar?: string | null;
  description_en?: string | null;
  [key: string]: unknown;
}

interface IngredientModalProps {
  product: ExtendedProduct | null;
  onClose: () => void;
}

interface ReviewItem {
  id: string;
  customer_name: string;
  customer_phone?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface IngredientObject {
  icon?: string;
  nameAr?: string;
  name_ar?: string;
  nameEn?: string;
  name_en?: string;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({ product, onClose }) => {
  const { language, t } = useLanguage();
  const isAr = language === "ar";
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const { userName, userPhone } = useUser();
  const reviewInputId = useId();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // الأسعار الحقيقية من قاعدة البيانات
  const basePrice250 = Number(product?.price_250g || product?.base_price || product?.price || 45);
  const basePrice500 = Number(product?.price_500g || basePrice250 * 2);
  const basePrice1Kg = Number(product?.price_1kg || basePrice250 * 4);

  const [currentPrice, setCurrentPrice] = useState(basePrice250);
  const [selectedWeightLabel, setSelectedWeightLabel] = useState(
    isAr ? "ربع كيلو (250g)" : "250g Quarter"
  );

  const [userRating, setUserRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const imagesList = useMemo<string[]>(() => {
    if (!product) return ["/hero-baklava.png"];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls.filter(Boolean);
    }
    const single = product.image || product.image_url;
    return single ? [single] : ["/hero-baklava.png"];
  }, [product]);

  const isSoldOut = Boolean(
    product?.is_available === false ||
    product?.isOutOfStock === true ||
    product?.is_out_of_stock === true
  );

  useEffect(() => {
    if (!product?.id) return;
    const resetTimer = setTimeout(() => {
      setCurrentImageIndex(0);
      setCurrentPrice(basePrice250);
      setSelectedWeightLabel(isAr ? "ربع كيلو (250g)" : "250g Quarter");
      setUserRating(5);
      setNewComment("");
      setReviewerName("");
    }, 0);

    return () => clearTimeout(resetTimer);
  }, [product?.id, isAr, basePrice250]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;

    const fetchProductReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false });

        if (isMounted && data && !error) {
          setReviewsList(data as ReviewItem[]);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    };

    const timer = setTimeout(() => {
      void fetchProductReviews();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [product?.id]);

  if (!product) return null;

  const productTitleAr = product.titleAr || product.title_ar || "صنف فاخر";
  const productTitleEn = product.titleEn || product.title_en || "Signature Item";
  const productDescAr = product.descriptionAr || product.description_ar;
  const productDescEn = product.descriptionEn || product.description_en;
  const productIngredients: IngredientObject[] = Array.isArray(product.ingredients)
    ? (product.ingredients as IngredientObject[])
    : [];

  const averageRating =
    reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
      : "5.0";

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const handleSelectPortion = (priceVal: number, labelAr: string, labelEn: string) => {
    setCurrentPrice(priceVal);
    setSelectedWeightLabel(isAr ? labelAr : labelEn);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isSoldOut) return;

    addToCart(
      {
        id: product.id,
        title: isAr ? productTitleAr : productTitleEn,
        price: currentPrice,
        image: imagesList[0] || "/hero-baklava.png",
        portionNote: selectedWeightLabel,
      },
      e
    );
    showToast(isAr ? "تمت إضافة الصنف إلى السلة بنجاح! ✨" : "Added to cart successfully!", "success");
    onClose();
    setIsCartOpen(true);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product?.id) return;

    const finalName = reviewerName.trim() || userName.trim();
    const finalPhone = userPhone?.trim() || "";

    if (!finalName || !finalPhone) {
      showToast(
        isAr
          ? "يرجى تسجيل اسمك ورقم هاتفك (من ملفك الشخصي) للمشاركة بالتقييم"
          : "Please update your profile name and phone first",
        "error"
      );
      return;
    }

    setSubmittingReview(true);
    try {
      const { data: existingReviews, error: countError } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", product.id)
        .eq("customer_phone", finalPhone);

      if (countError) throw countError;

      if (existingReviews && existingReviews.length >= 2) {
        showToast(
          isAr
            ? "عذراً، لقد وصلت الحد الأقصى المسموح (تعليقين اثنين) لهذا المنتج."
            : "Sorry, you have reached the maximum limit of 2 reviews for this product.",
          "error"
        );
        setSubmittingReview(false);
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: product.id,
            customer_name: finalName,
            customer_phone: finalPhone,
            rating: userRating,
            comment: newComment.trim(),
          },
        ])
        .select()
        .single();

      if (data && !error) {
        setReviewsList((prev) => [data as ReviewItem, ...prev]);
        setNewComment("");
        setReviewerName("");
        showToast(
          isAr ? "شكراً لتقييمك! تم حفظ ونشر رأيك بنجاح 🌟" : "Thank you! Review posted successfully 🌟",
          "success"
        );
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast(isAr ? "تعذر إرسال التقييم، يرجى المحاولة لاحقاً" : "Failed to post review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? productTitleAr : productTitleEn}
    >
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-label="Close modal overlay" />

      <div className="bg-[#FAF5ED] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[92vh] flex flex-col relative z-10 text-[#2D2321] animate-in zoom-in-95 duration-200">
        
        {/* الترويسة الملكية */}
        <div className="relative bg-[#4A0E17] text-white text-center pt-6 pb-4 px-4 border-b border-[#C59B27]/30 shadow-xs">
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto z-20 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5 font-bold" />
          </button>

          <span className="block text-[9.5px] tracking-[0.25em] text-[#E5C058] font-black uppercase font-brand">
            BADEM SIGNATURE RECIPE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-xs">
            {isAr ? productTitleAr : productTitleEn}
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.2em] font-brand font-bold text-stone-300 uppercase mt-0.5">
            {productTitleEn}
          </p>
        </div>

        {/* المحتوى الداخلي */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 flex-1 overscroll-contain">
          
          {/* 1. المكونات */}
          {productIngredients.length > 0 && (
            <section className="space-y-2" aria-label="Ingredients">
              <div className="text-center text-xs text-[#4A0E17] font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span>{isAr ? "تفكيك المكونات الطبيعية 100%" : "100% Pure Natural Ingredients"}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {productIngredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-1">{ing.icon || "✨"}</span>
                    <span className="text-[10px] font-bold text-stone-700 leading-tight">
                      {isAr ? ing.nameAr || ing.name_ar : ing.nameEn || ing.name_en}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. بطاقة الصورة */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-2xs border border-stone-200/90 flex flex-col items-center">
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 bg-[#F7F2EB] group">
              <Image
                src={imagesList[currentImageIndex] || "/hero-baklava.png"}
                alt={isAr ? productTitleAr : productTitleEn}
                fill
                priority
                quality={90}
                sizes="(max-width: 640px) 100vw, 550px"
                className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                  isSoldOut ? "grayscale-35 opacity-90" : ""
                }`}
              />

              {isSoldOut && (
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] z-10 flex items-center justify-center p-4">
                  <div className="bg-[#4A0E17]/95 border border-[#C59B27]/60 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-center">
                    <Clock className="w-4 h-4 text-[#E5C058] shrink-0 animate-pulse" />
                    <div>
                      <span className="text-xs sm:text-sm font-black text-amber-200 block">
                        {isAr ? "نفدت الكمية مؤقتاً" : "Temporarily Sold Out"}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-stone-200 font-medium">
                        {isAr ? "نخبز دفعة طازجة قادمة قريباً من الفرن ✨" : "A fresh batch is baking soon"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {imagesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous Image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next Image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>

            {(productDescAr || productDescEn) && (
              <p className="text-xs text-stone-600 text-center mt-3 leading-relaxed px-2 font-medium">
                {isAr ? productDescAr : productDescEn}
              </p>
            )}
          </div>

          {/* 3. خيارات الوزن المباشرة من لوحة التحكم */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-[#4A0E17]">
              {isAr ? "اختر الوزن والتغليف الملكي:" : "Select Portion & Packaging:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPortion(basePrice250, "ربع كيلو (250g)", "250g Quarter")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  currentPrice === basePrice250
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{isAr ? "ربع كيلو (250g)" : "250g"}</span>
                <span className="text-[11px] font-black text-[#C59B27] block mt-1">{basePrice250} ر.س</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(basePrice500, "نصف كيلو (500g)", "500g Half")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  currentPrice === basePrice500
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{isAr ? "نصف كيلو (500g)" : "500g"}</span>
                <span className="text-[11px] font-black text-[#C59B27] block mt-1">{basePrice500} ر.س</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(basePrice1Kg, "1 كجم فاخر (1000g)", "1 Kg Royal Box")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  currentPrice === basePrice1Kg
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{isAr ? "1 كجم (1000g)" : "1 Kg"}</span>
                <span className="text-[11px] font-black text-[#C59B27] block mt-1">{basePrice1Kg} ر.س</span>
              </button>
            </div>
          </div>

          {/* 4. تقييمات العملاء */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200/90 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#C59B27]" />
                </div>
                <h4 className="text-xs font-black text-stone-900">
                  {isAr ? "تقييمات وتجارب العملاء الملكية" : "Royal Customer Reviews"}
                </h4>
              </div>
              <span className="text-xs font-black text-[#4A0E17] font-mono">{averageRating} / 5.0</span>
            </div>

            {loadingReviews ? (
              <div className="py-6 text-center text-xs text-stone-400">جاري التحميل...</div>
            ) : reviewsList.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-500">كن أول من يقيم هذا الصنف الملكي!</div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="bg-[#FAF5ED]/60 p-3 rounded-2xl border border-stone-200/80 space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{rev.customer_name}</span>
                      <span className="text-[10px] text-stone-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-stone-700">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddReview} className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex gap-2">
                <input
                  id={reviewInputId}
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isAr ? "اكتب انطباعك وتجربتك بالتذوق..." : "Write your tasting review..."}
                  className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-medium"
                />
                <button
                  type="submit"
                  disabled={submittingReview || !newComment.trim()}
                  className="bg-[#4A0E17] text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#C59B27]" />
                  <span>{isAr ? "نشر" : "Post"}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{isAr ? "تنبيه مسببات الحساسية: يحتوي على فستق ومكسرات ومشتقات القمح." : "Allergen Warning."}</span>
          </div>

        </div>

        {/* شريط السعر النهائي */}
        <div className="p-4 bg-[#4A0E17] text-white border-t border-[#C59B27]/30 flex items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="block text-[10px] text-stone-300 font-bold uppercase tracking-wider">{t("total")}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{currentPrice.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#E5C058]">{t("currency")}</span>
            </div>
          </div>

          {isSoldOut ? (
            <div className="flex-1 bg-stone-800 text-amber-200 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{isAr ? "نفدت الكمية الملكية" : "Sold Out"}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-[#C59B27] hover:bg-[#E5C058] active:scale-95 text-[#4A0E17] font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 font-bold" />
              <span>{t("addToCart")}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
