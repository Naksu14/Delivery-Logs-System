import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';

export class ImageUtil {
  /**
   * Converts an image file to a base64 data URI for embedding in emails
   * @param filename - The image filename (e.g., "1694356789-abc123.jpg")
   * @returns Base64 data URI (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
   * @returns null if file doesn't exist or can't be read
   */
  static getImageAsBase64(filename: string): string | null {
    try {
      // Try multiple possible upload root locations to handle both ts-node and compiled scenarios
      const possiblePaths = [
        // For ts-node execution (npm run dev) - from src/modules/deliveries
        join(__dirname, '..', '..', '..', 'uploads', 'proof-images', filename),
        // For compiled execution - from dist/src/modules/deliveries
        join(__dirname, '..', '..', '..', '..', 'uploads', 'proof-images', filename),
        // Fallback using process.cwd() - project root
        join(process.cwd(), 'uploads', 'proof-images', filename),
        // Fallback if running from parent directory
        join(process.cwd(), 'dls-backend', 'uploads', 'proof-images', filename),
      ];

      let filePath = '';
      for (const possiblePath of possiblePaths) {
        console.log(`[ImageUtil] Checking path: ${possiblePath}`);
        if (existsSync(possiblePath)) {
          filePath = possiblePath;
          console.log(`[ImageUtil] ✓ Found file at: ${filePath}`);
          break;
        }
      }

      if (!filePath) {
        console.warn(`[ImageUtil] ✗ Image file not found in any location for: ${filename}`);
        console.warn(`[ImageUtil] Tried ${possiblePaths.length} locations`);
        return null;
      }

      // Read file as binary
      const imageBuffer = readFileSync(filePath);
      const base64String = imageBuffer.toString('base64');

      // Detect MIME type from file extension
      const extension = filename.toLowerCase().split('.').pop() || 'jpg';
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      };

      const mimeType = mimeTypes[extension] || 'image/jpeg';

      console.log(`[ImageUtil] ✓ Successfully converted image to base64: ${filename} (size: ${base64String.length} bytes, mime: ${mimeType})`);

      // Return data URI
      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      console.error(`[ImageUtil] ✗ Error converting image to base64: ${filename}`, error);
      return null;
    }
  }

  /**
   * Extracts the filename from a full proof_image_url
   * Handles URLs like: http://localhost:3014/uploads/proof-images/filename.jpg
   * @param proof_image_url - The full URL
   * @returns The image filename only (e.g., "1694356789-abc123.jpg")
   */
  static extractFilenameFromUrl(proof_image_url: string): string {
    try {
      // Extract filename from URL - it's the last part after the final slash
      const urlParts = proof_image_url.split('/');
      const filename = urlParts[urlParts.length - 1];

      console.log(`[ImageUtil] Extracted filename from URL: ${filename}`);

      return filename;
    } catch (error) {
      console.error(`[ImageUtil] Failed to extract filename from URL: ${proof_image_url}`, error);
      return '';
    }
  }

  /**
   * Gets the MIME type based on file extension
   * @param filename - The image filename
   * @returns The MIME type (e.g., "image/jpeg")
   */
  static getMimeType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || 'jpg';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  /**
   * Gets the file system path for an image file for email attachment
   * @param filename - The image filename
   * @returns The full file path if it exists, null otherwise
   */
  static getImageFilePath(filename: string): string | null {
    try {
      // Try multiple possible upload root locations to handle both ts-node and compiled scenarios
      const possiblePaths = [
        // For ts-node execution (npm run dev) - from src/modules/deliveries
        join(__dirname, '..', '..', '..', 'uploads', 'proof-images', filename),
        // For compiled execution - from dist/src/modules/deliveries
        join(__dirname, '..', '..', '..', '..', 'uploads', 'proof-images', filename),
        // Fallback using process.cwd() - project root
        join(process.cwd(), 'uploads', 'proof-images', filename),
        // Fallback if running from parent directory
        join(process.cwd(), 'dls-backend', 'uploads', 'proof-images', filename),
      ];

      for (const possiblePath of possiblePaths) {
        console.log(`[ImageUtil] Checking path: ${possiblePath}`);
        if (existsSync(possiblePath)) {
          console.log(`[ImageUtil] ✓ Found file at: ${possiblePath}`);
          return possiblePath;
        }
      }

      console.warn(`[ImageUtil] ✗ Image file not found in any location for: ${filename}`);
      return null;
    } catch (error) {
      console.error(`[ImageUtil] Error getting image file path: ${filename}`, error);
      return null;
    }
  }
}
