const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo_secret',
});

const uploadPoster = async (filePathOrBase64) => {
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'demo_key') {
    return { secure_url: filePathOrBase64 };
  }
  return await cloudinary.uploader.upload(filePathOrBase64, {
    folder: 'cineverse/posters',
    transformation: [{ width: 600, height: 900, crop: 'fill' }],
  });
};

module.exports = { cloudinary, uploadPoster };
