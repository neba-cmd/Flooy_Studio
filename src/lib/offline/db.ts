import Dexie, { type Table } from "dexie";

// A single queued photo. Both blobs live on-device in IndexedDB
// until they've been confirmed-uploaded to Supabase Storage.
export interface QueuedPhoto {
  clientId: string; // uuid, generated at drop-time. Used as the
  // idempotency key so retries never create duplicate rows.
  eventId: string;
  galleryId: string;
  photographerId: string;

  // ArrayBuffers are used instead of Blob/File objects because WebKit can
  // invalidate Blob-backed IndexedDB records after the original file handle
  // is released, producing "Error preparing Blob/File data" during upload.
  // Original data is removed after a confirmed upload.
  originalData?: ArrayBuffer;
  previewData: ArrayBuffer;
  originalType: string;
  previewType: string;
  fileName: string;

  status: "queued" | "uploading" | "uploaded" | "failed";
  attempts: number;
  lastError?: string;

  createdAt: number; // epoch ms — also used for FIFO upload order
  updatedAt: number;
}

class UploadQueueDB extends Dexie {
  queue!: Table<QueuedPhoto, string>; // primary key = clientId

  constructor() {
    // v3 replaces WebKit-unsafe Blob records with durable ArrayBuffers.
    // Broken v2 records are intentionally not retried.
    super("flooy-photo-upload-queue-v3");
    this.version(1).stores({
      // Index status and createdAt so we can efficiently pull
      // "next batch to upload, oldest first" without a full scan.
      queue: "clientId, status, createdAt",
    });
    this.version(2).stores({
      queue: "clientId, status, createdAt, eventId, galleryId",
    });
  }
}

// Single shared instance. Dexie handles IndexedDB connection
// lifecycle internally, safe to import anywhere client-side.
export const db = new UploadQueueDB();
