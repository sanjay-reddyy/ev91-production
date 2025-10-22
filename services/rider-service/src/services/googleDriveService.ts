import axios from "axios";

/**
 * Extract Google Drive file ID from various URL formats
 */
function extractFileId(url: string): string | null {
  // Support various Google Drive URL formats:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  // https://drive.google.com/uc?export=download&id=FILE_ID

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // /file/d/FILE_ID
    /[?&]id=([a-zA-Z0-9_-]+)/, // ?id=FILE_ID or &id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/, // /d/FILE_ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert Google Drive URL to direct download link
 */
function convertToDirectDownloadUrl(fileUrl: string): string {
  const fileId = extractFileId(fileUrl);
  if (!fileId) {
    throw new Error("Invalid Google Drive URL - could not extract file ID");
  }

  // Use the direct download endpoint
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Download file from Google Drive (public link)
 *
 * Requirements:
 * - The Google Drive file must be publicly accessible (Anyone with link can view)
 * - File size should be less than 10MB
 *
 * @param fileUrl - Google Drive file URL (various formats supported)
 * @returns Buffer containing the file data
 */
export async function downloadFromGoogleDrive(
  fileUrl: string
): Promise<Buffer> {
  try {
    const directUrl = convertToDirectDownloadUrl(fileUrl);
    console.log(`📥 Downloading from Google Drive: ${directUrl}`);

    // First request - might get a confirmation page for large files
    const initialResponse = await axios.get(directUrl, {
      responseType: "arraybuffer",
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
      maxRedirects: 5,
      timeout: 30000, // 30 second timeout
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      validateStatus: (status) => status < 500, // Accept redirects and client errors
    });

    // Check if we got an HTML page (virus scan warning or confirmation page)
    const contentType = initialResponse.headers["content-type"];

    if (contentType && contentType.includes("text/html")) {
      // This is likely a confirmation page, try to extract the confirmation link
      const htmlContent = Buffer.from(initialResponse.data).toString("utf-8");

      // Look for the download confirmation pattern
      const confirmMatch = htmlContent.match(/action="([^"]+)"/);
      if (confirmMatch) {
        const confirmUrl = confirmMatch[1].replace(/&amp;/g, "&");
        console.log(
          "🔄 Found confirmation page, downloading with confirmation..."
        );

        // Make second request with confirmation
        const finalResponse = await axios.get(confirmUrl, {
          responseType: "arraybuffer",
          maxContentLength: 10 * 1024 * 1024,
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        return Buffer.from(finalResponse.data);
      }

      // If no confirmation link found but HTML, might be an error page
      throw new Error(
        "Google Drive returned an HTML page - file might not be publicly accessible or too large"
      );
    }

    // Direct download successful
    console.log(
      `✅ Downloaded ${initialResponse.data.byteLength} bytes from Google Drive`
    );
    return Buffer.from(initialResponse.data);
  } catch (error: any) {
    console.error("❌ Google Drive download error:", error.message);

    if (error.response?.status === 404) {
      throw new Error(
        "Google Drive file not found - check if link is correct and file still exists"
      );
    }
    if (error.response?.status === 403) {
      throw new Error(
        "Access denied - ensure file is publicly accessible (Anyone with link can view)"
      );
    }
    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Download timeout - file might be too large or connection is slow"
      );
    }
    if (error.code === "ERR_BAD_REQUEST") {
      throw new Error("Invalid Google Drive URL format");
    }

    throw new Error(`Failed to download from Google Drive: ${error.message}`);
  }
}

/**
 * Validate if a Google Drive URL is properly formatted
 */
export function validateGoogleDriveUrl(url: string): boolean {
  try {
    const fileId = extractFileId(url);
    return fileId !== null && fileId.length > 10;
  } catch {
    return false;
  }
}

/**
 * Batch download multiple files from Google Drive
 * Downloads in parallel with concurrency limit
 */
export async function batchDownloadFromGoogleDrive(
  urls: string[],
  concurrency: number = 5
): Promise<Array<{ url: string; buffer?: Buffer; error?: string }>> {
  const results: Array<{ url: string; buffer?: Buffer; error?: string }> = [];

  // Process in batches to avoid overwhelming Google Drive
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const buffer = await downloadFromGoogleDrive(url);
          return { url, buffer };
        } catch (error: any) {
          return { url, error: error.message };
        }
      })
    );

    results.push(...batchResults);

    // Small delay between batches to be nice to Google's servers
    if (i + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
