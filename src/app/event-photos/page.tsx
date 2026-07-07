"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface GalleryPhoto {
  photo_id: string;
  preview_path: string;
  original_path: string | null;
  taken_at: string;
}

export default function EventPhotosPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setPhotos([]);
    const normalizedCode = code.trim().toUpperCase();
    const supabase = createClient();

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_client_gallery_by_access_code",
      {
        p_code: normalizedCode,
      }
    );

    let rows: GalleryPhoto[] = [];
    let galleryPaid = false;

    if (!rpcError && rpcData && rpcData.length > 0) {
      galleryPaid = Boolean(rpcData[0].paid);
      rows = rpcData.filter((r: { photo_id: string | null }) => r.photo_id) as GalleryPhoto[];
    }

    if (rpcError || rows.length === 0) {
      const { data: galleryData, error: galleryError } = await supabase
        .from("client_galleries")
        .select("id, paid")
        .eq("access_code", normalizedCode)
        .maybeSingle();

      if (galleryError || !galleryData) {
        setLoading(false);
        setError("No photos found for that code yet.");
        return;
      }

      galleryPaid = Boolean(galleryData.paid);

      const { data: photoData, error: photoError } = await supabase
        .from("photos")
        .select("id, preview_path, original_path")
        .eq("gallery_id", galleryData.id)
        .order("created_at", { ascending: false });

      if (photoError) {
        setLoading(false);
        setError("Something went wrong. Please try again.");
        return;
      }

      rows = (photoData ?? [])
        .filter((row) => row.preview_path)
        .map((row) => ({
          photo_id: row.id,
          preview_path: row.preview_path,
          original_path: row.original_path,
          taken_at: "",
        }));
    }

    setLoading(false);

    if (rows.length === 0) {
      setError("This gallery exists, but no photos have been uploaded yet.");
      return;
    }

    setPaid(galleryPaid);
    setPhotos(rows);

    const urls: Record<string, string> = {};
    for (const p of rows) {
      const { data: signed } = await supabase.storage
        .from("previews")
        .createSignedUrl(p.preview_path, 3600);
      if (signed) urls[p.photo_id] = signed.signedUrl;
    }
    setPreviewUrls(urls);
  }

  // Originals live in a private bucket. Storage RLS only allows
  // signed URLs when the gallery is marked paid.
  async function downloadOriginal(photoId: string) {
    const photo = photos.find((p) => p.photo_id === photoId);
    if (!photo?.original_path) {
      setError("This photo is not available for download yet.");
      return;
    }

    setDownloadingId(photoId);
    try {
      const supabase = createClient();
      const { data, error: signedError } = await supabase.storage
        .from("originals")
        .createSignedUrl(photo.original_path, 300);

      if (signedError || !data?.signedUrl) {
        setError("Couldn't get download link. Please try again.");
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.h1}>Find your photos</h1>

      <div className={styles.row}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="Enter your access code"
          className={styles.input}
        />
        <button type="button" onClick={lookup} disabled={loading || !code.trim()} className={styles.button}>
          {loading ? "Looking…" : "View"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {photos.length > 0 && (
        <>
          {!paid && (
            <p className={styles.notice}>
              Previews only. Pay at the event desk to unlock full-resolution downloads.
            </p>
          )}
          <div className={styles.grid}>
            {photos.map((p) => (
              <div key={p.photo_id} className={styles.card}>
                {previewUrls[p.photo_id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrls[p.photo_id]}
                    alt="Event preview"
                    className={styles.thumb}
                  />
                )}
                <div className={styles.cardFooter}>
                  {paid ? (
                    <button
                      type="button"
                      onClick={() => downloadOriginal(p.photo_id)}
                      disabled={downloadingId === p.photo_id}
                      className={styles.downloadBtn}
                    >
                      {downloadingId === p.photo_id ? "…" : "Download"}
                    </button>
                  ) : (
                    <div className={styles.lockedBtn}>Locked</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
