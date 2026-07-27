import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const publicKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

const failures = [];
if (!url?.startsWith("https://") || !url.endsWith(".supabase.co")) {
  failures.push("NEXT_PUBLIC_SUPABASE_URL is missing or invalid");
}
if (!publicKey) failures.push("A Supabase publishable/anon key is missing");
if (!secretKey) failures.push("SUPABASE_SERVICE_ROLE_KEY is missing");
if (!siteUrl?.startsWith("https://")) failures.push("NEXT_PUBLIC_SITE_URL must be an HTTPS URL");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const report = { tables: {}, buckets: {}, auth_users: 0 };

for (const table of [
  "photographer_profiles",
  "photo_events",
  "customer_galleries",
  "gallery_photos",
]) {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error) failures.push(`${table}: ${error.message}`);
  else report.tables[table] = count ?? 0;
}

const { error: profileShapeError } = await admin
  .from("photographer_profiles")
  .select("id, display_name, email")
  .limit(1);
if (profileShapeError) {
  failures.push(`photographer_profiles company columns: ${profileShapeError.message}`);
}

const { error: photoShapeError } = await admin
  .from("gallery_photos")
  .select("id, gallery_id, photographer_id")
  .limit(1);
if (photoShapeError) {
  failures.push(`gallery_photos company columns: ${photoShapeError.message}`);
}

for (const bucketName of ["photo-previews", "photo-originals"]) {
  const { data, error } = await admin.storage.getBucket(bucketName);
  if (error || !data) {
    failures.push(`${bucketName}: ${error?.message ?? "bucket not found"}`);
    continue;
  }
  report.buckets[bucketName] = {
    private: !data.public,
    file_size_limit: data.file_size_limit,
    allowed_mime_types: data.allowed_mime_types,
  };
  if (data.public) failures.push(`${bucketName} must be private`);
  if (data.file_size_limit !== 50 * 1024 * 1024) {
    failures.push(`${bucketName} must have a 50 MB file limit`);
  }
}

const { data: users, error: usersError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1,
});
if (usersError) failures.push(`Auth users: ${usersError.message}`);
else {
  report.auth_users = users.users.length;
  if (!users.users.length) failures.push("No photographer Auth user exists");
}

console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`\nPreflight failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nProduction preflight passed.");
