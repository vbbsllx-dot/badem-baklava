"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/supabase";

export interface SavedAddress {
  id: string;
  title: string;
  city: string;
  district: string;
  street: string;
  isDefault?: boolean;
}

export interface PastOrder {
  id: string;
  date: string;
  items: any[];
  totalAmount: number;
  status: string;
  paymentMethod: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "order" | "points" | "promo";
  date: string;
  isRead: boolean;
  orderId?: string;
}

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  points: number;
  addPoints: (amount: number) => void;
  redeemPoints: (cost: number) => boolean;
  addresses: SavedAddress[];
  addAddress: (addr: Omit<SavedAddress, "id">) => void;
  deleteAddress: (id: string) => void;
  orders: PastOrder[];
  addOrder: (order: any) => Promise<void>;
  resetAllUserData: () => void;
  syncPointsWithDatabase: () => Promise<void>;
  // النوافذ
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isRewardsOpen: boolean;
  setIsRewardsOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  // الإشعارات
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// مفاتيح التخزين المحددة لمنع تداخل أو مسح باقي بيانات المتجر
const STORAGE_KEYS = {
  NAME: "badem_user_name",
  PHONE: "badem_user_phone",
  ADDRESSES: "badem_user_addresses",
  ORDERS: "badem_user_orders",
  NOTIFICATIONS: "badem_user_notifications",
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [points, setPoints] = useState(0);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // حالات النوافذ المنبثقة
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // مرجع ثابت لمحرك الصوت لمنع تراكم الـ AudioContext في الذاكرة
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1️⃣ استرجاع البيانات بأمان عند بدء تشغيل المتصفح
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedName = localStorage.getItem(STORAGE_KEYS.NAME);
        const savedPhone = localStorage.getItem(STORAGE_KEYS.PHONE);
        const savedAddresses = localStorage.getItem(STORAGE_KEYS.ADDRESSES);
        const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

        if (savedName) setUserName(savedName);
        if (savedPhone) setUserPhone(savedPhone);
        if (savedAddresses) {
          const parsed = JSON.parse(savedAddresses);
          if (Array.isArray(parsed)) setAddresses(parsed);
        }
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) setOrders(parsed);
        }
        if (savedNotifs) {
          const parsed = JSON.parse(savedNotifs);
          if (Array.isArray(parsed)) setNotifications(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load user state from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2️⃣ الحفظ التلقائي الآمن للبيانات عند أي تحديث بعد التحميل الأولي
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEYS.NAME, userName);
      localStorage.setItem(STORAGE_KEYS.PHONE, userPhone);
      localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Failed to persist user state:", e);
    }
  }, [addresses, orders, userName, userPhone, notifications, isLoaded]);

  // تشغيل نغمة الإشعار باستخدام Web Audio API النظيف
  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtxClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // نغمة C5 الملكية
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // نغمة G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {
      // تجاهل حظر الصوت التلقائي من المتصفح دون تعليق التطبيق
    }
  }, []);

  // إضافة إشعار جديد إلى القائمة وتشغيل النغمة
  const pushNotification = useCallback(
    (title: string, message: string, type: "order" | "points" | "promo", orderId?: string) => {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        message,
        type,
        date: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        isRead: false,
        orderId,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      playNotificationSound();
    },
    [playNotificationSound]
  );

  // حساب ومزامنة النقاط مع قاعدة البيانات بناءً على الطلبات المكتملة
  const syncPointsWithDatabase = useCallback(async () => {
    const cleanPhone = userPhone.trim();
    if (!cleanPhone) {
      setPoints(0);
      return;
    }

    try {
      const [{ data: settings }, { data: completedOrders }] = await Promise.all([
        supabase
          .from("store_settings")
          .select("points_per_sar")
          .eq("id", "loyalty")
          .maybeSingle(),
        supabase
          .from("orders")
          .select("subtotal, total_amount, delivery_fee, status")
          .eq("customer_phone", cleanPhone)
          .eq("status", "completed"),
      ]);

      const rate = Number(settings?.points_per_sar) || 1;

      if (completedOrders) {
        const totalEarned = completedOrders.reduce((sum, ord) => {
          const productAmount = parseFloat(ord.subtotal || ord.total_amount || "0");
          return sum + Math.floor(productAmount * rate);
        }, 0);

        const redeemed = Number(localStorage.getItem(`badem_redeemed_${cleanPhone}`) || "0");
        const available = Math.max(0, totalEarned - redeemed);
        setPoints(available);
      }
    } catch (err) {
      console.error("Points sync error:", err);
    }
  }, [userPhone]);

  // الاشتراك اللحظي في تحديثات الطلبات وإرسال الإشعارات للعميل
  useEffect(() => {
    const cleanPhone = userPhone.trim();
    if (!cleanPhone) return;

    syncPointsWithDatabase();

    const channel = supabase
      .channel(`realtime-orders-${cleanPhone}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload: any) => {
          const updated = payload.new;
          if (updated && updated.customer_phone === cleanPhone) {
            if (updated.status === "baking") {
              pushNotification(
                "🔥 جاري خَبز وتجهيز طلبك",
                `طلبك رقم #${updated.id} تم تسليمه للشيف وهو الآن في الفرن والتجهيز.`,
                "order",
                updated.id
              );
            } else if (updated.status === "delivering") {
              pushNotification(
                "🚚 طلبك خرج مع المندوب",
                `المندوب استلم طلبك #${updated.id} وهو في طريقه الآن إلى موقعك.`,
                "order",
                updated.id
              );
            } else if (updated.status === "completed") {
              const { data: settings } = await supabase
                .from("store_settings")
                .select("points_per_sar")
                .eq("id", "loyalty")
                .maybeSingle();

              const rate = Number(settings?.points_per_sar) || 1;
              const productAmount = parseFloat(updated.subtotal || updated.total_amount || "0");
              const earnedPts = Math.floor(productAmount * rate);

              pushNotification(
                "✅ تم تسليم الطلب وإضافة النقاط!",
                `تم تسليم طلبك بنجاح، وتمت إضافة ${earnedPts} نقطة مكافأة إلى رصيدك الملكي 🎉`,
                "points",
                updated.id
              );
              syncPointsWithDatabase();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userPhone, syncPointsWithDatabase, pushNotification]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addPoints = useCallback((amount: number) => {
    setPoints((prev) => prev + amount);
  }, []);

  const redeemPoints = useCallback(
    (cost: number): boolean => {
      if (points >= cost) {
        setPoints((prev) => prev - cost);
        const cleanPhone = userPhone.trim();
        if (cleanPhone) {
          const current = Number(localStorage.getItem(`badem_redeemed_${cleanPhone}`) || "0");
          localStorage.setItem(`badem_redeemed_${cleanPhone}`, String(current + cost));
        }

        pushNotification(
          "🎟️ تم استبدال النقاط بنجاح",
          `تم استبدال ${cost} نقطة بنجاح، كود الخصم جاهز في محفظتك لاستخدامه في السلة.`,
          "points"
        );
        return true;
      }
      return false;
    },
    [points, userPhone, pushNotification]
  );

  const addAddress = useCallback((addr: Omit<SavedAddress, "id">) => {
    setAddresses((prev) => [...prev, { ...addr, id: `addr-${Date.now()}` }]);
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addOrder = useCallback(
    async (orderData: any) => {
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      const newOrder: PastOrder = { ...orderData, date: formattedDate, status: "pending" };
      setOrders((prev) => [newOrder, ...prev]);

      if (orderData.phone && orderData.phone !== userPhone) setUserPhone(orderData.phone);
      if (orderData.customerName && orderData.customerName !== userName) setUserName(orderData.customerName);

      pushNotification(
        "📦 تم استلام طلبك بنجاح",
        `تم استلام طلبك رقم #${orderData.id} وجاري مراجعته وتأكيده عبر الواتساب.`,
        "order",
        orderData.id
      );
    },
    [userName, userPhone, pushNotification]
  );

  // تصفير بيانات المستخدم فقط دون مسح السلة أو لغة المتجر
  const resetAllUserData = useCallback(() => {
    const cleanPhone = userPhone.trim();
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      if (cleanPhone) {
        localStorage.removeItem(`badem_redeemed_${cleanPhone}`);
      }
    }

    setUserName("");
    setUserPhone("");
    setPoints(0);
    setAddresses([]);
    setOrders([]);
    setNotifications([]);
  }, [userPhone]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // دمج قيم السياق بـ useMemo لمنع إعادة تصيير مكونات المتجر عند كل تحديث
  const contextValue = useMemo(
    () => ({
      userName,
      setUserName,
      userPhone,
      setUserPhone,
      points,
      addPoints,
      redeemPoints,
      addresses,
      addAddress,
      deleteAddress,
      orders,
      addOrder,
      resetAllUserData,
      syncPointsWithDatabase,
      isProfileOpen,
      setIsProfileOpen,
      isRewardsOpen,
      setIsRewardsOpen,
      isNotificationsOpen,
      setIsNotificationsOpen,
      isMenuOpen,
      setIsMenuOpen,
      notifications,
      unreadNotificationsCount,
      markAllNotificationsAsRead,
      clearNotifications,
    }),
    [
      userName,
      userPhone,
      points,
      addPoints,
      redeemPoints,
      addresses,
      addAddress,
      deleteAddress,
      orders,
      addOrder,
      resetAllUserData,
      syncPointsWithDatabase,
      isProfileOpen,
      isRewardsOpen,
      isNotificationsOpen,
      isMenuOpen,
      notifications,
      unreadNotificationsCount,
      markAllNotificationsAsRead,
      clearNotifications,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};