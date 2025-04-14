import multer from "multer";
import fs from "fs-extra"; // fs-extra to handle file/folder operations
import path from "path";

// Portfolio Storage Configuration (user-specific folders)
const portfolioStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userID = req.params.userId || req.body.userId;  // Get userID from request
      
      const userFolder = `public/portfolio/${userID}`; // Create folder per user

      // Ensure the user-specific folder exists
      await fs.ensureDir(userFolder);

      // Use the user folder for storing files
      cb(null, userFolder);
    } catch (error) {        
      cb(error); // Handle errors if folder creation fails
    }
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp and file extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File Type Validation (Images & Videos)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Image formats
    "image/jpeg",
    // "image/jpg",
    "image/png",

    // Video formats
    "video/mp4",
    "video/mpeg",
    "video/quicktime", // MOV
    "video/x-matroska", // MKV
    "video/webm"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Invalid file type. Only JPG, JPEG, PNG, MP4, MPEG, MOV, MKV, and WebM are allowed."), false);
  }
};

export const portfolioUpload = multer(
  {
    storage: portfolioStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size (adjust as needed)
    },
  }
);
