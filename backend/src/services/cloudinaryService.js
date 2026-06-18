const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary only if variables exist, otherwise log warning
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  logger.warn('Cloudinary environment variables are missing. File uploads may fail unless configured.');
}

/**
 * Uploads a file buffer to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @returns {Promise<string>} Secure URL of uploaded asset
 */
const uploadImage = (fileBuffer, folder = 'shopez') => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      // In local dev/testing mode without credentials, return a mock URL
      logger.warn('Cloudinary not configured. Fallback to placeholder image path.');
      return resolve(`https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failure:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadImage
};
