"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase/supabase";

interface BannerItem {
  id?: string;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  tag_ar?: string;
  tag_en?: string;
  image_url?: string;
}

export const PromoCarousel: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const defaultBanners: BannerItem[] = [
    {
      title_en: "ROYAL SARMA.\nPURE PISTACHIO.",
      title_ar: "سارما ملكية.\nفستق عنتاب خالص.",
      subtitle_en: "Royal green rolls with over 85% pure Antep pistachios.",
      subtitle_ar: "رولات خضراء فاخرة بأكثر من 85% من فستق عنتاب النقي.",
      tag_en: "Special Offer",
      tag_ar: "عرض حصري",
      image_url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop",
    },
  ];

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0 && !error) {
          setBanners(data);
        } else {
          setBanners(defaultBanners);
        }
      } catch {
        setBanners(defaultBanners);
      }
    };
    fetchBanners();
  }, []);

  const activeBanners = banners.length > 0 ? banners : defaultBanners;
  const current = activeBanners[currentIndex] || activeBanners[0];

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const scrollToMenu = () => {
    const el = document.getElementById("categories-section") || document.getElementById("menu-section") || document.getElementById("products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-3 sm:px-6 my-3 sm:my-6">
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#380E14] border border-white/5 shadow-xl p-4 sm:p-8 md:p-10">
        
        {/* المحتوى الداخلي المتناسق */}
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* 1. جانب النصوص والزر */}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3.5 text-white rtl:text-right ltr:text-left z-10">
            
            {/* العنوان الرئيسي */}
            <h2 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black tracking-wide text-[#FAF5ED] uppercase leading-tight drop-shadow-sm whitespace-pre-line break-words">
              {isAr ? current.title_ar : current.title_en}
            </h2>

            {/* الوصف */}
            {(current.subtitle_ar || current.subtitle_en) && (
              <p className="text-[10px] sm:text-xs md:text-sm text-stone-300/90 font-serif leading-relaxed line-clamp-2 max-w-xs break-words">
                {isAr ? current.subtitle_ar : current.subtitle_en}
              </p>
            )}

            {/* زر الطلب */}
            <div className="pt-1 sm:pt-2">
              <button
                onClick={scrollToMenu}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#FAF5ED] hover:bg-white text-[#380E14] font-serif font-bold text-[11px] sm:text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer group"
              >
                <span>{isAr ? "اطلب الآن" : "Explore Now"}</span>
                {isAr ? (
                  <ArrowLeft className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform group-hover:-translate-x-1" />
                ) : (
                  <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 transition-transform group-hover:translate-x-1" />
                )}
              </button>
            </div>
          </div>

          {/* 2. إطار صورة المنتج الثابت والمتناسق */}
          <div className="w-28 sm:w-48 md:w-64 h-28 sm:h-48 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0 bg-black/20">
            <img
              src={current.image_url || "/hero-baklava.png"}
              alt={isAr ? current.title_ar : current.title_en}
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>

        {/* 3. مؤشرات التنقل السفلية */}
        {activeBanners.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-3 sm:pt-4">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? "w-6 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};