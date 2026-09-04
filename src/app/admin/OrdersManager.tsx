"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ShoppingBag, Package, Tag, Printer, X, FileSpreadsheet, Download, 
  CalendarClock, DollarSign, Phone, MapPin, User, Gift, ExternalLink, 
  Trash2, Pencil, CheckCircle2, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";

interface OrdersManagerProps {
  orders: any[];
  productsCount: number;
  couponsCount: number;
  fetchData: () => Promise<void>;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  productsCount,
  couponsCount,
  fetchData,
}) => {
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayFormattedDate, setTodayFormattedDate] = useState<string>("");

  // تهيئة التاريخ الحي تفادياً لمشاكل الـ Hydration في Next.js
  useEffect(() => {
    const formatted = new Date().toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setTodayFormattedDate(formatted);
  }, []);

  // تحديث حالة الطلب السريعة
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("تعذر تحديث حالة الطلب: " + err.message);
    }
  }, [fetchData]);

  // حذف الطلب نهائياً
  const handleDeleteOrder = useCallback(async (orderId: string) => {
    const isConfirmed = window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً من قاعدة البيانات؟");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
      await fetchData();
      alert("تم حذف الطلب بنجاح ✅");
    } catch (err: any) {
      alert("حدث خطأ أثناء الحذف: " + err.message);
    }
  }, [fetchData]);

  // حفظ التعديلات الشاملة للطلب
  const handleSaveOrderChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: editingOrder.customer_name?.trim() || "",
          customer_phone: editingOrder.customer_phone?.trim() || "",
          city: editingOrder.city?.trim() || "",
          district: editingOrder.district?.trim() || "",
          street: editingOrder.street?.trim() || "",
          total_amount: Number(editingOrder.total_amount) || 0,
          status: editingOrder.status || "pending",
          notes: editingOrder.notes || "",
        })
        .eq("id", editingOrder.id);

      if (error) throw error;

      await fetchData();
      setEditingOrder(null);
      alert("تم تحديث بيانات الطلب بنجاح ✅");
    } catch (err: any) {
      alert("حدث خطأ أثناء التحديث: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 📊 تصدير ملف Excel بتنسيق XML/HTML ومن اليمين لليسار
  const exportOrdersToExcel = () => {
    if (orders.length === 0) {
      alert("لا توجد طلبات مسجلة لتصديرها حالياً.");
      return;
    }

    const tableRows = orders.map((o) => `
      <tr>
        <td style="text-align: center; font-weight: bold; mso-number-format:'\\@';">${o.id || ""}</td>
        <td style="text-align: center;">${o.created_at ? new Date(o.created_at).toLocaleString("ar-SA") : ""}</td>
        <td style="text-align: right; font-weight: bold;">${o.customer_name || ""}</td>
        <td style="text-align: center; mso-number-format:'\\@';">${o.customer_phone || ""}</td>
        <td style="text-align: right;">${o.city || ""}</td>
        <td style="text-align: right;">${o.district || ""}</td>
        <td style="text-align: right;">${o.street || ""}</td>
        <td style="text-align: center;">${o.payment_method || ""}</td>
        <td style="text-align: center; font-weight: bold;">${o.status || ""}</td>
        <td style="text-align: center;">${o.subtotal || o.total_amount || 0}</td>
        <td style="text-align: center;">${o.discount_amount || 0}</td>
        <td style="text-align: center;">${o.delivery_fee || 15}</td>
        <td style="text-align: center; font-weight: bold; color: #4A0E17;">${o.total_amount || 0}</td>
        <td style="text-align: right;">${o.notes || ""}</td>
      </tr>
    `).join("");

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>سجل طلبات بادَم</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          th { background-color: #4A0E17; color: #FFFFFF; font-weight: bold; border: 1px solid #C59B27; padding: 10px; text-align: center; font-size: 12px; }
          td { border: 1px solid #D5D5D5; padding: 8px; font-size: 11px; }
          tr:nth-child(even) { background-color: #FAF5ED; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>تاريخ الطلب</th>
              <th>اسم العميل</th>
              <th>رقم الجوال</th>
              <th>المدينة</th>
              <th>الحي</th>
              <th>تفاصيل العنوان</th>
              <th>طريقة الدفع</th>
              <th>حالة الطلب</th>
              <th>قيمة المنتجات (ر.س)</th>
              <th>الخصم (ر.س)</th>
              <th>رسوم التوصيل (ر.س)</th>
              <th>المبلغ الإجمالي (ر.س)</th>
              <th>ملاحظات وموقع GPS</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `badem_orders_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  return (
    <div className="space-y-6 select-none">
      
      {/* 📅 شريط التاريخ والوقت الحي */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs font-bold text-stone-700 shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#C59B27] shrink-0" />
          <span className="min-h-[1rem]">{todayFormattedDate}</span>
        </div>
        <span className="text-[10.5px] bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/60 font-black flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>الربط اللحظي مفعل (Live)</span>
        </span>
      </div>

      {/* 📊 بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 group">
          <span className="text-[10px] text-stone-400 font-bold block">إجمالي المبيعات</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-[#4A0E17] font-mono tracking-tight truncate">
              {totalRevenue.toFixed(2)} <span className="text-xs font-bold font-sans">ر.س</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17] shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 group">
          <span className="text-[10px] text-stone-400 font-bold block">عدد الطلبات</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-stone-800 font-mono tracking-tight truncate">
              {orders.length} <span className="text-xs font-bold font-sans">طلب</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 group">
          <span className="text-[10px] text-stone-400 font-bold block">الأصناف المعروضة</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-stone-800 font-mono tracking-tight truncate">
              {productsCount} <span className="text-xs font-bold font-sans">صنف</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1 group">
          <span className="text-[10px] text-stone-400 font-bold block">الكوبونات النشطة</span>
          <div className="flex items-center justify-between gap-1">
            <span className="text-lg md:text-xl font-black text-stone-800 font-mono tracking-tight truncate">
              {couponsCount} <span className="text-xs font-bold font-sans">كود</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-700 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* صندوق تصدير Excel */}
      <div className="bg-gradient-to-r from-white via-[#FAF5ED] to-white p-5 rounded-3xl border border-[#C59B27]/30 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#4A0E17] text-[#E5C058] flex items-center justify-center shadow-md border border-[#C59B27]/40 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#4A0E17]">سجل المبيعات والعملاء المعتمد</h3>
              <span className="bg-[#4A0E17]/10 text-[#4A0E17] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {orders.length} طلبات
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              تصدير تقرير متكامل بصيغة Excel لحملات الواتساب والتسويق الموسمي.
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={exportOrdersToExcel}
          className="w-full sm:w-auto px-6 py-3 bg-[#4A0E17] hover:bg-[#36070E] text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2.5 border border-[#C59B27]/40 group cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-[#E5C058] group-hover:translate-y-0.5 transition-transform" />
          <span>تصدير تقرير المبيعات (Excel)</span>
        </button>
      </div>

      {/* 📋 قائمة الطلبات بتصميم ملكي فاخر ومنظم */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-400 shadow-2xs">
            <ShoppingBag className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-stone-300" />
            <p className="font-bold text-sm text-stone-700">لا توجد طلبات واردة حالياً.</p>
          </div>
        ) : (
          orders.map((ord) => (
            <div key={ord.id} className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden transition hover:border-[#4A0E17]/30">
              
              {/* رأس البطاقة (رقم الطلب + الحالة + الأزرار) */}
              <div className="bg-[#FAF5ED] px-6 py-4 border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-black text-[#4A0E17] bg-white px-3 py-1 rounded-xl border border-stone-200 shadow-2xs">
                    #{ord.id}
                  </span>
                  {ord.is_gift && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300/50">
                      <Gift className="w-3 h-3 text-amber-700" />
                      <span>طلب إهداء ملكي</span>
                    </span>
                  )}
                  <span className="text-[11px] text-stone-400 font-medium">
                    {ord.created_at ? new Date(ord.created_at).toLocaleString("ar-SA") : ""}
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {/* زر تعديل الطلب */}
                  <button
                    type="button"
                    onClick={() => setEditingOrder({ ...ord })}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
                    title="تعديل بيانات الطلب"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    <span>تعديل</span>
                  </button>

                  {/* زر طباعة الفاتورة */}
                  <button 
                    type="button"
                    onClick={() => setSelectedOrderForPrint(ord)} 
                    className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 text-stone-700 shadow-2xs cursor-pointer transition active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>طباعة الفاتورة</span>
                  </button>

                  {/* زر حذف الطلب */}
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(ord.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
                    title="حذف الطلب نهائياً"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>حذف</span>
                  </button>

                  {/* قائمة تغيير الحالة */}
                  <select
                    value={ord.status || "pending"}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                    className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-hidden shadow-2xs cursor-pointer"
                  >
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="baking">🔥 في الفرن والتجهيز</option>
                    <option value="delivering">🚚 مع المندوب</option>
                    <option value="completed">✅ مكتمل ومسلم</option>
                  </select>
                </div>
              </div>

              {/* جسم البطاقة */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#FAF5ED]/50 p-4 rounded-2xl border border-stone-200/40 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-stone-800 font-bold">
                      <User className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                      <span>{ord.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a href={`tel:${ord.customer_phone}`} dir="ltr" className="hover:underline font-mono">
                        {ord.customer_phone}
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:border-r md:border-stone-200 md:pr-3">
                    <div className="flex items-start gap-2 text-stone-800 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-[#4A0E17] shrink-0 mt-0.5" />
                      <span>{ord.city}، {ord.district} {ord.street ? `- ${ord.street}` : ""}</span>
                    </div>
                    {ord.notes && ord.notes.includes("https://") && (
                      <div>
                        {ord.notes.split(" ").map((word: string, i: number) => 
                          word.startsWith("https://") ? (
                            <a key={i} href={word} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 mt-1 hover:underline">
                              <span>📍 فتح موقع العميل (GPS)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* تفاصيل قائمة المنتجات */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-stone-400 uppercase tracking-wider block">المنتجات المطلوبة:</span>
                  <div className="divide-y divide-stone-100 border border-stone-200/60 rounded-2xl overflow-hidden bg-white">
                    {Array.isArray(ord.items) && ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAF5ED]/30 transition">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#4A0E17]/10 text-[#4A0E17] font-black flex items-center justify-center text-[11px] font-mono shrink-0">
                            {it.quantity}
                          </span>
                          <div>
                            <span className="font-bold text-stone-800 block">{it.title}</span>
                            <span className="text-[10px] text-stone-400">{it.portion || it.portionNote || "الحجم القياسي الملكي"}</span>
                          </div>
                        </div>
                        <span className="font-black text-[#4A0E17] font-mono">
                          {(Number(it.price) * it.quantity).toFixed(2)} ر.س
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ملاحظات إضافية */}
                {ord.notes && !ord.notes.includes("https://") && (
                  <div className="text-xs bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60 text-amber-900 flex items-start gap-2">
                    <span className="font-bold shrink-0">ملاحظات العميل:</span>
                    <span className="flex-1">{ord.notes}</span>
                  </div>
                )}
              </div>

              {/* ذيل البطاقة */}
              <div className="bg-[#FAF5ED]/80 px-6 py-4 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-stone-500 font-medium">
                  طريقة الدفع: <strong className="text-stone-800 uppercase font-mono">{ord.payment_method}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">المبلغ الإجمالي:</span>
                  <span className="text-base font-black text-[#4A0E17] font-mono">{parseFloat(ord.total_amount).toFixed(2)} ر.س</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ✏️ نافذة تعديل بيانات الطلب المنبثقة */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#4A0E17]/20 space-y-5 text-[#2D2321] relative max-h-[90vh] overflow-y-auto overscroll-contain">
            
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#4A0E17]">تعديل بيانات الطلب #{editingOrder.id}</h3>
                <p className="text-xs text-stone-400 mt-0.5">قم بتحديث معلومات العميل أو العنوان أو إجمالي الحساب</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 cursor-pointer transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderChanges} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">اسم العميل:</label>
                  <input
                    type="text"
                    value={editingOrder.customer_name || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17] font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">رقم الجوال:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingOrder.customer_phone || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17] font-mono text-right"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المدينة:</label>
                  <input
                    type="text"
                    value={editingOrder.city || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">الحي:</label>
                  <input
                    type="text"
                    value={editingOrder.district || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الشارع وتفاصيل العنوان:</label>
                <input
                  type="text"
                  value={editingOrder.street || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المبلغ الإجمالي (ر.س):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingOrder.total_amount || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, total_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17] font-black text-[#4A0E17] font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">حالة الطلب:</label>
                  <select
                    value={editingOrder.status || "pending"}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17] font-bold cursor-pointer"
                  >
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="baking">🔥 في الفرن والتجهيز</option>
                    <option value="delivering">🚚 مع المندوب</option>
                    <option value="completed">✅ مكتمل ومسلم</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الملاحظات ورابط الموقع:</label>
                <textarea
                  rows={2}
                  value={editingOrder.notes || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#4A0E17]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isProcessing ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 🖨️ نافذة طباعة الفاتورة الفاخرة */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-[#4A0E17]/20 space-y-6 text-[#2D2321] relative max-h-[90vh] overflow-y-auto overscroll-contain">
            
            <button 
              type="button"
              onClick={() => setSelectedOrderForPrint(null)} 
              className="absolute top-6 left-6 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 cursor-pointer print:hidden transition active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 border-b border-stone-200 pb-5">
              <h2 className="text-xl font-black text-[#4A0E17] font-brand tracking-wider">BADEM BAKLAVA</h2>
              <p className="text-xs text-[#C59B27] font-bold">بادَم للحلويات الفاخرة والضيافة الملكية</p>
              <p className="text-[10px] text-stone-400">فاتورة تسليم مبيعات رسمية</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200/60">
              <div className="space-y-1">
                <p><span className="text-stone-400">رقم الفاتورة:</span> <strong className="font-mono text-[#4A0E17]">#{selectedOrderForPrint.id}</strong></p>
                <p><span className="text-stone-400">تاريخ الطلب:</span> <strong>{selectedOrderForPrint.created_at ? new Date(selectedOrderForPrint.created_at).toLocaleString("ar-SA") : ""}</strong></p>
              </div>
              <div className="space-y-1 text-left rtl:text-right">
                <p><span className="text-stone-400">العميل:</span> <strong>{selectedOrderForPrint.customer_name}</strong></p>
                <p><span className="text-stone-400">الجوال:</span> <strong dir="ltr" className="font-mono">{selectedOrderForPrint.customer_phone}</strong></p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-black text-stone-400 border-b border-stone-200 pb-1 flex justify-between">
                <span>الصنف والوصف</span>
                <span>المبلغ</span>
              </div>
              <div className="space-y-2 text-xs divide-y divide-stone-100">
                {Array.isArray(selectedOrderForPrint.items) && selectedOrderForPrint.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between items-center pt-2">
                    <span className="font-medium text-stone-800">{it.quantity}× {it.title} ({it.portion || it.portionNote || "قياسي"})</span>
                    <span className="font-bold font-mono text-[#4A0E17]">{(Number(it.price) * it.quantity).toFixed(2)} ر.س</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>رسوم التوصيل الملكي:</span>
                <span className="font-mono">{(Number(selectedOrderForPrint.delivery_fee) || 15).toFixed(2)} ر.س</span>
              </div>
              {Number(selectedOrderForPrint.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>الخصم المطبق:</span>
                  <span className="font-mono">- {Number(selectedOrderForPrint.discount_amount).toFixed(2)} ر.س</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base font-black text-[#4A0E17] pt-2 border-t border-stone-200">
                <span>المبلغ الإجمالي المدفوع:</span>
                <span className="font-mono">{parseFloat(selectedOrderForPrint.total_amount).toFixed(2)} ر.س</span>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed border-stone-200 text-[10px] text-stone-400 flex justify-between items-end">
              <div>
                <p>شكراً لاختياركم بادَم</p>
                <p>نتطلع لخدمتكم دائماً بأجود الحلويات الطازجة.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-32 border-b border-stone-300" />
                <span>توقيع المندوب / المستلم</span>
              </div>
            </div>

            <div className="pt-2 print:hidden">
              <button 
                type="button"
                onClick={() => window.print()} 
                className="w-full bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
              >
                <Printer className="w-4 h-4 text-[#C59B27]" />
                <span>طباعة الفاتورة الرسمية</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};