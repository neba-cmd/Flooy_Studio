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

  // Dense, high-contrast diagonal watermark. The outline and repeated spacing
  // keep it visible across both bright and dark areas of a photograph.
  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.lineWidth = Math.max(3, Math.round(width / 450));
  ctx.lineJoin = "round";
  const fontSize = Math.max(24, Math.round(width / 13));
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const stepY = fontSize * 2.3;
  const stepX = Math.max(fontSize * 4.5, fontSize * watermarkText.length * 0.72);
  for (let y = -height * 1.5; y < height * 1.5; y += stepY) {
    for (let x = -width * 1.5; x < width * 1.5; x += stepX) {
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();

  // A large central mark stays obvious even when a customer crops the edges.
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.95)";
  ctx.lineWidth = Math.max(5, Math.round(width / 280));
  ctx.lineJoin = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(38, Math.round(width / 7))}px Arial, sans-serif`;
  ctx.strokeText(watermarkText, width / 2, height / 2);
  ctx.fillText(watermarkText, width / 2, height / 2);
  ctx.restore();

  cleanup();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to encode preview image");
  return blob;
}
