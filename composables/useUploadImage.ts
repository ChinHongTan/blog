/**
 * Upload a single image file to the repo. Returns the public path (e.g. /images/uploads/123-image.png).
 * Used for featured image, avatar, banner — no media library.
 */
export function useUploadImage() {
  const uploading = ref(false);

  async function uploadImage(file: File): Promise<string> {
    uploading.value = true;
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await $fetch<{ path: string }>("/api/admin/repo/upload", {
        method: "POST",
        body: form,
      });
      return res.path;
    } finally {
      uploading.value = false;
    }
  }

  return { uploadImage, uploading };
}
