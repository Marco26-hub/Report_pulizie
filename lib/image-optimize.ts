import sharp from "sharp";

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 75;

export async function optimizeForPdf(bytes: Uint8Array): Promise<{ bytes: Uint8Array; contentType: string }> {
  try {
    const metadata = await sharp(bytes).metadata();
    const { width = 0, height = 0 } = metadata;

    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      return { bytes, contentType: contentTypeFromSharp(metadata.format) };
    }

    const resized = await sharp(bytes)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    return { bytes: new Uint8Array(resized), contentType: "image/jpeg" };
  } catch {
    return { bytes, contentType: "image/jpeg" };
  }
}

function contentTypeFromSharp(format?: string): string {
  switch (format) {
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    default: return "image/jpeg";
  }
}
