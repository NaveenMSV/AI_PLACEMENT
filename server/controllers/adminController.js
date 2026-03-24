const mongoose = require('mongoose');
const Company = require('../models/Company');
const InterviewBlueprint = require('../models/InterviewBlueprint');
const User = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const RoundAttempt = require('../models/RoundAttempt');
const { finalizeTestAttempt } = require('../services/resultEngineService');
const { generateTemplate } = require('../utils/csvTemplateGenerator');
const { parseAndSeedCsv, parseSplitSqlCsv } = require('../services/csvParserService');
const Question = require('../models/Question');
const DailyChallenge = require('../models/DailyChallenge');
const { syncBlueprintWithRound } = require('../services/interviewEngineService');

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

        // Synchronize company numberOfRounds if they differ
        if (companyExists.numberOfRounds !== rounds.length) {
            companyExists.numberOfRounds = rounds.length;
            await companyExists.save();
        }

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
        const roundType = req.body.roundType || null;
        fs.appendFileSync(logFile, `Target Company ID: ${companyId}, Round: ${roundNumber}, Type: ${roundType}\n`);

        if (!companyId) {
            fs.appendFileSync(logFile, `Error: Missing Company ID\n`);
            return res.status(400).json({ message: 'Company ID is required' });
        }

        console.log(`ADMIN: Uploading questions for Company: ${companyId}, Round: ${roundNumber}, Type: ${roundType}`);
        const count = await parseAndSeedCsv(req.file.path, companyId, roundNumber, roundType);
        console.log(`ADMIN: Seeded ${count} questions successfully.`);
        
        // Synchronize blueprint if roundType was provided
        if (roundType && roundNumber) {
            const { syncBlueprintWithRound } = require('../services/interviewEngineService');
            await syncBlueprintWithRound(companyId, roundNumber, roundType);
        }

        fs.appendFileSync(logFile, `CSV Upload Success. Seeded count: ${count.count}\n`);

        // If set as today's challenge is checked
        if (req.body.setAsDailyChallenge === 'true' && count.firstId) {
            const q = await Question.findById(count.firstId);
            if (q) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                await DailyChallenge.findOneAndUpdate(
                    { date: today, type: q.questionType },
                    { 
                        questionId: q._id, 
                        date: today, 
                        difficulty: q.difficulty || 'Medium', 
                        type: q.questionType 
                    },
                    { upsert: true }
                );
            }
        }

        res.status(201).json({ message: `Successfully seeded ${count.count} questions` });
    } catch (error) {
        fs.appendFileSync(logFile, `CSV Upload Error: ${error.message}\n`);
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const uploadSplitSqlCsv = async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../server_logs.txt');

    try {
        if (!req.files || !req.files['tables'] || !req.files['questions']) {
            return res.status(400).json({ message: 'Both tables and questions CSV files are required' });
        }

        const companyId = req.body.companyId;
        const roundNumber = req.body.roundNumber || null;

        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const tablesFiles = req.files['tables'].map(f => ({
            path: f.path,
            originalname: f.originalname
        }));
        const questionsFile = req.files['questions'][0];

        if (!questionsFile) {
            return res.status(400).json({ message: 'Questions CSV file is required' });
        }

        console.log(`ADMIN: Uploading SPLIT SQL questions for Company: ${companyId}, Round: ${roundNumber} (${tablesFiles.length} tables)`);
        fs.appendFileSync(logFile, `Split SQL Upload Start: Company ${companyId}, Tables: ${tablesFiles.length}\n`);

        const result = await parseSplitSqlCsv(tablesFiles, questionsFile.path, companyId, roundNumber);

        // Synchronize blueprint if roundNumber was provided
        if (roundNumber) {
            await syncBlueprintWithRound(companyId, roundNumber, 'SQL');
        }

        // If set as today's challenge is checked
        if (req.body.setAsDailyChallenge === 'true' && result.firstId) {
            const q = await Question.findById(result.firstId);
            if (q) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                await DailyChallenge.findOneAndUpdate(
                    { date: today, type: q.questionType },
                    { 
                        questionId: q._id, 
                        date: today, 
                        difficulty: q.difficulty || 'Medium', 
                        type: q.questionType 
                    },
                    { upsert: true }
                );
            }
        }
        
        res.status(201).json({ 
            message: `Successfully seeded ${result.count} SQL questions with associated tables`,
            count: result.count
        });
    } catch (error) {
        fs.appendFileSync(logFile, `Split CSV Upload Error: ${error.message}\n`);
        console.error('Split Upload Error:', error);
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

        // Synchronize blueprint to match number of rounds
        if (numberOfRounds) {
            let blueprint = await InterviewBlueprint.findOne({ companyId: req.params.id });
            if (!blueprint) {
                blueprint = await InterviewBlueprint.create({
                    companyId: req.params.id,
                    rounds: Array.from({ length: numberOfRounds }, (_, i) => ({
                        roundNumber: i + 1,
                        roundType: 'APTITUDE',
                        duration: 30,
                        totalQuestions: 10,
                        weight: Math.floor(100 / numberOfRounds)
                    }))
                });
            } else {
                const currentRounds = blueprint.rounds.length;
                if (numberOfRounds > currentRounds) {
                    // Add missing rounds
                    for (let i = currentRounds + 1; i <= numberOfRounds; i++) {
                        blueprint.rounds.push({
                            roundNumber: i,
                            roundType: 'APTITUDE',
                            duration: 30,
                            totalQuestions: 10,
                            weight: 0
                        });
                    }
                } else if (numberOfRounds < currentRounds) {
                    // Trim rounds
                    blueprint.rounds = blueprint.rounds.filter(r => r.roundNumber <= numberOfRounds);
                }
                
                // Recalculate weights if they were default (all equal)
                const totalWeight = blueprint.rounds.reduce((sum, r) => sum + (r.weight || 0), 0);
                if (totalWeight === 0 || numberOfRounds !== currentRounds) {
                    const avgWeight = Math.floor(100 / numberOfRounds);
                    blueprint.rounds.forEach(r => r.weight = avgWeight);
                }
                
                await blueprint.save();
            }
        }

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
                    id: a._id,
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

// @desc    Create manual question
// @route   POST /api/admin/question/create
// @access  Private/Admin
const createManualQuestion = async (req, res) => {
    try {
        const Question = require('../models/Question');
        const question = await Question.create({
            ...req.body,
            createdByAdmin: req.user._id
        });

        // Synchronize blueprint if roundNumber and roundType were provided
        if (question.roundNumber && question.roundType) {
            await syncBlueprintWithRound(question.companyId, question.roundNumber, question.roundType);
        }

        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update question
// @route   PUT /api/admin/question/:id
// @access  Private/Admin
const updateQuestion = async (req, res) => {
    try {
        const Question = require('../models/Question');
        const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!question) return res.status(404).json({ message: 'Question not found' });
        res.json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete question
// @route   DELETE /api/admin/question/:id
// @access  Private/Admin
const deleteQuestion = async (req, res) => {
    try {
        const Question = require('../models/Question');
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get questions by company
// @route   GET /api/admin/company/:companyId/questions
// @access  Private/Admin
const getQuestionsByCompany = async (req, res) => {
    try {
        const Question = require('../models/Question');
        const questions = await Question.find({ companyId: req.params.companyId });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get test attempt details for review
// @route   GET /api/admin/test-attempt/:id
// @access  Private/Admin
const getTestAttemptById = async (req, res) => {
    try {
        const attempt = await TestAttempt.findById(req.params.id)
            .populate('studentId', 'name email')
            .populate('companyId', 'name');

        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        const roundAttempts = await RoundAttempt.find({ attemptId: attempt._id }).lean();

        // Populate questions for each round to show the text
        const enrichedRounds = await Promise.all(roundAttempts.map(async (ra) => {
            const answerMap = ra.answers || {};
            const questionIds = Object.keys(answerMap);
            const dbQuestions = await Question.find({ _id: { $in: questionIds.filter(id => mongoose.Types.ObjectId.isValid(id) || id === 'default') } }).lean();
            
            // Map db questions for easy lookup
            const dbQMap = {};
            dbQuestions.forEach(q => dbQMap[q._id.toString()] = q);

            // Synthesize questions for all answers to ensure they are visible
            const allQuestions = questionIds.map(id => {
                if (dbQMap[id]) return dbQMap[id];
                return {
                    _id: id,
                    question: id === 'default' ? "General/Introductory Question" : `Question (ID: ${id})`,
                    roundType: ra.roundType,
                    isVirtual: true
                };
            });

            // If no answers but round is an interview, and there are questions in DB for this round, show them too
            if (allQuestions.length === 0 && (ra.roundType === 'TECHNICAL_INTERVIEW' || ra.roundType === 'HR_INTERVIEW')) {
                const fallbackQuestions = await Question.find({ companyId: attempt.companyId, roundType: ra.roundType }).lean();
                return { ...ra, questions: fallbackQuestions };
            }

            return { ...ra, questions: allQuestions };
        }));

        res.json({ attempt, roundAttempts: enrichedRounds });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update round score manually
// @route   PUT /api/admin/round-attempt/:id/score
// @access  Private/Admin
const updateRoundScore = async (req, res) => {
    try {
        const { score } = req.body;
        const roundAttempt = await RoundAttempt.findById(req.params.id);
        if (!roundAttempt) return res.status(404).json({ message: 'Round attempt not found' });

        roundAttempt.score = score;
        await roundAttempt.save();

        // Re-calculate final test score
        const updatedAttempt = await finalizeTestAttempt(roundAttempt.attemptId, { TestAttempt, RoundAttempt });

        res.json({ message: 'Score updated successfully', attempt: updatedAttempt });
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
    deleteCompany,
    createManualQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsByCompany,
    uploadSplitSqlCsv,
    getTestAttemptById,
    updateRoundScore
};

