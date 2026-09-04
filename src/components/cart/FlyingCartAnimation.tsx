"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

// واجهة بيانات العنصر الطائر لتفادي استخدام any
export interface FlyingItemData {
  id: string | number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  image?: string;
}

// مكون العنصر الطائر الفردي - معالجة مباشرة على كرت الشاشة (GPU Accelerated)
const SingleFlyingItem: React.FC<{ item: FlyingItemData }> = ({ item }) => {
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    // ⚡ استخدام requestAnimationFrame المزدوج لضمان تفعيل الحركة فور أول إطار رسم للشاشة بدون تأخير
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsFlying(true);
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  const deltaX = item.endX - item.startX;
  const deltaY = item.endY - item.startY;

  return (
    <div
      className="fixed pointer-events-none z-[99999]"
      style={{
        left: `${item.startX - 22}px`,
        top: `${item.startY - 22}px`,
        width: "44px",
        height: "44px",
        transform: isFlying
          ? `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.18) rotate(18deg)`
          : "translate3d(0, 0, 0) scale(1.15) rotate(0deg)",
        opacity: isFlying ? 0 : 1,
        transition:
          "transform 0.42s cubic-bezier(0.18, 0.9, 0.32, 1.1), opacity 0.42s cubic-bezier(0.4, 0, 1, 1)",
        willChange: "transform, opacity",
      }}
    >
      {/* إطار العنصر الملكي مع الهالة الذهبية */}
      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-2 border-[#E5C058] bg-[#4A0E17] ring-2 ring-[#C59B27]/40 flex items-center justify-center">
        <Image
          src={item.image || "/hero-baklava.png"}
          alt="Flying Sweet"
          fill
          sizes="44px"
          quality={70}
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
};

export const FlyingCartAnimation: React.FC = () => {
  const { flyingItems } = useCart();

  if (!flyingItems || flyingItems.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden" 
      aria-hidden="true"
    >
      {flyingItems.map((item) => (
        <SingleFlyingItem key={item.id} item={item} />
      ))}
    </div>
  );
};