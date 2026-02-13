import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

export const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dtom/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, quality: 'auto' }],
  } as any,
});

export const commentImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dtom/comments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 400, quality: 'auto' }],
  } as any,
});
