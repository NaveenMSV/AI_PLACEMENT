const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadResume, getResumeData } = require('../controllers/resumeController');
const { protect } = require('../middlewares/authMiddleware');

// Ensure upload directory exists
const resumeDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, resumeDir);
    },
    filename: (req, file, cb) => {
        cb(null, `resume-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/data', protect, getResumeData);

module.exports = router;
