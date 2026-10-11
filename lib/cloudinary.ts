/** Server-only helpers for deleting Cloudinary assets after an owned DB action. */
export async function deleteCloudinaryImages(publicIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const uniqueIds = Array.from(new Set(publicIds.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) return { ok: true };

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false, error: "Cloudinary credentials are not configured." };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    return { ok: false, error: "Cloudinary cloud name is invalid." };
  }

  const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;

  // Cloudinary's Admin API accepts up to 100 public IDs per request.
  for (let offset = 0; offset < uniqueIds.length; offset += 100) {
    const chunk = uniqueIds.slice(offset, offset + 100);
    const params = new URLSearchParams();
    for (const publicId of chunk) params.append("public_ids[]", publicId);

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${authorization}` },
        cache: "no-store",
      });
      if (!response.ok) {
        return { ok: false, error: `Cloudinary image cleanup failed with status ${response.status}.` };
      }
    } catch {
      return { ok: false, error: "Cloudinary image cleanup could not reach the storage service." };
    }
  }

  return { ok: true };
}
