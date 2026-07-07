/**
 * Generates a compressed, watermarked preview from an original photo
 * FILE, entirely on-device using a <canvas>. This runs before the
 * photo is queued so both the preview and original are ready to
 * upload immediately once connectivity is available — no separate
 * server-side processing step is required (keeping the system
 * fully self-contained even if the venue's internet never comes
 * back during the event).
 */
export async function createWatermarkedPreview(
  file: File,
  opts: { maxDimension?: number; quality?: number; watermarkText?: string } = {}
): Promise<Blob> {
  const { maxDimension = 1600, quality = 0.72, watermarkText = "PREVIEW" } = opts;

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(bitmap, 0, 0, width, height);

  // Diagonal repeated watermark
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  const fontSize = Math.max(18, Math.round(width / 18));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const stepY = fontSize * 4;
  for (let y = -height; y < height; y += stepY) {
    for (let x = -width; x < width; x += fontSize * watermarkText.length * 0.9) {
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();

  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to encode preview image");
  return blob;
}
