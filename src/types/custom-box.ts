// تعريف أحجام وسعات البوكسات
export interface BoxTier {
  id: string;
  name_ar: string;
  name_en: string;
  capacity: number; // إجمالي عدد القطع المسموح بها بدقة
  price: number;    // السعر الثابت
}

// عنصر البوكس المخصص داخل السلة
export interface CustomBoxCartItem {
  id: string; // معرّف فريد للبوكس
  type: "custom_box";
  tierId: string;
  title: string;
  price: number;
  quantity: number;
  capacity: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  summaryText: string; // نص ملخص المحتويات للفاتورة
}