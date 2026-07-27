import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_CODE_PATTERN,
  isValidPhotoId,
  normalizeAccessCode,
} from "@/lib/photo-delivery/validation";
import { publicApiLimiter, requestClientKey } from "@/lib/server/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * This is the real security boundary for original-photo downloads.
 * A server-only client verifies the access code, paid state, and photo
 * membership before signing one exact object. This deliberately does not rely
 * on a separately deployed RPC, which makes downloads more reliable across
 * Supabase schema versions.
 */
export async function POST(req: NextRequest) {
  const rate = publicApiLimiter.check(`download:${requestClientKey(req)}`, {
    limit: 120,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many downloads were requested. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const { code, photoId } = await req.json().catch(() => ({}));
  const normalizedCode = normalizeAccessCode(code);

  if (
    !ACCESS_CODE_PATTERN.test(normalizedCode) ||
    !isValidPhotoId(photoId)
  ) {
    return NextResponse.json({ error: "Missing code or photoId" }, { status: 400 });
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (error) {
    console.error("[download-original] Server configuration error", error);
    return NextResponse.json(
      { error: "Downloads are temporarily unavailable. Please contact the photographer." },
      { status: 503 }
    );
  }

  const { data: gallery, error: galleryError } = await adminClient
    .from("customer_galleries")
    .select("id, is_paid")
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
  if (!gallery.is_paid) {
    return NextResponse.json(
      { error: "This gallery has not been unlocked for downloads yet." },
      { status: 403 }
    );
  }

  const { data: photo, error: photoError } = await adminClient
    .from("gallery_photos")
    .select("original_storage_path, original_file_name, status")
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
  if (!photo?.original_storage_path || photo.status !== "ready") {
    return NextResponse.json(
      { error: "This photo is still being prepared. Please try again shortly." },
      { status: 409 }
    );
  }

  const { data: signed, error: signError } = await adminClient.storage
    .from("photo-originals")
    .createSignedUrl(photo.original_storage_path, 600, {
      download: photo.original_file_name || true,
    });

  if (signError || !signed) {
    console.error(
      "[download-original] Storage signing failed",
      signError?.message ?? "No signed URL returned",
      { photoId, path: photo.original_storage_path }
    );
    return NextResponse.json(
      { error: "The photo is available, but the download could not start. Please try again." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { url: signed.signedUrl, fileName: photo.original_file_name },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
