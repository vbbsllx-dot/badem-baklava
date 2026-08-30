"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

// مكون العنصر الطائر الفردي لضمان تشغيل الحركة فوراً على كرت الشاشة
const SingleFlyingItem = ({ item }: { item: any }) => {
  const [fly, setFly] = useState(false);

  useEffect(() => {
    // تفعيل الحركة فور الرسم على الشاشة
    const timer = setTimeout(() => setFly(true), 20);
    return () => clearTimeout(timer);
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
        transform: fly
          ? `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.2) rotate(15deg)`
          : "translate3d(0, 0, 0) scale(1.15) rotate(0deg)",
        opacity: fly ? 0.1 : 1,
        transition: "transform 0.42s cubic-bezier(0.18, 0.9, 0.32, 1.1), opacity 0.42s ease-in",
        willChange: "transform, opacity",
      }}
    >
      <div className="w-full h-full rounded-full overflow-hidden shadow-2xl border-2 border-[#E5C058] bg-[#4A0E17] flex items-center justify-center">
        <img
          src={item.image}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    </div>
  );
};

export const FlyingCartAnimation: React.FC = () => {
  const { flyingItems } = useCart();

  if (flyingItems.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {flyingItems.map((item) => (
        <SingleFlyingItem key={item.id} item={item} />
      ))}
    </div>
  );
};