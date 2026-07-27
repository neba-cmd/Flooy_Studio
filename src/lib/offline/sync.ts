import { createClient } from "@/lib/supabase/client";
import {
  MAX_UPLOAD_ATTEMPTS,
  resolvePhotoMimeType,
  safePhotoExtension,
} from "@/lib/photo-delivery/validation";
import { db } from "./db";
import { markUploading, markFailed, markUploaded } from "./queue";

const MAX_CONCURRENT_UPLOADS = 3;
const RETRY_BACKOFF_MS = [2000, 5000, 15000, 30000]; // caps at 30s between retries
const STALE_UPLOAD_MS = 2 * 60 * 1000;

let syncRunning = false;
let listenersAttached = false;

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
    if (!item.originalBlob) {
      throw new Error("The original photo is no longer available on this device");
    }

    const ext = safePhotoExtension({
      name: item.fileName,
      type: item.originalBlob.type,
    });
    const originalContentType = resolvePhotoMimeType({
      name: item.fileName,
      type: item.originalBlob.type,
    });
    const previewPath = `${item.galleryId}/${item.clientId}-preview.jpg`;
    const originalPath = `${item.galleryId}/${item.clientId}-original.${ext}`;

    const [previewUpload, originalUpload] = await Promise.all([
      supabase.storage.from("photo-previews").upload(previewPath, item.previewBlob, {
        contentType: "image/jpeg",
        upsert: true,
      }),
      supabase.storage.from("photo-originals").upload(originalPath, item.originalBlob, {
        contentType: originalContentType,
        upsert: true,
      }),
    ]);
    if (previewUpload.error) throw previewUpload.error;
    if (originalUpload.error) throw originalUpload.error;

    const { error: insertErr } = await supabase.from("gallery_photos").upsert(
      {
        upload_key: item.clientId,
        gallery_id: item.galleryId,
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

  window.addEventListener("online", () => runSyncCycle());
  setInterval(() => runSyncCycle(), 4000);
  runSyncCycle();
}
