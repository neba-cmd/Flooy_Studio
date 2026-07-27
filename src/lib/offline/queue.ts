import { db, type QueuedPhoto } from "./db";
import { createWatermarkedPreview } from "./image-processing";
import { MAX_UPLOAD_ATTEMPTS, validatePhotoFile } from "@/lib/photo-delivery/validation";

/**
 * Called the instant a photographer drags/drops a photo into a
 * client gallery. This writes to IndexedDB FIRST — before any
 * network call — so the photo is durably saved on-device even if
 * there is zero connectivity. The sync worker (sync.ts) picks it up
 * whenever the network is available, in the background.
 */
export async function enqueuePhoto(
  file: File,
  eventId: string,
  galleryId: string,
  photographerId: string
) {
  const validationError = validatePhotoFile(file);
  if (validationError) throw new Error(validationError);

  const clientId = crypto.randomUUID();
  const previewBlob = await createWatermarkedPreview(file);

  const item: QueuedPhoto = {
    clientId,
    eventId,
    galleryId,
    photographerId,
    originalBlob: file,
    previewBlob,
    fileName: file.name,
    status: "queued",
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.queue.put(item);
  return clientId;
}

export async function getQueueSnapshot() {
  return db.queue.orderBy("createdAt").toArray();
}

export async function countByStatus() {
  const all = await db.queue.toArray();
  return {
    queued: all.filter(
      (i) => i.status === "queued" || (i.status === "failed" && i.attempts < MAX_UPLOAD_ATTEMPTS)
    ).length,
    uploading: all.filter((i) => i.status === "uploading").length,
    uploaded: all.filter((i) => i.status === "uploaded").length,
    failed: all.filter(
      (i) => i.status === "failed" && i.attempts >= MAX_UPLOAD_ATTEMPTS
    ).length,
    total: all.length,
  };
}

export async function markUploaded(clientId: string) {
  const item = await db.queue.get(clientId);
  if (!item) return;

  // Keep the small preview and metadata for the visible sent history, but
  // release the full-resolution original from IndexedDB immediately.
  const { originalBlob: _originalBlob, ...completed } = item;
  void _originalBlob;
  await db.queue.put({
    ...completed,
    status: "uploaded",
    lastError: undefined,
    updatedAt: Date.now(),
  });
}

export async function markFailed(clientId: string, error: string) {
  const item = await db.queue.get(clientId);
  if (!item) return;
  await db.queue.put({
    ...item,
    status: "failed",
    attempts: item.attempts + 1,
    lastError: error,
    updatedAt: Date.now(),
  });
}

export async function markUploading(clientId: string) {
  const item = await db.queue.get(clientId);
  if (!item) return;
  await db.queue.put({ ...item, status: "uploading", updatedAt: Date.now() });
}
