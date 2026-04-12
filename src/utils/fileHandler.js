import axios from 'axios';

/**
 * Fetches a private file from the server using the auth token,
 * creates a local Blob URL, and returns it.
 * * @param {string} url - The backend URL of the file
 * @param {string} token - User's authorization token
 * @returns {Promise<string|null>} - The local blob URL or null on failure
 */
export const getSecureUrl = async (url, token) => {
  if (!url) return null;

  try {
    const response = await axios.get(url, {
      responseType: 'blob', // Critical for binary data (PDFs, Images, etc)
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Create a local URL that points to the binary data in memory
    const blobUrl = URL.createObjectURL(response.data);
    return blobUrl;
  } catch (error) {
    console.error("Secure File Fetch Error:", {
      message: error.message,
      url: url
    });
    return null;
  }
};

/**
 * Cleans up memory by revoking the created Blob URL.
 * Should be called when the modal is closed or component unmounts.
 * * @param {string} localUrl - The blob:http://... URL to revoke
 */
export const revokeFileUrl = (localUrl) => {
  if (localUrl && localUrl.startsWith('blob:')) {
    URL.revokeObjectURL(localUrl);
  }
};

/**
 * Utility to check if the file is a web-viewable image
 * * @param {string} fileNameOrUrl 
 * @returns {boolean}
 */
export const isImageFile = (fileNameOrUrl) => {
  if (!fileNameOrUrl) return false;
  return /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(fileNameOrUrl);
};

/**
 * Returns the file extension for conditional logic
 * * @param {string} url 
 * @returns {string}
 */
export const getFileExtension = (url) => {
  if (!url) return '';
  return url.split('.').pop().toLowerCase();
};
