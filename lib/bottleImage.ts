import { createClient } from "@/lib/supabase/client";

export const BOTTLE_IMAGES_BUCKET = "bottle-images";
export const MAX_BOTTLE_IMAGE_BYTES = 5 * 1024 * 1024;
export const BOTTLE_IMAGE_ACCEPT =
  "image/*,.jpg,.jpeg,.png,.webp,.heic,.heif";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function mimeFromExtension(ext: string): string | null {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return null;
}

function resolveMime(file: File): string {
  if (file.type) return file.type.toLowerCase();
  return mimeFromExtension(fileExtension(file.name)) ?? "";
}

export function validateBottleImageFile(file: File): string | null {
  const mime = resolveMime(file);

  if (HEIC_TYPES.has(mime) || ["heic", "heif"].includes(fileExtension(file.name))) {
    return "Please use JPEG or PNG (iPhone: Settings → Camera → Formats → Most Compatible)";
  }

  if (!ALLOWED_TYPES.has(mime)) {
    return "Use a JPEG, PNG, or WebP image";
  }

  if (file.size > MAX_BOTTLE_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller";
  }

  return null;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Re-encode via canvas when needed so Storage always gets jpeg/png/webp. */
async function normalizeBottleImageFile(file: File): Promise<{ blob: Blob; contentType: string }> {
  const mime = resolveMime(file);

  if (ALLOWED_TYPES.has(mime) && file.type) {
    return { blob: file, contentType: mime };
  }

  // Empty MIME but allowed extension — trust bytes as-is with inferred type
  if (ALLOWED_TYPES.has(mime) && !file.type) {
    return { blob: file, contentType: mime };
  }

  // Try decode + re-encode to JPEG (covers odd browser MIME cases)
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
    );
    if (!blob) throw new Error("Could not process image");
    if (blob.size > MAX_BOTTLE_IMAGE_BYTES) {
      throw new Error("Image must be 5 MB or smaller");
    }
    return { blob, contentType: "image/jpeg" };
  } catch {
    throw new Error(
      validateBottleImageFile(file) ??
        "Couldn’t process that photo. Try JPEG or PNG."
    );
  }
}

function friendlyStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("bucket") && lower.includes("not found")) {
    return "Photo storage isn’t set up yet. Run migration 020 in Supabase, then try again.";
  }
  if (lower.includes("row-level security") || lower.includes("rls")) {
    return "Photo upload was blocked. Re-run migration 020/021 in Supabase, then try again.";
  }
  if (lower.includes("mime") || lower.includes("not allowed")) {
    return "That image format isn’t allowed. Use JPEG or PNG.";
  }
  return message;
}

/** Upload to pending/{userId}/{uuid}.ext — path passed to drop_bottle. */
export async function uploadPendingBottleImage(file: File): Promise<string> {
  const validationError = validateBottleImageFile(file);
  if (validationError) throw new Error(validationError);

  const { blob, contentType } = await normalizeBottleImageFile(file);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = extensionForMime(contentType);
  const objectName = `${crypto.randomUUID()}.${ext}`;
  const path = `pending/${user.id}/${objectName}`;

  const { error } = await supabase.storage.from(BOTTLE_IMAGES_BUCKET).upload(path, blob, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });

  if (error) throw new Error(friendlyStorageError(error.message));
  return path;
}

export function publicBottleImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/storage/v1/object/public/${BOTTLE_IMAGES_BUCKET}/${path}`;
}

/** Deterministic tilt in degrees: ±4 to ±8 from id hash. */
export function letterPhotoTiltDeg(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const magnitude = 4 + (Math.abs(hash) % 5);
  return hash & 1 ? magnitude : -magnitude;
}

export function friendlyDropBottleError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("could not find the function") || lower.includes("p_image_path")) {
    return "Bottle photo support isn’t on the server yet. Run migration 020 in Supabase, then try again.";
  }
  if (lower.includes("image not found") || lower.includes("invalid image path")) {
    return "Photo upload didn’t finish. Try attaching the photo again.";
  }
  return message;
}
