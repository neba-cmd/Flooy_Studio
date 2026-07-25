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
  const [loadedPreviews, setLoadedPreviews] = useState<Record<string, boolean>>({});
  const [activeCode, setActiveCode] = useState("");
  const [emptyGalleryCode, setEmptyGalleryCode] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  async function lookup() {
    setLoading(true);
    setError(null);
    setDownloadMessage(null);
    setPhotos([]);
    setPreviewUrls({});
    setLoadedPreviews({});
    setActiveCode("");
    setEmptyGalleryCode("");
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

    if (rpcError || !rpcData?.length) {
      setLoading(false);
      setError("No gallery was found for that code.");
      return;
    }

    setLoading(false);

    if (rows.length === 0) {
      setEmptyGalleryCode(normalizedCode);
      return;
    }

    setPaid(galleryPaid);
    setPhotos(rows);
    setActiveCode(normalizedCode);

    const urls: Record<string, string> = {};
    const { data: signedPreviews, error: signingError } = await supabase.storage
      .from("previews")
      .createSignedUrls(rows.map((photo) => photo.preview_path), 3600);
    if (signingError) {
      setError("The gallery opened, but previews could not be loaded.");
      return;
    }
    for (let index = 0; index < rows.length; index += 1) {
      const signedUrl = signedPreviews?.[index]?.signedUrl;
      if (signedUrl) urls[rows[index].photo_id] = signedUrl;
    }
    setPreviewUrls(urls);
  }

  // Originals live in a private bucket. The server verifies the active access
  // code, paid state, and photo membership before creating a short-lived URL.
  async function downloadOriginal(photoId: string) {
    const photo = photos.find((p) => p.photo_id === photoId);
    if (!photo || !activeCode) {
      setError("This photo is not available for download yet.");
      return;
    }

    setDownloadingId(photoId);
    setError(null);
    setDownloadMessage(null);

    try {
      const response = await fetch("/api/download-original", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activeCode, photoId }),
      });
      const data = (await response.json().catch(() => null)) as { url?: string } | null;

      if (!response.ok || !data?.url) {
        setError("Couldn't get download link. Please try again.");
      } else {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setDownloadMessage(
          "Your download has started. Thank you for taking your pic with us."
        );
      }
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.header}>
        <h1 className={styles.h1}>Download your event photos</h1>
        <p className={styles.intro}>
          Enter the access code you were given at the event. Once your gallery opens, tap Download under any photo to save the full-quality file.
        </p>
      </section>

      <div className={styles.row}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="Enter your access code"
          className={styles.input}
        />
        <button type="button" onClick={lookup} disabled={loading || !code.trim()} className={styles.button}>
          {loading ? "Looking…" : "Find photos"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {downloadMessage && <p className={styles.success}>{downloadMessage}</p>}
      {emptyGalleryCode && (
        <section className={styles.emptyGallery} role="status" aria-live="polite">
          <div className={styles.emptyGalleryHeader}>
            <span className={styles.confirmationIcon} aria-hidden="true">✓</span>
            <div>
              <h2 className={styles.emptyGalleryTitle}>Your code is valid</h2>
              <p className={styles.confirmedCode}>Gallery code: {emptyGalleryCode}</p>
            </div>
          </div>
          <p className={styles.photoCount}>
            <strong>0 photos</strong> are currently in this folder.
          </p>
          <p className={styles.uploadNote}>
            If you have been told that your photos are being uploaded, please allow some time
            for the upload to finish. If your photos still do not appear by the next day,
            please check with the contact desk or call us using one of the phone numbers
            listed on our website.
          </p>
        </section>
      )}

      {photos.length > 0 && (
        <>
          <div className={styles.gallerySummary}>
            <div>
              <p className={styles.galleryEyebrow}>Your gallery</p>
              <h2 className={styles.galleryTitle}>
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </h2>
            </div>
            <span className={paid ? styles.statusReady : styles.statusPreview}>
              {paid ? "Downloads ready" : "Preview only"}
            </span>
          </div>
          {paid ? (
            <p className={styles.readyNotice}>
              Your gallery is ready. Choose a photo and tap Download.
            </p>
          ) : (
            <p className={styles.notice}>
              These are previews. Please pay at the event desk to unlock full-resolution downloads.
            </p>
          )}
          <div className={styles.grid}>
            {photos.map((p) => (
              <div key={p.photo_id} className={styles.card}>
                <div className={styles.previewFrame}>
                  {!loadedPreviews[p.photo_id] && (
                    <div className={styles.imageSkeleton} aria-hidden="true">
                      <span className={styles.loadingIcon}>✦</span>
                      <span className={styles.loadingText}>Loading photo</span>
                    </div>
                  )}
                  {previewUrls[p.photo_id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrls[p.photo_id]}
                      alt="Event preview"
                      className={`${styles.thumb} ${
                        loadedPreviews[p.photo_id] ? styles.thumbLoaded : ""
                      }`}
                      onLoad={() =>
                        setLoadedPreviews((current) => ({
                          ...current,
                          [p.photo_id]: true,
                        }))
                      }
                    />
                  )}
                </div>
                <div className={styles.cardFooter}>
                  {paid ? (
                    <button
                      type="button"
                      onClick={() => downloadOriginal(p.photo_id)}
                      disabled={downloadingId === p.photo_id}
                      className={styles.downloadBtn}
                    >
                      {downloadingId === p.photo_id ? (
                        <span className={styles.buttonLoading}>
                          <span className={styles.spinner} aria-hidden="true" />
                          Preparing…
                        </span>
                      ) : (
                        "Download photo"
                      )}
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
