const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    createCompany,
    getAllCompanies,
    searchCompanies,
    createBlueprint,
    getCsvTemplate,
    uploadQuestionsCsv,
    getGlobalAnalytics,
    getStudentsTracking,
    getCompanyById,
    updateCompany,
    deleteCompany,
    createManualQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsByCompany,
    uploadSplitSqlCsv
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Apply RBAC: Only admin allowed for all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getGlobalAnalytics);
router.get('/students/tracking', getStudentsTracking);

// Company Management
router.get('/companies', getAllCompanies);
router.get('/companies/search', searchCompanies);
router.get('/company/:id', getCompanyById);
router.put('/company/:id', upload.single('logo'), updateCompany);
router.delete('/company/:id', deleteCompany);
router.post('/company/create', upload.single('logo'), createCompany);
router.post('/company/upload-logo', upload.single('logo'), (req, res) => {
    if (req.file) {
        res.json({ message: 'Logo uploaded via legacy route', url: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ message: 'No file received' });
    }
});

// Blueprint Management
router.post('/company/:companyId/interview-blueprint', createBlueprint);

// Question Management
router.get('/questions/template', getCsvTemplate);
router.post('/questions/upload', upload.single('file'), uploadQuestionsCsv);
router.post('/questions/upload-split-sql', upload.fields([{ name: 'tables', maxCount: 10 }, { name: 'questions', maxCount: 1 }]), uploadSplitSqlCsv);
router.get('/company/:companyId/questions', getQuestionsByCompany);
router.post('/question/create', createManualQuestion);
router.put('/question/:id', updateQuestion);
router.delete('/question/:id', deleteQuestion);

module.exports = router;

