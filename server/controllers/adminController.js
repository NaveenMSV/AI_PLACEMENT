const Company = require('../models/Company');
const InterviewBlueprint = require('../models/InterviewBlueprint');
const User = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const { generateTemplate } = require('../utils/csvTemplateGenerator');
const { parseAndSeedCsv } = require('../services/csvParserService');

// @desc    Get all dashboard stats
// @route   GET /admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalAttempts = await TestAttempt.countDocuments();
        const totalCompanies = await Company.countDocuments();
        const activeTests = await TestAttempt.countDocuments({ status: 'IN_PROGRESS' });

        res.json({
            totalStudents,
            totalAttempts,
            totalCompanies,
            activeTests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new company
// @route   POST /admin/company/create
// @access  Private/Admin
const createCompany = async (req, res) => {
    try {
        const { name, description, difficultyLevel, estimatedDuration, numberOfRounds } = req.body;

        const company = await Company.create({
            name,
            description,
            difficultyLevel,
            estimatedDuration,
            numberOfRounds,
            createdByAdmin: req.user._id
        });

        res.status(201).json(company);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create Interview Blueprint for Company
// @route   POST /admin/company/:companyId/interview-blueprint
// @access  Private/Admin
const createBlueprint = async (req, res) => {
    try {
        const { rounds } = req.body;
        const { companyId } = req.params;

        const companyExists = await Company.findById(companyId);
        if (!companyExists) return res.status(404).json({ message: 'Company not found' });

        const blueprint = await InterviewBlueprint.findOneAndUpdate(
            { companyId },
            { companyId, rounds },
            { new: true, upsert: true }
        );

        res.status(201).json(blueprint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Download CSV Template
// @route   GET /admin/questions/template
// @access  Private/Admin
const getCsvTemplate = async (req, res) => {
    try {
        const filePath = await generateTemplate();
        res.download(filePath, 'question_template.csv');
    } catch (error) {
        res.status(500).json({ message: 'Error generating template' });
    }
};

// @desc    Upload Questions via CSV
// @route   POST /admin/questions/upload
// @access  Private/Admin
const uploadQuestionsCsv = async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../server_logs.txt');

    try {
        fs.appendFileSync(logFile, `--- CSV Upload Start: ${req.file ? req.file.filename : 'No File'} ---\n`);

        if (!req.file) {
            fs.appendFileSync(logFile, `Error: No file in request\n`);
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }

        const companyId = req.body.companyId;
        const roundNumber = req.body.roundNumber || null;
        fs.appendFileSync(logFile, `Target Company ID: ${companyId}, Round: ${roundNumber}\n`);

        if (!companyId) {
            fs.appendFileSync(logFile, `Error: Missing Company ID\n`);
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const count = await parseAndSeedCsv(req.file.path, companyId, roundNumber);
        fs.appendFileSync(logFile, `CSV Upload Success. Seeded count: ${count}\n`);

        res.status(201).json({ message: `Successfully seeded ${count} questions` });
    } catch (error) {
        fs.appendFileSync(logFile, `CSV Upload Error: ${error.message}\n`);
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Analytics (Top performing etc)
// @route   GET /admin/analytics
// @access  Private/Admin
const getGlobalAnalytics = async (req, res) => {
    try {
        // Stub implementation for complex aggregations requested
        const topStudents = await User.find({ role: 'student' }).sort({ averageScore: -1 }).limit(10).select('name averageScore college');

        res.json({
            topStudents,
            // Adding stubs for future advanced aggregations
            companySuccessRate: [],
            averageScorePerCompany: []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all companies
// @route   GET /api/admin/companies
// @access  Private/Admin
const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ name: 1 });
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search companies by name
// @route   GET /api/admin/companies/search
// @access  Private/Admin
const searchCompanies = async (req, res) => {
    try {
        const { query } = req.query;
        const companies = await Company.find({
            name: { $regex: query, $options: 'i' }
        }).limit(10);
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get company by ID
// @route   GET /api/admin/company/:id
// @access  Private/Admin
const getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update company
// @route   PUT /api/admin/company/:id
// @access  Private/Admin
const updateCompany = async (req, res) => {
    try {
        const { name, description, difficultyLevel, estimatedDuration, numberOfRounds } = req.body;
        const company = await Company.findById(req.params.id);

        if (!company) return res.status(404).json({ message: 'Company not found' });

        company.name = name || company.name;
        company.description = description || company.description;
        company.difficultyLevel = difficultyLevel || company.difficultyLevel;
        company.estimatedDuration = estimatedDuration || company.estimatedDuration;
        company.numberOfRounds = numberOfRounds || company.numberOfRounds;

        const updatedCompany = await company.save();
        res.json(updatedCompany);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete company
// @route   DELETE /api/admin/company/:id
// @access  Private/Admin
const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });

        // Delete related data (Blueprint and Questions)
        await InterviewBlueprint.deleteMany({ companyId: req.params.id });
        // Assuming questions are linked to companyId
        const Question = require('../models/Question');
        await Question.deleteMany({ companyId: req.params.id });

        await company.deleteOne();
        res.json({ message: 'Company and related data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all students with tracking info
// @route   GET /admin/students/tracking
// @access  Private/Admin
const getStudentsTracking = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .populate('enrolledCompanies', 'name')
            .select('name email enrolledCompanies createdAt lastLogin');

        const studentTracking = await Promise.all(students.map(async (student) => {
            const attempts = await TestAttempt.find({ studentId: student._id })
                .populate('companyId', 'name')
                .sort({ createdAt: -1 });

            return {
                _id: student._id,
                name: student.name,
                email: student.email,
                enrolledCompanies: student.enrolledCompanies,
                joinedAt: student.createdAt,
                testHistory: attempts.map(a => ({
                    company: a.companyId?.name,
                    status: a.status,
                    score: a.score,
                    date: a.createdAt
                }))
            };
        }));

        res.json(studentTracking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
    deleteCompany
};
