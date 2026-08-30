"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, Heart, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "favorite" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Container الإشعارات العائم أعلى الشاشة */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-[#4A0E17] text-white border border-[#E5C058]/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {t.type === "favorite" && <Heart className="w-5 h-5 text-rose-400 fill-rose-400 shrink-0 animate-bounce" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {t.type === "info" && <Info className="w-5 h-5 text-[#E5C058] shrink-0" />}
              
              <span className="text-xs font-bold leading-tight">{t.message}</span>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-stone-400 hover:text-white p-1 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};