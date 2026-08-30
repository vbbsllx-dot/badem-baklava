"use client";

import React, { useState } from "react";
import { X, User, MapPin, Package, Plus, Trash2, ShieldCheck, CheckCircle2, RotateCcw } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";

export const ProfileModal: React.FC = () => {
  const { 
    isProfileOpen, setIsProfileOpen, 
    userName, setUserName, 
    userPhone, setUserPhone, 
    addresses, addAddress, deleteAddress, 
    orders, points, resetAllUserData 
  } = useUser();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "info">("info");

  // نموذج إضافة عنوان جديد
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrTitle, setAddrTitle] = useState("المنزل");
  const [addrCity, setAddrCity] = useState("الرياض");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrStreet, setAddrStreet] = useState("");

  if (!isProfileOpen) return null;

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrDistrict.trim()) return;

    addAddress({
      title: addrTitle,
      city: addrCity,
      district: addrDistrict,
      street: addrStreet,
    });

    setAddrDistrict("");
    setAddrStreet("");
    setShowAddAddr(false);
    showToast(language === "ar" ? "تم حفظ العنوان بنجاح! 📍" : "Address saved! 📍", "success");
  };

  const handleClearCache = () => {
    if (confirm(language === "ar" ? "هل تريد تصفير كافة البيانات المحفوظة والبدء من جديد؟" : "Reset all saved data?")) {
      resetAllUserData();
      showToast(language === "ar" ? "تم تصفير البيانات بنجاح 🔄" : "Data reset successfully 🔄", "info");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF5ED] w-full max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[90vh] flex flex-col relative text-[#2D2321]">
        
        {/* Header */}
        <div className="bg-[#4A0E17] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C59B27]/20 border border-[#E5C058]/40 flex items-center justify-center font-brand font-black text-lg text-[#E5C058]">
              {userName.trim() ? userName.trim().charAt(0) : "B"}
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-1.5">
                <span>{userName.trim() ? userName : (language === "ar" ? "ضيف بادَم" : "BADEM Guest")}</span>
                <span className="text-[10px] bg-[#E5C058] text-[#4A0E17] font-black px-2 py-0.5 rounded-full">
                  {language === "ar" ? "عضو ملكي ✨" : "Royal Member ✨"}
                </span>
              </h3>
              <p className="text-xs text-stone-300 font-medium">
                {language === "ar" ? "رصيد النقاط: " : "Points: "}
                <strong className="text-[#E5C058]">{points}</strong> {language === "ar" ? "نقطة" : "pts"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="bg-white border-b border-stone-200 grid grid-cols-3 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "orders" ? "bg-[#4A0E17] text-white shadow-xs" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{language === "ar" ? `سجل الطلبات (${orders.length})` : `Orders (${orders.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "addresses" ? "bg-[#4A0E17] text-white shadow-xs" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{language === "ar" ? `العناوين (${addresses.length})` : `Addresses (${addresses.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "info" ? "bg-[#4A0E17] text-white shadow-xs" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{language === "ar" ? "بيانات الحساب" : "Profile Info"}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4 flex-1">
          
          {/* 1. Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-stone-400">
                  <Package className="w-12 h-12 mx-auto stroke-1" />
                  <p className="text-xs font-bold">{language === "ar" ? "لا توجد طلبات سابقة حتى الآن." : "No past orders."}</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div>
                        <span className="text-xs font-black text-[#4A0E17]">{order.id}</span>
                        <span className="text-[10px] text-stone-400 block">{order.date}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{language === "ar" ? "مكتمل" : "Completed"}</span>
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-stone-600">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.quantity}× {item.title}</span>
                          <span className="font-bold">{(item.price * item.quantity).toFixed(2)} ر.س</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-black">
                      <span className="text-stone-700">{language === "ar" ? "المجموع الكلي:" : "Total:"}</span>
                      <span className="text-[#4A0E17] text-sm">{order.totalAmount.toFixed(2)} ر.س</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Addresses Tab */}
          {activeTab === "addresses" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  {language === "ar" ? "عناوين التوصيل المحفوظة:" : "Saved Delivery Addresses:"}
                </span>
                <button
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="px-3 py-1.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#36070E] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === "ar" ? "إضافة عنوان" : "Add Address"}</span>
                </button>
              </div>

              {showAddAddr && (
                <form onSubmit={handleSaveNewAddress} className="bg-white p-4 rounded-2xl border border-[#4A0E17]/20 space-y-3 shadow-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">اسم العنوان:</label>
                      <select
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="المنزل">المنزل</option>
                        <option value="العمل">العمل</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">المدينة:</label>
                      <input
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">الحي *:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: حي النرجس"
                      value={addrDistrict}
                      onChange={(e) => setAddrDistrict(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">الشارع والوصف:</label>
                    <input
                      type="text"
                      placeholder="اسم الشارع، رقم المبنى"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4A0E17] text-white font-bold py-2 rounded-xl text-xs shadow hover:bg-[#36070E] transition cursor-pointer"
                  >
                    حفظ العنوان
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  {language === "ar" ? "لا توجد عناوين محفوظة بعد." : "No saved addresses."}
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="bg-white p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-[#4A0E17]">{addr.title}</span>
                        <p className="text-[11px] text-stone-600 font-medium">
                          {addr.city}، {addr.district} {addr.street ? `- ${addr.street}` : ""}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Info Tab */}
          {activeTab === "info" && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold text-[#4A0E17] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                <span>{language === "ar" ? "المعلومات الشخصية" : "Personal Information"}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {language === "ar" ? "الاسم الكامل:" : "Full Name:"}
                  </label>
                  <input
                    type="text"
                    value={userName}
                    placeholder={language === "ar" ? "أدخل اسمك الكريم..." : "Enter your name..."}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:border-[#4A0E17]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {language === "ar" ? "رقم الجوال:" : "Phone Number:"}
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    placeholder="05xxxxxxxx"
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:border-[#4A0E17]"
                  />
                </div>

                <button
                  onClick={() => showToast(language === "ar" ? "تم حفظ التعديلات بنجاح! ✅" : "Saved successfully! ✅", "success")}
                  className="w-full bg-[#4A0E17] text-white font-bold py-2.5 rounded-xl shadow hover:bg-[#36070E] transition cursor-pointer"
                >
                  {language === "ar" ? "حفظ التعديلات" : "Save Changes"}
                </button>

                <div className="pt-2 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={handleClearCache}
                    className="text-[10px] text-stone-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{language === "ar" ? "تصفير بيانات التخزين المؤقت" : "Reset cached data"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};