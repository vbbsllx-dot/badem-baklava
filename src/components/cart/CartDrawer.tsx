"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, ShoppingBag, Plus, Minus, ArrowLeft, ArrowRight, Tag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

interface CartDrawerProps {
  onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    subtotal,
    discountAmount,
    discountPercent,
    deliveryFee,
    totalAmount,
    applyCoupon,
    couponMessage,
  } = useCart();
  const { dir, t } = useLanguage();
  const [couponInput, setCouponInput] = useState("");

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCoupon = couponInput.trim();
    if (cleanCoupon) {
      applyCoupon(cleanCoupon);
    }
  };

  const handleProceedCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    if (onCheckout) onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* خلفية الإغلاق الشفافة */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={() => setIsCartOpen(false)} 
        aria-label="Close cart overlay"
      />

      {/* لوحة السلة الجانبية */}
      <div className="relative w-full max-w-md bg-[#FAF5ED] h-full shadow-2xl flex flex-col border-s border-stone-200 z-10 animate-in slide-in-from-right duration-300">
        
        {/* الترويسة الفاخرة */}
        <div className="p-4 bg-[#4A0E17] text-white border-b border-[#C59B27]/30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#E5C058]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{t("cartTitle")}</h3>
              <span className="text-[10px] text-stone-300">
                {cart.length} {t("items") || "أصناف مختارة"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* قائمة منتجات السلة */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar overscroll-contain">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-3 py-16">
              <div className="w-20 h-20 rounded-3xl bg-[#4A0E17]/5 flex items-center justify-center text-[#4A0E17]/40">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-stone-700">{t("emptyCart")}</p>
                <p className="text-xs text-stone-400 mt-0.5">أضف أصنافك الفاخرة المفضلة لتظهر هنا</p>
              </div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.id}-${item.portionNote || idx}`}
                className="bg-white p-3 rounded-2xl border border-stone-200/90 flex items-center justify-between gap-3 shadow-2xs hover:border-[#4A0E17]/20 transition"
              >
                {/* صورة الصنف مع Next/Image المحسّن */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-100 shrink-0 bg-stone-50">
                  <Image
                    src={item.image || "/hero-baklava.png"}
                    alt={item.title || "منتج"}
                    fill
                    sizes="56px"
                    quality={75}
                    className="object-cover"
                  />
                </div>

                {/* التفاصيل والأسعار */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-stone-900 truncate leading-snug">
                    {item.title}
                  </h5>
                  {item.portionNote && (
                    <span className="text-[10px] text-stone-400 block truncate mt-0.5">
                      {item.portionNote}
                    </span>
                  )}
                  <div className="text-xs font-black text-[#4A0E17] mt-1">
                    {(Number(item.price) * item.quantity).toFixed(2)} {t("currency")}
                  </div>
                </div>

                {/* أزرار زيادة ونقص الكمية */}
                <div className="flex items-center gap-1.5 bg-[#FAF5ED] p-1 rounded-xl border border-stone-200/70 shrink-0">
                  <button
                    onClick={() => updateQuantity(idx, -1)}
                    className="w-6 h-6 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs transition active:scale-90 cursor-pointer"
                    title={item.quantity === 1 ? "حذف" : "تقليل"}
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  
                  <span className="text-xs font-mono font-black w-5 text-center text-stone-800">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(idx, 1)}
                    className="w-6 h-6 bg-white hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs transition active:scale-90 cursor-pointer"
                    title="زيادة"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ملخص الحسابات، الكوبون، وزر إتمام الطلب */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-3.5 shadow-lg">
          
          {/* حقل إدخال الكوبون */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 ltr:left-3 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={t("couponPlaceholder")}
                className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs uppercase font-mono font-bold focus:outline-hidden focus:border-[#4A0E17] rtl:pr-8 ltr:pl-8 placeholder:text-stone-400"
              />
            </div>
            <button
              type="submit"
              disabled={!couponInput.trim()}
              className="bg-[#4A0E17] hover:bg-[#36070E] disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
            >
              {t("apply")}
            </button>
          </form>

          {/* رسائل تأكيد أو خطأ الكوبون */}
          {couponMessage && (
            <p
              className={`text-[11px] font-bold px-1 ${
                couponMessage.isError ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {couponMessage.text}
            </p>
          )}

          {/* تفاصيل الفاتورة */}
          <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
            <div className="flex justify-between">
              <span>{t("subtotal")}:</span>
              <span className="font-bold text-stone-800">{subtotal.toFixed(2)} {t("currency")}</span>
            </div>

            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>{t("discount")} ({discountPercent}%):</span>
                <span>- {discountAmount.toFixed(2)} {t("currency")}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>{t("deliveryFee")}:</span>
              <span className="text-stone-800 font-medium">
                {deliveryFee === 0 ? "مجاناً" : `${deliveryFee.toFixed(2)} ${t("currency")}`}
              </span>
            </div>

            <div className="flex justify-between text-sm font-black text-[#4A0E17] pt-2 border-t border-stone-200">
              <span>{t("total")}:</span>
              <span>{totalAmount.toFixed(2)} {t("currency")}</span>
            </div>
          </div>

          {/* زر المتابعة للدفع */}
          <button
            onClick={handleProceedCheckout}
            disabled={cart.length === 0}
            className="w-full bg-[#4A0E17] hover:bg-[#36070E] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer"
          >
            <span>{t("checkout")}</span>
            {dir === "rtl" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};