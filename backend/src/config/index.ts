import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/safetymapper',
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  upload: {
    maxVideoSizeMB: parseInt(process.env.MAX_VIDEO_SIZE_MB || '100', 10),
    dir: process.env.UPLOAD_DIR || './uploads',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default config;
