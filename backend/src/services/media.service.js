import cloudinary from '../config/cloudinary.js';

export function upload(buffer, mimetype, folder) {
  const isModel = mimetype === 'model/gltf-binary' || mimetype === 'application/octet-stream';
  const resourceType = isModel ? 'raw' : 'image';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(resourceType === 'image' && {
          format: 'webp',
          quality: 'auto',
        }),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function destroy(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }
}
