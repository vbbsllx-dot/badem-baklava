import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// استخدام مفتاح الخدمة إن وجد أو المفتاح العام للأمان
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const target = (formData.get("target") as string) || "product";

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار أي ملف" }, { status: 400 });
    }

    // التحقق من نوع الملف لضمان أمان السيرفر
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "يرجى رفع ملف صورة صالح فقط" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ⚡ تحديد الأبعاد المثالية بناءً على موضع العرض لمنع أي تشويش أو حجم زائد
    let maxWidth = 800;
    let maxHeight = 800;
    let quality = 80;

    if (target === "banner") {
      maxWidth = 1280;
      maxHeight = 720;
      quality = 85;
    } else if (target === "category") {
      maxWidth = 450;
      maxHeight = 450;
      quality = 82;
    }

    // ⚡ معالجة وضغط الصورة باحترافية
    const optimizedBuffer = await sharp(buffer)
      .rotate() // 🔄 يصحح دوران صور الجوال تلقائياً اعتماداً على مستشعر الكاميرا
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 4, // ضغط متقدم يحافظ على نقاء الألوان وتفاصيل الفستق والعسل
        smartSubsample: true,
      })
      .toBuffer();

    const fileName = `${target}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
    const filePath = `${target}/${fileName}`;

    // 🚀 الرفع مع إعدادات الكاش السحابي الأقصى (1 سنة كاملة)
    const { error: uploadError } = await supabase.storage
      .from("store-images")
      .upload(filePath, optimizedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000, immutable", // كاش دائم فائق السرعة
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("store-images").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Upload & optimize error:", err);
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء معالجة ورفع الصورة" },
      { status: 500 }
    );
  }
}