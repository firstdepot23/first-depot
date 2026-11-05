// Uploads one image to Cloudinary and returns its https URL. Shared by the
// single-product form and the bulk (supplier delivery) table.
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "FIRST-DEPOT");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();

  if (!data.secure_url) {
    throw new Error(data?.error?.message ?? "Upload failed");
  }
  return data.secure_url as string;
};
