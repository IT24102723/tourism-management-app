const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/helpers');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed.'));
  }
});

router.post('/', verifyToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded.', 400);
    
    // Construct public URL
    // In production, this would be a Cloudinary URL or similar
    // For local dev, we'll return the relative path which the frontend will prepend with API_BASE
    const fileUrl = `/uploads/${req.file.filename}`;
    
    return successResponse(res, { url: fileUrl }, 'File uploaded successfully.');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

module.exports = router;
