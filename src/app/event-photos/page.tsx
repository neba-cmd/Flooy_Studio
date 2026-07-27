"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface GalleryPhoto {
  photo_id: string;
  preview_url: string | null;
  taken_at: string;
}

const DOWNLOAD_ATTEMPTS = 2;

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
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
    const response = await fetch("/api/client-gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalizedCode }),
      cache: "no-store",
    }).catch(() => null);
    const result = response
      ? ((await response.json().catch(() => null)) as {
          error?: string;
          gallery?: { paid: boolean };
          photos?: GalleryPhoto[];
        } | null)
      : null;

    if (!response?.ok || !result?.gallery) {
      setLoading(false);
      setError(result?.error ?? "The connection was interrupted. Please try again.");
      return;
    }

    const rows = result.photos ?? [];
    setLoading(false);

    if (rows.length === 0) {
      setEmptyGalleryCode(normalizedCode);
      return;
    }

    setPaid(Boolean(result.gallery.paid));
    setPhotos(rows);
    setActiveCode(normalizedCode);

    setPreviewUrls(
      Object.fromEntries(
        rows
          .filter((photo) => photo.preview_url)
          .map((photo) => [photo.photo_id, photo.preview_url as string])
      )
    );
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
      let lastMessage = "The download could not start. Please try again.";

      for (let attempt = 0; attempt < DOWNLOAD_ATTEMPTS; attempt += 1) {
        try {
          const response = await fetch("/api/download-original", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: activeCode, photoId }),
            cache: "no-store",
          });
          const data = (await response.json().catch(() => null)) as {
            url?: string;
            fileName?: string;
            error?: string;
          } | null;

          if (response.ok && data?.url) {
            const link = document.createElement("a");
            link.href = data.url;
            link.download = data.fileName ?? "";
            link.rel = "noopener";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setDownloadMessage(
              "Download started. If your browser asks for permission, choose Allow."
            );
            return;
          }

          lastMessage = data?.error ?? lastMessage;
          // Retry service/network failures, but not permanent states such as
          // an unpaid gallery or a photo that is still uploading.
          if (response.status < 500) break;
        } catch {
          lastMessage = navigator.onLine
            ? "The connection was interrupted while preparing your photo."
            : "You appear to be offline. Reconnect and try the download again.";
        }

        if (attempt < DOWNLOAD_ATTEMPTS - 1) await wait(700);
      }

      setError(lastMessage);
    } catch {
      setError("Something unexpected happened. Please try the download again.");
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
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
          placeholder="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
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
                        "Download full quality"
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
