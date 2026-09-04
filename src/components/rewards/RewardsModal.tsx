"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Gift,
  Star,
  Sparkles,
  Loader2,
  Check,
  Lock,
  Ticket,
  ArrowRight,
  Copy,
  CheckCheck,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase/supabase";

interface LoyaltyRewardItem {
  id: string;
  title_ar: string;
  title_en: string;
  discount_percent: number;
  points_required: number;
}

interface SavedCoupon {
  code: string;
  discount_percent: number;
  created_at: string;
}

export const RewardsModal: React.FC = () => {
  const { isRewardsOpen, setIsRewardsOpen, points = 0, redeemPoints } = useUser();
  const { applyCoupon, setIsCartOpen } = useCart();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"rewards" | "my_coupons">("rewards");
  const [rewards, setRewards] = useState<LoyaltyRewardItem[]>([]);
  const [myCoupons, setMyCoupons] = useState<SavedCoupon[]>([]);
  const [pointsPerSar, setPointsPerSar] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // إغلاق النافذة عبر مفتاح Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isRewardsOpen) {
        setIsRewardsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRewardsOpen, setIsRewardsOpen]);

  // تحميل المكافآت والتحقق من الكوبونات المحفوظة
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. جلب قائمة المكافآت وإعدادات النقاط
      const [rewardsRes, settingsRes] = await Promise.all([
        supabase
          .from("loyalty_rewards")
          .select("*")
          .order("points_required", { ascending: true }),
        supabase
          .from("store_settings")
          .select("*")
          .eq("id", "loyalty")
          .maybeSingle(),
      ]);

      if (rewardsRes.data) {
        setRewards(rewardsRes.data);
      }

      if (settingsRes.data?.points_per_sar) {
        setPointsPerSar(Number(settingsRes.data.points_per_sar));
      }

      // 2. فحص الكوبونات المستبدلة سابقاً وتحديث الصالح منها فقط
      try {
        const stored = localStorage.getItem("badem_saved_coupons");
        const localCoupons: SavedCoupon[] = stored ? JSON.parse(stored) : [];

        if (localCoupons.length > 0) {
          const codes = localCoupons.map((c) => c.code);
          const { data: validCoupons } = await supabase
            .from("coupons")
            .select("code, discount_percent, created_at, is_used")
            .in("code", codes)
            .eq("is_used", false);

          if (validCoupons) {
            setMyCoupons(validCoupons);
            localStorage.setItem("badem_saved_coupons", JSON.stringify(validCoupons));
          }
        } else {
          setMyCoupons([]);
        }
      } catch (storageErr) {
        console.warn("LocalStorage coupons parse error:", storageErr);
      }
    } catch (err) {
      console.error("Error loading loyalty rewards:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRewardsOpen) {
      loadData();
    }
  }, [isRewardsOpen, loadData]);

  if (!isRewardsOpen) return null;

  // استبدال النقاط وتوليد الكوبون الفوري
  const handleRedeem = async (reward: LoyaltyRewardItem) => {
    if (points < reward.points_required) {
      showToast(isAr ? "رصيد نقاطك غير كافٍ لهذا الخصم ❌" : "Insufficient points ❌", "error");
      return;
    }

    setRedeemingId(reward.id);
    try {
      const generatedCode = `BADEM-${reward.discount_percent}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. إنشاء الكوبون في Supabase
      const { error: insertError } = await supabase.from("coupons").insert([
        {
          code: generatedCode,
          discount_percent: reward.discount_percent,
          is_used: false,
          is_active: true,
        },
      ]);

      if (insertError) throw insertError;

      // 2. خصم النقاط من رصيد العميل
      redeemPoints(reward.points_required);

      // 3. حفظ الكوبون في المحفظة المحلية
      const newSavedCoupon: SavedCoupon = {
        code: generatedCode,
        discount_percent: reward.discount_percent,
        created_at: new Date().toISOString(),
      };

      const updatedList = [newSavedCoupon, ...myCoupons];
      setMyCoupons(updatedList);
      try {
        localStorage.setItem("badem_saved_coupons", JSON.stringify(updatedList));
      } catch {
        // تجاهل أخطاء مساحة التخزين الصامتة
      }

      showToast(
        isAr
          ? `🎉 تم الاستبدال بنجاح! تم حفظ الكوبون (${generatedCode}) في محفظتك`
          : `🎉 Reward saved to your wallet: (${generatedCode})!`,
        "success"
      );

      setActiveTab("my_coupons");
    } catch (err) {
      console.error("Error redeeming loyalty reward:", err);
      showToast(isAr ? "تعذر الاستبدال حالياً، يرجى المحاولة لاحقاً" : "Failed to redeem reward", "error");
    } finally {
      setRedeemingId(null);
    }
  };

  // نسخ كود الخصم للحافظة
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(isAr ? "تم نسخ الكود بنجاح! 📋" : "Coupon code copied! 📋", "success");
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      showToast(isAr ? "تعذر نسخ الكود" : "Failed to copy code", "error");
    }
  };

  // تطبيق الكوبون مباشرة في السلة والانتقال إليها
  const handleApplyToCart = (code: string) => {
    applyCoupon(code);
    showToast(
      isAr ? `تم تفعيل الكوبون (${code}) في السلة! ✨` : `Applied (${code}) to cart! ✨`,
      "success"
    );
    setIsRewardsOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "نادي مكافآت بادَم" : "BADEM Rewards Club"}
    >
      {/* خلفية للإغلاق عند النقر بالخارج */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsRewardsOpen(false)}
        aria-label="Close modal overlay"
      />

      {/* نافذة المكافآت */}
      <div className="bg-[#FAF5ED] w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[90vh] flex flex-col relative z-10 text-[#2D2321] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* الترويسة الملكية */}
        <div className="bg-[#4A0E17] text-white p-5 text-center relative border-b border-[#C59B27]/30 shadow-xs">
          <button
            type="button"
            onClick={() => setIsRewardsOpen(false)}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#33050C] border border-[#C59B27]/40 flex items-center justify-center shadow-inner mb-1.5 ring-2 ring-[#C59B27]/20">
            <Gift className="w-6 h-6 text-[#E5C058]" />
          </div>

          <span className="text-[9.5px] tracking-[0.25em] text-[#E5C058] font-black uppercase font-brand block leading-tight">
            BADEM ROYAL REWARDS
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
            {isAr ? "نادي مكافآت بادَم" : "BADEM Rewards Club"}
          </h3>

          {/* رصيد النقاط المتاح */}
          <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl py-1.5 px-4 inline-flex items-center gap-2 border border-white/15 shadow-2xs">
            <Star className="w-4 h-4 text-[#E5C058] fill-[#E5C058]" />
            <span className="text-xs font-bold text-stone-200">{isAr ? "رصيدك المتاح:" : "Balance:"}</span>
            <span className="text-base font-black text-[#E5C058] font-mono">{points}</span>
            <span className="text-xs text-white font-medium">{isAr ? "نقطة" : "pts"}</span>
          </div>
        </div>

        {/* أزرار التبديل بين المكافآت والمحفظة */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-200/60 border-b border-stone-200 text-xs font-bold gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("rewards")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "rewards"
                ? "bg-[#4A0E17] text-white shadow-sm font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5C058]" />
            <span>{isAr ? "استبدال النقاط" : "Redeem Points"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("my_coupons")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === "my_coupons"
                ? "bg-[#4A0E17] text-white shadow-sm font-black"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-[#E5C058]" />
            <span>{isAr ? `كوبوناتي (${myCoupons.length})` : `My Coupons (${myCoupons.length})`}</span>
            {myCoupons.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E5C058] animate-pulse" />
            )}
          </button>
        </div>

        {/* المحتوى الداخلي */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3 flex-1 overscroll-contain">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#4A0E17]" />
              <span className="text-xs font-bold">{isAr ? "جاري التحميل..." : "Loading..."}</span>
            </div>
          ) : activeTab === "rewards" ? (
            /* 🎁 تبويب 1: استبدال النقاط */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 px-1">
                <span>{isAr ? "اختر مكافأتك للاستبدال الفوري:" : "Select reward to redeem:"}</span>
                <span className="text-[#4A0E17] bg-white px-2.5 py-0.5 rounded-full border border-stone-200 font-mono shadow-2xs">
                  {isAr ? `1 ريال = ${pointsPerSar} نقاط` : `1 SAR = ${pointsPerSar} pts`}
                </span>
              </div>

              {rewards.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-400 text-xs shadow-2xs">
                  {isAr ? "لا توجد مكافآت متاحة حالياً." : "No rewards currently available."}
                </div>
              ) : (
                rewards.map((reward) => {
                  const canRedeem = points >= reward.points_required;
                  const pointsNeeded = Math.max(0, reward.points_required - points);
                  const title = isAr ? reward.title_ar : reward.title_en;

                  return (
                    <div
                      key={reward.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                        canRedeem
                          ? "bg-white border-stone-200 hover:border-[#4A0E17]/30"
                          : "bg-white/60 border-stone-200/70 opacity-80"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-[#FAF5ED] text-[#4A0E17] font-black px-2 py-0.5 rounded-full border border-[#4A0E17]/20 shrink-0">
                            خصم {reward.discount_percent}%
                          </span>
                          <h4 className="font-bold text-xs text-stone-900 truncate">{title}</h4>
                        </div>
                        <span className="text-[11px] font-black text-[#C59B27] block font-mono">
                          {isAr ? `التكلفة: ${reward.points_required} نقطة` : `Cost: ${reward.points_required} pts`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem || redeemingId === reward.id}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                          canRedeem
                            ? "bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white shadow-xs cursor-pointer"
                            : "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200"
                        }`}
                      >
                        {redeemingId === reward.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : canRedeem ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#E5C058]" />
                            <span>{isAr ? "استبدال" : "Redeem"}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>{isAr ? `تحتاج ${pointsNeeded}` : `Need ${pointsNeeded}`}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* 🎟️ تبويب 2: محفظة الكوبونات المحفوظة */
            <div className="space-y-3">
              {myCoupons.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center text-stone-400 space-y-1.5 shadow-2xs">
                  <Ticket className="w-10 h-10 mx-auto stroke-[1.5] text-stone-300 mb-1" />
                  <p className="text-xs font-bold text-stone-700">
                    {isAr ? "لا توجد كوبونات محفوظة حالياً." : "No saved coupons."}
                  </p>
                  <p className="text-[10px] text-stone-400 leading-relaxed max-w-xs mx-auto">
                    {isAr
                      ? "استبدل نقاطك من تبويب (استبدال النقاط) وستبقى كوبوناتك هنا حتى تقرر استخدامها."
                      : "Redeem rewards to store coupons here until you're ready to use them."}
                  </p>
                </div>
              ) : (
                myCoupons.map((coupon, idx) => (
                  <div
                    key={`${coupon.code}-${idx}`}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-[#C59B27]/60 shadow-2xs flex items-center justify-between gap-3 bg-[#FAF5ED]/50 hover:bg-[#FAF5ED] transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#4A0E17] tracking-wider bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
                          {coupon.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          خصم {coupon.discount_percent}%
                        </span>
                      </div>
                      <span className="text-[9.5px] text-stone-400 block font-medium">
                        {isAr ? "صالحة للاستخدام لمرة واحدة فقط" : "Valid for one-time use"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* زر نسخ الكود */}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        title={isAr ? "نسخ الكود" : "Copy code"}
                        aria-label="Copy coupon code"
                        className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#4A0E17] hover:border-[#4A0E17]/30 active:scale-90 transition cursor-pointer shadow-2xs"
                      >
                        {copiedCode === coupon.code ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* زر التطبيق المباشر في السلة */}
                      <button
                        type="button"
                        onClick={() => handleApplyToCart(coupon.code)}
                        className="px-3 py-2 bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isAr ? "تطبيق" : "Apply"}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};