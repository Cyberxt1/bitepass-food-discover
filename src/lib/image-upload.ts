const MAX_IMAGE_SIZE = 720;
const JPEG_QUALITY = 0.72;
const MAX_UPLOAD_BYTES = 1024 * 1024;
const TARGET_IMAGE_BYTES = 700 * 1024;

function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Image must be 1 MB or smaller"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image could not be read"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Image could not be loaded"));
      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Image could not be processed"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        let quality = JPEG_QUALITY;
        let result = canvas.toDataURL("image/jpeg", quality);
        while (dataUrlBytes(result) > TARGET_IMAGE_BYTES && quality > 0.45) {
          quality -= 0.08;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(result);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
