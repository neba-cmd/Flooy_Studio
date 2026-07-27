import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(resolve("supabase/schema.sql"), "utf8");

describe("production database schema", () => {
  it("enables RLS on every public application table", () => {
    for (const table of [
      "photographer_profiles",
      "photo_events",
      "customer_galleries",
      "gallery_photos",
    ]) {
      expect(schema).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("keeps both photo buckets private and constrained", () => {
    expect(schema).toContain("'photo-previews'");
    expect(schema).toContain("'photo-originals'");
    expect(schema).toContain("52428800");
    expect(schema).not.toMatch(/to anon[\s\S]{0,120}storage\.objects/i);
  });

  it("does not expose security-definer helpers to anonymous users", () => {
    expect(schema).toContain(
      "revoke all on function public.ensure_photographer_profile() from public, anon;"
    );
    expect(schema).toContain(
      "revoke all on function public.generate_gallery_access_code(text, text) from public, anon, authenticated;"
    );
  });
});
