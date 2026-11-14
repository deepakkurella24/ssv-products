/**
 * Cloudinary Unsigned Upload Utility
 *
 * Uploads images directly from the browser to Cloudinary via unsigned upload preset.
 * Expects NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.
 */

export async function uploadToCloudinary(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPG, PNG, WebP).");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image file size must be under 10 MB.");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    // If Cloudinary environment variables are missing, provide a clear, helpful error
    throw new Error(
      "Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error?.message ||
        `Cloudinary upload failed (HTTP ${res.status}). Please check your preset and cloud name.`
    );
  }

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error("Cloudinary did not return a secure image URL.");
  }

  return data.secure_url;
}
