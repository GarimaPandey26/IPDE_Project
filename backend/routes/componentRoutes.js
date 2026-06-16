const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const componentController = require('../controllers/componentController');
const auth = require('../middleware/auth');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API Endpoints
// Read-only endpoints are public to allow registration dropdown and viewer browsing
router.get('/', componentController.getComponents);
router.get('/:id/history', componentController.getVersionHistory);
router.get('/download/:dataId', componentController.downloadFile);

// Write/Modify endpoints are protected and require JWT authentication
router.post('/', auth, componentController.createComponent);
router.post('/connect', auth, componentController.connectComponents);
router.post('/:id/upload', auth, upload.single('file'), componentController.uploadFile);

module.exports = router;
