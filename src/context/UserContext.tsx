"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [points, setPoints] = useState(0);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 1️⃣ استرجاع البيانات المحلية المحفوظة
  useEffect(() => {
    try {
      const savedAddresses = localStorage.getItem("badem_user_addresses");
      const savedOrders = localStorage.getItem("badem_user_orders");
      const savedName = localStorage.getItem("badem_user_name");
      const savedPhone = localStorage.getItem("badem_user_phone");
      const savedNotifs = localStorage.getItem("badem_user_notifications");

      if (savedName) setUserName(savedName);
      if (savedPhone) setUserPhone(savedPhone);
      if (savedAddresses) setAddresses(JSON.parse(savedAddresses));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    } catch (e) {
      console.error("Local load error:", e);
    }
    setIsLoaded(true);
  }, []);

  // 2️⃣ الحفظ المحلي التلقائي عند أي تحديث
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("badem_user_addresses", JSON.stringify(addresses));
      localStorage.setItem("badem_user_orders", JSON.stringify(orders));
      localStorage.setItem("badem_user_name", userName);
      localStorage.setItem("badem_user_phone", userPhone);
      localStorage.setItem("badem_user_notifications", JSON.stringify(notifications));
    }
  }, [addresses, orders, userName, userPhone, notifications, isLoaded]);

  // صوت تنبيه ناعم للإشعار الجديد
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.log(e);
    }
  };

  // دالة إضافة إشعار جديد
  const pushNotification = (title: string, message: string, type: "order" | "points" | "promo", orderId?: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      date: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
      orderId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    playNotificationSound();
  };

  // حساب النقاط على قيمة المنتجات بمعدل الإعدادات
  const syncPointsWithDatabase = useCallback(async () => {
    if (!userPhone.trim()) {
      setPoints(0);
      return;
    }

    try {
      const { data: settings } = await supabase
        .from("store_settings")
        .select("points_per_sar")
        .eq("id", "loyalty")
        .single();

      const rate = settings?.points_per_sar ? Number(settings.points_per_sar) : 1;

      const { data: completedOrders } = await supabase
        .from("orders")
        .select("subtotal, total_amount, delivery_fee, status")
        .eq("customer_phone", userPhone.trim())
        .eq("status", "completed");

      if (completedOrders) {
        const totalEarned = completedOrders.reduce((sum, ord) => {
          const productAmount = parseFloat(ord.subtotal || ord.total_amount || "0");
          return sum + Math.floor(productAmount * rate);
        }, 0);

        const redeemed = Number(localStorage.getItem(`badem_redeemed_${userPhone.trim()}`) || "0");
        const available = Math.max(0, totalEarned - redeemed);
        setPoints(available);
      }
    } catch (err) {
      console.error(err);
    }
  }, [userPhone]);

  // الاستماع اللحظي للإشعار بحساب دقيق
  useEffect(() => {
    if (!userPhone.trim()) return;

    syncPointsWithDatabase();

    const channel = supabase
      .channel(`realtime-notifications-${userPhone.trim()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload: any) => {
          const updated = payload.new;
          if (updated && updated.customer_phone === userPhone.trim()) {
            
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
                .single();
              const rate = settings?.points_per_sar ? Number(settings.points_per_sar) : 1;
              
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
  }, [userPhone, syncPointsWithDatabase]);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addPoints = (amount: number) => setPoints((prev) => prev + amount);

  const redeemPoints = (cost: number): boolean => {
    if (points >= cost) {
      setPoints((prev) => prev - cost);
      if (userPhone.trim()) {
        const current = Number(localStorage.getItem(`badem_redeemed_${userPhone.trim()}`) || "0");
        localStorage.setItem(`badem_redeemed_${userPhone.trim()}`, String(current + cost));
      }
      pushNotification(
        "🎟️ تم استبدال النقاط بنجاح",
        `تم استبدال ${cost} نقطة بنجاح، كود الخصم جاهز في محفظتك لاستخدامه في السلة.`,
        "points"
      );
      return true;
    }
    return false;
  };

  const addAddress = (addr: Omit<SavedAddress, "id">) => {
    setAddresses((prev) => [...prev, { ...addr, id: Date.now().toString() }]);
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const addOrder = async (orderData: any) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}`;
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
  };

  const resetAllUserData = () => {
    localStorage.clear();
    setUserName("");
    setUserPhone("");
    setPoints(0);
    setAddresses([]);
    setOrders([]);
    setNotifications([]);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <UserContext.Provider
      value={{
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};