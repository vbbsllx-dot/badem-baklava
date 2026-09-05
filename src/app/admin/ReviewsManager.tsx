"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Star, MessageSquare, ShieldAlert, RefreshCw, CheckCircle, Edit3, X, Save, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";

export const ReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات نافذة التعديل
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق نهائياً؟")) return;

    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert("تعذر حذف التعليق: " + err.message);
    }
  };

  const handleOpenEdit = (rev: any) => {
    setEditingReview(rev);
    setEditComment(rev.comment || "");
    setEditRating(Number(rev.rating) || 5);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editComment.trim()) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          comment: editComment.trim(),
          rating: editRating,
        })
        .eq("id", editingReview.id);

      if (error) throw error;

      // تحديث القائمة المحلية
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id ? { ...r, comment: editComment.trim(), rating: editRating } : r
        )
      );

      setEditingReview(null);
    } catch (err: any) {
      alert("تعذر حفظ التعديل: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-5 select-none relative">
      
      {/* الترويسة العلوية للقسم */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-stone-900">إدارة تعليقات وتقييمات العملاء الملكية</h3>
            <p className="text-[10px] text-stone-400 mt-0.5">متابعة ومراجعة آراء الذواقين والتحكم بها</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReviews}
            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs bg-[#FAF5ED] text-[#4A0E17] font-black px-3.5 py-1.5 rounded-2xl border border-stone-200/80 font-mono">
            إجمالي التعليقات: {reviews.length}
          </span>
        </div>
      </div>

      {/* قائمة التعليقات أو حالة التحميل */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#4A0E17]" />
          <span>جاري تحميل التعليقات...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-2 bg-[#FAF5ED]/30 rounded-2xl border border-dashed border-stone-200">
          <ShieldAlert className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
          <p className="font-bold text-stone-700">لا توجد تعليقات مسجلة حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {reviews.map((rev) => (
            <div 
              key={rev.id} 
              className="p-4 rounded-2xl border border-stone-200/90 bg-[#FAF5ED]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs transition hover:bg-[#FAF5ED]/80"
            >
              {/* تفاصيل التعليق والعميل ورقم الهاتف */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-[#4A0E17] text-[#E5C058] flex items-center justify-center font-black text-xs">
                    {(rev.customer_name || "ع")[0]}
                  </div>
                  <span className="text-xs font-black text-stone-900">{rev.customer_name}</span>

                  {/* رقم هاتف أو معرف المعلق */}
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-stone-700 font-bold px-2.5 py-0.5 rounded-lg border border-stone-200 font-mono shadow-2xs">
                    <Phone className="w-3 h-3 text-[#C59B27]" />
                    <span>{rev.customer_phone || rev.phone || "رقم غير متوفر"}</span>
                  </span>

                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    <span>مشتري مؤكد</span>
                  </span>
                  
                  {/* النجوم */}
                  <div className="flex items-center gap-0.5 mr-auto sm:mr-0">
                    {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/70 font-medium">
                  {rev.comment}
                </p>

                <span className="text-[10px] text-stone-400 block font-mono">
                  {rev.created_at ? new Date(rev.created_at).toLocaleString("ar-SA") : ""}
                </span>
              </div>

              {/* أزرار الإدارة (تعديل وحذف) */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rev)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#4A0E17] hover:border-[#4A0E17] active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                  title="تعديل التعليق"
                >
                  <Edit3 className="w-4 h-4 text-[#C59B27]" />
                  <span className="sm:hidden">تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                  title="حذف التعليق"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sm:hidden">حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة منبثقة (Modal) لتعديل التعليق */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF5ED] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#4A0E17]/20 space-y-4 relative text-[#2D2321] animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#4A0E17]" />
                <h4 className="text-sm font-black text-[#4A0E17]">تعديل تعليق العميل: {editingReview.customer_name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">تقييم النجوم:</label>
                <div className="flex gap-1.5 bg-white p-3 rounded-2xl border border-stone-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="cursor-pointer hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= editRating ? "text-amber-400 fill-amber-400" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">نص التعليق:</label>
                <textarea
                  rows={4}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl p-3 text-xs focus:outline-hidden focus:border-[#4A0E17] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#36070E] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};