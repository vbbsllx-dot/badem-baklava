"use client";

import React, { useState, useEffect, useId } from "react";
import {
  X,
  Gift,
  MapPin,
  CreditCard,
  CheckCircle2,
  Truck,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  MessageCircle,
  Loader2,
  AlertTriangle,
  Tag,
  Compass,
  ExternalLink
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase/supabase";

// رقم الواتساب الرسمي للمتجر لاستقبال الطلبات
const STORE_WHATSAPP_NUMBER = "966592320106";

interface CheckoutSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "details" | "payment" | "tracking";
type PaymentMethod = "applepay" | "mada" | "card" | "cod";

interface CheckoutCartItem {
  id?: string | number;
  type?: string;
  tierId?: string;
  title: string;
  price: number | string;
  quantity: number;
  portion?: string;
  portionNote?: string;
  summaryText?: string;
  items?: Array<{ quantity?: number; unitPrice?: number }>;
  [key: string]: unknown;
}

interface VerifiedOrderItem {
  title: string;
  portion: string;
  portionNote?: string;
  quantity: number;
  price: number;
  is_custom_box?: boolean;
}

interface CartContextExtended {
  cart?: CheckoutCartItem[];
  totalAmount?: number;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon?: string;
  couponCode?: string;
  coupon?: string;
  discountAmount?: number;
  deliveryFee?: number;
  subtotal?: number;
  removeCoupon?: () => void;
}

export const CheckoutSystem: React.FC<CheckoutSystemProps> = ({ isOpen, onClose }) => {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const detailsFormId = useId();

  // استدعاء بيانات السلة بأمان
  const cartContext = useCart() as unknown as CartContextExtended;
  const { cart = [], totalAmount = 0, clearCart, setIsCartOpen } = cartContext;
  const appliedCouponCode = cartContext.appliedCoupon || cartContext.couponCode || cartContext.coupon || "";
  const discountAmount = Number(cartContext.discountAmount) || 0;
  const deliveryFee =
    cartContext.deliveryFee !== undefined && cartContext.deliveryFee !== null
      ? Number(cartContext.deliveryFee)
      : 15;
  const subtotal = Number(cartContext.subtotal) || Math.max(0, totalAmount - deliveryFee + discountAmount);

  // استدعاء بيانات المستخدم
  const { userName, setUserName, userPhone, setUserPhone, addOrder } = useUser();
  const [currentStep, setCurrentStep] = useState<Step>("details");

  // بيانات العنوان والموقع
  const [customerName, setCustomerName] = useState(userName || "");
  const [phone, setPhone] = useState(userPhone || "");
  const [city, setCity] = useState("الرياض");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [notes, setNotes] = useState("");

  // حالات تحديد الموقع بالـ GPS
  const [isLocating, setIsLocating] = useState(false);
  const [mapsLink, setMapsLink] = useState<string | null>(null);

  // بيانات الإهداء
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  // الدفع وحالة المعالجة
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("applepay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponWarning, setCouponWarning] = useState<string | null>(null);

  // تتبع الطلب ورابط الواتساب الاحتياطي
  const [orderId, setOrderId] = useState("");
  const [trackingProgress, setTrackingProgress] = useState(1);
  const [backupWhatsAppUrl, setBackupWhatsAppUrl] = useState<string | null>(null);
  const etaMinutes = 35;

  // محاكاة مراحل تحضير الطلب في شاشة التتبع
  useEffect(() => {
    if (currentStep === "tracking") {
      const interval = setInterval(() => {
        setTrackingProgress((prev) => (prev < 4 ? prev + 1 : prev));
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  if (!isOpen) return null;

  // قيم العرض الذكية لتفادي Cascading Renders
  const effectiveCustomerName = customerName || userName || "";
  const effectivePhone = phone || userPhone || "";

  // 📍 تحديد الموقع الجغرافي التفاعلي بالـ GPS
  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(isAr ? "متصفحك لا يدعم ميزة تحديد الموقع الجغرافي" : "Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const generatedLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setMapsLink(generatedLink);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              const addr = data.address;
              const detectedCity = addr.city || addr.town || addr.state || city;
              const detectedDistrict = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || "";
              const detectedRoad = addr.road || "";

              if (detectedCity) setCity(detectedCity);
              if (detectedDistrict) setDistrict(detectedDistrict);
              if (detectedRoad && !street) setStreet(detectedRoad);
            }
          }
        } catch (e) {
          console.warn("Geocoding fetch non-blocking warning:", e);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn("Geolocation permission/error:", error.message);
        alert(
          isAr
            ? "يرجى تفعيل صلاحية الموقع في متصفحك ليتم تحديد موقعك آلياً."
            : "Please enable location permission in your browser."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  // 🛡️ فحص أمني لشروط الكوبون قبل الانتقال للدفع
  const validateCouponSecurity = async (phoneToCheck: string): Promise<boolean> => {
    if (!appliedCouponCode) return true;

    try {
      const { data: couponData, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", appliedCouponCode)
        .single();

      if (error || !couponData || couponData.is_active === false) {
        setCouponWarning(isAr ? "عذراً، هذا الكوبون غير صالح أو تم إيقافه ❌" : "This coupon is no longer active ❌");
        return false;
      }

      if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
        setCouponWarning(isAr ? "عذراً، انتهت صلاحية هذا الكود الترويجي ⏳" : "This coupon has expired ⏳");
        return false;
      }

      if (couponData.max_uses && (couponData.used_count || 0) >= couponData.max_uses) {
        setCouponWarning(isAr ? "عذراً، وصل هذا الكوبون للحد الأقصى من الاستخدام 🚫" : "Coupon usage limit reached 🚫");
        return false;
      }

      if (couponData.min_order_amount && subtotal < Number(couponData.min_order_amount)) {
        setCouponWarning(
          isAr
            ? `الحد الأدنى لتفعيل هذا الكود هو ${couponData.min_order_amount} ر.س (سلتك الحالية: ${subtotal.toFixed(2)} ر.س)`
            : `Minimum order for this coupon is ${couponData.min_order_amount} SAR`
        );
        return false;
      }

      if (couponData.one_per_customer) {
        const { data: previousOrders, error: orderErr } = await supabase
          .from("orders")
          .select("id, notes")
          .eq("customer_phone", phoneToCheck.trim());

        if (!orderErr && previousOrders) {
          const hasUsedBefore = previousOrders.some(
            (ord: { notes?: string }) => ord.notes && ord.notes.includes(appliedCouponCode)
          );

          if (hasUsedBefore) {
            setCouponWarning(
              isAr
                ? "⚠️ تم استخدام هذا الكود الترويجي مسبقاً بهذا الرقم! الخصم مخصص لمرة واحدة فقط لكل عميل."
                : "This coupon has already been used with this phone number ⚠️"
            );
            return false;
          }
        }
      }

      setCouponWarning(null);
      return true;
    } catch (e) {
      console.error("Coupon validation error:", e);
      return true;
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = effectiveCustomerName.trim();
    const finalPhone = effectivePhone.trim();

    if (!finalName || !finalPhone || !district.trim()) {
      alert(isAr ? "يرجى تعبئة كافة الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }

    setCustomerName(finalName);
    setPhone(finalPhone);
    setUserName(finalName);
    setUserPhone(finalPhone);

    const isValid = await validateCouponSecurity(finalPhone);

    if (!isValid) {
      const rejectionReason = couponWarning || (isAr ? "كود الخصم غير صالح أو لم يعد مستوفياً للشروط." : "Coupon is invalid.");
      alert(
        isAr
          ? `⚠️ تنبيه:\n${rejectionReason}\n\nسيتم الآن إزالة الكوبون ومتابعة الطلب بالسعر الأساسي.`
          : `⚠️ Notice:\n${rejectionReason}\n\nThe coupon will be removed to proceed.`
      );

      try {
        if (cartContext?.removeCoupon) {
          cartContext.removeCoupon();
        }
      } catch (err) {
        console.error("Error clearing invalid coupon:", err);
      }

      setCouponWarning(null);
      return;
    }

    setCurrentStep("payment");
  };

  // 📲 بناء رابط الواتساب بدقة متناهية ومطابقة للفاتورة الموثقة
  const createWhatsAppUrl = (
    generatedId: string,
    verifiedSub: number,
    verifiedDisc: number,
    verifiedDeliv: number,
    finalTotal: number,
    itemsToPrint: VerifiedOrderItem[]
  ) => {
    const cleanPhone = STORE_WHATSAPP_NUMBER.replace(/[^0-9]/g, "");

    const itemsText = itemsToPrint
      .map(
        (item, idx) =>
          `  ${idx + 1}. *${item.title}*\n     ${item.portion ? `• الحجم: ${item.portion}\n     ` : ""}الكمية: ${item.quantity} | السعر: ${(Number(item.price) * item.quantity).toFixed(2)} ر.س`
      )
      .join("\n");

    const giftText = isGift
      ? `\n🎁 *تفاصيل الإهداء الملكي:*\n• المهدَى إليه: ${recipientName || "غير محدد"}\n• رسالة البطاقة: "${giftMessage || "بدون رسالة"}"\n`
      : "";

    const locationLinkText = mapsLink ? `\n📍 *موقع الخريطة (GPS للمندوب):*\n${mapsLink}\n` : "";
    const notesText = notes ? `\n📝 *ملاحظات خاصة:* ${notes}\n` : "";
    const couponText =
      appliedCouponCode && verifiedDisc > 0
        ? `\n🏷️ *الخصم المطبق (${appliedCouponCode}):* -${verifiedDisc.toFixed(2)} ر.س`
        : "";

    const payMethodTitle =
      paymentMethod === "applepay"
        ? "Apple Pay "
        : paymentMethod === "mada"
        ? "بطاقة مدى Mada"
        : paymentMethod === "card"
        ? "بطاقة ائتمانية (Visa / MC)"
        : "الدفع عند الاستلام (نقداً / مدى)";

    const message = `✨ *طلب جديد من متجر بادَم BADEM BAKLAVA*
━━━━━━━━━━━━━━━━━━━
🆔 *رقم الطلب:* #${generatedId}

👤 *بيانات المستلم والتوصيل:*
• *الاسم:* ${effectiveCustomerName}
• *الجوال:* ${effectivePhone}
• *المدينة:* ${city}
• *الحي:* ${district}
• *الشارع / التفاصيل:* ${street || "غير محدد"}${locationLinkText}${giftText}${notesText}
🛍️ *تفاصيل الأصناف والفاتورة:*
${itemsText}
━━━━━━━━━━━━━━━━━━━
📦 *قيمة المنتجات:* ${verifiedSub.toFixed(2)} ر.س
🚚 *رسوم التوصيل:* ${verifiedDeliv.toFixed(2)} ر.س${couponText}
💰 *المبلغ الصافي المطلوب:* *${finalTotal.toFixed(2)} ر.س*
━━━━━━━━━━━━━━━━━━━
💳 *طريقة الدفع:* ${payMethodTitle}
━━━━━━━━━━━━━━━━━━━
✨ أرجو تأكيد الطلب وتجهيزه طازجاً!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // 🎯 دالة استخراج السعر الصحيح للوزن المختار من بيانات المنتج في قاعدة البيانات
  const resolveOfficialProductPrice = (
    dbProduct: Record<string, unknown> | null,
    cartItem: CheckoutCartItem
  ): number => {
    const cartPrice = Number(cartItem.price) || 0;
    if (!dbProduct) return cartPrice;

    const portionText = String(cartItem.portion || cartItem.portionNote || "").toLowerCase();
    const basePrice = Number(dbProduct.base_price || dbProduct.price || 0);

    // 1. فحص إذا كان المنتج يحتوي على مصفوفة أوزان مخصصة
    const variantsList =
      (dbProduct.weights as Array<Record<string, unknown>>) ||
      (dbProduct.portions as Array<Record<string, unknown>>) ||
      (dbProduct.sizes as Array<Record<string, unknown>>) ||
      (dbProduct.variants as Array<Record<string, unknown>>);

    if (Array.isArray(variantsList) && variantsList.length > 0) {
      const matchedVariant = variantsList.find((v) => {
        const vName = String(v.name_ar || v.title_ar || v.name || v.label || v.weight || "").toLowerCase();
        return vName && (portionText.includes(vName) || vName.includes(portionText));
      });
      if (matchedVariant && Number(matchedVariant.price) > 0) {
        return Number(matchedVariant.price);
      }
    }

    // 2. فحص حالة اختيار 1 كيلو (1000g / 1Kg)
    if (
      (/1000|1\s*kg|كيلو/i.test(portionText)) &&
      !(/نصف|نص|ربع|500|250/i.test(portionText))
    ) {
      const dbKiloPrice = Number(
        dbProduct.price_1kg ||
          dbProduct.price_1000g ||
          dbProduct.kilo_price ||
          dbProduct.price_kilo ||
          dbProduct.one_kilo_price ||
          0
      );
      if (dbKiloPrice > 0) return dbKiloPrice;
      if (cartPrice > 0) return cartPrice;
      return basePrice * 4;
    }

    // 3. فحص حالة اختيار نصف كيلو (500g)
    if (/500|نصف|نص/i.test(portionText)) {
      const dbHalfPrice = Number(
        dbProduct.price_500g ||
          dbProduct.price_half ||
          dbProduct.half_kilo_price ||
          dbProduct.half_price ||
          dbProduct.price_half_kilo ||
          0
      );
      if (dbHalfPrice > 0) return dbHalfPrice;
      if (cartPrice > 0) return cartPrice;
      return basePrice * 2;
    }

    // 4. فحص حالة اختيار ربع كيلو (250g)
    if (/250|ربع/i.test(portionText)) {
      const dbQuarterPrice = Number(
        dbProduct.price_250g ||
          dbProduct.price_quarter ||
          dbProduct.quarter_kilo_price ||
          dbProduct.quarter_price ||
          basePrice ||
          0
      );
      if (dbQuarterPrice > 0) return dbQuarterPrice;
      return cartPrice;
    }

    return cartPrice > 0 ? cartPrice : basePrice;
  };

  // ✅ تأكيد الطلب والتحقق الصارم مع دعم المدى المرن للبوكسات وأسعار الأوزان
  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    let verifiedSubtotal = 0;
    const verifiedItems: VerifiedOrderItem[] = [];

    try {
      const { data: boxSettingsData } = await supabase
        .from("box_builder_settings")
        .select("pricing_mode, packaging_fee")
        .eq("id", "default")
        .maybeSingle();

      const isDynamicBoxPricing = (boxSettingsData?.pricing_mode || "dynamic") === "dynamic";
      const boxPackagingFee = Number(boxSettingsData?.packaging_fee) || 0;

      for (const cartItem of cart) {
        // 🔒 1. فحص البوكس المخصص (مع دعم المدى المرن للقطع مثل 6 - 8 قطع)
        if (cartItem.type === "custom_box" || cartItem.tierId) {
          let officialBoxPrice = Number(cartItem.price) || 0;
          let maxCapacity = 0;
          let minCapacity = 0;

          const { data: tierData } = await supabase
            .from("custom_box_tiers")
            .select("price, capacity, name_ar, subtitle_ar")
            .eq("id", cartItem.tierId)
            .maybeSingle();

          if (tierData) {
            maxCapacity = Number(tierData.capacity) || 0;
            minCapacity = maxCapacity;

            // استخراج الحد الأدنى إذا كانت الملاحظة تحتوي على مدى مثل "6 - 8 قطعة"
            const sub = String(tierData.subtitle_ar || "");
            const rangeMatch = sub.match(/(\d+)\s*[-–—إلى]+\s*(\d+)/);
            if (rangeMatch && rangeMatch.length >= 3) {
              const first = parseInt(rangeMatch[1], 10);
              const second = parseInt(rangeMatch[2], 10);
              minCapacity = Math.min(first, second);
            }

            if (!isDynamicBoxPricing) {
              officialBoxPrice = Number(tierData.price);
            }
          }

          if (Array.isArray(cartItem.items)) {
            const totalPieces = cartItem.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
            if (maxCapacity > 0 && (totalPieces < minCapacity || totalPieces > maxCapacity)) {
              throw new Error(
                `سعة البوكس غير مكتملة (${totalPieces} قطع، والمطلوب بين ${minCapacity} إلى ${maxCapacity} قطع).`
              );
            }

            if (isDynamicBoxPricing) {
              const calculatedDynamic = cartItem.items.reduce(
                (sum, it) => sum + Number(it.unitPrice || 0) * Number(it.quantity || 0),
                0
              );
              if (calculatedDynamic > 0) {
                officialBoxPrice = calculatedDynamic + boxPackagingFee;
              }
            }
          }

          const boxItemTotal = officialBoxPrice * Number(cartItem.quantity || 1);
          verifiedSubtotal += boxItemTotal;
          verifiedItems.push({
            title: cartItem.title,
            portion: cartItem.portion || cartItem.summaryText || "تشكيلة مخصصة بالميزان",
            portionNote: cartItem.portionNote || `بوكس مخصص (${minCapacity}-${maxCapacity} قطع)`,
            quantity: Number(cartItem.quantity || 1),
            price: officialBoxPrice,
            is_custom_box: true,
          });
        }
        // 🔒 2. فحص المنتجات العادية مع احترام الوزن المختار (ربع / نصف / كيلو)
        else {
          const { data: dbProduct } = await supabase
            .from("products")
            .select("*")
            .eq("title_ar", cartItem.title)
            .maybeSingle();

          const officialPrice = resolveOfficialProductPrice(
            dbProduct as Record<string, unknown> | null,
            cartItem
          );
          const qty = Number(cartItem.quantity) || 1;
          const itemTotal = officialPrice * qty;

          verifiedSubtotal += itemTotal;
          verifiedItems.push({
            title: cartItem.title,
            portion: cartItem.portion || cartItem.portionNote || "الوزن المختار",
            portionNote: cartItem.portionNote || cartItem.portion || "الوزن المختار",
            quantity: qty,
            price: officialPrice,
          });
        }
      }

      // حساب الخصم المعتمد
      let verifiedDiscount = 0;
      if (appliedCouponCode) {
        const { data: couponData } = await supabase
          .from("coupons")
          .select("discount_percent")
          .eq("code", appliedCouponCode)
          .maybeSingle();

        if (couponData?.discount_percent) {
          verifiedDiscount = (verifiedSubtotal * Number(couponData.discount_percent)) / 100;
        }
      }

      const verifiedDeliveryFee = deliveryFee;
      const verifiedTotalAmount = Math.max(0, verifiedSubtotal - verifiedDiscount + verifiedDeliveryFee);
      const generatedId = `BDM-${Math.floor(100000 + Math.random() * 900000)}`;

      const combinedNotes = [
        notes.trim(),
        appliedCouponCode ? `[Coupon: ${appliedCouponCode}]` : "",
        mapsLink ? `[GPS: ${mapsLink}]` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const finalCustomerName = effectiveCustomerName.trim();
      const finalCustomerPhone = effectivePhone.trim();

      const orderPayload = {
        id: generatedId,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        city: city.trim(),
        district: district.trim(),
        street: street.trim(),
        notes: combinedNotes,
        is_gift: isGift,
        recipient_name: isGift ? recipientName.trim() : null,
        gift_message: isGift ? giftMessage.trim() : null,
        items: verifiedItems,
        subtotal: verifiedSubtotal,
        discount_amount: verifiedDiscount,
        delivery_fee: verifiedDeliveryFee,
        total_amount: verifiedTotalAmount,
        payment_method: paymentMethod,
        status: "pending",
      };

      const { error: insertError } = await supabase.from("orders").insert([orderPayload]);
      if (insertError) throw insertError;

      // تحديث استخدام الكوبون
      if (appliedCouponCode) {
        const { data: couponData } = await supabase
          .from("coupons")
          .select("id, used_count")
          .eq("code", appliedCouponCode)
          .maybeSingle();

        if (couponData) {
          const isSingleUse = appliedCouponCode.startsWith("BADEM-") || appliedCouponCode.startsWith("LOYAL-");
          await supabase
            .from("coupons")
            .update({
              used_count: (couponData.used_count || 0) + 1,
              is_used: isSingleUse,
              is_active: !isSingleUse,
            })
            .eq("code", appliedCouponCode);
        }

        try {
          const localCoupons = JSON.parse(localStorage.getItem("badem_saved_coupons") || "[]");
          const filtered = Array.isArray(localCoupons)
            ? localCoupons.filter((c: { code?: string }) => c.code !== appliedCouponCode)
            : [];
          localStorage.setItem("badem_saved_coupons", JSON.stringify(filtered));
        } catch {
          // تجاوز أخطاء التخزين المحلي الصامتة
        }
      }

      setOrderId(generatedId);

      // إنشاء رابط الواتساب متطابقاً 100% مع الأسعار الموثقة
      const waUrl = createWhatsAppUrl(
        generatedId,
        verifiedSubtotal,
        verifiedDiscount,
        verifiedDeliveryFee,
        verifiedTotalAmount,
        verifiedItems
      );
      setBackupWhatsAppUrl(waUrl);

      const win = window.open(waUrl, "_blank");
      if (!win) {
        window.location.assign(waUrl);
      }

      setCurrentStep("tracking");

      if (addOrder) {
        await addOrder({
          id: generatedId,
          customerName: finalCustomerName,
          phone: finalCustomerPhone,
          items: verifiedItems as unknown as Record<string, unknown>[],
          totalAmount: verifiedTotalAmount,
          status: "pending",
          paymentMethod: paymentMethod,
        });
      }

      clearCart();
    } catch (err: unknown) {
      console.error("Secure order processing error:", err);
      const message =
        err instanceof Error
          ? err.message
          : isAr
          ? "حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى."
          : "Error processing order, please try again.";
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishClose = () => {
    setCurrentStep("details");
    onClose();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF5ED] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[92vh] flex flex-col relative text-[#2D2321]">

        {/* الترويسة الفاخرة */}
        <div className="bg-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C59B27]/20 flex items-center justify-center text-[#E5C058]">
              {currentStep === "tracking" ? <Truck className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                {currentStep === "details" && (isAr ? "بيانات التوصيل والموقع" : "Delivery & Address")}
                {currentStep === "payment" && (isAr ? "طريقة الدفع الفاخرة" : "Payment Method")}
                {currentStep === "tracking" && (isAr ? "تتبع الطلب المباشر" : "Live Tracking")}
              </h3>
              <p className="text-[10px] text-stone-300">
                {currentStep === "tracking" ? `رقم الطلب: ${orderId}` : `إجمالي الطلب: ${totalAmount.toFixed(2)} ر.س`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={currentStep === "tracking" ? handleFinishClose : onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* مؤشر الخطوات */}
        {currentStep !== "tracking" && (
          <div className="bg-white border-b border-stone-200/80 px-6 py-3 flex items-center justify-center gap-4 text-xs font-bold text-stone-500">
            <div className={`flex items-center gap-1.5 ${currentStep === "details" ? "text-[#4A0E17]" : "text-emerald-700"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === "details" ? "bg-[#4A0E17] text-white" : "bg-emerald-600 text-white"}`}>
                {currentStep === "payment" ? <Check className="w-3 h-3" /> : "1"}
              </span>
              <span>{isAr ? "العنوان والموقع" : "Delivery"}</span>
            </div>

            <span className="w-8 h-[1px] bg-stone-300" />

            <div className={`flex items-center gap-1.5 ${currentStep === "payment" ? "text-[#4A0E17]" : "text-stone-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === "payment" ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-600"}`}>
                2
              </span>
              <span>{isAr ? "الدفع والإنهاء" : "Payment"}</span>
            </div>
          </div>
        )}

        {/* محتوى الشاشة */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 flex-1 overscroll-contain">

          {/* الخطوة 1: العنوان والتفاصيل */}
          {currentStep === "details" && (
            <form id={detailsFormId} onSubmit={handleProceedToPayment} className="space-y-4">

              {couponWarning && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-800 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">{couponWarning}</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h4 className="text-xs font-black text-[#4A0E17] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C59B27]" />
                    <span>{isAr ? "معلومات التوصيل والموقع" : "Delivery Information"}</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A0E17]/10 hover:bg-[#4A0E17]/20 text-[#4A0E17] rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A0E17]" />
                    ) : (
                      <Compass className="w-3.5 h-3.5 text-[#C59B27]" />
                    )}
                    <span>{isLocating ? (isAr ? "جاري تحديد موقعك..." : "Locating...") : (isAr ? "تحديد موقعي بالـ GPS" : "Use GPS Location")}</span>
                  </button>
                </div>

                {mapsLink && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>تم تحديد إحداثيات موقعك بدقة وسيتم إرفاقها للمندوب! 📍</span>
                    </span>
                    <a href={mapsLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-900 font-black underline flex items-center gap-1">
                      <span>معاينة الخريطة</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {isAr ? "الاسم الكامل *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={effectiveCustomerName}
                      onChange={(e) => { setCustomerName(e.target.value); setCouponWarning(null); }}
                      placeholder="مثال: محمد العتيبي"
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {isAr ? "رقم الجوال (واتساب) *" : "Phone Number *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={effectivePhone}
                      onChange={(e) => { setPhone(e.target.value); setCouponWarning(null); }}
                      placeholder="05XXXXXXXX"
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {isAr ? "المدينة *" : "City *"}
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold cursor-pointer"
                    >
                      <option value="الرياض">الرياض (Riyadh)</option>
                      <option value="جدة">جدة (Jeddah)</option>
                      <option value="الدمام">الدمام (Dammam)</option>
                      <option value="مكة المكرمة">مكة المكرمة (Makkah)</option>
                      <option value="المدينة المنورة">المدينة المنورة (Madinah)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {isAr ? "الحي *" : "District *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="مثال: حي المحمدية"
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isAr ? "الشارع / رقم المبنى أو تفاصيل المنزل" : "Street / House Details"}
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="اسم الشارع، رقم الشقة أو الفيلا"
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                  />
                </div>
              </div>

              {/* قسم الإهداء الفاخر */}
              <div className="bg-white p-4 rounded-3xl border border-stone-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
                      <Gift className="w-4 h-4 text-[#C59B27]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">
                        {isAr ? "هل هذا الطلب إهداء لشخص آخر؟" : "Is this order a gift?"}
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        {isAr ? "إضافة تغليف حريري وبطاقة إهداء فاخرة مجاناً" : "Free custom ribbon & gift card"}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="w-5 h-5 accent-[#4A0E17] rounded-md cursor-pointer"
                  />
                </div>

                {isGift && (
                  <div className="pt-3 border-t border-stone-100 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isAr ? "اسم المهدَى إليه:" : "Recipient Name:"}
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="اسم الشخص العزيز"
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isAr ? "رسالة الإهداء (تُكتب بخط عربي فاخر):" : "Gift Card Message:"}
                      </label>
                      <textarea
                        rows={2}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="اكتب تهنئتك هنا..."
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isAr ? "ملاحظات إضافية للمُخبز أو المندوب:" : "Special Instructions:"}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى تسليم الطلب عند الباب الخلفي..."
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                />
              </div>
            </form>
          )}

          {/* الخطوة 2: الدفع وملخص الطلب */}
          {currentStep === "payment" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2 shadow-2xs text-xs">
                <div className="flex justify-between font-bold text-stone-800 pb-2 border-b border-stone-100">
                  <span>{isAr ? "ملخص المنتجات:" : "Cart Summary:"}</span>
                  <span className="text-[#4A0E17]">{cart.length} أصناف</span>
                </div>
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-stone-600">
                    <span className="truncate max-w-[200px]">
                      {item.title} ({item.portion || item.portionNote || "افتراضي"})
                    </span>
                    <span className="font-bold">{(Number(item.price) * Number(item.quantity)).toFixed(2)} ر.س</span>
                  </div>
                ))}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>الخصم المطبق ({appliedCouponCode}):</span>
                    </span>
                    <span>- {discountAmount.toFixed(2)} ر.س</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-sm text-[#4A0E17] pt-2 border-t border-stone-100">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span>{totalAmount.toFixed(2)} ر.س</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  {isAr ? "اختر طريقة الدفع المناسبة:" : "Select Payment Method:"}
                </label>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("applepay")}
                  className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "applepay"
                      ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white px-2.5 py-1 rounded-lg text-xs font-black tracking-wider">
                      Pay
                    </span>
                    <span className="text-xs font-bold text-stone-900">Apple Pay</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    أسرع وأشمل
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("mada")}
                  className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "mada"
                      ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded-md">
                      MADA مدى
                    </span>
                    <span className="text-xs font-bold text-stone-900">بطاقة مدى البنكية</span>
                  </div>
                  <CreditCard className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-800 text-white text-[10px] font-black px-2 py-1 rounded-md">
                      VISA / MC
                    </span>
                    <span className="text-xs font-bold text-stone-900">البطاقات الائتمانية</span>
                  </div>
                  <CreditCard className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-1 rounded-md">
                      COD
                    </span>
                    <span className="text-xs font-bold text-stone-900">الدفع عند الاستلام</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* الخطوة 3: التتبع المباشر للطلب */}
          {currentStep === "tracking" && (
            <div className="space-y-5 animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm text-emerald-900">
                  {isAr ? "تم استلام طلبك وتمريره للواتساب بنجاح!" : "Order Placed Successfully!"}
                </h4>
                <p className="text-xs text-emerald-700">
                  {isAr
                    ? `شكراً ${effectiveCustomerName}، تم توثيق الفاتورة برقم (${orderId}) وجاري تحضير طلبك بعناية.`
                    : `Thank you ${effectiveCustomerName}, your order (${orderId}) is now registered.`}
                </p>

                {backupWhatsAppUrl && (
                  <div className="pt-2">
                    <a
                      href={backupWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>فتح محادثة الواتساب وتأكيد الطلب 📲</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-stone-100 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#4A0E17]" />
                    <span>وقت الوصول التقديري:</span>
                  </span>
                  <span className="text-[#4A0E17] font-black text-sm">{etaMinutes} دقيقة</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${trackingProgress >= 1 ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-500"}`}>
                      1
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-stone-900">تم تأكيد الطلب وإرسال الفاتورة</h5>
                      <p className="text-[10px] text-stone-500">تم استلام طلبك وتمريره للشيف للبدء بالتجهيز.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${trackingProgress >= 2 ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-500"}`}>
                      2
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-stone-900">التجهيز والخَبز في الفرن</h5>
                      <p className="text-[10px] text-stone-500">تجهيز الرقائق والسمن والقطر الدافئ.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${trackingProgress >= 3 ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-500"}`}>
                      3
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-stone-900">التغليف الملكي وتسليم المندوب</h5>
                      <p className="text-[10px] text-stone-500">وضع الصندوق والتغليف الحريري المخصص.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${trackingProgress >= 4 ? "bg-emerald-600 text-white animate-bounce" : "bg-stone-200 text-stone-500"}`}>
                      4
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-stone-900">جاري التوصيل إلى موقعك</h5>
                      <p className="text-[10px] text-stone-500">المندوب في طريقه إليك في حي {district || "المحدد"}.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات السفلية */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shadow-md">
          {currentStep === "details" && (
            <button
              type="submit"
              form={detailsFormId}
              className="w-full bg-[#4A0E17] hover:bg-[#36070E] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <span>{isAr ? "المتابعة لاختيار طريقة الدفع" : "Proceed to Payment"}</span>
              {dir === "rtl" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          )}

          {currentStep === "payment" && (
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep("details")}
                className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                تعديل
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isProcessing || cart.length === 0}
                className="flex-1 bg-[#4A0E17] hover:bg-[#36070E] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري معالجة وتأمين الطلب...</span>
                  </div>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <span>تأكيد وإرسال عبر الواتساب ({totalAmount.toFixed(2)} ر.س)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === "tracking" && (
            <button
              type="button"
              onClick={handleFinishClose}
              className="w-full bg-[#4A0E17] hover:bg-[#36070E] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <span>العودة للرئيسية</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
