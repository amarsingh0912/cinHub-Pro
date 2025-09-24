import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
} else {
  console.warn("Cloudinary environment variables not set - image upload will be disabled");
  console.warn("Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
}

interface CloudinarySignatureParams {
  folder?: string;
  public_id?: string;
  upload_preset?: string;
  transformation?: string;
}

export function generateUploadSignature(params: CloudinarySignatureParams = {}) {
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary not configured - missing API secret');
  }

  const timestamp = Math.round(Date.now() / 1000);
  
  // Default upload parameters for profile pictures
  const uploadParams = {
    timestamp,
    folder: params.folder || 'profile_pictures',
    upload_preset: params.upload_preset || undefined,
    transformation: params.transformation || 'c_fill,w_400,h_400,q_auto,f_auto',
    ...params
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(uploadParams).filter(([_, value]) => value !== undefined)
  );

  // Generate signature
  const signature = cloudinary.utils.api_sign_request(cleanParams, process.env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    ...cleanParams
  };
}

export function validateCloudinaryUrl(url: string, userId?: string): boolean {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return false;
  }
  
  // Require HTTPS for security
  if (!url.startsWith('https://')) {
    return false;
  }
  
  // Check if URL is from the configured Cloudinary account
  const cloudinaryUrlPattern = new RegExp(
    `^https://res\\.cloudinary\\.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`
  );
  
  if (!cloudinaryUrlPattern.test(url)) {
    return false;
  }
  
  // If userId provided, validate that the URL contains the user's folder path
  if (userId) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Must contain the user's profile pictures folder
      const requiredPath = `/image/upload/`;
      const requiredFolder = `profile_pictures/${userId}_`;
      
      if (!pathname.includes(requiredPath)) {
        return false;
      }
      
      // Check if the pathname contains the user's folder after any transformations/versions
      if (!pathname.includes(`/${requiredFolder}`)) {
        return false;
      }
      
      // Additional check: extract the part after the last occurrence of profile_pictures/
      const profilePicturesIndex = pathname.lastIndexOf('/profile_pictures/');
      if (profilePicturesIndex === -1) {
        return false;
      }
      
      const afterProfilePictures = pathname.substring(profilePicturesIndex + '/profile_pictures/'.length);
      // Should start with userId_
      if (!afterProfilePictures.startsWith(`${userId}_`)) {
        return false;
      }
      
    } catch (error) {
      console.error('Error parsing Cloudinary URL:', error);
      return false;
    }
  }
  
  return true;
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
  );
}