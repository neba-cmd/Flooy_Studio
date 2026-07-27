import { NextRequest, NextResponse } from "next/server";
import { normalizeAccessCode, ACCESS_CODE_PATTERN } from "@/lib/photo-delivery/validation";
import { publicApiLimiter, requestClientKey } from "@/lib/server/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const rate = publicApiLimiter.check(`gallery:${requestClientKey(req)}`, {
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many code attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const { code } = await req.json().catch(() => ({}));
  const normalizedCode = normalizeAccessCode(code);
  if (!ACCESS_CODE_PATTERN.test(normalizedCode)) {
    return NextResponse.json({ error: "Enter a valid gallery code." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[client-gallery] Server configuration error", error);
    return NextResponse.json(
      { error: "The gallery service is temporarily unavailable." },
      { status: 503 }
    );
  }

  const { data: gallery, error: galleryError } = await admin
    .from("customer_galleries")
    .select("id, customer_name, access_code, is_paid")
    .eq("access_code", normalizedCode)
    .maybeSingle();

  if (galleryError) {
    console.error("[client-gallery] Gallery lookup failed", galleryError.message);
    return NextResponse.json({ error: "The gallery could not be opened. Try again." }, { status: 503 });
  }
  if (!gallery) {
    return NextResponse.json({ error: "No gallery was found for that code." }, { status: 404 });
  }

  const { data: photos, error: photoError } = await admin
    .from("gallery_photos")
    .select("id, preview_storage_path, captured_at, created_at")
    .eq("gallery_id", gallery.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  if (photoError) {
    console.error("[client-gallery] Photo lookup failed", photoError.message);
    return NextResponse.json({ error: "The gallery could not be opened. Try again." }, { status: 503 });
  }

  if (!photos?.length) {
    return NextResponse.json(
      {
        gallery: {
          name: gallery.customer_name,
          accessCode: gallery.access_code,
          paid: gallery.is_paid,
        },
        photos: [],
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const { data: signed, error: signingError } = await admin.storage
    .from("photo-previews")
    .createSignedUrls(
      photos.map((photo) => photo.preview_storage_path),
      1800
    );

  if (signingError) {
    console.error("[client-gallery] Preview signing failed", signingError.message);
    return NextResponse.json(
      { error: "Your gallery was found, but its previews could not be prepared." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      gallery: {
        name: gallery.customer_name,
        accessCode: gallery.access_code,
        paid: gallery.is_paid,
      },
      photos: photos.map((photo, index) => ({
        photo_id: photo.id,
        preview_url: signed?.[index]?.signedUrl ?? null,
        taken_at: photo.captured_at ?? photo.created_at,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
