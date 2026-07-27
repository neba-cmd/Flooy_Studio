"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/offline/db";
import type { QueuedPhoto } from "@/lib/offline/db";
import { enqueuePhoto, countByStatus, getQueueSnapshot } from "@/lib/offline/queue";
import { startBackgroundSync, runSyncCycle, uploadPhotoDirect } from "@/lib/offline/sync";

export interface QueueCounts {
  queued: number;
  uploading: number;
  uploaded: number;
  failed: number;
  total: number;
}

export function useUploadQueue(photographerId: string) {
  const [counts, setCounts] = useState<QueueCounts>({
    queued: 0,
    uploading: 0,
    uploaded: 0,
    failed: 0,
    total: 0,
  });
  const [items, setItems] = useState<QueuedPhoto[]>([]);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const refresh = useCallback(async () => {
    const [nextCounts, snapshot] = await Promise.all([countByStatus(), getQueueSnapshot()]);
    setCounts(nextCounts);
    const newestFirst = snapshot.slice().reverse();
    setItems((current) => {
      const currentSignature = current.map((item) => `${item.clientId}:${item.updatedAt}`).join("|");
      const nextSignature = newestFirst
        .map((item) => `${item.clientId}:${item.updatedAt}`)
        .join("|");
      return currentSignature === nextSignature ? current : newestFirst;
    });
  }, []);

  useEffect(() => {
    // No separate session bootstrap needed here anymore — this hook
    // is only ever rendered inside AdminAuthGate, which guarantees a
    // real photographer is already logged in before this mounts.
    startBackgroundSync();

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(refresh, 1500);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [refresh]);

  const addPhotos = useCallback(
    async (files: File[], eventId: string, galleryId: string) => {
      const errors: string[] = [];
      let added = 0;
      const useDirectMobileUpload =
        typeof navigator !== "undefined" &&
        (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) &&
        navigator.onLine;
      for (const file of files) {
        try {
          if (useDirectMobileUpload) {
            await uploadPhotoDirect(file, eventId, galleryId, photographerId);
          } else {
            await enqueuePhoto(file, eventId, galleryId, photographerId);
          }
          added += 1;
        } catch (error) {
          errors.push(
            error instanceof Error ? error.message : `${file.name} could not be prepared.`
          );
        }
      }
      await refresh();
      if (added && !useDirectMobileUpload) void runSyncCycle();
      return { added, errors };
    },
    [photographerId, refresh]
  );

  return { counts, items, isOnline, addPhotos, refresh, db };
}
