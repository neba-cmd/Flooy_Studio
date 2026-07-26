import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * This is the real security boundary for original-photo downloads.
 * A server-only client verifies the access code, paid state, and photo
 * membership before signing one exact object. This deliberately does not rely
 * on a separately deployed RPC, which makes downloads more reliable across
 * Supabase schema versions.
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

  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    console.error("[download-original] SUPABASE_SERVICE_ROLE_KEY is not configured");
    return NextResponse.json(
      { error: "Downloads are temporarily unavailable. Please contact the photographer." },
      { status: 503 }
    );
  }

  const adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const normalizedCode = code.trim().toUpperCase();

  const { data: gallery, error: galleryError } = await adminClient
    .from("client_galleries")
    .select("id, paid")
    .eq("access_code", normalizedCode)
    .maybeSingle();

  if (galleryError) {
    console.error("[download-original] Gallery lookup failed", galleryError.message);
    return NextResponse.json(
      { error: "We couldn't verify this gallery. Please try again." },
      { status: 503 }
    );
  }
  if (!gallery) {
    return NextResponse.json({ error: "This gallery could not be found." }, { status: 404 });
  }
  if (!gallery.paid) {
    return NextResponse.json(
      { error: "This gallery has not been unlocked for downloads yet." },
      { status: 403 }
    );
  }

  const { data: photo, error: photoError } = await adminClient
    .from("photos")
    .select("original_path, file_name, upload_status")
    .eq("id", photoId)
    .eq("gallery_id", gallery.id)
    .maybeSingle();

  if (photoError) {
    console.error("[download-original] Photo lookup failed", photoError.message);
    return NextResponse.json(
      { error: "We couldn't prepare this photo. Please try again." },
      { status: 503 }
    );
  }
  if (!photo?.original_path || photo.upload_status !== "uploaded") {
    return NextResponse.json(
      { error: "This photo is still being prepared. Please try again shortly." },
      { status: 409 }
    );
  }

  const { data: signed, error: signError } = await adminClient.storage
    .from("originals")
    .createSignedUrl(photo.original_path, 600, {
      download: photo.file_name || true,
    });

  if (signError || !signed) {
    console.error(
      "[download-original] Storage signing failed",
      signError?.message ?? "No signed URL returned",
      { photoId, path: photo.original_path }
    );
    return NextResponse.json(
      { error: "The photo is available, but the download could not start. Please try again." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { url: signed.signedUrl, fileName: photo.file_name },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
