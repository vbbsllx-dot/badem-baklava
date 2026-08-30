"use client";

import React from "react";
import { X, Bell, CheckCheck, Trash2, Package, Coins, Sparkles, Clock } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";

export const NotificationModal: React.FC = () => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications, 
    unreadNotificationsCount, 
    markAllNotificationsAsRead, 
    clearNotifications,
    setIsProfileOpen
  } = useUser();
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!isNotificationsOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-4 h-4 text-[#C59B27]" />;
      case "points":
        return <Coins className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#E5C058]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF5ED] w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[85vh] flex flex-col relative text-[#2D2321]">
        
        {/* Header */}
        <div className="bg-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#E5C058] relative">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute top-2 right-2 ring-2 ring-[#4A0E17]" />
              )}
            </div>
            <div>
              <span className="text-[9px] tracking-widest text-[#E5C058] font-black uppercase font-brand">
                BADEM LIVE ALERTS
              </span>
              <h3 className="font-black text-base text-white">
                {isAr ? "مركز التنبيهات المباشرة" : "Live Notifications"}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="bg-white px-4 py-2 border-b border-stone-200/80 flex items-center justify-between text-[11px] font-bold text-stone-500">
            <span className="text-stone-700">
              {isAr ? `لديك ${notifications.length} إشعار` : `${notifications.length} Notifications`}
            </span>
            <div className="flex items-center gap-3">
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="flex items-center gap-1 text-[#4A0E17] hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحديد كمقروء" : "Mark read"}</span>
                </button>
              )}
              <button
                onClick={clearNotifications}
                className="flex items-center gap-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? "مسح الكل" : "Clear"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1">
          {notifications.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-stone-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto stroke-1 text-stone-300 mb-1" />
              <p className="text-xs font-bold text-stone-600">{isAr ? "لا توجد إشعارات جديدة حالياً" : "No new notifications"}</p>
              <p className="text-[10px] text-stone-400">{isAr ? "ستظهر هنا تحديثات طلباتك وإشعارات النقاط فورياً." : "Order status updates and points will appear here."}</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.orderId) {
                    setIsNotificationsOpen(false);
                    setIsProfileOpen(true);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 shadow-2xs ${
                  notif.isRead
                    ? "bg-white border-stone-200/80 text-stone-700"
                    : "bg-[#FAF5ED] border-[#4A0E17]/25 text-stone-900 shadow-xs"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-black text-[#4A0E17] truncate">{notif.title}</h4>
                    <span className="text-[9px] text-stone-400 flex items-center gap-0.5 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{notif.date}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};