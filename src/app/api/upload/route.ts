import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const target = (formData.get("target") as string) || "media";

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار أي ملف" }, { status: 400 });
    }

    // 1. تحويل الملف إلى Buffer لمعالجته برمجياً
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. تجهيز اسم فريد للملف
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${target}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${target}/${fileName}`;

    // 3. رفع الصورة إلى مستودع store-images في Supabase
    const { error: uploadError } = await supabase.storage
      .from("store-images")
      .upload(filePath, buffer, {
        contentType: file.type || `image/${fileExt}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("خطأ التخزين في سوبابيس:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 4. استخراج الرابط المباشر العام للصورة
    const { data: { publicUrl } } = supabase.storage
      .from("store-images")
      .getPublicUrl(filePath);

    // 5. إرجاع نفس النتيجة المتوقعة للواجهة الأمامية
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}