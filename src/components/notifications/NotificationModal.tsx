"use client";

import React, { useEffect } from "react";
import { X, Bell, CheckCheck, Trash2, Package, Coins, Sparkles, Clock, AlertCircle } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";

export const NotificationModal: React.FC = () => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications = [], 
    unreadNotificationsCount = 0, 
    markAllNotificationsAsRead, 
    clearNotifications,
    setIsProfileOpen
  } = useUser();
  const { language } = useLanguage();
  const isAr = language === "ar";

  // إغلاق النافذة عبر زر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isNotificationsOpen) {
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNotificationsOpen, setIsNotificationsOpen]);

  if (!isNotificationsOpen) return null;

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "order":
        return {
          icon: <Package className="w-4 h-4 text-[#C59B27]" />,
          bg: "bg-[#C59B27]/10 border-[#C59B27]/20"
        };
      case "points":
        return {
          icon: <Coins className="w-4 h-4 text-emerald-600" />,
          bg: "bg-emerald-50 border-emerald-200"
        };
      case "alert":
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          bg: "bg-rose-50 border-rose-200"
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-[#E5C058]" />,
          bg: "bg-[#4A0E17]/10 border-[#4A0E17]/20"
        };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "مركز التنبيهات المباشرة" : "Notifications Center"}
    >
      {/* خلفية للإغلاق عند النقر خارج الإطار */}
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={() => setIsNotificationsOpen(false)}
        aria-label="Close modal overlay"
      />

      {/* نافذة الإشعارات */}
      <div className="bg-[#FAF5ED] w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[85vh] flex flex-col relative z-10 text-[#2D2321] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* الترويسة الفاخرة */}
        <div className="bg-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#E5C058] relative shadow-xs">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-[#4A0E17] animate-pulse" />
              )}
            </div>
            <div>
              <span className="text-[9px] tracking-[0.25em] text-[#E5C058] font-black uppercase font-brand block leading-tight">
                BADEM ALERTS
              </span>
              <h3 className="font-black text-sm sm:text-base text-white">
                {isAr ? "مركز التنبيهات المباشرة" : "Live Notifications"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationsOpen(false)}
            aria-label={isAr ? "إغلاق التنبيهات" : "Close notifications"}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط الإجراءات السريعة */}
        {notifications.length > 0 && (
          <div className="bg-white px-4 py-2.5 border-b border-stone-200/80 flex items-center justify-between text-[11px] font-bold text-stone-500 shadow-2xs">
            <span className="text-stone-700">
              {isAr ? `لديك ${notifications.length} إشعار` : `${notifications.length} Notifications`}
            </span>
            <div className="flex items-center gap-3">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="flex items-center gap-1 text-[#4A0E17] hover:underline active:scale-95 transition cursor-pointer font-black"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحديد كمقروء" : "Mark read"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearNotifications}
                className="flex items-center gap-1 text-stone-400 hover:text-rose-600 active:scale-95 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? "مسح الكل" : "Clear"}</span>
              </button>
            </div>
          </div>
        )}

        {/* قائمة الإشعارات */}
        <div className="p-4 space-y-2.5 overflow-y-auto no-scrollbar flex-1 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-stone-200/80 text-center text-stone-400 space-y-2 shadow-2xs my-auto">
              <div className="w-12 h-12 rounded-full bg-[#4A0E17]/5 flex items-center justify-center mx-auto text-stone-400 mb-2">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-stone-700">
                {isAr ? "لا توجد إشعارات جديدة حالياً" : "No new notifications"}
              </p>
              <p className="text-[10px] text-stone-400 leading-relaxed max-w-xs mx-auto">
                {isAr 
                  ? "ستظهر هنا تحديثات طلباتك، العروض الحصرية، وإشعارات النقاط فورياً." 
                  : "Order status updates, special offers, and reward points will appear here."}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const badge = getNotificationBadge(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.orderId) {
                      setIsNotificationsOpen(false);
                      setIsProfileOpen(true);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                    notif.orderId ? "cursor-pointer active:scale-[0.99]" : "cursor-default"
                  } ${
                    notif.isRead
                      ? "bg-white/80 border-stone-200/70 text-stone-700 shadow-2xs"
                      : "bg-white border-[#4A0E17]/30 text-stone-900 shadow-xs ring-1 ring-[#4A0E17]/10"
                  }`}
                >
                  {/* أيقونة نوع الإشعار */}
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${badge.bg}`}>
                    {badge.icon}
                  </div>

                  {/* تفاصيل التنبيه */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4A0E17] shrink-0" />
                        )}
                        <h4 className="text-xs font-black text-[#4A0E17] truncate leading-tight">
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[9px] text-stone-400 flex items-center gap-1 shrink-0 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{notif.date}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 leading-relaxed break-words">
                      {notif.message}
                    </p>

                    {notif.orderId && (
                      <span className="inline-block text-[9px] text-[#C59B27] font-black underline underline-offset-2 pt-0.5">
                        {isAr ? "اضغط لعرض تفاصيل الطلب ←" : "View order details →"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};