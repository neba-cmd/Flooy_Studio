import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * This is the real security boundary for original-photo downloads.
 * The gallery page and this route use the public anon key. Access to
 * originals is enforced by `get_client_gallery_by_access_code` and
 * Storage RLS, which only signs objects for paid galleries.
 */
export async function POST(req: NextRequest) {
  const { code, photoId } = await req.json().catch(() => ({}));

  if (!code || !photoId) {
    return NextResponse.json({ error: "Missing code or photoId" }, { status: 400 });
  }

  const { url, key } = getSupabaseConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error: galleryError } = await supabase.rpc(
    "get_client_gallery_by_access_code",
    { p_code: String(code).trim().toUpperCase() }
  );

  if (galleryError || !rows?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!rows[0].paid) {
    return NextResponse.json({ error: "Not paid" }, { status: 403 });
  }

  const photo = rows.find(
    (row: { photo_id: string | null; original_path: string | null }) => row.photo_id === photoId
  );
  if (!photo?.original_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("originals")
    .createSignedUrl(photo.original_path, 300);

  if (signError || !signed) {
    return NextResponse.json({ error: "Failed to create download link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
