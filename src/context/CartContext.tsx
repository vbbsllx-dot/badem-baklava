"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { CartItem } from "@/types";
import { supabase } from "@/lib/supabase/supabase";

export interface FlyingItem {
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
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "badem_cart_items";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // حالات الكوبون والخصم
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponMinAmount, setCouponMinAmount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // مؤقتات الحركات لمنع تسرب الذاكرة
  const animationTimers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      animationTimers.current.forEach(clearTimeout);
    };
  }, []);

  // 1. استرجاع السلة بأمان عند تحميل المتصفح
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load cart from localStorage:", e);
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  // 2. حفظ السلة تلقائياً عند أي تعديل (بعد اكتمال التحميل الأولي فقط)
  useEffect(() => {
    if (isCartLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {
        console.warn("Failed to persist cart to localStorage:", e);
      }
    }
  }, [cart, isCartLoaded]);

  // الحسابات الرياضية المجمعة عبر useMemo لتفادي إعادة الحساب غير الضرورية
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  }, [cart]);

  // 3. التحقق التلقائي من شرط الكوبون إذا انخفضت السلة عن الحد الأدنى بعد حذف صنف
  useEffect(() => {
    if (couponCode && couponMinAmount !== null && subtotal < couponMinAmount) {
      setDiscountPercent(0);
      setCouponMessage({
        text: `⚠️ تم إلغاء الكوبون لأن قيمة السلة أصبحت أقل من الحد الأدنى (${couponMinAmount} ر.س)`,
        isError: true,
      });
    }
  }, [subtotal, couponCode, couponMinAmount]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const deliveryFee = useMemo(() => {
    return cart.length > 0 ? 15 : 0;
  }, [cart.length]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + deliveryFee);
  }, [subtotal, discountAmount, deliveryFee]);

  // تشغيل حركة طيران المنتج وارتداد السلة
  const triggerFlyAnimation = useCallback((image: string, event?: React.MouseEvent) => {
    if (typeof window === "undefined") return;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (event?.clientX && event?.clientY) {
      startX = event.clientX;
      startY = event.clientY;
    }

    const isDesktop = window.innerWidth >= 768;
    const targetEl = isDesktop
      ? document.getElementById("cart-target-desktop")
      : document.getElementById("cart-target-mobile");

    let endX = window.innerWidth / 2;
    let endY = isDesktop ? 40 : window.innerHeight - 50;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    const newFlyingItem: FlyingItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      image,
      startX,
      startY,
      endX,
      endY,
    };

    setFlyingItems((prev) => [...prev, newFlyingItem]);

    const flyTimer = setTimeout(() => {
      setFlyingItems((prev) => prev.filter((i) => i.id !== newFlyingItem.id));
      setIsCartBouncing(true);

      const bounceTimer = setTimeout(() => {
        setIsCartBouncing(false);
      }, 350);

      animationTimers.current.push(bounceTimer);
    }, 430);

    animationTimers.current.push(flyTimer);
  }, []);

  // إضافة صنف للسلة
  const addToCart = useCallback(
    (newItem: Omit<CartItem, "quantity">, clickEvent?: React.MouseEvent) => {
      triggerFlyAnimation(newItem.image || "/hero-baklava.png", clickEvent);

      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(
          (item) => item.id === newItem.id && item.portionNote === newItem.portionNote
        );

        if (existingIndex > -1) {
          const updated = [...prevCart];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        }

        return [...prevCart, { ...newItem, quantity: 1 }];
      });
    },
    [triggerFlyAnimation]
  );

  // تحديث كمية صنف
  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart((prevCart) => {
      if (!prevCart[index]) return prevCart;

      const currentQty = prevCart[index].quantity;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        return prevCart.filter((_, i) => i !== index);
      }

      const updated = [...prevCart];
      updated[index] = {
        ...updated[index],
        quantity: newQty,
      };
      return updated;
    });
  }, []);

  // حذف صنف
  const removeFromCart = useCallback((index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  }, []);

  // تفريغ السلة بالكامل
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setCouponCode("");
    setCouponMinAmount(null);
    setCouponMessage(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // تجاهل الأخطاء
      }
    }
  }, []);

  // مسح الكوبون يدوياً
  const removeCoupon = useCallback(() => {
    setCouponCode("");
    setDiscountPercent(0);
    setCouponMinAmount(null);
    setCouponMessage(null);
  }, []);

  // تطبيق وفحص كود الخصم
  const applyCoupon = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return;

      setCouponCode(cleanCode);

      try {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", cleanCode)
          .maybeSingle();

        if (error || !data || data.is_active === false) {
          setDiscountPercent(0);
          setCouponMinAmount(null);
          setCouponMessage({
            text: "كود الخصم غير صالح أو تم إيقافه ❌",
            isError: true,
          });
          return;
        }

        // فحص انتهاء الصلاحية
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setDiscountPercent(0);
          setCouponMinAmount(null);
          setCouponMessage({
            text: "عذراً، انتهت صلاحية هذا الكود الترويجي ⏳",
            isError: true,
          });
          return;
        }

        // فحص الحد الأقصى للاستخدام
        if (data.max_uses && (data.used_count || 0) >= data.max_uses) {
          setDiscountPercent(0);
          setCouponMinAmount(null);
          setCouponMessage({
            text: "عذراً، وصل هذا الكوبون للحد الأقصى من الاستخدام 🚫",
            isError: true,
          });
          return;
        }

        // فحص الحد الأدنى للطلب
        const minOrder = Number(data.min_order_amount) || 0;
        if (minOrder > 0 && subtotal < minOrder) {
          setDiscountPercent(0);
          setCouponMinAmount(minOrder);
          setCouponMessage({
            text: `الحد الأدنى لتفعيل هذا الكود هو ${minOrder} ر.س (سلتك الحالية: ${subtotal.toFixed(2)} ر.س)`,
            isError: true,
          });
          return;
        }

        // تطبيق الكوبون بنجاح
        setCouponMinAmount(minOrder > 0 ? minOrder : null);
        setDiscountPercent(Number(data.discount_percent) || 0);
        setCouponMessage({
          text: `✨ تم تطبيق خصم ${data.discount_percent}% بنجاح!`,
          isError: false,
        });
      } catch (err) {
        console.error("Coupon verification error:", err);
        setDiscountPercent(0);
        setCouponMinAmount(null);
        setCouponMessage({ text: "تعذر التحقق من كود الخصم حالياً", isError: true });
      }
    },
    [subtotal]
  );

  // دمج القيم وتمريرها بمصفوفة تبعيات دقيقة
  const contextValue = useMemo(
    () => ({
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
    }),
    [
      cart,
      isCartOpen,
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
    ]
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};