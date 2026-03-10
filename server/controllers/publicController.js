const Company = require('../models/Company');
const InterviewBlueprint = require('../models/InterviewBlueprint');

const getCompaniesPublic = async (req, res) => {
    try {
        const companies = await Company.find({}).select('-createdByAdmin');
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCompanyByIdPublic = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCompanyPreview = async (req, res) => {
    try {
        const blueprint = await InterviewBlueprint.findOne({ companyId: req.params.id });
        if (!blueprint) {
            return res.status(404).json({ message: 'Blueprint not found for this company view' });
        }
        res.json(blueprint.rounds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCompaniesPublic,
    getCompanyByIdPublic,
    getCompanyPreview
};
