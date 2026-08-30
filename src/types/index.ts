// 1. نوع المكونات
export interface Ingredient {
  nameAr: string;
  nameEn: string;
  icon: string;
  isAllergen?: boolean;
}

// 2. نوع المنتج (متوافق مع Supabase)
export interface Product {
  id: string | number;
  titleAr: string;
  titleEn: string;
  category: string;
  basePrice: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  image: string;
  descriptionAr: string;
  descriptionEn: string;
  ingredients: Ingredient[];
}

// 3. نوع التصنيف
export interface Category {
  id: string;
  slug?: string;
  nameAr: string;
  nameEn: string;
  image?: string;
  iconName?: string;
}

// 4. نوع عنصر السلة
export interface CartItem {
  id: string | number;
  title: string;
  price: number;
  image: string;
  portionNote: string;
  quantity: number;
}

// 5. نوع البانر والعروض الترويجية
export interface BannerSlide {
  id: string | number;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  tag_ar?: string;
  tag_en?: string;
  image_url?: string;
  image?: string;
  actionType?: "scroll" | "category" | "product";
  actionPayload?: string | number;
}

// 6. نوع التقييمات والمراجعات
export interface Review {
  id: string;
  product_id: string | number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// 7. نوع كود الخصم (Coupon)
export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
}

// 8. نوع الطلب والفاتورة
export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  district: string;
  street?: string;
  notes?: string;
  is_gift?: boolean;
  recipient_name?: string;
  gift_message?: string;
  items: any[];
  subtotal: number;
  discount_amount?: number;
  delivery_fee?: number;
  total_amount: number;
  payment_method: string;
  status: "pending" | "baking" | "delivering" | "completed" | "cancelled";
  created_at?: string;
}