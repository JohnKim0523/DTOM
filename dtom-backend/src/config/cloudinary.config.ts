import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddgxzk4pf',
  api_key: process.env.CLOUDINARY_API_KEY || '627184227971789',
  api_secret: process.env.CLOUDINARY_API_SECRET || '8Hfg1rZdMkMP6SOcgxC7HvmKCZk',
});

export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dtom/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  } as any,
});

export const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dtom/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, quality: 'auto' }],
  } as any,
});
