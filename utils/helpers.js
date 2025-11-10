/**
 * Extracts the public_id from a Cloudinary URL.
 * @param {string} imageUrl - The full URL of the Cloudinary image.
 * @returns {string|null} The public_id of the image, or null if not found.
 */
exports.getPublicId = (imageUrl) => {
  // Regular expression to find the public_id
  // It looks for the part of the URL after the version number (e.g., /v1234567/)
  // and before the file extension (e.g., .jpg)
  const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
  const match = imageUrl.match(regex);

  return match ? match[1] : null;
};