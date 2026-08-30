import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const target = (formData.get("target") as string) || "media";

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار أي ملف" }, { status: 400 });
    }

    // قراءة محتوى الملف
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // تجهيز اسم الملف والمسار داخل مجلد public
    const fileExt = file.name.split(".").pop() || "jpg";
    const cleanFileName = `${target}-${Date.now()}.${fileExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // إنشاء المجلد تلقائياً إذا لم يكن موجوداً
    await mkdir(uploadDir, { recursive: true });

    // حفظ الصورة على الجهاز
    const filePath = path.join(uploadDir, cleanFileName);
    await writeFile(filePath, buffer);

    // إرجاع الرابط المباشر
    const publicUrl = `/uploads/${cleanFileName}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Local upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}