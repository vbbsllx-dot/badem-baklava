"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { CheckCircle2, Heart, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "favorite" | "error" | "info";

export interface Toast {
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
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // تنظيف كافة المؤقتات عند تفريغ المكون لحماية الذاكرة
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      setToasts((prev) => {
        // حصر الإشعارات بحد أقصى 3 في نفس الوقت لمنع حجب الشاشة
        const currentToasts = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
        return [...currentToasts, { id, message, type }];
      });

      const timer = setTimeout(() => {
        removeToast(id);
      }, 3200);

      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* شريط الإشعارات العائم أعلى الشاشة مع دعم قارئات الشاشة */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none select-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto bg-[#4A0E17]/95 backdrop-blur-md text-white border border-[#E5C058]/40 ring-1 ring-black/10 shadow-[0_10px_25px_rgba(74,14,23,0.35)] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-300"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {t.type === "favorite" && (
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400 shrink-0 animate-bounce" />
              )}
              {t.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              {t.type === "info" && (
                <Info className="w-5 h-5 text-[#E5C058] shrink-0" />
              )}

              <span className="text-xs font-bold leading-snug break-words">
                {t.message}
              </span>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="إغلاق التنبيه"
              className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 active:scale-90 transition-all shrink-0 cursor-pointer"
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
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};