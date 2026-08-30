import { createClient } from "@supabase/supabase-js";

// ضع رابط مشروعك ومفتاح anon هنا مباشرة
const supabaseUrl = "https://zpvcjdnucykexfnxkxeb.supabase.co";
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdmNqZG51Y3lrZXhmbnhreGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Nzk0MzYsImV4cCI6MjEwMzM1NTQzNn0.NwJ5mU-ZhIv5tMssfDT-IdtUMl6QvquoHURXgyVHmIs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);