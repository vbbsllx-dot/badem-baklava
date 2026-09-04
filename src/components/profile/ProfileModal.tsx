"use client";

import React, { useState, useEffect, useId } from "react";
import {
  X,
  User,
  MapPin,
  Package,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Calendar,
  Phone,
  ChevronDown
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";

type TabType = "orders" | "addresses" | "info";

export const ProfileModal: React.FC = () => {
  const { 
    isProfileOpen, 
    setIsProfileOpen, 
    userName = "", 
    setUserName, 
    userPhone = "", 
    setUserPhone, 
    addresses = [], 
    addAddress, 
    deleteAddress, 
    orders = [], 
    points = 0, 
    resetAllUserData 
  } = useUser();

  const { language } = useLanguage();
  const isAr = language === "ar";
  const { showToast } = useToast();
  const addressFormId = useId();

  const [activeTab, setActiveTab] = useState<TabType>("info");

  // نموذج إضافة عنوان جديد
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrTitle, setAddrTitle] = useState(isAr ? "المنزل" : "Home");
  const [addrCity, setAddrCity] = useState("الرياض");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrStreet, setAddrStreet] = useState("");

  // حالات محلية لتعديل البيانات الشخصية
  const [localName, setLocalName] = useState(userName);
  const [localPhone, setLocalPhone] = useState(userPhone);

  // تحديث الحالات المحلية عند فتح النافذة
  useEffect(() => {
    if (isProfileOpen) {
      setLocalName(userName);
      setLocalPhone(userPhone);
    }
  }, [isProfileOpen, userName, userPhone]);

  // إغلاق النافذة بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfileOpen, setIsProfileOpen]);

  if (!isProfileOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(localName.trim());
    setUserPhone(localPhone.trim());
    showToast(isAr ? "تم حفظ بيانات الحساب بنجاح! ✅" : "Profile saved successfully! ✅", "success");
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrDistrict.trim()) return;

    addAddress({
      title: addrTitle,
      city: addrCity,
      district: addrDistrict.trim(),
      street: addrStreet.trim(),
    });

    setAddrDistrict("");
    setAddrStreet("");
    setShowAddAddr(false);
    showToast(isAr ? "تمت إضافة العنوان بنجاح! 📍" : "Address added successfully! 📍", "success");
  };

  const handleClearCache = () => {
    const confirmMessage = isAr 
      ? "هل أنت متأكد من تصفير كافة البيانات المحفوظة والبدء من جديد؟" 
      : "Are you sure you want to reset all stored data?";

    if (window.confirm(confirmMessage)) {
      resetAllUserData();
      setLocalName("");
      setLocalPhone("");
      showToast(isAr ? "تم تصفير البيانات بنجاح 🔄" : "Data reset successfully 🔄", "info");
    }
  };

  const avatarInitial = (localName.trim() || userName.trim() || "B").charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "الملف الشخصي" : "User Profile"}
    >
      {/* خلفية للإغلاق عند النقر خارج الإطار */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsProfileOpen(false)}
        aria-label="Close modal overlay"
      />

      <div className="bg-[#FAF5ED] w-full max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[90vh] flex flex-col relative z-10 text-[#2D2321] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* الترويسة الملكية */}
        <div className="bg-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C59B27]/20 border border-[#E5C058]/50 flex items-center justify-center font-brand font-black text-lg text-[#E5C058] shadow-inner">
              {avatarInitial}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-white truncate max-w-[160px] sm:max-w-[220px]">
                  {localName.trim() || userName.trim() || (isAr ? "ضيف بادَم" : "BADEM Guest")}
                </h3>
                <span className="text-[9.5px] bg-[#E5C058] text-[#4A0E17] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{isAr ? "عضو ملكي" : "Royal Member"}</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                {isAr ? "رصيد النقاط: " : "Points: "}
                <strong className="text-[#E5C058] font-mono text-sm">{points}</strong> {isAr ? "نقطة" : "pts"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط التبويبات الفاخر */}
        <div className="bg-white border-b border-stone-200 grid grid-cols-3 p-1.5 text-xs font-bold gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "info"
                ? "bg-[#4A0E17] text-[#FAF5ED] shadow-sm font-black"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? "البيانات" : "Profile"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#4A0E17] text-[#FAF5ED] shadow-sm font-black"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isAr ? `الطلبات (${orders.length})` : `Orders (${orders.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "addresses"
                ? "bg-[#4A0E17] text-[#FAF5ED] shadow-sm font-black"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isAr ? `العناوين (${addresses.length})` : `Addresses (${addresses.length})`}</span>
          </button>
        </div>

        {/* محتوى التبويبات */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4 flex-1 overscroll-contain">
          
          {/* 1. تبويب البيانات الشخصية */}
          {activeTab === "info" && (
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                  <span>{isAr ? "المعلومات الشخصية المعتمدة" : "Personal Account Info"}</span>
                </h4>
                <span className="text-[10px] text-stone-400 font-bold">
                  {isAr ? "تستخدم لتسريع إتمام الطلبات" : "Used for quick checkout"}
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isAr ? "الاسم الكامل:" : "Full Name:"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={localName}
                      placeholder={isAr ? "أدخل اسمك الكريم..." : "Enter your name..."}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                    />
                    <User className="w-3.5 h-3.5 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isAr ? "رقم الجوال (واتساب):" : "Phone Number (WhatsApp):"}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={localPhone}
                      placeholder="05XXXXXXXX"
                      onChange={(e) => setLocalPhone(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                    />
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white font-black py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isAr ? "حفظ وتحديث البيانات" : "Save & Update Profile"}
                </button>
              </form>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">
                  {isAr ? "البيانات محفوظة بأمان في متصفحك" : "Stored securely in your local browser"}
                </span>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="text-[10px] font-bold text-stone-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? "تصفير الذاكرة" : "Reset Data"}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. تبويب سجل الطلبات */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-2 text-stone-400 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-[#4A0E17]/5 flex items-center justify-center mx-auto text-stone-400 mb-2">
                    <Package className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-bold text-stone-700">
                    {isAr ? "لا توجد طلبات سابقة مسجلة حتى الآن." : "No past orders registered yet."}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {isAr ? "عند إتمام أي طلب عبر الموقع سيتم توثيق فاتورته وتتبعها هنا." : "Orders will be recorded and tracked here."}
                  </p>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-[#4A0E17] font-mono">{order.id}</span>
                        <div className="flex items-center gap-1 text-[10px] text-stone-400">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{order.date || new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US")}</span>
                        </div>
                      </div>

                      <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isAr ? "تم الاستلام" : "Confirmed"}</span>
                      </span>
                    </div>

                    {/* تفاصيل المنتجات */}
                    <div className="space-y-1 text-xs text-stone-600 divide-y divide-stone-50">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center pt-1 first:pt-0">
                          <span className="truncate max-w-[220px]">
                            {item.quantity}× {item.title}
                          </span>
                          <span className="font-mono font-bold text-stone-800 shrink-0">
                            {(Number(item.price) * item.quantity).toFixed(2)} {isAr ? "ر.س" : "SAR"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-black">
                      <span className="text-stone-700">{isAr ? "المجموع الكلي:" : "Total Amount:"}</span>
                      <span className="text-[#4A0E17] font-mono text-sm">
                        {Number(order.totalAmount).toFixed(2)} {isAr ? "ر.س" : "SAR"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. تبويب العناوين المحفوظة */}
          {activeTab === "addresses" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4A0E17]">
                  {isAr ? "عناوين التوصيل المحفوظة:" : "Saved Delivery Addresses:"}
                </span>

                <button
                  type="button"
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="px-3 py-1.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#36070E] active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddAddr ? (isAr ? "إلغاء" : "Cancel") : isAr ? "إضافة عنوان جديد" : "Add Address"}</span>
                </button>
              </div>

              {/* فورم إضافة عنوان */}
              {showAddAddr && (
                <form
                  id={addressFormId}
                  onSubmit={handleSaveNewAddress}
                  className="bg-white p-4 rounded-2xl border border-[#4A0E17]/20 space-y-3 shadow-xs animate-in fade-in duration-200"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">
                        {isAr ? "اسم العنوان:" : "Label:"}
                      </label>
                      <select
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-hidden"
                      >
                        <option value={isAr ? "المنزل" : "Home"}>{isAr ? "المنزل" : "Home"}</option>
                        <option value={isAr ? "العمل" : "Work"}>{isAr ? "العمل" : "Work"}</option>
                        <option value={isAr ? "الديوان" : "Diwan"}>{isAr ? "الديوان / الاستراحة" : "Diwan"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">
                        {isAr ? "المدينة:" : "City:"}
                      </label>
                      <div className="relative">
                        <select
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-hidden"
                        >
                          <option value="الرياض">الرياض (Riyadh)</option>
                          <option value="جدة">جدة (Jeddah)</option>
                          <option value="الدمام">الدمام (Dammam)</option>
                          <option value="مكة المكرمة">مكة المكرمة (Makkah)</option>
                          <option value="المدينة المنورة">المدينة المنورة (Madinah)</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-stone-400 absolute top-1/2 -translate-y-1/2 left-2 rtl:left-2 rtl:right-auto ltr:right-2 ltr:left-auto pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">
                      {isAr ? "الحي *:" : "District *:"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? "مثال: حي المحمدية" : "e.g., Al Mohammadiyah"}
                      value={addrDistrict}
                      onChange={(e) => setAddrDistrict(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">
                      {isAr ? "الشارع ورقم المبنى:" : "Street / House details:"}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? "اسم الشارع، رقم الشقة أو الفيلا" : "Street name, building/villa #"}
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white font-bold py-2 rounded-xl text-xs shadow transition cursor-pointer"
                  >
                    {isAr ? "حفظ العنوان" : "Save Address"}
                  </button>
                </form>
              )}

              {/* قائمة العناوين */}
              {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-stone-400 text-xs shadow-2xs space-y-1">
                  <MapPin className="w-8 h-8 mx-auto text-stone-300 stroke-1 mb-1" />
                  <p className="font-bold text-stone-600">
                    {isAr ? "لا توجد عناوين محفوظة بعد." : "No saved addresses."}
                  </p>
                  <p className="text-[10px]">
                    {isAr ? "أضف عنوانك لتحديده بضغطة زر عند الدفع." : "Add addresses for one-click checkout."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white p-3.5 rounded-2xl border border-stone-200/90 flex items-center justify-between shadow-2xs hover:border-[#4A0E17]/30 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span className="text-xs font-black text-[#4A0E17]">{addr.title}</span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                          {addr.city}، {addr.district} {addr.street ? `- ${addr.street}` : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteAddress(addr.id)}
                        className="text-stone-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title={isAr ? "حذف" : "Delete"}
                        aria-label="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};