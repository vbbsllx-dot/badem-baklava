"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit3, Package, Tag, Image as ImageIcon, 
  ShoppingBag, Layers, RefreshCw, Lock, KeyRound, LogOut, 
  Upload, Volume2, Loader2, Sparkles, Award, Coins, Wand2, 
  Check, ShieldCheck, Calendar, Users, DollarSign, CheckCircle2, Clock, Medal, User, AlertTriangle,
  PackagePlus
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { OrdersManager } from "./OrdersManager";
import { BoxBuilderSettings } from "./BoxBuilderSettings";
// =========================================================================
// 🌟 القسم الأول: المحركات الذكية، الترجمة الفورية، والأدوات المساعدة
// =========================================================================

const GOURMET_DICTIONARY: Record<string, string> = {
  "بقلاوة": "Royal Baklava",
  "عنتابية": "Antep Signature",
  "عنتابي": "Antep",
  "فستق": "Pistachio",
  "فستق حلبي": "Aleppo Pistachio",
  "فستق عنتاب": "Antep Pistachio",
  "سارما": "Royal Sarma Rolls",
  "سمن بلدي": "Pure Clarified Butter",
  "سمن بلدي نقي": "Artisan Clarified Butter",
  "سمن بقري": "Artisan Pure Butter",
  "عسل": "Blossom Honey",
  "قشطة": "Fresh Clotted Cream (Kaymak)",
  "شوكولاتة": "Belgian Chocolate",
  "شوكولاته": "Belgian Chocolate",
  "جوز": "Crispy Walnuts",
  "عين الجمل": "Royal Walnuts",
  "كاجو": "Roasted Cashews",
  "هيل": "Aromatic Cardamom",
  "زعفران": "Royal Saffron",
  "ماء ورد": "Rose Water Infusion",
  "ماء زهر": "Orange Blossom Water",
  "عش البلبل": "Bird's Nest Pastry",
  "مبرومة": "Twisted Pistachio Roll",
  "أصابع": "Golden Filo Fingers",
  "دولما": "Pistachio Dolma",
  "بوكس": "Luxury Box",
  "صندوق": "Royal Gift Box",
  "مشكل": "Signature Assortment",
  "مشكلة": "Signature Assortment",
  "طازج": "Freshly Baked",
  "طازجة": "Freshly Baked",
  "شاي": "Turkish Black Tea",
  "قهوة": "Traditional Artisan Coffee",
  "عرض حصري": "Exclusive Royal Offer",
  "عرض خاص": "Special Reserve Offer",
  "خصم": "Discount",
  "ملكي": "Royal",
  "ملكية": "Royal",
  "فاخر": "Luxury",
  "فاخرة": "Luxury",
};

const ARABIC_PHONETICS: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "e", "آ": "aa", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a",
  "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "ah", "ء": "'", "ئ": "e", "ؤ": "o",
  " ": " "
};

function translateToGourmetEnglish(arabicText: string): string {
  if (!arabicText || !arabicText.trim()) return "";
  let text = arabicText.trim();

  for (const [ar, en] of Object.entries(GOURMET_DICTIONARY)) {
    const regex = new RegExp(`\\b${ar}\\b|${ar}`, "gi");
    text = text.replace(regex, ` ${en} `);
  }

  const words = text.split(/\s+/).filter(Boolean);
  const translatedWords = words.map((word) => {
    if (/^[a-zA-Z0-9&%().'-]+$/.test(word)) return word;
    let phon = "";
    for (let i = 0; i < word.length; i++) {
      phon += ARABIC_PHONETICS[word[i]] || word[i];
    }
    return phon ? phon.charAt(0).toUpperCase() + phon.slice(1) : "";
  });

  return translatedWords
    .join(" ")
    .replace(/[،,]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function generateCleanSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-") || `item-${Date.now()}`;
}

const QUICK_INGREDIENT_ICONS = ["🥜", "🧈", "🍯", "🌰", "🥛", "🌾", "🍫", "🌸", "🍋", "✨"];

// =========================================================================
// 🖥️ القسم الثاني: لوحة تحكم المتجر، التقارير، وإدارة العمليات
// =========================================================================

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 🛡️ حالات تسجيل الدخول والأمان (إيقاف مؤقت عند 3 محاولات خاطئة)
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [activeTab, setActiveTab] = useState<"orders" | "categories" | "products" | "banners" | "coupons" | "loyalty" | "box_settings" >("orders");

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);
  const [pointsPerSar, setPointsPerSar] = useState<number>(10);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ slug: "", name_ar: "", name_en: "", image_url: "", sort_order: 0 });

  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [newProd, setNewProd] = useState({
    title_ar: "", title_en: "", category_slug: "", base_price: "",
    original_price: "", image_url: "", description_ar: "", description_en: ""
  });
  const [productIngredients, setProductIngredients] = useState<{ nameAr: string; nameEn: string; icon: string }[]>([]);
  const [currIngNameAr, setCurrIngNameAr] = useState("");
  const [currIngNameEn, setCurrIngNameEn] = useState("");
  const [currIngIcon, setCurrIngIcon] = useState("🥜");

  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState({ title_ar: "", title_en: "", subtitle_ar: "", subtitle_en: "", tag_ar: "عرض حصري", image_url: "" });

  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percent: "",
    one_per_customer: false,
    max_uses: "",
    min_order_amount: "",
    expires_at: "",
  });

  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [newLoyaltyReward, setNewLoyaltyReward] = useState({ title_ar: "", title_en: "", discount_percent: "", points_required: "" });

  useEffect(() => {
    if (sessionStorage.getItem("badem_admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // 🛡️ دالة التحقق الأمني من تسجيل الدخول وقفل الحساب لمدة ساعة عند 3 محاولات فاشلة
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const cleanUser = usernameInput.trim();
      const cleanPass = passwordInput.trim();

      if (!cleanUser || !cleanPass) {
        setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور.");
        setIsLoggingIn(false);
        return;
      }

      // 1. فحص هل الحساب محظور مؤقتاً بسبب 3 محاولات فاشلة سابقة
      const lockDataStr = localStorage.getItem(`badem_lock_${cleanUser}`);
      if (lockDataStr) {
        const lockData = JSON.parse(lockDataStr);
        const now = new Date().getTime();
        if (now < lockData.lockUntil) {
          const remainingMinutes = Math.ceil((lockData.lockUntil - now) / (1000 * 60));
          setLoginError(`⚠️ تم إيقاف هذا الحساب مؤقتاً بسبب المحاولات الفاشلة. يرجى المحاولة بعد ${remainingMinutes} دقيقة.`);
          setIsLoggingIn(false);
          return;
        } else {
          // انتهى وقت الحظر، نزيل القفل
          localStorage.removeItem(`badem_lock_${cleanUser}`);
          localStorage.removeItem(`badem_fails_${cleanUser}`);
        }
      }

      // 2. التحقق من قاعدة البيانات (جدول admins)
      // ملاحظة: الجدول يحتوي على أعمدة username و pin_code (التي نستخدمها ككلمة مرور)
      const { data: adminData, error } = await supabase
        .from("admins")
        .select("*")
        .eq("username", cleanUser)
        .single();

      if (error || !adminData || adminData.pin_code !== cleanPass) {
        // حساب عدد المحاولات الفاشلة
        const failsKey = `badem_fails_${cleanUser}`;
        const currentFails = Number(localStorage.getItem(failsKey) || 0) + 1;
        localStorage.setItem(failsKey, String(currentFails));

        if (currentFails >= 3) {
          const lockUntil = new Date().getTime() + 60 * 60 * 1000; // حظر لمدة ساعة كاملة
          localStorage.setItem(`badem_lock_${cleanUser}`, JSON.stringify({ lockUntil }));
          setLoginError("🚨 تم إدخال كلمة المرور خاطئة 3 مرات متتالية! تم إيقاف الحساب مؤقتاً لمدة ساعة كاملة للأمان.");
        } else {
          setLoginError(`❌ اسم المستخدم أو كلمة المرور غير صحيحة. (محاولة ${currentFails} من 3)`);
        }
        setIsLoggingIn(false);
        return;
      }

      // 3. نجاح تسجيل الدخول
      localStorage.removeItem(`badem_fails_${cleanUser}`);
      localStorage.removeItem(`badem_lock_${cleanUser}`);
      setIsAuthenticated(true);
      sessionStorage.setItem("badem_admin_auth", "true");
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const playLuxuryOrderAlert = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.log("Audio trigger error:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, banRes, coupRes, ordRes, loyRes, setRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("banners").select("*").order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("loyalty_rewards").select("*").order("points_required", { ascending: true }),
        supabase.from("store_settings").select("*").eq("id", "loyalty").single(),
      ]);

      if (catRes.data) {
        setCategories(catRes.data);
        if (catRes.data.length > 0 && !newProd.category_slug) {
          setNewProd((prev) => ({ ...prev, category_slug: catRes.data[0].slug }));
        }
      }
      if (prodRes.data) setProducts(prodRes.data);
      if (banRes.data) setBanners(banRes.data);
      if (coupRes.data) setCoupons(coupRes.data);
      if (ordRes.data) setOrders(ordRes.data);
      if (loyRes.data) setLoyaltyRewards(loyRes.data);
      if (setRes.data?.points_per_sar) setPointsPerSar(Number(setRes.data.points_per_sar));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();

    const channel = supabase
      .channel("realtime-admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setOrders((prev) => [payload.new as any, ...prev]);
        playLuxuryOrderAlert();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const handleCategoryNameArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewCat((prev) => ({
      ...prev,
      name_ar: value,
      name_en: translated,
      slug: generateCleanSlug(translated),
    }));
  };

  const handleProductNameArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewProd((prev) => ({
      ...prev,
      title_ar: value,
      title_en: translated,
    }));
  };

  const handleProductDescArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewProd((prev) => ({
      ...prev,
      description_ar: value,
      description_en: translated,
    }));
  };

  const handleBannerTitleArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewBanner((prev) => ({
      ...prev,
      title_ar: value,
      title_en: translated,
    }));
  };

  const handleBannerSubtitleArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewBanner((prev) => ({
      ...prev,
      subtitle_ar: value,
      subtitle_en: translated,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "category" | "product" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", target);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "فشل رفع الصورة");

      if (target === "category") setNewCat((prev) => ({ ...prev, image_url: data.url }));
      if (target === "product") setNewProd((prev) => ({ ...prev, image_url: data.url }));
      if (target === "banner") setNewBanner((prev) => ({ ...prev, image_url: data.url }));
    } catch (err: any) {
      alert("خطأ أثناء رفع الصورة: " + err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name_ar || !newCat.image_url) return alert("يرجى إدخال اسم القسم وصورته");

    setIsSubmitting(true);
    try {
      const payload = {
        slug: newCat.slug.trim() || generateCleanSlug(newCat.name_en || newCat.name_ar),
        name_ar: newCat.name_ar.trim(),
        name_en: newCat.name_en.trim() || newCat.name_ar.trim(),
        image_url: newCat.image_url.trim(),
        sort_order: Number(newCat.sort_order) || categories.length + 1,
      };

      if (editingCatId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCatId);
        if (error) throw error;
        alert("تم تحديث بيانات القسم بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        alert("تمت إضافة القسم بنجاح! 🎉");
      }

      setEditingCatId(null);
      setNewCat({ slug: "", name_ar: "", name_en: "", image_url: "", sort_order: 0 });
      await fetchData();
    } catch (err: any) {
      alert("تعذر حفظ القسم: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.title_ar || !newProd.base_price || !newProd.image_url) return alert("يرجى إكمال بيانات المنتج الأساسية");

    setIsSubmitting(true);
    try {
      const payload = {
        title_ar: newProd.title_ar.trim(),
        title_en: newProd.title_en.trim() || translateToGourmetEnglish(newProd.title_ar),
        category_slug: newProd.category_slug || (categories[0]?.slug ?? "Baklava"),
        base_price: parseFloat(newProd.base_price),
        original_price: newProd.original_price ? parseFloat(newProd.original_price) : null,
        has_discount: Boolean(newProd.original_price),
        image_url: newProd.image_url.trim(),
        description_ar: newProd.description_ar.trim(),
        description_en: newProd.description_en.trim(),
        ingredients: productIngredients,
      };

      if (editingProdId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProdId);
        if (error) throw error;
        alert("تم تحديث المنتج بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        alert("تم حفظ المنتج الجديد بنجاح! ✨");
      }

      setEditingProdId(null);
      setNewProd({
        title_ar: "", title_en: "", category_slug: categories[0]?.slug || "",
        base_price: "", original_price: "", image_url: "", description_ar: "", description_en: ""
      });
      setProductIngredients([]);
      await fetchData();
    } catch (err: any) {
      alert("تعذر حفظ المنتج: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.title_ar || !newBanner.image_url) return alert("يرجى إدخال عنوان وصورة العرض");

    setIsSubmitting(true);
    try {
      const payload = {
        title_ar: newBanner.title_ar.trim(),
        title_en: newBanner.title_en.trim() || translateToGourmetEnglish(newBanner.title_ar),
        subtitle_ar: newBanner.subtitle_ar.trim(),
        subtitle_en: newBanner.subtitle_en.trim() || translateToGourmetEnglish(newBanner.subtitle_ar),
        tag_ar: newBanner.tag_ar.trim(),
        image_url: newBanner.image_url.trim(),
      };

      if (editingBannerId) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editingBannerId);
        if (error) throw error;
        alert("تم تحديث العرض بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("banners").insert([payload]);
        if (error) throw error;
        alert("تم نشر العرض بنجاح! 🎊");
      }

      setEditingBannerId(null);
      setNewBanner({ title_ar: "", title_en: "", subtitle_ar: "", subtitle_en: "", tag_ar: "عرض حصري", image_url: "" });
      await fetchData();
    } catch (err: any) {
      alert("تعذر حفظ البانر: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_percent) {
      return alert("يرجى إدخال رمز الكوبون ونسبة الخصم");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        discount_percent: parseInt(newCoupon.discount_percent),
        one_per_customer: Boolean(newCoupon.one_per_customer),
        max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
        min_order_amount: newCoupon.min_order_amount ? parseFloat(newCoupon.min_order_amount) : null,
        expires_at: newCoupon.expires_at ? new Date(newCoupon.expires_at).toISOString() : null,
        is_active: true,
      };

      if (editingCouponId) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editingCouponId);
        if (error) throw error;
        alert("تم تحديث شروط الكوبون بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("coupons").insert([payload]);
        if (error) throw error;
        alert("تم تفعيل الكوبون المتقدم بنجاح! 🏷️");
      }

      setEditingCouponId(null);
      setNewCoupon({
        code: "",
        discount_percent: "",
        one_per_customer: false,
        max_uses: "",
        min_order_amount: "",
        expires_at: "",
      });
      await fetchData();
    } catch (err: any) {
      alert("تعذر حفظ الكوبون: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditCoupon = (c: any) => {
    setEditingCouponId(c.id);
    setNewCoupon({
      code: c.code || "",
      discount_percent: String(c.discount_percent || ""),
      one_per_customer: Boolean(c.one_per_customer),
      max_uses: c.max_uses ? String(c.max_uses) : "",
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "",
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveLoyaltyReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoyaltyReward.title_ar || !newLoyaltyReward.discount_percent || !newLoyaltyReward.points_required) {
      return alert("يرجى إكمال بيانات المكافأة");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title_ar: newLoyaltyReward.title_ar.trim(),
        title_en: newLoyaltyReward.title_en.trim() || translateToGourmetEnglish(newLoyaltyReward.title_ar),
        discount_percent: parseInt(newLoyaltyReward.discount_percent),
        points_required: parseInt(newLoyaltyReward.points_required),
      };

      if (editingRewardId) {
        const { error } = await supabase.from("loyalty_rewards").update(payload).eq("id", editingRewardId);
        if (error) throw error;
        alert("تم تحديث المكافأة بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("loyalty_rewards").insert([payload]);
        if (error) throw error;
        alert("تمت إضافة المكافأة بنجاح! 👑");
      }

      setEditingRewardId(null);
      setNewLoyaltyReward({ title_ar: "", title_en: "", discount_percent: "", points_required: "" });
      await fetchData();
    } catch (err: any) {
      alert("تعذر حفظ المكافأة: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePointsRate = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("store_settings").upsert({
        id: "loyalty",
        points_per_sar: Number(pointsPerSar),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert("تم تحديث معدل احتساب النقاط بنجاح! 🪙");
    } catch (err: any) {
      alert("تعذر حفظ الإعدادات: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (confirm("هل أنت متأكد من الحذف النهائي لهذا العنصر؟")) {
      try {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        await fetchData();
      } catch (err: any) {
        alert("تعذر الحذف: " + err.message);
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // شاشة تسجيل الدخول الآمنة عبر قاعدة البيانات مع ميزة القفل لمدة ساعة
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF5ED] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#4A0E17]/20 shadow-2xl text-center space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 bg-[#4A0E17] text-[#E5C058] rounded-3xl mx-auto flex items-center justify-center shadow-lg border border-[#C59B27]/40">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] tracking-widest text-[#C59B27] font-black uppercase font-brand">BADEM SECURE ADMIN</span>
            <h2 className="text-xl font-black text-[#4A0E17] mt-1">لوحة إدارة المتجر</h2>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">اسم المستخدم:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={usernameInput}
                  autoFocus
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#4A0E17] hover:bg-[#36070E] text-white font-black py-3.5 rounded-2xl text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2 transition"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>تسجيل الدخول الآمن</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#2D2321] p-4 md:p-8 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="bg-[#4A0E17] text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-[#C59B27]/30">
          <div>
            <span className="text-[10px] tracking-widest text-[#E5C058] font-black uppercase font-brand">BADEM MASTER CONTROL</span>
            <h1 className="text-2xl font-black text-white mt-1">لوحة تحكم المتجر وقواعد البيانات</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={playLuxuryOrderAlert} title="تجربة الصوت" className="p-2.5 bg-white/10 text-[#E5C058] rounded-xl cursor-pointer hover:bg-white/20 transition">
              <Volume2 className="w-4 h-4" />
            </button>
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/20 transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
            <button onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem("badem_admin_auth"); }} className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700 transition">
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* أزرار التبويبات */}
        <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: "orders", label: `الطلبات (${orders.length})`, icon: ShoppingBag },
            { id: "categories", label: `الأقسام (${categories.length})`, icon: Layers },
            { id: "products", label: `المنتجات (${products.length})`, icon: Package },
            { id: "banners", label: `العروض والبانرات (${banners.length})`, icon: ImageIcon },
            { id: "coupons", label: `الكوبونات والأمان 🛡️ (${coupons.length})`, icon: Tag },
            { id: "loyalty", label: `نقاط المكافآت  (${loyaltyRewards.length})`, icon: Award },
            { id: "box_settings", label: "خدمة البوكسات 📦", icon: PackagePlus }, // 🌟 هذا هو السطر الناقص!
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === tab.id ? "bg-[#4A0E17] text-white shadow-md" : "bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1️⃣ تبويب إدارة الطلبات */}
        {activeTab === "orders" && (
          <OrdersManager 
            orders={orders} 
            productsCount={products.length} 
            couponsCount={coupons.length} 
            fetchData={fetchData} 
          />
        )}

        {/* 2️⃣ تبويب إدارة الأقسام */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
                  {editingCatId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
                  <span>{editingCatId ? "تعديل بيانات القسم الحالي" : "إضافة قسم جديد للمتجر"}</span>
                </h3>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => { setEditingCatId(null); setNewCat({ slug: "", name_ar: "", name_en: "", image_url: "", sort_order: 0 }); }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    إلغاء التعديل ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">اسم القسم بالعربي *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بقلاوة عنتابية"
                    value={newCat.name_ar}
                    onChange={(e) => handleCategoryNameArChange(e.target.value)}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 flex items-center justify-between">
                    <span>الاسم بالإنجليزي (ترجمة فورية):</span>
                    <Wand2 className="w-3 h-3 text-[#C59B27]" />
                  </label>
                  <input
                    type="text"
                    placeholder="Antep Signature Baklava"
                    value={newCat.name_en}
                    onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">معرّف الرابط (Slug تلقائي):</label>
                  <input
                    type="text"
                    placeholder="antep-signature-baklava"
                    value={newCat.slug}
                    onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="block font-bold mb-1">صورة القسم مفرغة PNG *:</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#36070E] transition shrink-0">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingImage ? "جاري الرفع..." : "اختر صورة مفرغة"}</span>
                      <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, "category")} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="رابط الصورة أو مسار الملف..."
                      value={newCat.image_url}
                      onChange={(e) => setNewCat({ ...newCat, image_url: e.target.value })}
                      className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs font-medium"
                    />
                    {newCat.image_url && <img src={newCat.image_url} alt="" className="w-10 h-10 rounded-xl object-contain border bg-stone-100" />}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center gap-2 ${
                  editingCatId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingCatId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingCatId ? "حفظ التعديلات" : "حفظ القسم"}</span>
              </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white p-4 rounded-3xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                  <img src={cat.image_url} alt="" className="w-12 h-12 rounded-2xl object-contain" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs truncate">{cat.name_ar}</h4>
                    <span className="text-[10px] text-stone-400 block truncate">{cat.name_en}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingCatId(cat.id); setNewCat(cat); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="تعديل" className="p-1.5 text-stone-400 hover:text-amber-600 cursor-pointer">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete("categories", cat.id)} title="حذف" className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 هذا الجزء سليم 100% اتركه كما هو */}
{activeTab === "box_settings" && (
  <div className="pt-2">
    <BoxBuilderSettings />
  </div>
)}

        {/* 3️⃣ تبويب إدارة المنتجات */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
                  {editingProdId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
                  <span>{editingProdId ? "تعديل بيانات المنتج الحالي" : "إضافة منتج فاخر جديد"}</span>
                </h3>
                {editingProdId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProdId(null);
                      setNewProd({
                        title_ar: "", title_en: "", category_slug: categories[0]?.slug || "",
                        base_price: "", original_price: "", image_url: "", description_ar: "", description_en: ""
                      });
                      setProductIngredients([]);
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    إلغاء التعديل ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">اسم الصنف بالعربي *:</label>
                  <input
                    type="text"
                    required
                    placeholder="بقلاوة بالفستق الملكي"
                    value={newProd.title_ar}
                    onChange={(e) => handleProductNameArChange(e.target.value)}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 flex items-center justify-between">
                    <span>الاسم بالإنجليزي (ترجمة فورية):</span>
                    <Wand2 className="w-3 h-3 text-[#C59B27]" />
                  </label>
                  <input
                    type="text"
                    placeholder="Royal Pistachio Baklava"
                    value={newProd.title_en}
                    onChange={(e) => setNewProd({ ...newProd, title_en: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">القسم / التصنيف *:</label>
                  <select
                    value={newProd.category_slug}
                    onChange={(e) => setNewProd({ ...newProd, category_slug: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold cursor-pointer"
                  >
                    {categories.map((c) => (<option key={c.id} value={c.slug}>{c.name_ar}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">السعر الحالي (ر.س) *:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="8.50"
                    value={newProd.base_price}
                    onChange={(e) => setNewProd({ ...newProd, base_price: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">السعر قبل الخصم (اختياري):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={newProd.original_price}
                    onChange={(e) => setNewProd({ ...newProd, original_price: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold mb-1">صورة المنتج *:</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#36070E] shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? "رفع..." : "رفع ملف"}</span>
                      <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, "product")} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="رابط الصورة..."
                      value={newProd.image_url}
                      onChange={(e) => setNewProd({ ...newProd, image_url: e.target.value })}
                      className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl p-2 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">الوصف بالعربي:</label>
                  <textarea
                    rows={2}
                    value={newProd.description_ar}
                    onChange={(e) => handleProductDescArChange(e.target.value)}
                    placeholder="وصف مكونات ومميزات الصنف بالعربي..."
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 flex items-center justify-between">
                    <span>الوصف بالإنجليزي (ترجمة فورية):</span>
                    <Wand2 className="w-3 h-3 text-[#C59B27]" />
                  </label>
                  <textarea
                    rows={2}
                    value={newProd.description_en}
                    onChange={(e) => setNewProd({ ...newProd, description_en: e.target.value })}
                    placeholder="Gourmet English description..."
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs resize-none"
                  />
                </div>
              </div>

              {/* تفكيك المكونات */}
              <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>تفكيك المكونات الطبيعية (اختياري):</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-stone-200">
                    <span className="text-base">{currIngIcon}</span>
                    <select value={currIngIcon} onChange={(e) => setCurrIngIcon(e.target.value)} className="bg-transparent text-xs font-bold focus:outline-hidden cursor-pointer">
                      {QUICK_INGREDIENT_ICONS.map((ic) => (<option key={ic} value={ic}>{ic}</option>))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="اسم المكون (عربي) مثل: سمن بلدي نقي"
                    value={currIngNameAr}
                    onChange={(e) => {
                      setCurrIngNameAr(e.target.value);
                      setCurrIngNameEn(translateToGourmetEnglish(e.target.value));
                    }}
                    className="flex-1 min-w-[140px] bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="ترجمة الإنجليزية..."
                    value={currIngNameEn}
                    onChange={(e) => setCurrIngNameEn(e.target.value)}
                    className="flex-1 min-w-[120px] bg-white border border-stone-200 rounded-xl p-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!currIngNameAr.trim()) return;
                      setProductIngredients((prev) => [
                        ...prev,
                        { nameAr: currIngNameAr.trim(), nameEn: currIngNameEn.trim() || currIngNameAr.trim(), icon: currIngIcon },
                      ]);
                      setCurrIngNameAr("");
                      setCurrIngNameEn("");
                    }}
                    className="px-3 py-2 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + إضافة مكون
                  </button>
                </div>
                {productIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200/60">
                    {productIngredients.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-stone-300 px-3 py-1 rounded-xl text-xs font-bold text-stone-800">
                        <span>{item.icon}</span><span>{item.nameAr}</span>
                        <span className="text-[10px] text-stone-400">({item.nameEn})</span>
                        <button type="button" onClick={() => setProductIngredients((prev) => prev.filter((_, i) => i !== idx))} className="text-stone-400 hover:text-rose-600 mr-1 text-sm cursor-pointer">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
                  editingProdId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingProdId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingProdId ? "حفظ تعديلات المنتج" : "حفظ المنتج"}</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white p-4 rounded-3xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
                  <img src={p.image_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs truncate">{p.title_ar}</h4>
                    <span className="text-[10px] text-stone-400 block truncate">{p.title_en}</span>
                    <span className="text-xs font-black text-[#4A0E17] block">{p.base_price} ر.س</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingProdId(p.id); setNewProd(p); setProductIngredients(p.ingredients || []); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="تعديل" className="p-2 text-stone-400 hover:text-amber-600 cursor-pointer">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete("products", p.id)} title="حذف" className="p-2 text-stone-400 hover:text-rose-600 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 4️⃣ تبويب إدارة العروض والبانرات */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveBanner} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
                  {editingBannerId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
                  <span>{editingBannerId ? "تعديل بيانات العرض الترويجي" : "إضافة بانر / عرض ترويجي جديد"}</span>
                </h3>
                {editingBannerId && (
                  <button
                    type="button"
                    onClick={() => { setEditingBannerId(null); setNewBanner({ title_ar: "", title_en: "", subtitle_ar: "", subtitle_en: "", tag_ar: "عرض حصري", image_url: "" }); }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    إلغاء التعديل ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">العنوان بالعربي *:</label>
                  <textarea
                    rows={2}
                    required
                    placeholder={"سارما ملكية\nفستق عنتاب خالص"}
                    value={newBanner.title_ar}
                    onChange={(e) => handleBannerTitleArChange(e.target.value)}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs font-bold resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 flex items-center justify-between">
                    <span>العنوان بالإنجليزي (ترجمة فورية):</span>
                    <Wand2 className="w-3 h-3 text-[#C59B27]" />
                  </label>
                  <textarea
                    rows={2}
                    placeholder={"ROYAL SARMA.\nPURE ANTEP PISTACHIO."}
                    value={newBanner.title_en}
                    onChange={(e) => setNewBanner({ ...newBanner, title_en: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs font-bold uppercase resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">الوصف المختصر (عربي):</label>
                  <input
                    type="text"
                    placeholder="رولات خضراء فاخرة بأكثر من 85% فستق نقي"
                    value={newBanner.subtitle_ar}
                    onChange={(e) => handleBannerSubtitleArChange(e.target.value)}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 flex items-center justify-between">
                    <span>الوصف المختصر بالإنجليزي:</span>
                    <Wand2 className="w-3 h-3 text-[#C59B27]" />
                  </label>
                  <input
                    type="text"
                    placeholder="Royal green rolls with over 85% pure Antep pistachios."
                    value={newBanner.subtitle_en}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle_en: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="block font-bold mb-1">صورة العرض *:</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#36070E] shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? "جاري الرفع..." : "رفع من الجهاز"}</span>
                      <input type="file" accept="image/*" disabled={uploadingImage} onChange={(e) => handleFileUpload(e, "banner")} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="رابط الصورة أو مسار الملف..."
                      value={newBanner.image_url}
                      onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                      className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl p-2 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
                  editingBannerId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingBannerId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingBannerId ? "حفظ تعديلات العرض" : "نشر العرض"}</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div key={b.id} className="relative rounded-3xl overflow-hidden shadow-md h-40 border border-stone-200 bg-[#380E14] text-white p-4 flex items-center justify-between">
                  <div className="max-w-[60%] space-y-1">
                    <h4 className="font-bold text-xs leading-tight line-clamp-2">{b.title_ar || b.title_en}</h4>
                    <p className="text-[10px] text-stone-300 line-clamp-2">{b.subtitle_ar || b.subtitle_en}</p>
                  </div>
                  <img src={b.image_url} alt="" className="w-24 h-24 rounded-2xl object-cover border border-white/10" />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <button onClick={() => { setEditingBannerId(b.id); setNewBanner(b); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="تعديل" className="bg-black/60 hover:bg-amber-600 text-white p-1.5 rounded-lg transition cursor-pointer">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete("banners", b.id)} title="حذف" className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg transition cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5️⃣ تبويب إدارة الكوبونات */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveCoupon} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
                    <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#4A0E17]">
                      {editingCouponId ? "تعديل بيانات وشروط الكوبون" : "إنشاء كود خصم ذكي ومحمي"}
                    </h3>
                    <p className="text-[10px] text-stone-400">حدد رمز الكوبون ونسبة الخصم مع شروط الاستخدام المتقدمة</p>
                  </div>
                </div>

                {editingCouponId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCouponId(null);
                      setNewCoupon({
                        code: "",
                        discount_percent: "",
                        one_per_customer: false,
                        max_uses: "",
                        min_order_amount: "",
                        expires_at: "",
                      });
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    إلغاء التعديل ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">رمز الكوبون (الكود) *:</label>
                  <input
                    type="text"
                    required
                    placeholder="SARAH15 أو ROYAL20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">نسبة الخصم (%) *:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    placeholder="15"
                    value={newCoupon.discount_percent}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200/80 space-y-4">
                <span className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                  <span>شروط الاستخدام والقيود الأمنية (اختياري):</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold mb-1 flex items-center gap-1 text-stone-700">
                      <DollarSign className="w-3.5 h-3.5 text-[#4A0E17]" />
                      <span>الحد الأدنى لقيمة السلة (ر.س):</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="مثال: 100"
                      value={newCoupon.min_order_amount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 flex items-center gap-1 text-stone-700">
                      <Users className="w-3.5 h-3.5 text-[#4A0E17]" />
                      <span>العدد الإجمالي المسموح به (سقف الطلبات):</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="مثال: 50"
                      value={newCoupon.max_uses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 flex items-center gap-1.5 text-stone-700">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>تاريخ انتهاء الكوبون:</span>
                    </label>
                    <input
                      type="date"
                      value={newCoupon.expires_at ? newCoupon.expires_at.slice(0, 10) : ""}
                      onChange={(e) => {
                        const fullDateTime = e.target.value ? `${e.target.value}T23:59` : "";
                        setNewCoupon({ ...newCoupon, expires_at: fullDateTime });
                      }}
                      className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17] shadow-2xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">تقييد الاستخدام لمرة واحدة فقط لكل رقم جوال</span>
                      <span className="text-[10px] text-stone-500">يفحص سجل الطلبات برقم العميل لمنع استغلال الخصم أكثر من مرة.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newCoupon.one_per_customer}
                    onChange={(e) => setNewCoupon({ ...newCoupon, one_per_customer: e.target.checked })}
                    className="w-5 h-5 accent-[#4A0E17] rounded-md cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
                  editingCouponId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingCouponId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingCouponId ? "حفظ تعديلات الكوبون" : "تفعيل الكوبون المتقدم"}</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {coupons.map((c) => {
                const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                const isLimitReached = c.max_uses && (c.used_count || 0) >= c.max_uses;

                return (
                  <div
                    key={c.id}
                    className={`bg-white p-4 rounded-2xl border shadow-2xs space-y-2 relative transition ${
                      isExpired || isLimitReached ? "border-rose-200 bg-rose-50/30 opacity-80" : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#4A0E17] bg-[#FAF5ED] px-2.5 py-0.5 rounded-lg border border-stone-200">
                          {c.code}
                        </span>
                        <span className="text-xs font-black text-emerald-700">
                          خصم {c.discount_percent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditCoupon(c)} title="تعديل" className="text-stone-400 hover:text-amber-600 p-1 cursor-pointer">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete("coupons", c.id)} title="حذف" className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-stone-600">
                      {c.one_per_customer && (
                        <div className="flex items-center gap-1 text-emerald-800 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>مرة واحدة لكل رقم جوال</span>
                        </div>
                      )}
                      {c.min_order_amount && (
                        <div className="flex items-center gap-1 text-stone-500">
                          <DollarSign className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>الحد الأدنى: <strong>{c.min_order_amount} ر.س</strong></span>
                        </div>
                      )}
                      {c.max_uses && (
                        <div className="flex items-center gap-1 text-stone-500">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>الاستخدام: <strong>{c.used_count || 0} / {c.max_uses}</strong></span>
                        </div>
                      )}
                      {c.expires_at && (
                        <div className={`flex items-center gap-1 ${isExpired ? "text-rose-600 font-bold" : "text-stone-500"}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isExpired ? "انتهى في:" : "ينتهي في:"} {new Date(c.expires_at).toLocaleDateString("ar-SA")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6️⃣ تبويب نقاط المكافآت والولاء */}
        {activeTab === "loyalty" && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17] border border-[#C59B27]/30 shadow-2xs shrink-0">
                  <Coins className="w-6 h-6 text-[#C59B27]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#4A0E17]">معدل احتساب نقاط المشتريات التلقائي</h3>
                    <Sparkles className="w-4 h-4 text-[#C59B27]" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    حدد عدد النقاط الملكية التي يكتسبها العميل تلقائياً عند إنفاق كل 1 ريال سعودي:
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md pt-2">
                <div className="w-full sm:flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    value={pointsPerSar}
                    onChange={(e) => setPointsPerSar(Number(e.target.value))}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-2xl px-4 py-3 text-xs font-black text-[#4A0E17] focus:outline-hidden focus:border-[#4A0E17] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    نقطة / 1 ر.س
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={handleSavePointsRate}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-[#4A0E17] hover:bg-[#36070E] text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ المعدل 🪙"}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveLoyaltyReward} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
                  {editingRewardId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
                  <span>{editingRewardId ? "تعديل مكافأة النقاط" : "إضافة مكافأة استبدال نقاط جديدة"}</span>
                </h3>
                {editingRewardId && (
                  <button
                    type="button"
                    onClick={() => { setEditingRewardId(null); setNewLoyaltyReward({ title_ar: "", title_en: "", discount_percent: "", points_required: "" }); }}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    إلغاء التعديل ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">اسم المكافأة بالعربي *:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خصم 15% للملوك"
                    value={newLoyaltyReward.title_ar}
                    onChange={(e) => {
                      setNewLoyaltyReward({
                        ...newLoyaltyReward,
                        title_ar: e.target.value,
                        title_en: translateToGourmetEnglish(e.target.value),
                      });
                    }}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 flex items-center justify-between">
                    <span>الاسم بالإنجليزي (ترجمة فورية):</span>
                    <Wand2 className="w-3 h-3 text-[#C59B27]" />
                  </label>
                  <input
                    type="text"
                    placeholder="15% Royal Discount"
                    value={newLoyaltyReward.title_en}
                    onChange={(e) => setNewLoyaltyReward({ ...newLoyaltyReward, title_en: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">نسبة الخصم الممنوحة (%) *:</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={newLoyaltyReward.discount_percent}
                    onChange={(e) => setNewLoyaltyReward({ ...newLoyaltyReward, discount_percent: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">عدد النقاط المطلوبة للاستبدال *:</label>
                  <input
                    type="number"
                    required
                    placeholder="150"
                    value={newLoyaltyReward.points_required}
                    onChange={(e) => setNewLoyaltyReward({ ...newLoyaltyReward, points_required: e.target.value })}
                    className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
                  editingRewardId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingRewardId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingRewardId ? "حفظ تعديلات المكافأة" : "حفظ المكافأة"}</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {loyaltyRewards.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                      <Medal className="w-5 h-5 text-[#C59B27]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#4A0E17]">{r.title_ar}</h4>
                      <span className="text-[10px] text-stone-400 block">{r.title_en}</span>
                      <span className="text-[10px] text-emerald-700 font-bold block">خصم {r.discount_percent}%</span>
                      <span className="text-[10px] text-stone-500 font-bold">مطلوب: {r.points_required} نقطة</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingRewardId(r.id); setNewLoyaltyReward(r); window.scrollTo({ top: 0, behavior: "smooth" }); }} title="تعديل" className="text-stone-400 hover:text-amber-600 p-2 cursor-pointer">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete("loyalty_rewards", r.id)} title="حذف" className="text-stone-400 hover:text-rose-600 p-2 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}