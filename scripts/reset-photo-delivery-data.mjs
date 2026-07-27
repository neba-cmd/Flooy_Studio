import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const mode = process.argv[2];
if (!["backup", "reset"].includes(mode)) {
  throw new Error("Usage: node scripts/reset-photo-delivery-data.mjs <backup|reset>");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) throw new Error("Missing Supabase environment variables");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const root = path.resolve("supabase/backups");

async function allRows(table, columns = "*") {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + 999);
    if (error) throw new Error(`${table} backup failed: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

async function backup() {
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const destination = path.join(root, stamp);
  await mkdir(destination, { recursive: true });

  const tables = {};
  for (const table of [
    "photographer_profiles",
    "photo_events",
    "customer_galleries",
    "gallery_photos",
  ]) {
    tables[table] = await allRows(table);
    await writeFile(
      path.join(destination, `${table}.json`),
      `${JSON.stringify(tables[table], null, 2)}\n`
    );
  }

  const files = [];
  for (const photo of tables.gallery_photos) {
    for (const [bucket, storagePath] of [
      ["photo-previews", photo.preview_storage_path],
      ["photo-originals", photo.original_storage_path],
    ]) {
      if (!storagePath) continue;
      const { data, error } = await supabase.storage.from(bucket).download(storagePath);
      if (error || !data) {
        throw new Error(`${bucket}/${storagePath} backup failed: ${error?.message ?? "no data"}`);
      }
      const bytes = Buffer.from(await data.arrayBuffer());
      const localPath = path.join(destination, "storage", bucket, storagePath);
      await mkdir(path.dirname(localPath), { recursive: true });
      await writeFile(localPath, bytes);
      files.push({
        bucket,
        path: storagePath,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }

  const manifest = {
    created_at: new Date().toISOString(),
    counts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])),
    storage_files: files.length,
    storage_bytes: files.reduce((total, file) => total + file.bytes, 0),
    files,
  };
  await writeFile(path.join(destination, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(root, "LATEST"), `${destination}\n`);
  console.log(JSON.stringify({ destination, ...manifest.counts, storage_files: files.length }));
}

async function removeStorageObjects(bucket, paths) {
  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    if (!batch.length) continue;
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) throw new Error(`${bucket} cleanup failed: ${error.message}`);
  }
}

async function reset() {
  const photos = await allRows(
    "gallery_photos",
    "preview_storage_path, original_storage_path"
  );
  await removeStorageObjects(
    "photo-previews",
    photos.map((photo) => photo.preview_storage_path).filter(Boolean)
  );
  await removeStorageObjects(
    "photo-originals",
    photos.map((photo) => photo.original_storage_path).filter(Boolean)
  );

  // Removing photographer profiles cascades through events, galleries, and
  // photos while retaining Supabase Auth users and project configuration.
  const { error } = await supabase
    .from("photographer_profiles")
    .delete()
    .not("id", "is", null);
  if (error) throw new Error(`Database reset failed: ${error.message}`);

  for (const bucket of ["photo-previews", "photo-originals"]) {
    const { error: bucketError } = await supabase.storage.updateBucket(bucket, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    });
    if (bucketError) throw new Error(`${bucket} hardening failed: ${bucketError.message}`);
  }

  const counts = {};
  for (const table of [
    "photographer_profiles",
    "photo_events",
    "customer_galleries",
    "gallery_photos",
  ]) {
    const { count, error: countError } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (countError) throw new Error(`${table} verification failed: ${countError.message}`);
    counts[table] = count ?? 0;
  }
  console.log(JSON.stringify(counts));
}

await (mode === "backup" ? backup() : reset());
