const express = require('express');
const router = express.Router();
const {
    getCompaniesPublic,
    getCompanyByIdPublic,
    getCompanyPreview
} = require('../controllers/publicController');

router.get('/companies', getCompaniesPublic);
router.get('/companies/:id', getCompanyByIdPublic);
router.get('/companies/:id/interview-preview', getCompanyPreview);

module.exports = router;
