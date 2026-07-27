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

  let source: CanvasImageSource;
  let sourceWidth: number;
  let sourceHeight: number;
  let cleanup: () => void;

  try {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    sourceWidth = bitmap.width;
    sourceHeight = bitmap.height;
    cleanup = () => bitmap.close();
  } catch {
    // iOS Safari can display camera-library HEIC images even when
    // createImageBitmap cannot decode them. An <img> fallback uses WebKit's
    // native image decoder and keeps the upload flow working.
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    source = image;
    sourceWidth = image.naturalWidth;
    sourceHeight = image.naturalHeight;
    cleanup = () => URL.revokeObjectURL(objectUrl);
  }

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(source, 0, 0, width, height);

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

  cleanup();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to encode preview image");
  return blob;
}
