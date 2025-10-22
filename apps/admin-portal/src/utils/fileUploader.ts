import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

interface UploadProgressCallback {
  (progress: number, loaded: number, total: number): void;
}

interface ChunkedUploadOptions {
  file: File;
  chunkSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: UploadProgressCallback;
}

/**
 * Split a file into chunks for more reliable uploading
 *
 * @param file The file to split into chunks
 * @param chunkSize Size of each chunk in bytes
 * @returns Array of file chunks
 */
function splitFileIntoChunks(file: File, chunkSize: number): Blob[] {
  const chunks: Blob[] = [];
  let start = 0;

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }

  return chunks;
}

/**
 * Creates a FormData object with all the necessary fields
 *
 * @param chunk The file chunk to upload
 * @param formFields Additional form fields to include
 * @param chunkIndex Current chunk index
 * @param totalChunks Total number of chunks
 * @returns FormData object
 */
function createFormDataWithChunk(
  chunk: Blob,
  formFields: Record<string, string>,
  chunkIndex: number,
  totalChunks: number
): FormData {
  const formData = new FormData();

  // Add all the provided form fields
  Object.entries(formFields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  // Add chunk metadata
  formData.append("chunkIndex", String(chunkIndex));
  formData.append("totalChunks", String(totalChunks));

  // Add the file chunk with the expected field name
  formData.append("file", chunk);

  return formData;
}

/**
 * Upload a file in chunks for more reliable uploading
 *
 * @param api AxiosInstance to use for uploading
 * @param url API endpoint URL
 * @param formFields Form fields to include in each request
 * @param options Upload options
 * @returns Response data from the server
 */
export async function uploadFileInChunks<T>(
  api: AxiosInstance,
  url: string,
  formFields: Record<string, string>,
  options: ChunkedUploadOptions
): Promise<T> {
  const {
    file,
    chunkSize = 1024 * 1024, // Default 1MB chunks
    maxRetries = 3,
    retryDelay = 2000,
    onProgress,
  } = options;

  // Check if the file is small enough to upload directly
  if (file.size <= chunkSize) {
    console.log(
      `File size (${file.size} bytes) is small enough for direct upload`
    );

    // Create form data with all fields
    const formData = new FormData();
    Object.entries(formFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);

    // Upload with regular method but longer timeout
    const response = await api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // 2 minutes
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!
          );
          onProgress(
            percentCompleted,
            progressEvent.loaded,
            progressEvent.total!
          );
        }
      },
    });

    return response.data;
  }

  // For larger files, split into chunks
  const chunks = splitFileIntoChunks(file, chunkSize);
  console.log(
    `Splitting ${file.name} (${file.size} bytes) into ${chunks.length} chunks`
  );

  // Track overall progress
  let totalUploaded = 0;
  const totalSize = file.size;

  // Add unique upload ID to prevent confusion between concurrent uploads
  const uploadId =
    Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

  // Add upload ID to form fields
  const formFieldsWithId = {
    ...formFields,
    uploadId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size.toString(),
  };

  // Upload each chunk with retry logic
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let retries = 0;
    let success = false;

    // Try to upload this chunk, with retries if needed
    while (!success && retries <= maxRetries) {
      try {
        const formData = createFormDataWithChunk(
          chunk,
          formFieldsWithId,
          i,
          chunks.length
        );

        // Configure chunk upload with shorter timeout per chunk
        const chunkUploadConfig: AxiosRequestConfig = {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Chunk-Upload": "true",
            "X-Chunk-Index": i.toString(),
            "X-Total-Chunks": chunks.length.toString(),
          },
          timeout: 30000, // 30 seconds per chunk
          onUploadProgress: (progressEvent) => {
            // Calculate overall progress including previously uploaded chunks
            const chunkLoaded = progressEvent.loaded;
            const overallLoaded = totalUploaded + chunkLoaded;

            if (onProgress) {
              const percentCompleted = Math.round(
                (overallLoaded * 100) / totalSize
              );
              onProgress(percentCompleted, overallLoaded, totalSize);
            }
          },
        };

        // Upload the chunk
        await api.post(`${url}/chunk`, formData, chunkUploadConfig);

        // Update total uploaded on success
        totalUploaded += chunk.size;
        success = true;

        // Report progress again to make sure we report the full chunk
        if (onProgress) {
          const percentCompleted = Math.round(
            (totalUploaded * 100) / totalSize
          );
          onProgress(percentCompleted, totalUploaded, totalSize);
        }
      } catch (error) {
        retries++;
        console.error(
          `Error uploading chunk ${i + 1}/${
            chunks.length
          } (attempt ${retries}/${maxRetries}):`,
          error
        );

        if (retries <= maxRetries) {
          // Wait before retrying with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, retries - 1))
          );
        } else {
          throw new Error(
            `Failed to upload chunk ${i + 1}/${
              chunks.length
            } after ${maxRetries} attempts`
          );
        }
      }
    }
  }

  // After all chunks are uploaded, tell server to combine them
  const finalizeResponse = await api.post(`${url}/finalize`, {
    uploadId,
    fileName: file.name,
    totalChunks: chunks.length,
  });

  return finalizeResponse.data;
}

/**
 * Helper to determine if a file should use chunked upload
 *
 * @param file The file to check
 * @param threshold Size threshold in bytes (default: 2MB)
 * @returns True if chunked upload should be used
 */
export function shouldUseChunkedUpload(
  file: File,
  threshold = 2 * 1024 * 1024
): boolean {
  return file.size > threshold;
}
