import * as tus from "tus-js-client";
import type { SupabaseClient } from "@supabase/supabase-js";

const TUS_CHUNK_BYTES = 6 * 1024 * 1024;

export async function uploadOriginalResumably(
  supabase: SupabaseClient,
  bucketName: string,
  objectName: string,
  data: ArrayBuffer | Blob,
  contentType: string
) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error(error?.message ?? "Your photographer session expired. Sign in again.");
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) throw new Error("Supabase URL is not configured.");
  const projectRef = new URL(projectUrl).hostname.split(".")[0];
  if (!projectRef) throw new Error("Supabase project URL is invalid.");

  const file = data instanceof Blob ? data : new Blob([data], { type: contentType });

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_BYTES,
      metadata: {
        bucketName,
        objectName,
        contentType,
        cacheControl: "3600",
      },
      onError: (uploadError) => reject(uploadError),
      onSuccess: () => resolve(),
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch(reject);
  });
}
