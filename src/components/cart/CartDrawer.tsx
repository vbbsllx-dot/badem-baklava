"use client";

import React, { useState } from "react";
import { X, ShoppingBag, Plus, Minus, ArrowLeft, ArrowRight, Tag } from "lucide-react";
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
    if (couponInput) applyCoupon(couponInput);
  };

  const handleProceedCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    if (onCheckout) onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="relative w-full max-w-md bg-[#FAF5ED] h-full shadow-2xl flex flex-col border-s border-stone-200 z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 bg-[#4A0E17] text-white border-b border-[#C59B27]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#E5C058]" />
            <h3 className="font-bold text-white text-base">{t("cartTitle")}</h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-2">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              <p className="text-xs font-bold">{t("emptyCart")}</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.id}-${item.portionNote}`}
                className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-14 rounded-xl object-cover border border-stone-100"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-stone-900 truncate">{item.title}</h5>
                  <span className="text-[10px] text-stone-400 block">{item.portionNote}</span>
                  <div className="text-xs font-black text-[#4A0E17] mt-1">
                    {(item.price * item.quantity).toFixed(2)} {t("currency")}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-xl">
                  <button
                    onClick={() => updateQuantity(idx, -1)}
                    className="w-5 h-5 bg-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(idx, 1)}
                    className="w-5 h-5 bg-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculations & Actions */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-3">
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 ltr:left-3 text-stone-400" />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={t("couponPlaceholder")}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs uppercase font-bold focus:outline-hidden focus:border-[#4A0E17] rtl:pr-8 ltr:pl-8"
              />
            </div>
            <button
              type="submit"
              className="bg-[#4A0E17] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#36070E] transition"
            >
              {t("apply")}
            </button>
          </form>

          {couponMessage && (
            <p
              className={`text-[10px] font-bold ${
                couponMessage.isError ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {couponMessage.text}
            </p>
          )}

          <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
            <div className="flex justify-between">
              <span>{t("subtotal")}:</span>
              <span>{subtotal.toFixed(2)} {t("currency")}</span>
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
                {deliveryFee.toFixed(2)} {t("currency")}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-[#4A0E17] pt-2 border-t border-stone-200">
              <span>{t("total")}:</span>
              <span>{totalAmount.toFixed(2)} {t("currency")}</span>
            </div>
          </div>

          <button
            onClick={handleProceedCheckout}
            disabled={cart.length === 0}
            className="w-full bg-[#4A0E17] hover:bg-[#36070E] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95"
          >
            <span>{t("checkout")}</span>
            {dir === "rtl" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};