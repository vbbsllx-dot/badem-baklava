"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, ShoppingBag, Star, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
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
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const { userName } = useUser();

  const [multiplier, setMultiplier] = useState(1);
  const [selectedWeightLabel, setSelectedWeightLabel] = useState("250 جرام (ربع كيلو)");
  const [userRating, setUserRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  
  // حالة التقييمات الحقيقية
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // 1. جلب المراجعات الحقيقية الخاصة بهذا المنتج من Supabase
  useEffect(() => {
    if (!product?.id) return;

    const fetchProductReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false });

        if (data && !error) {
          setReviewsList(data);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchProductReviews();
  }, [product?.id]);

  if (!product) return null;

  // دعم أسعار وصور وبيانات المنتجات القادمة من قاعدة البيانات مباشرة أو من الكائنات المحلية
  const basePrice = Number(product.basePrice ?? product.base_price ?? product.price ?? 0);
  const currentPrice = basePrice * multiplier;
  const productImage = product.image || product.image_url || "/placeholder.jpg";
  const productTitleAr = product.titleAr || product.title_ar || "صنف فاخر";
  const productTitleEn = product.titleEn || product.title_en || "Signature Item";
  const productDescAr = product.descriptionAr || product.description_ar;
  const productDescEn = product.descriptionEn || product.description_en;
  const productIngredients = Array.isArray(product.ingredients) ? product.ingredients : [];

  // حساب متوسط التقييم الفعلي للمنتج
  const averageRating =
    reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
      : "5.0";

  const handleSelectPortion = (mult: number, labelAr: string, labelEn: string) => {
    setMultiplier(mult);
    setSelectedWeightLabel(language === "ar" ? labelAr : labelEn);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    addToCart(
      {
        id: product.id,
        title: language === "ar" ? productTitleAr : productTitleEn,
        price: currentPrice,
        image: productImage,
        portionNote: selectedWeightLabel,
      },
      e
    );
    showToast(language === "ar" ? "تمت إضافة الصنف إلى السلة بنجاح! ✨" : "Added to cart successfully!", "success");
    onClose();
    setIsCartOpen(true);
  };

  // 2. إرسال وحفظ التقييم الجديد في جدول reviews في Supabase
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product) return;

    const finalName =
      reviewerName.trim() ||
      userName.trim() ||
      (language === "ar" ? "عميل بادَم المميز" : "Valued Customer");

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
        setReviewsList([data, ...reviewsList]);
        setNewComment("");
        setReviewerName("");
        showToast(
          language === "ar" ? "شكراً لتقييمك! تم حفظ ونشر رأيك بنجاح 🌟" : "Thank you! Review posted successfully 🌟",
          "success"
        );
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast(
        language === "ar" ? "تعذر إرسال التقييم، يرجى المحاولة لاحقاً" : "Failed to post review",
        "error"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF5ED] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[92vh] flex flex-col relative text-[#2D2321]">
        
        {/* Header */}
        <div className="relative bg-[#4A0E17] text-white text-center pt-6 pb-4 px-4 border-b border-[#C59B27]/30 shadow-md">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto z-20 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5 font-bold" />
          </button>

          <span className="block text-[10px] tracking-[0.25em] text-[#E5C058] font-black uppercase font-brand">
            BADEM SIGNATURE RECIPE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 drop-shadow-xs">
            {language === "ar" ? productTitleAr : productTitleEn}
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.2em] font-brand font-bold text-stone-300 uppercase mt-0.5">
            {productTitleEn}
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-6 flex-1">
          
          {/* 1. قسم تفكيك المكونات: يظهر فقط إذا أضفت مكونات للمنتج من لوحة التحكم */}
          {productIngredients.length > 0 && (
            <div className="space-y-2">
              <div className="text-center text-xs text-[#4A0E17] font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span>{language === "ar" ? "تفكيك المكونات الطبيعية 100%" : "100% Pure Natural Ingredients"}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {productIngredients.map((ing: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-1">{ing.icon || "✨"}</span>
                    <span className="text-[10px] font-bold text-stone-700 leading-tight">
                      {language === "ar" ? ing.nameAr || ing.name_ar : ing.nameEn || ing.name_en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. بطاقة صورة المنتج النظيفة بدون شارات مثبتة */}
          <div className="relative bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200 flex flex-col items-center">
            <div className="relative w-full max-w-xs flex justify-center py-2">
              <img
                src={productImage}
                alt={language === "ar" ? productTitleAr : productTitleEn}
                className="w-52 h-40 sm:w-60 sm:h-44 object-cover rounded-2xl shadow-lg border border-stone-100"
              />
            </div>

            {(productDescAr || productDescEn) && (
              <p className="text-xs text-stone-600 text-center mt-3 leading-relaxed px-2 font-medium">
                {language === "ar" ? productDescAr : productDescEn}
              </p>
            )}
          </div>

          {/* 3. اختيار الوزن والتغليف */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800">
              {language === "ar" ? "اختر الوزن والتغليف:" : "Select Portion & Packaging:"}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPortion(1, "ربع كيلو (250g)", "250g Quarter")}
                className={`p-3 rounded-2xl text-center transition border cursor-pointer ${
                  multiplier === 1
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] font-bold"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionQuarter")}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">8 - 10 قطع</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(1.85, "نصف كيلو (500g)", "500g Half")}
                className={`p-3 rounded-2xl text-center transition border cursor-pointer ${
                  multiplier === 1.85
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] font-bold"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionHalf")}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">16 - 20 قطعة</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(3.5, "1 كجم فاخر (صندوق خشبي)", "1 Kg Royal Box")}
                className={`p-3 rounded-2xl text-center transition border cursor-pointer ${
                  multiplier === 3.5
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] font-bold"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionKilo")}</span>
                <span className="text-[10px] text-[#C59B27] font-bold block mt-0.5">بوكس إهداء فاخر</span>
              </button>
            </div>
          </div>

          {/* 4. ⭐ قسم التقييمات المرتبط بـ Supabase ⭐ */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#4A0E17]" />
                <h4 className="text-xs font-black text-stone-900">
                  {language === "ar" ? "تقييمات وتجارب العملاء" : "Customer Reviews"}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 text-[#E5C058] fill-[#E5C058]" />
                ))}
                <span className="text-xs font-bold text-stone-700 mr-1">{averageRating} / 5</span>
              </div>
            </div>

            {/* قائمة المراجعات */}
            {loadingReviews ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#4A0E17]" />
                <span className="text-[11px]">جاري تحميل آراء العملاء...</span>
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="text-center py-6 text-stone-400 space-y-1">
                <p className="text-xs font-bold">كن أول من يشاركنا رأيه وتجربته لهذا الصنف الفاخر!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="bg-[#FAF5ED]/60 p-3 rounded-2xl border border-stone-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-800">{rev.customer_name}</span>
                        <span title="مشتري مؤكد">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(rev.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-[#E5C058] fill-[#E5C058]" />
                      ))}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* نموذج إضافة تقييم جديد */}
            <form onSubmit={handleAddReview} className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">
                  {language === "ar" ? "أضف تقييمك وتجربتك:" : "Add your rating:"}
                </span>
                <div className="flex gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setUserRating(star)}
                      className={`w-4 h-4 transition cursor-pointer ${
                        star <= userRating ? "text-[#E5C058] fill-[#E5C058]" : "text-stone-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {!userName && (
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={language === "ar" ? "اسمك الكريم (اختياري)..." : "Your name (optional)..."}
                  className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                />
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={language === "ar" ? "اكتب رأيك وتجربتك هنا..." : "Write your review here..."}
                  className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#4A0E17] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#36070E] transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? "جاري النشر..." : language === "ar" ? "نشر" : "Post"}
                </button>
              </div>
            </form>
          </div>

          {/* 5. تنبيه الحساسية */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {language === "ar"
                ? "تنبيه مسببات الحساسية: يحتوي هذا الصنف على الفستق الحلبي، المكسرات، ومشتقات القمح والحليب."
                : "Allergen Warning: Contains tree nuts, wheat and dairy."}
            </span>
          </div>

        </div>

        {/* Footer */}
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
            onClick={handleAddToCart}
            className="flex-1 bg-[#C59B27] hover:bg-[#E5C058] text-[#4A0E17] font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 font-bold" />
            <span>{t("addToCart")}</span>
          </button>
        </div>

      </div>
    </div>
  );
};