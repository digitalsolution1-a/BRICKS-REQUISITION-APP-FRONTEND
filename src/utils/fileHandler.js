import axios from 'axios';

/**
 * Fetches a private file using the auth token and creates a temporary local URL
 */
export const getSecureUrl = async (url, token) => {
  if (!url) return null;
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` }
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error("Secure Fetch Error:", error);
    return null;
  }
};

/**
 * Memory management: revokes the temporary URL
 */
export const revokeFileUrl = (localUrl) => {
  if (localUrl && localUrl.startsWith('blob:')) {
    URL.revokeObjectURL(localUrl);
  }
};
