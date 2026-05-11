import 'dotenv/config';

export const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/collabsync',
  JWT_SECRET: process.env.JWT_SECRET ?? 'development-only-secret-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE ?? '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  FILE_SIGNING_SECRET: process.env.FILE_SIGNING_SECRET ?? '',
};

export default ENV;