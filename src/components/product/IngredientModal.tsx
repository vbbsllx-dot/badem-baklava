"use client";

import React, { useState, useEffect, useId } from "react";
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
} from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase/supabase";

interface IngredientModalProps {
  product: Product | any | null;
  onClose: () => void;
}

interface ReviewItem {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({ product, onClose }) => {
  const { language, t } = useLanguage();
  const isAr = language === "ar";
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const { userName } = useUser();
  const reviewInputId = useId();

  const [multiplier, setMultiplier] = useState(1);
  const [selectedWeightLabel, setSelectedWeightLabel] = useState(
    isAr ? "ربع كيلو (250g)" : "250g Quarter"
  );
  const [userRating, setUserRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // إعادة ضبط خيارات الوزن عند فتح صنف جديد
  useEffect(() => {
    if (product?.id) {
      setMultiplier(1);
      setSelectedWeightLabel(isAr ? "ربع كيلو (250g)" : "250g Quarter");
      setUserRating(5);
      setNewComment("");
      setReviewerName("");
    }
  }, [product?.id, isAr]);

  // إغلاق النافذة بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // جلب تقييمات المنتج من Supabase
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
          setReviewsList(data);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    };

    fetchProductReviews();

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  if (!product) return null;

  // تهيئة بيانات المنتج بأمان
  const basePrice = Number(product.basePrice ?? product.base_price ?? product.price ?? 0);
  const currentPrice = basePrice * multiplier;
  const productImage = product.image || product.image_url || "/hero-baklava.png";
  const productTitleAr = product.titleAr || product.title_ar || "صنف فاخر";
  const productTitleEn = product.titleEn || product.title_en || "Signature Item";
  const productDescAr = product.descriptionAr || product.description_ar;
  const productDescEn = product.descriptionEn || product.description_en;
  const productIngredients = Array.isArray(product.ingredients) ? product.ingredients : [];

  const averageRating =
    reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
      : "5.0";

  const handleSelectPortion = (mult: number, labelAr: string, labelEn: string) => {
    setMultiplier(mult);
    setSelectedWeightLabel(isAr ? labelAr : labelEn);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    addToCart(
      {
        id: product.id,
        title: isAr ? productTitleAr : productTitleEn,
        price: currentPrice,
        image: productImage,
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

    const finalName =
      reviewerName.trim() ||
      userName.trim() ||
      (isAr ? "عميل بادَم المميز" : "Valued Customer");

    setSubmittingReview(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: product.id,
            customer_name: finalName,
            rating: userRating,
            comment: newComment.trim(),
          },
        ])
        .select()
        .single();

      if (data && !error) {
        setReviewsList((prev) => [data, ...prev]);
        setNewComment("");
        setReviewerName("");
        showToast(
          isAr
            ? "شكراً لتقييمك! تم حفظ ونشر رأيك بنجاح 🌟"
            : "Thank you! Review posted successfully 🌟",
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? productTitleAr : productTitleEn}
    >
      {/* خلفية الإغلاق عند النقر بالخارج */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

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

        {/* المحتوى الداخلي والتفاصيل */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 flex-1 overscroll-contain">
          
          {/* 1. تفكيك المكونات الطبيعية */}
          {productIngredients.length > 0 && (
            <section className="space-y-2" aria-label="Ingredients">
              <div className="text-center text-xs text-[#4A0E17] font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span>{isAr ? "تفكيك المكونات الطبيعية 100%" : "100% Pure Natural Ingredients"}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {productIngredients.map((ing: any, idx: number) => (
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

          {/* 2. بطاقة الصورة والوصف الفاخر */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xs border border-stone-200/90 flex flex-col items-center">
            <div className="relative w-56 sm:w-64 aspect-4/3 rounded-2xl overflow-hidden shadow-md border border-stone-100 bg-stone-100">
              <Image
                src={productImage}
                alt={isAr ? productTitleAr : productTitleEn}
                fill
                priority
                quality={85}
                sizes="(max-width: 640px) 224px, 256px"
                className="object-cover"
              />
            </div>

            {(productDescAr || productDescEn) && (
              <p className="text-xs text-stone-600 text-center mt-3 leading-relaxed px-2 font-medium">
                {isAr ? productDescAr : productDescEn}
              </p>
            )}
          </div>

          {/* 3. خيارات الوزن والتغليف */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-[#4A0E17]">
              {isAr ? "اختر الوزن والتغليف الملكي:" : "Select Portion & Packaging:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPortion(1, "ربع كيلو (250g)", "250g Quarter")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  multiplier === 1
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionQuarter")}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">8 - 10 قطع</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(1.85, "نصف كيلو (500g)", "500g Half")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  multiplier === 1.85
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionHalf")}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">16 - 20 قطعة</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(3.5, "1 كجم فاخر (صندوق خشبي)", "1 Kg Royal Box")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  multiplier === 3.5
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionKilo")}</span>
                <span className="text-[10px] text-[#C59B27] font-black block mt-0.5">بوكس إهداء فاخر</span>
              </button>
            </div>
          </div>

          {/* 4. تجارب وتقييمات العملاء */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200/90 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#4A0E17]" />
                <h4 className="text-xs font-black text-stone-900">
                  {isAr ? "تقييمات وتجارب العملاء" : "Customer Reviews"}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-[#E5C058] fill-[#E5C058]" />
                ))}
                <span className="text-xs font-bold text-stone-700 mr-1 rtl:mr-1 ltr:ml-1">
                  {averageRating} / 5
                </span>
              </div>
            </div>

            {loadingReviews ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#4A0E17]" />
                <span className="text-[11px] font-bold">
                  {isAr ? "جاري تحميل آراء العملاء..." : "Loading reviews..."}
                </span>
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="text-center py-6 text-stone-400 space-y-1">
                <p className="text-xs font-bold text-stone-600">
                  {isAr ? "كن أول من يشاركنا رأيه وتجربته لهذا الصنف الفاخر!" : "Be the first to review this royal sweet!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar overscroll-contain">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="bg-[#FAF5ED]/70 p-3 rounded-2xl border border-stone-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-800">{rev.customer_name}</span>
                        <span title={isAr ? "مشتري مؤكد" : "Verified Buyer"} className="inline-flex items-center">
  <CheckCircle className="w-3 h-3 text-emerald-600" />
</span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(rev.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-[#E5C058] fill-[#E5C058]" />
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* نموذج إرسال التقييم */}
            <form onSubmit={handleAddReview} className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">
                  {isAr ? "أضف تقييمك وتجربتك:" : "Add your rating:"}
                </span>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      aria-label={`${star} Stars`}
                      className="p-0.5 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 transition-colors ${
                          star <= userRating ? "text-[#E5C058] fill-[#E5C058]" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {!userName && (
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={isAr ? "اسمك الكريم (اختياري)..." : "Your name (optional)..."}
                  className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-medium"
                />
              )}

              <div className="flex gap-2">
                <input
                  id={reviewInputId}
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isAr ? "اكتب رأيك وتجربتك هنا..." : "Write your review here..."}
                  className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                />
                <button
                  type="submit"
                  disabled={submittingReview || !newComment.trim()}
                  className="bg-[#4A0E17] hover:bg-[#36070E] text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {submittingReview ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submittingReview ? (isAr ? "جاري..." : "Posting...") : isAr ? "نشر" : "Post"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 5. تنبيه مسببات الحساسية */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {isAr
                ? "تنبيه مسببات الحساسية: يحتوي هذا الصنف على الفستق الحلبي، المكسرات، ومشتقات القمح والحليب والسمن البقري الطبيعي."
                : "Allergen Warning: Contains tree nuts, wheat, dairy, and natural ghee."}
            </span>
          </div>

        </div>

        {/* شريط الإضافة للسلة النهائي */}
        <div className="p-4 bg-[#4A0E17] text-white border-t border-[#C59B27]/30 flex items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="block text-[10px] text-stone-300 font-bold uppercase tracking-wider">
              {t("total")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{currentPrice.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#E5C058]">{t("currency")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-[#C59B27] hover:bg-[#E5C058] active:scale-95 text-[#4A0E17] font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 font-bold" />
            <span>{t("addToCart")}</span>
          </button>
        </div>

      </div>
    </div>
  );
};