"use client";

import React from "react";
import { Phone, MapPin, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#4A0E17] text-white border-t border-[#C59B27]/30 mt-6 py-5 px-4 mb-14 md:mb-0 shadow-2xl relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-xs text-center">
        
        {/* الشعار والعنوان الفاخر */}
        <div className="flex flex-col items-center space-y-0.5">
          <span className="font-black text-[#E5C058] font-brand text-sm tracking-[0.25em] uppercase drop-shadow-xs">
            BADEM BAKLAVA
          </span>
          <span className="text-[9px] text-stone-300 font-medium tracking-widest uppercase">
            {isAr ? "بقلاوة ملكية فاخرة" : "Royal Turkish Sweets"}
          </span>
        </div>

        {/* معلومات الموقع وأوقات العمل */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-stone-300 text-[11px]">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#E5C058] shrink-0" />
            <span>
              {isAr ? "الرياض - حي المحمدية - شارع التخصصي" : "Riyadh - Al Mohammadiyah - Tahlia St"}
            </span>
          </span>

          <span className="hidden sm:inline text-white/30">•</span>

          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#E5C058] shrink-0" />
            <span>
              {isAr ? "أوقات العمل: 4 م - 12 ص" : "Hours: 4 PM - 12 AM"}
            </span>
          </span>
        </div>

        {/* فاصل ذهبي ناعم */}
        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#C59B27]/40 to-transparent my-0.5" />

        {/* وسائل التواصل والحقوق */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-stone-200">
          <a
            href="https://instagram.com/badem_sa"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-[#E5C058] flex items-center gap-1.5 font-bold transition duration-200 group cursor-pointer text-[11px]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[#E5C058] group-hover:scale-110 transition-transform">
              <InstagramIcon className="w-3 h-3" />
            </div>
            <span>@badem_sa</span>
          </a>

          <a
            href="tel:+966500000000"
            aria-label={isAr ? "اتصل بنا" : "Call us"}
            className="hover:text-[#E5C058] flex items-center gap-1.5 font-bold transition duration-200 group cursor-pointer text-[11px]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[#E5C058] group-hover:scale-110 transition-transform">
              <Phone className="w-3 h-3" />
            </div>
            <span>{isAr ? "اتصل بنا" : "Contact Us"}</span>
          </a>
        </div>

        {/* حقوق النشر */}
        <span className="text-[10px] text-stone-400 font-medium tracking-wide">
          © {currentYear} BADEM. {isAr ? "جميع الحقوق محفوظة" : "All rights reserved"}
        </span>

      </div>
    </footer>
  );
};