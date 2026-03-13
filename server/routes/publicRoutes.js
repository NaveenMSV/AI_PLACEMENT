const express = require('express');
const router = express.Router();
const {
    getCompaniesPublic,
    getCompanyByIdPublic,
    getCompanyPreview,
    checkCompanyQuestions
} = require('../controllers/publicController');

router.get('/companies', getCompaniesPublic);
router.get('/companies/:id', getCompanyByIdPublic);
router.get('/companies/:id/interview-preview', getCompanyPreview);
router.get('/companies/:id/has-questions', checkCompanyQuestions);

module.exports = router;
