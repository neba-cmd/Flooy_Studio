import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * This is the real security boundary for original-photo downloads.
 * The public client validates a paid gallery/code/photo combination through
 * a narrowly scoped RPC. Only then does a server-only client sign the object.
 */
export async function POST(req: NextRequest) {
  const { code, photoId } = await req.json().catch(() => ({}));

  if (
    typeof code !== "string" ||
    typeof photoId !== "string" ||
    !code.trim() ||
    code.length > 64 ||
    !/^[a-z0-9-]+$/i.test(code.trim()) ||
    !/^[0-9a-f-]{36}$/i.test(photoId)
  ) {
    return NextResponse.json({ error: "Missing code or photoId" }, { status: 400 });
  }

  const { url, key } = getSupabaseConfig();
  const publicClient = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error: galleryError } = await publicClient.rpc(
    "get_paid_photo_by_access_code",
    { p_code: code.trim().toUpperCase(), p_photo_id: photoId }
  );

  if (galleryError || !rows?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const photo = rows[0] as { original_path: string | null };
  if (!photo?.original_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    return NextResponse.json({ error: "Download service unavailable" }, { status: 503 });
  }

  // Only this server-side client bypasses Storage RLS, after the access code,
  // paid state, and photo membership have all been verified above.
  const adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data: signed, error: signError } = await adminClient.storage
    .from("originals")
    .createSignedUrl(photo.original_path, 300, { download: true });

  if (signError || !signed) {
    return NextResponse.json({ error: "Failed to create download link" }, { status: 500 });
  }

  return NextResponse.json(
    { url: signed.signedUrl },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
