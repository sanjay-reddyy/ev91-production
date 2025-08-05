import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,application/pdf').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Upload single file endpoint
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('📤 File upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { vehicleId, mediaType = 'vehicle_photo', uploadedBy = 'admin', source = 'web_admin', description } = req.body;

    // Create media record in database
    const mediaRecord = await prisma.vehicleMedia.create({
      data: {
        id: uuidv4(),
        vehicleId: vehicleId || 'temp',
        fileName: req.file.filename,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        mediaType: mediaType,
        mediaCategory: req.file.mimetype.startsWith('image/') ? 'Photo' : 'Document',
        description: description,
        uploadedBy: uploadedBy,
        uploadDate: new Date(),
        source: source,
        isActive: true,
        tags: null
      }
    });

    console.log('✅ Media record created:', mediaRecord.id);

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: mediaRecord.id,
        fileName: mediaRecord.fileName,
        fileType: mediaRecord.fileType,
        fileSize: mediaRecord.fileSize,
        mediaType: mediaRecord.mediaType,
        uploadDate: mediaRecord.uploadDate,
        url: `/api/v1/media/file/${mediaRecord.id}`
      }
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload multiple files endpoint
router.post('/upload-multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    console.log('📤 Multiple file upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { vehicleId, mediaType = 'vehicle_photo', uploadedBy = 'admin', source = 'web_admin', description } = req.body;
    const uploadedFiles = [];

    // Create media records for each file
    for (const file of req.files) {
      const mediaRecord = await prisma.vehicleMedia.create({
        data: {
          id: uuidv4(),
          vehicleId: vehicleId || 'temp',
          fileName: file.filename,
          fileUrl: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          mediaType: mediaType,
          mediaCategory: file.mimetype.startsWith('image/') ? 'Photo' : 'Document',
          description: description,
          uploadedBy: uploadedBy,
          uploadDate: new Date(),
          source: source,
          isActive: true,
          tags: null
        }
      });

      uploadedFiles.push({
        id: mediaRecord.id,
        fileName: mediaRecord.fileName,
        fileType: mediaRecord.fileType,
        fileSize: mediaRecord.fileSize,
        mediaType: mediaRecord.mediaType,
        uploadDate: mediaRecord.uploadDate,
        url: `/api/v1/media/file/${mediaRecord.id}`
      });
    }

    console.log(`✅ ${uploadedFiles.length} media records created`);

    return res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('❌ Multiple file upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get file by ID
router.get('/file/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  prisma.vehicleMedia.findUnique({
    where: { id }
  }).then((mediaRecord: any) => {
    if (!mediaRecord) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    // Check if file exists on disk
    if (!fs.existsSync(mediaRecord.fileUrl)) {
      res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', mediaRecord.fileType);
    res.setHeader('Content-Disposition', `inline; filename="${mediaRecord.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(mediaRecord.fileUrl);
    fileStream.pipe(res);

  }).catch((error: any) => {
    console.error('❌ File retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'File retrieval failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  });
});

// Get media list for a vehicle
router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;

    const mediaRecords = await prisma.vehicleMedia.findMany({
      where: {
        vehicleId,
        isActive: true
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });

    const mediaList = mediaRecords.map((record: any) => ({
      id: record.id,
      fileName: record.fileName,
      fileType: record.fileType,
      fileSize: record.fileSize,
      mediaType: record.mediaType,
      description: record.description,
      uploadDate: record.uploadDate,
      url: `/api/v1/media/file/${record.id}`
    }));

    return res.status(200).json({
      success: true,
      data: mediaList
    });

  } catch (error) {
    console.error('❌ Media list retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve media list',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete media file
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mediaRecord = await prisma.vehicleMedia.findUnique({
      where: { id }
    });

    if (!mediaRecord) {
      return res.status(404).json({
        success: false,
        message: 'Media record not found'
      });
    }

    // Soft delete - mark as inactive
    await prisma.vehicleMedia.update({
      where: { id },
      data: { isActive: false }
    });

    // Optionally delete the physical file
    if (fs.existsSync(mediaRecord.fileUrl)) {
      fs.unlinkSync(mediaRecord.fileUrl);
    }

    return res.status(200).json({
      success: true,
      message: 'Media file deleted successfully'
    });

  } catch (error) {
    console.error('❌ Media deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete media file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
