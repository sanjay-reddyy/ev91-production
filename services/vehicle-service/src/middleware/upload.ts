import multer from "multer";
import path from "path";

// Configure multer for memory storage (we'll upload to S3 instead of disk)
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req: any, file: any, cb: any) => {
  // Allow images, videos, and documents
  const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|wmv|pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, videos, and documents are allowed."
      )
    );
  }
};

// Configure multer with options for S3 upload
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

// Export individual upload configurations
export const uploadSingle = upload.single("file");
export const uploadDocument = upload.single("document");
export const uploadMultiple = upload.array("files", 10);
export const uploadFields = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
  { name: "documents", maxCount: 5 },
]);
