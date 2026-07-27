import { describe, expect, it } from "vitest";
import {
  isValidAccessCode,
  isValidPhotoId,
  MAX_PHOTO_BYTES,
  normalizeAccessCode,
  resolvePhotoMimeType,
  safePhotoExtension,
  validatePhotoFile,
} from "./validation";

describe("gallery access codes", () => {
  it("normalizes customer input consistently", () => {
    expect(normalizeAccessCode(" n-4821 ")).toBe("N4821");
    expect(normalizeAccessCode("sa$r 19!")).toBe("SAR19");
  });

  it("requires one initial followed by four digits", () => {
    expect(isValidAccessCode("n4821")).toBe(true);
    expect(isValidAccessCode("N-4821")).toBe(true);
    expect(isValidAccessCode("4821")).toBe(false);
    expect(isValidAccessCode("NN482")).toBe(false);
    expect(isValidAccessCode(null)).toBe(false);
  });
});

describe("photo identifiers", () => {
  it("accepts real UUIDs and rejects loose 36-character strings", () => {
    expect(isValidPhotoId("2dcf73ce-cf83-4a7a-9b4b-672be69a2185")).toBe(true);
    expect(isValidPhotoId("00000000-0000-0000-0000-000000000000")).toBe(false);
    expect(isValidPhotoId("not-a-photo-id")).toBe(false);
  });
});

describe("photo file validation", () => {
  it("accepts supported browser MIME types", () => {
    expect(
      validatePhotoFile({ name: "photo.JPG", type: "image/jpeg", size: 1024 })
    ).toBeNull();
  });

  it("infers MIME type from a safe extension when browsers omit it", () => {
    const file = { name: "IMG_001.HEIC", type: "" };
    expect(resolvePhotoMimeType(file)).toBe("image/heic");
    expect(safePhotoExtension(file)).toBe("heic");
  });

  it("rejects executable, SVG, empty, and oversized files", () => {
    expect(validatePhotoFile({ name: "bad.svg", type: "image/svg+xml", size: 100 })).toMatch(
      /not a supported/
    );
    expect(validatePhotoFile({ name: "bad.exe", type: "", size: 100 })).toMatch(
      /not a supported/
    );
    expect(validatePhotoFile({ name: "empty.jpg", type: "image/jpeg", size: 0 })).toMatch(
      /empty/
    );
    expect(
      validatePhotoFile({
        name: "huge.jpg",
        type: "image/jpeg",
        size: MAX_PHOTO_BYTES + 1,
      })
    ).toMatch(/50 MB/);
  });
});
