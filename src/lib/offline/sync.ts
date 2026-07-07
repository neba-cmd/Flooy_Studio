import { createClient } from "@/lib/supabase/client";
import { db } from "./db";
import { markUploading, markFailed, removeUploaded } from "./queue";

const MAX_CONCURRENT_UPLOADS = 3;
const RETRY_BACKOFF_MS = [2000, 5000, 15000, 30000]; // caps at 30s between retries

let syncRunning = false;
let listenersAttached = false;

/**
 * Uploads a single queued item: both blobs to Storage, then a row
 * to `photos`. Uses clientId as an idempotency key so if the
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

    const ext = item.fileName.split(".").pop() || "jpg";
    // Match the storage RLS policy used in the Supabase schema by placing the
    // event id in the second folder segment of the object path.
    const previewPath = `${item.galleryId}/${item.eventId}/${item.clientId}-preview.jpg`;
    const originalPath = `${item.galleryId}/${item.eventId}/${item.clientId}-original.${ext}`;

    const [previewUpload, originalUpload] = await Promise.all([
      supabase.storage.from("previews").upload(previewPath, item.previewBlob, {
        contentType: "image/jpeg",
        upsert: true,
      }),
      supabase.storage.from("originals").upload(originalPath, item.originalBlob, {
        upsert: true,
      }),
    ]);
    if (previewUpload.error) throw previewUpload.error;
    if (originalUpload.error) throw originalUpload.error;

    const { error: insertErr } = await supabase.from("photos").upsert(
      {
        client_id: item.clientId,
        event_id: item.eventId,
        gallery_id: item.galleryId,
        photographer_id: item.photographerId,
        file_name: item.fileName,
        preview_path: previewPath,
        original_path: originalPath,
        upload_status: "uploaded",
      },
      { onConflict: "client_id" }
    );
    if (insertErr) throw insertErr;

    await removeUploaded(clientId);
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
      if (item.status === "failed") {
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
