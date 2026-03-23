const Company = require('../models/Company');
const InterviewBlueprint = require('../models/InterviewBlueprint');
const Question = require('../models/Question');

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
        let blueprint = await InterviewBlueprint.findOne({ companyId: req.params.id });
        
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });

        if (!blueprint) {
            // Dynamic fallback: scan questions for rounds
            const distinctRounds = await Question.aggregate([
                { $match: { companyId: new (require('mongoose').Types.ObjectId)(req.params.id) } },
                { $group: { _id: "$roundNumber", type: { $first: "$roundType" } } },
                { $sort: { _id: 1 } }
            ]);

            if (distinctRounds.length === 0) {
                // Return defaults based on company.numberOfRounds
                const defaultRounds = Array.from({ length: company.numberOfRounds || 1 }, (_, i) => ({
                    roundNumber: i + 1,
                    roundType: 'APTITUDE',
                    duration: 30,
                    weight: Math.floor(100 / (company.numberOfRounds || 1))
                }));
                return res.json(defaultRounds);
            }

            const rounds = distinctRounds.map(r => ({
                roundNumber: r._id || 1,
                roundType: r.type,
                duration: 30,
                weight: Math.floor(100 / distinctRounds.length)
            }));
            return res.json(rounds);
        }

        // If blueprint exists but has fewer rounds than company configuration (legacy data)
        let rounds = [...blueprint.rounds];
        if (company.numberOfRounds > rounds.length) {
            for (let i = rounds.length + 1; i <= company.numberOfRounds; i++) {
                rounds.push({
                    roundNumber: i,
                    roundType: 'APTITUDE',
                    duration: 30,
                    totalQuestions: 10,
                    weight: 0
                });
            }
        }
        
        res.json(rounds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkCompanyQuestions = async (req, res) => {
    try {
        const count = await Question.countDocuments({ companyId: req.params.id });
        res.json({ hasQuestions: count > 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCompaniesPublic,
    getCompanyByIdPublic,
    getCompanyPreview,
    checkCompanyQuestions
};
