import type { Metadata } from "next";
import { Tajawal, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import { FlyingCartAnimation } from "@/components/cart/FlyingCartAnimation";
import { UserProvider } from "@/context/UserContext";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "BADEM BAKLAVA | متجر بادَم للبقلاوة الفاخرة",
  description: "أفخر أنواع البقلاوة التركية الفاخرة بأجود أنواع الفستق العنتابي والسمن البلدي الصافي.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen bg-[#F4ECE1] text-[#2D2321]">
       <ToastProvider>
  <LanguageProvider>
    <UserProvider>
      <WishlistProvider>
        <CartProvider>
          <FlyingCartAnimation />
          {children}
        </CartProvider>
      </WishlistProvider>
    </UserProvider>
  </LanguageProvider>
</ToastProvider>
      </body>
    </html>
  );
}