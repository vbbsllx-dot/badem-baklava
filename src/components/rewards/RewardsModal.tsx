"use client";

import React, { useState, useEffect } from "react";
import { X, Gift, Star, Sparkles, Loader2, Award, Check, Lock, Ticket, ArrowRight, Copy } from "lucide-react";
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
  const { isRewardsOpen, setIsRewardsOpen, points, redeemPoints } = useUser();
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

  // تحميل المكافآت والكوبونات المحفوظة محلياً للعميل
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. جلب المكافآت وإعدادات النقاط
      const [rewardsRes, settingsRes] = await Promise.all([
        supabase.from("loyalty_rewards").select("*").order("points_required", { ascending: true }),
        supabase.from("store_settings").select("*").eq("id", "loyalty").single(),
      ]);

      if (rewardsRes.data) setRewards(rewardsRes.data);
      if (settingsRes.data?.points_per_sar) setPointsPerSar(Number(settingsRes.data.points_per_sar));

      // 2. فحص الكوبونات المستبدلة سابقاً والتحقق من صلاحيتها في Supabase
      const localCoupons: SavedCoupon[] = JSON.parse(localStorage.getItem("badem_saved_coupons") || "[]");
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRewardsOpen) loadData();
  }, [isRewardsOpen]);

  if (!isRewardsOpen) return null;

  // استبدال النقاط وحفظ الكوبون في المحفظة
  const handleRedeem = async (reward: LoyaltyRewardItem) => {
    if (points < reward.points_required) {
      showToast(isAr ? "رصيد نقاطك غير كافٍ لهذا الخصم ❌" : "Insufficient points ❌", "error");
      return;
    }

    setRedeemingId(reward.id);
    try {
      const generatedCode = `BADEM-${reward.discount_percent}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. تسجيل الكوبون في قاعدة البيانات
      const { error } = await supabase.from("coupons").insert([
        {
          code: generatedCode,
          discount_percent: reward.discount_percent,
          is_used: false,
        },
      ]);
      if (error) throw error;

      // 2. خصم النقاط
      redeemPoints(reward.points_required);

      // 3. حفظ الكوبون في محفظة العميل
      const newSaved = {
        code: generatedCode,
        discount_percent: reward.discount_percent,
        created_at: new Date().toISOString(),
      };
      const updatedList = [newSaved, ...myCoupons];
      setMyCoupons(updatedList);
      localStorage.setItem("badem_saved_coupons", JSON.stringify(updatedList));

      showToast(
        isAr
          ? `🎉 تم الاستبدال بنجاح! تم حفظ الكوبون (${generatedCode}) في محفظتك`
          : `🎉 Reward saved to your wallet: (${generatedCode})!`,
        "success"
      );

      setActiveTab("my_coupons");
    } catch (err) {
      showToast(isAr ? "تعذر الاستبدال حالياً" : "Failed to redeem", "error");
    } finally {
      setRedeemingId(null);
    }
  };

  // تطبيق الكوبون في السلة مباشرة
  const handleApplyToCart = (code: string) => {
    applyCoupon(code);
    showToast(isAr ? `تم تفعيل الكوبون (${code}) في السلة! ✨` : `Applied (${code}) to cart! ✨`, "success");
    setIsRewardsOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF5ED] w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[90vh] flex flex-col relative text-[#2D2321]">
        
        {/* Header */}
        <div className="bg-[#4A0E17] text-white p-5 text-center relative border-b border-[#C59B27]/30 shadow-md">
          <button
            onClick={() => setIsRewardsOpen(false)}
            className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#33050C] border border-[#C59B27]/40 flex items-center justify-center shadow-inner mb-1.5">
            <Gift className="w-6 h-6 text-[#E5C058]" />
          </div>

          <span className="text-[10px] tracking-widest text-[#E5C058] font-black uppercase font-brand">
            BADEM ROYAL REWARDS
          </span>
          <h3 className="text-xl font-black text-white mt-0.5">
            {isAr ? "نادي مكافآت بادَم" : "BADEM Rewards Club"}
          </h3>

          {/* رصيد النقاط */}
          <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl py-1.5 px-4 inline-flex items-center gap-2 border border-white/15">
            <Star className="w-4 h-4 text-[#E5C058] fill-[#E5C058]" />
            <span className="text-xs font-bold text-stone-200">{isAr ? "رصيدك المتاح:" : "Balance:"}</span>
            <span className="text-base font-black text-[#E5C058]">{points}</span>
            <span className="text-xs text-white">{isAr ? "نقطة" : "pts"}</span>
          </div>
        </div>

        {/* أزرار التبديل بين المكافآت والمحفظة */}
        <div className="grid grid-cols-2 p-2 bg-stone-200/60 border-b border-stone-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "rewards" ? "bg-[#4A0E17] text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? "استبدال النقاط" : "Redeem Points"}</span>
          </button>

          <button
            onClick={() => setActiveTab("my_coupons")}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === "my_coupons" ? "bg-[#4A0E17] text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>{isAr ? `كوبوناتي المحفوظة (${myCoupons.length})` : `My Coupons (${myCoupons.length})`}</span>
            {myCoupons.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#E5C058] animate-ping" />
            )}
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3 flex-1">
          
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
                <span className="text-[#4A0E17] bg-white px-2 py-0.5 rounded-full border border-stone-200">
                  {isAr ? `1 ريال = ${pointsPerSar} نقاط` : `1 SAR = ${pointsPerSar} pts`}
                </span>
              </div>

              {rewards.map((reward) => {
                const canRedeem = points >= reward.points_required;
                const pointsNeeded = reward.points_required - points;
                const title = isAr ? reward.title_ar : reward.title_en;

                return (
                  <div
                    key={reward.id}
                    className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-[#FAF5ED] text-[#4A0E17] font-black px-2 py-0.5 rounded-full border border-[#4A0E17]/20">
                          خصم {reward.discount_percent}%
                        </span>
                        <h4 className="font-bold text-xs text-stone-900">{title}</h4>
                      </div>
                      <span className="text-[11px] font-bold text-[#C59B27] block">
                        {isAr ? `التكلفة: ${reward.points_required} نقطة` : `Cost: ${reward.points_required} pts`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem || redeemingId === reward.id}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        canRedeem
                          ? "bg-[#4A0E17] text-white hover:bg-[#36070E] active:scale-95 shadow-xs"
                          : "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200"
                      }`}
                    >
                      {redeemingId === reward.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : canRedeem ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
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
              })}
            </div>
          ) : (
            /* 🎟️ تبويب 2: محفظة الكوبونات المحفوظة والنشطة */
            <div className="space-y-3">
              {myCoupons.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-400 space-y-1">
                  <Ticket className="w-8 h-8 mx-auto stroke-1 mb-1 text-stone-300" />
                  <p className="text-xs font-bold">{isAr ? "لا توجد كوبونات محفوظة حالياً." : "No saved coupons."}</p>
                  <p className="text-[10px] text-stone-400">{isAr ? "استبدل نقاطك وستبقى كوبوناتك هنا حتى استخدامها." : "Redeem rewards to see them here."}</p>
                </div>
              ) : (
                myCoupons.map((coupon, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3.5 rounded-2xl border-2 border-dashed border-[#C59B27]/50 shadow-2xs flex items-center justify-between gap-3 bg-[#FAF5ED]/30"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#4A0E17] tracking-wider bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                          {coupon.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-black">
                          خصم {coupon.discount_percent}%
                        </span>
                      </div>
                      <span className="text-[9px] text-stone-400 block mt-1">
                        {isAr ? "صالحة للاستخدام لمرة واحدة فقط" : "Valid for one-time use"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleApplyToCart(coupon.code)}
                      className="px-3.5 py-2 bg-[#4A0E17] hover:bg-[#36070E] text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>{isAr ? "تطبيق في السلة" : "Apply"}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
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