// Accept the current initial + last-four format (N4821) and legacy six-character
// codes so existing customer galleries keep working after the migration.
export const ACCESS_CODE_PATTERN = /^(?:[A-Z][0-9]{4}|[A-Z0-9]{6})$/;
export const PHOTO_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const MAX_PHOTO_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_ATTEMPTS = 8;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function normalizeAccessCode(value: unknown) {
  return typeof value === "string"
    ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    : "";
}

export function isValidAccessCode(value: unknown) {
  return ACCESS_CODE_PATTERN.test(normalizeAccessCode(value));
}

export function isValidPhotoId(value: unknown) {
  return typeof value === "string" && PHOTO_ID_PATTERN.test(value);
}

export function resolvePhotoMimeType(file: Pick<File, "name" | "type">) {
  const declared = file.type.toLowerCase();
  if (EXTENSION_BY_MIME[declared]) return declared;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "";
}

export function safePhotoExtension(file: Pick<File, "name" | "type">) {
  return EXTENSION_BY_MIME[resolvePhotoMimeType(file)] ?? "jpg";
}

export function validatePhotoFile(file: Pick<File, "name" | "size" | "type">) {
  if (!resolvePhotoMimeType(file)) {
    return `${file.name || "This file"} is not a supported JPG, PNG, WebP, HEIC, or HEIF photo.`;
  }
  if (file.size <= 0) return `${file.name || "This file"} is empty.`;
  if (file.size > MAX_PHOTO_BYTES) {
    return `${file.name || "This file"} is larger than the 50 MB upload limit.`;
  }
  return null;
}
