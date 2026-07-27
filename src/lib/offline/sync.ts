import { createClient } from "@/lib/supabase/client";
import {
  MAX_UPLOAD_ATTEMPTS,
  resolvePhotoMimeType,
  safePhotoExtension,
} from "@/lib/photo-delivery/validation";
import { db } from "./db";
import { markUploading, markFailed, markUploaded } from "./queue";
import { uploadOriginalResumably } from "./resumable-upload";
import { createWatermarkedPreview } from "./image-processing";

const MAX_CONCURRENT_UPLOADS = 3;
const RETRY_BACKOFF_MS = [2000, 5000, 15000, 30000]; // caps at 30s between retries
const STALE_UPLOAD_MS = 2 * 60 * 1000;

let syncRunning = false;
let listenersAttached = false;

/**
 * iOS Safari path: stream the original File directly to resumable Storage
 * instead of first cloning a potentially large camera photo into IndexedDB.
 */
export async function uploadPhotoDirect(
  file: File,
  eventId: string,
  galleryId: string,
  photographerId: string
) {
  const supabase = createClient();
  const clientId = crypto.randomUUID();
  const previewBlob = await createWatermarkedPreview(file);
  const ext = safePhotoExtension(file);
  const originalContentType = resolvePhotoMimeType(file);
  const previewPath = `${galleryId}/${clientId}-preview.jpg`;
  const originalPath = `${galleryId}/${clientId}-original.${ext}`;

  const [previewUpload] = await Promise.all([
    supabase.storage.from("photo-previews").upload(previewPath, previewBlob, {
      contentType: "image/jpeg",
      upsert: true,
    }),
    uploadOriginalResumably(
      supabase,
      "photo-originals",
      originalPath,
      file,
      originalContentType
    ),
  ]);
  if (previewUpload.error) throw previewUpload.error;

  const { error } = await supabase.from("gallery_photos").upsert(
    {
      upload_key: clientId,
      gallery_id: galleryId,
      photographer_id: photographerId,
      original_file_name: file.name,
      preview_storage_path: previewPath,
      original_storage_path: originalPath,
      status: "ready",
    },
    { onConflict: "upload_key" }
  );
  if (error) throw error;

  await db.queue.put({
    clientId,
    eventId,
    galleryId,
    photographerId,
    previewData: await previewBlob.arrayBuffer(),
    originalType: file.type,
    previewType: "image/jpeg",
    fileName: file.name,
    status: "uploaded",
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Uploads a single queued item: both blobs to Storage, then a row
 * to `gallery_photos`. Uses clientId as an idempotency key so if the
 * network drops mid-upload and we retry, we never create dupes —
 * Storage overwrites are safe (same path) and the DB insert uses
 * upsert on the unique client_id column.
 */
async function uploadOne(clientId: string) {
  const supabase = createClient();
  const item = await db.queue.get(clientId);
  if (!item) return;

  await markUploading(clientId);

  try {
    if (!item.eventId || !item.galleryId) {
      throw new Error("Queued photo is missing its event or client gallery");
    }
    if (!item.originalData) {
      throw new Error("The original photo is no longer available on this device");
    }
    const originalData = item.originalData;
    const previewData = item.previewData;

    const ext = safePhotoExtension({
      name: item.fileName,
      type: item.originalType,
    });
    const originalContentType = resolvePhotoMimeType({
      name: item.fileName,
      type: item.originalType,
    });
    const previewPath = `${item.galleryId}/${item.clientId}-preview.jpg`;
    const originalPath = `${item.galleryId}/${item.clientId}-original.${ext}`;

    const [previewUpload] = await Promise.all([
      supabase.storage.from("photo-previews").upload(previewPath, previewData, {
        contentType: item.previewType,
        upsert: true,
      }),
      uploadOriginalResumably(
        supabase,
        "photo-originals",
        originalPath,
        originalData,
        originalContentType
      ),
    ]);
    if (previewUpload.error) throw previewUpload.error;

    const { error: insertErr } = await supabase.from("gallery_photos").upsert(
      {
        upload_key: item.clientId,
        gallery_id: item.galleryId,
        photographer_id: item.photographerId,
        original_file_name: item.fileName,
        preview_storage_path: previewPath,
        original_storage_path: originalPath,
        status: "ready",
      },
      { onConflict: "upload_key" }
    );
    if (insertErr) throw insertErr;

    await markUploaded(clientId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailed(clientId, message);
  }
}

/**
 * Processes the queue: picks up items that are "queued" or "failed"
 * (retrying failed ones with backoff based on attempt count), up to
 * MAX_CONCURRENT_UPLOADS in parallel. Safe to call repeatedly —
 * it's a no-op if nothing is eligible or a cycle is already running.
 */
export async function runSyncCycle() {
  if (syncRunning) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  syncRunning = true;
  try {
    const all = await db.queue.orderBy("createdAt").toArray();
    const now = Date.now();

    const eligible = all.filter((item) => {
      if (item.status === "queued") return true;
      // A tab can close while an item is marked uploading. Recover it instead
      // of leaving the photo permanently stuck in IndexedDB.
      if (item.status === "uploading") return now - item.updatedAt >= STALE_UPLOAD_MS;
      if (item.status === "failed" && item.attempts < MAX_UPLOAD_ATTEMPTS) {
        const backoff = RETRY_BACKOFF_MS[Math.min(item.attempts, RETRY_BACKOFF_MS.length - 1)];
        return now - item.updatedAt >= backoff;
      }
      return false;
    });

    const batch = eligible.slice(0, MAX_CONCURRENT_UPLOADS);
    await Promise.all(batch.map((item) => uploadOne(item.clientId)));
  } finally {
    syncRunning = false;
  }
}

/**
 * Call once (e.g. from a top-level layout effect) to start the
 * background sync loop: reacts to the browser coming back online,
 * and also polls periodically in case the 'online' event is
 * unreliable (common on flaky venue wifi that flaps without firing
 * clean browser events).
 */
export function startBackgroundSync() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  const syncSafely = () => {
    void runSyncCycle().catch((error) => {
      console.error("Background photo sync failed:", error);
    });
  };
  window.addEventListener("online", syncSafely);
  setInterval(syncSafely, 4000);
  syncSafely();
}
