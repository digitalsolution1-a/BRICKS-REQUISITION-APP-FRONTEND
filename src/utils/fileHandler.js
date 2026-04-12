import axios from 'axios';

/**
 * Fetches a private file and creates a temporary local URL for previewing
 * @param {string} url - The Cloudinary or API storage URL
 * @param {string} token - User's Authorization token
 */
export const getSecureUrl = async (url, token) => {
  if (!url) return null;
  
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Creates a blob://... URL that works in <embed>, <iframe>, and <img>
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error("File Streaming Error:", error);
    return null;
  }
};

/**
 * Cleanup function to prevent memory leaks
 * @param {string} localUrl - The blob URL to revoke
 */
export const revokeFileUrl = (localUrl) => {
  if (localUrl && localUrl.startsWith('blob:')) {
    URL.revokeObjectURL(localUrl);
  }
};
