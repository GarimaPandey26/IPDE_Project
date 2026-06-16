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

// Protected API Endpoints
router.use(auth); // Apply JWT authentication to all component routes

router.post('/', componentController.createComponent);
router.get('/', componentController.getComponents);
router.post('/connect', componentController.connectComponents);
router.post('/:id/upload', upload.single('file'), componentController.uploadFile);
router.get('/:id/history', componentController.getVersionHistory);
router.get('/download/:dataId', componentController.downloadFile);

module.exports = router;
