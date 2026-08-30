"use client";

import React from "react";
import { Phone, MapPin } from "lucide-react";

// شعار إنستغرام مدمج كـ SVG خفيف وسريع بدون أي مكتبات خارجية
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#4A0E17] text-white border-t border-[#C59B27]/40 mt-12 py-5 px-4 hidden md:block shadow-2xl">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        
        {/* Left Side: Brand Name & Address Info */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#E5C058] font-brand text-sm tracking-widest uppercase drop-shadow-xs">
            BADEM BAKLAVA
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-1.5 text-stone-200">
            <MapPin className="w-3.5 h-3.5 text-[#E5C058]" />
            الرياض - حي المحمدية - شارع التخصصي | أوقات العمل: 4 م - 12 ص
          </span>
        </div>

        {/* Right Side: Social Media & Contact Links */}
        <div className="flex items-center gap-6 text-stone-200">
          <a
            href="https://instagram.com/badem_sa"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#E5C058] flex items-center gap-1.5 font-medium transition duration-200"
          >
            <InstagramIcon className="w-4 h-4 text-[#E5C058]" />
            <span>@badem_sa</span>
          </a>
          <a
            href="tel:+966500000000"
            className="hover:text-[#E5C058] flex items-center gap-1.5 font-medium transition duration-200"
          >
            <Phone className="w-4 h-4 text-[#E5C058]" />
            <span>اتصل بنا</span>
          </a>
        </div>

      </div>
    </footer>
  );
};