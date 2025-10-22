import imageCompression from "browser-image-compression";

/**
 * Compresses an image file to reduce its size
 *
 * @param imageFile The original image file
 * @param options Compression options
 * @returns A Promise that resolves to the compressed file
 */
export async function compressImage(
  imageFile: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  } = {}
): Promise<File> {
  // Default options
  const compressionOptions = {
    maxSizeMB: options.maxSizeMB || 1,
    maxWidthOrHeight: options.maxWidthOrHeight || 1920,
    useWebWorker: options.useWebWorker !== false,
  };

  try {
    // Only compress if it's an image file
    if (!imageFile.type.startsWith("image/")) {
      console.log("Not compressing non-image file:", imageFile.type);
      return imageFile;
    }

    // Skip compression if file is already smaller than maxSizeMB
    if (imageFile.size <= compressionOptions.maxSizeMB * 1024 * 1024) {
      console.log(
        "File already smaller than target size, skipping compression"
      );
      return imageFile;
    }

    console.log("Starting image compression:", {
      originalSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
      targetSize: `${compressionOptions.maxSizeMB}MB`,
      maxDimension: compressionOptions.maxWidthOrHeight,
    });

    const compressedFile = await imageCompression(
      imageFile,
      compressionOptions
    );

    console.log("Compression complete:", {
      originalSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${Math.round(
        (1 - compressedFile.size / imageFile.size) * 100
      )}%`,
    });

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    // Return the original file if compression fails
    return imageFile;
  }
}
