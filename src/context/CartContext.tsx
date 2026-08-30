"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem } from "@/types";
import { supabase } from "@/lib/supabase/supabase";

interface FlyingItem {
  id: string;
  image: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity">, clickEvent?: React.MouseEvent) => void;
  flyingItems: FlyingItem[];
  isCartBouncing: boolean;
  updateQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  couponCode: string;
  couponMessage: { text: string; isError: boolean } | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void; // ✨ دالة جديدة لمسح الكوبون وإلغاء حالة الخطأ
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. استرجاع عناصر السلة المخزنة عند تحميل الصفحة
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("badem_cart_items");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
    setIsCartLoaded(true);
  }, []);

  // 2. حفظ عناصر السلة تلقائياً عند إضافة أو حذف أي منتج
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("badem_cart_items", JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  const triggerFlyAnimation = (image: string, event?: React.MouseEvent) => {
    if (typeof window === "undefined") return;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (event && event.clientX && event.clientY) {
      startX = event.clientX;
      startY = event.clientY;
    }

    const desktopCart = document.getElementById("cart-target-desktop");
    const mobileCart = document.getElementById("cart-target-mobile");

    let endX = window.innerWidth / 2;
    let endY = window.innerHeight - 50;

    const isDesktop = window.innerWidth >= 768;
    const targetEl = isDesktop ? desktopCart : mobileCart;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    const newFlyingItem: FlyingItem = {
      id: `${Date.now()}-${Math.random()}`,
      image,
      startX,
      startY,
      endX,
      endY,
    };

    setFlyingItems((prev) => [...prev, newFlyingItem]);

    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((i) => i.id !== newFlyingItem.id));
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 300);
    }, 430);
  };

  const addToCart = (newItem: Omit<CartItem, "quantity">, clickEvent?: React.MouseEvent) => {
    triggerFlyAnimation(newItem.image, clickEvent);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === newItem.id && item.portionNote === newItem.portionNote
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prevCart, { ...newItem, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCouponCode("");
    setCouponMessage(null);
    localStorage.removeItem("badem_cart_items");
  };

  // ✨ دالة مسح وتفريغ الكوبون تماماً (تُستخدم عند رغبة العميل بإزالة الكوبون الخطأ)
  const removeCoupon = () => {
    setCouponCode("");
    setDiscountPercent(0);
    setCouponMessage(null);
  };

  // حساب المجموع الفرعي أولاً لنتمكن من التحقق من الحد الأدنى للسلة
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    
    setCouponCode(cleanCode);

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", cleanCode)
        .single();

      if (error || !data || data.is_active === false) {
        setDiscountPercent(0);
        setCouponMessage({ text: "كود الخصم غير صالح أو منتهي الصلاحية", isError: true });
        return;
      }

      // التحقق من تاريخ الانتهاء
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setDiscountPercent(0);
        setCouponMessage({ text: "عذراً، انتهت صلاحية هذا الكود الترويجي", isError: true });
        return;
      }

      // التحقق من الحد الأدنى لقيمة السلة
      if (data.min_order_amount && subtotal < Number(data.min_order_amount)) {
        setDiscountPercent(0);
        setCouponMessage({ 
          text: `الحد الأدنى لتفعيل هذا الكود هو ${data.min_order_amount} ر.س`, 
          isError: true 
        });
        return;
      }

      // إذا تجاوز كل الفحوصات بنجاح
      setDiscountPercent(data.discount_percent);
      setCouponMessage({ text: `✨ تم تطبيق خصم ${data.discount_percent}% بنجاح!`, isError: false });

    } catch (err) {
      setDiscountPercent(0);
      setCouponMessage({ text: "تعذر التحقق من كود الخصم", isError: true });
    }
  };

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const deliveryFee = cart.length > 0 ? 15 : 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        flyingItems,
        isCartBouncing,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal,
        discountPercent,
        discountAmount,
        deliveryFee,
        totalAmount,
        couponCode,
        couponMessage,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};