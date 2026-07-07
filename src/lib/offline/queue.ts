import { db, type QueuedPhoto } from "./db";
import { createWatermarkedPreview } from "./image-processing";

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
    queued: all.filter((i) => i.status === "queued" || i.status === "failed").length,
    uploading: all.filter((i) => i.status === "uploading").length,
    uploaded: all.filter((i) => i.status === "uploaded").length,
    total: all.length,
  };
}

export async function removeUploaded(clientId: string) {
  await db.queue.delete(clientId);
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
