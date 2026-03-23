const User = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const Company = require('../models/Company');
const Leaderboard = require('../models/Leaderboard');
const WarningLog = require('../models/WarningLog');
const RoundAttempt = require('../models/RoundAttempt');
const { startTest, getNextRound, getRoundQuestions } = require('../services/interviewEngineService');
const { calculateScore, finalizeTestAttempt } = require('../services/resultEngineService');
const { updateLeaderboard } = require('../services/leaderboardService');
const { runCode } = require('../services/codeExecutionService');

const {
    getDashboardStats,
    getEnrolledTracks,
    updateStudentStats
} = require('../controllers/studentStatsController');
const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('enrolledCompanies', 'name logo');
        const attemptedTests = await TestAttempt.find({ studentId: req.user._id }).sort({ createdAt: -1 });

        const recentScores = attemptedTests.map(test => ({
            companyId: test.companyId,
            score: test.score,
            status: test.status,
            date: test.createdAt
        }));

        res.json({
            enrolledCompanies: user.enrolledCompanies,
            attemptedTests: attemptedTests.length,
            recentScores,
            rank: null // Requires full aggregation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enroll in a company simulation
// @route   POST /student/enroll/:companyId
// @access  Private/Student
const enrollCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.companyId);
        if (!company) return res.status(404).json({ message: 'Company not found' });

        const user = await User.findById(req.user._id);
        if (user.enrolledCompanies.includes(company._id)) {
            return res.status(400).json({ message: 'Already enrolled' });
        }

        user.enrolledCompanies.push(company._id);
        await user.save();

        res.status(200).json({ message: 'Successfully enrolled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start test simulation
// @route   POST /student/test/start/:companyId
// @access  Private/Student
const startTestAttempt = async (req, res) => {
    try {
        const existingAttempt = await TestAttempt.findOne({
            studentId: req.user._id,
            companyId: req.params.companyId,
            status: { $in: ['IN_PROGRESS', 'COMPLETED', 'DISQUALIFIED', 'MALPRACTICE'] }
        });

        if (existingAttempt) {
            console.log(`startTestAttempt: Found existing attempt ${existingAttempt._id} with status ${existingAttempt.status}`);
            if (existingAttempt.status === 'COMPLETED') {
                return res.status(400).json({
                    message: 'You have already completed the simulation for this company.'
                });
            }
            if (existingAttempt.status === 'DISQUALIFIED' || existingAttempt.status === 'MALPRACTICE') {
                return res.status(400).json({
                    message: 'You have been disqualified/blocked from this simulation due to malpractice.'
                });
            }
            // IN_PROGRESS — return the existing attempt so they can continue
            return res.status(200).json(existingAttempt);
        }

        const attempt = await startTest(req.user._id, req.params.companyId);
        console.log(`startTestAttempt: Created new attempt ${attempt._id}`);
        res.status(201).json(attempt);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Log anti-cheat violation
// @route   POST /student/security/violation
// @access  Private/Student
const logViolation = async (req, res) => {
    try {
        const { attemptId, type } = req.body;

        await WarningLog.create({
            studentId: req.user._id,
            attemptId,
            type
        });

        // Use findOneAndUpdate to avoid race conditions with other updates
        const attempt = await TestAttempt.findOneAndUpdate(
            { _id: attemptId, status: 'IN_PROGRESS' },
            { $inc: { warningsCount: 1 } },
            { new: true }
        );

        if (!attempt) {
            // If attempt not found or not in progress, it might already be malpracticed or completed
            const currentAttempt = await TestAttempt.findById(attemptId);
            return res.json({
                warningsRemaining: currentAttempt ? Math.max(0, 3 - currentAttempt.warningsCount) : 0,
                status: currentAttempt?.status
            });
        }

        if (attempt.warningsCount >= 3) {
            attempt.status = 'MALPRACTICE';
            attempt.endTime = new Date();
            await attempt.save();
            return res.status(403).json({
                message: 'Test terminated due to malpractice (excessive violations)',
                malpractice: true
            });
        }

        res.json({ warningsRemaining: 3 - attempt.warningsCount });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Increment violation count and auto-malpractice if >= 3
// @route   PATCH /api/student/security/violation/increment
// @access  Private/Student
const incrementViolationCount = async (req, res) => {
    try {
        const { attemptId, type, isCritical } = req.body;
        console.log(`SERVER: incrementViolationCount called for attempt ${attemptId}, type ${type}, isCritical ${isCritical}`);

        // Define update object
        const update = { $inc: { warningsCount: 1 } };

        // If it's critical (e.g., 2nd screenshot or 4th back button), set status to MALPRACTICE immediately
        if (isCritical) {
            update.status = 'MALPRACTICE';
            update.endTime = new Date();
        }

        // Use findOneAndUpdate with status check to prevent overwriting MALPRACTICE
        const attempt = await TestAttempt.findOneAndUpdate(
            { _id: attemptId, status: 'IN_PROGRESS' },
            update,
            { new: true }
        );

        if (!attempt) {
            const currentAttempt = await TestAttempt.findById(attemptId);
            console.log(`SERVER: Attempt ${attemptId} not found or not in progress (status: ${currentAttempt?.status})`);
            return res.json({
                message: 'Attempt already finalized or not found',
                malpractice: currentAttempt?.status === 'MALPRACTICE',
                violationCount: currentAttempt?.warningsCount || 0
            });
        }

        await WarningLog.create({
            studentId: req.user._id,
            attemptId,
            type
        });

        // Global threshold check: 3 violations results in malpractice
        if (attempt.warningsCount >= 3 && attempt.status !== 'MALPRACTICE') {
            console.log(`SERVER: Global violation threshold reached for ${attemptId}. Marking MALPRACTICE.`);
            // Atomic update to mark as malpractice
            const finalAttempt = await TestAttempt.findOneAndUpdate(
                { _id: attemptId, status: 'IN_PROGRESS' },
                {
                    status: 'MALPRACTICE',
                    endTime: new Date()
                },
                { new: true }
            );

            return res.json({
                message: 'Test terminated due to malpractice',
                malpractice: true,
                violationCount: (finalAttempt || attempt).warningsCount
            });
        }

        res.json({
            message: 'Violation recorded',
            malpractice: attempt.status === 'MALPRACTICE' || isCritical,
            violationCount: attempt.warningsCount,
            warningsRemaining: Math.max(0, 3 - attempt.warningsCount)
        });

    } catch (error) {
        console.error('SERVER: incrementViolationCount error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Directly mark a test as MALPRACTICE (called by strict proctoring)
// @route   POST /student/security/malpractice
// @access  Private/Student
const markMalpractice = async (req, res) => {
    try {
        const { attemptId, type } = req.body;
        console.log(`SERVER: markMalpractice called for ${attemptId}, type ${type}`);

        const attempt = await TestAttempt.findOneAndUpdate(
            { _id: attemptId, status: { $ne: 'MALPRACTICE' } },
            {
                status: 'MALPRACTICE',
                warningsCount: 3,
                endTime: new Date()
            },
            { new: true }
        );

        if (!attempt) {
            console.log(`SERVER: Attempt ${attemptId} already MALPRACTICE or not found.`);
            return res.status(200).json({ message: 'Already marked as malpractice or not found', malpractice: true });
        }

        await WarningLog.create({ studentId: req.user._id, attemptId, type });
        console.log(`SERVER: Attempt ${attemptId} SUCCESSFULLY marked as MALPRACTICE.`);
        res.status(200).json({ message: 'Test terminated due to malpractice', malpractice: true });
    } catch (error) {
        console.error('SERVER: markMalpractice error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Run Code in coding round
// @route   POST /student/code/run
// @access  Private/Student
const runCodeStub = async (req, res) => {
    try {
        const { language, code, testCases } = req.body;
        
        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }

        const result = await runCode(language, code, testCases);
        res.json(result);
    } catch (error) {
        console.error('Code Run Error:', error);
        res.status(500).json({ message: 'Failed to execute code', error: error.message });
    }
};

// @desc    Run SQL in SQL round
// @route   POST /student/sql/run
// @access  Private/Student
const runSqlStub = async (req, res) => {
    try {
        const { query, testCases } = req.body;
        if (!query) return res.status(400).json({ message: 'Query is required' });

        const { runSql } = require('../services/sqlExecutionService');
        const result = await runSql(query, testCases || []);
        res.json(result);
    } catch (error) {
        console.error('SQL Run Error:', error);
        res.status(500).json({ message: 'Failed to execute SQL', error: error.message });
    }
};


// @desc    Finish the test and generate score
// @route   POST /student/test/:attemptId/finish
// @access  Private/Student
const finishTestAttempt = async (req, res) => {
    try {
        console.log(`finishTestAttempt called for attempt: ${req.params.attemptId}`);
        const models = {
            TestAttempt: require('../models/TestAttempt'),
            RoundAttempt: require('../models/RoundAttempt')
        };

        const attempt = await finalizeTestAttempt(req.params.attemptId, models);

        if (!attempt) {
            console.log(`finishTestAttempt: attempt not found for ${req.params.attemptId}`);
            return res.status(404).json({ message: 'Test attempt not found for finalization.' });
        }

        console.log(`finishTestAttempt: SUCCESS - status=${attempt.status}, score=${attempt.score}`);

        const timeTaken = (new Date(attempt.endTime).getTime() - new Date(attempt.startTime).getTime()) / 1000;

        // Update both the company leaderboard and the global student stats
        await Promise.all([
            updateLeaderboard(attempt.companyId, req.user._id, attempt.score, timeTaken),
            updateStudentStats(req.user._id)
        ]);

        res.json(attempt);
    } catch (error) {
        console.error(`Finalize Test Error for attempt ${req.params.attemptId}:`, error);
        res.status(500).json({
            message: 'Internal server error during finalization',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Get result analytics
// @route   GET /student/results/:attemptId
// @access  Private/Student
const getTestResult = async (req, res) => {
    try {
        const attempt = await TestAttempt.findById(req.params.attemptId)
            .populate('companyId', 'name');

        if (!attempt || attempt.studentId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        const rankRecord = await Leaderboard.findOne({
            companyId: attempt.companyId._id,
            studentId: req.user._id
        });

        const roundAttempts = await RoundAttempt.find({ attemptId: attempt._id })
            .sort({ roundNumber: 1 });

        res.json({
            attempt,
            rank: rankRecord ? rankRecord.rank : null,
            roundAttempts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get questions and meta for a specific round attempt
// @route   GET /api/student/test/:attemptId/round/:roundNumber
const getRoundData = async (req, res) => {
    try {
        const { attemptId, roundNumber } = req.params;
        const attempt = await TestAttempt.findById(attemptId);

        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        // If attempt is already finished, don't allow re-access
        if (['COMPLETED', 'MALPRACTICE', 'DISQUALIFIED'].includes(attempt.status)) {
            return res.status(400).json({ message: 'Test already finished', status: attempt.status });
        }

        let roundAttempt = await RoundAttempt.findOne({ attemptId, roundNumber });

        // If RoundAttempt doesn't exist, try to create it from the blueprint
        if (!roundAttempt) {
            console.log(`getRoundData: RoundAttempt for round ${roundNumber} not found, attempting to create...`);
            const prevRound = Number(roundNumber) - 1;
            if (prevRound >= 1) {
                const result = await getNextRound(attemptId, attempt.companyId, prevRound);
                if (result) {
                    roundAttempt = result.roundAttempt;
                    console.log(`getRoundData: Auto-created RoundAttempt for round ${roundNumber} (${roundAttempt.roundType})`);
                }
            }
        }

        if (!roundAttempt) return res.status(404).json({ message: 'Round attempt not found' });

        // If this round is already completed, tell the frontend to skip
        if (roundAttempt.completed) {
            return res.json({ roundAttempt, completed: true, questions: [] });
        }

        const questions = await getRoundQuestions(attempt.companyId, roundAttempt.roundType, Number(roundNumber));
        console.log(`SERVER: getRoundData for ${attemptId} - Company: ${attempt.companyId}, Round: ${roundNumber}, Type: ${roundAttempt.roundType}, Found questions: ${questions.length}`);

        res.json({
            roundAttempt,
            completed: false,
            questions: questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options,
                questionType: q.questionType,
                difficulty: q.difficulty,
                testCases: ['CODING', 'SQL', 'AI'].includes(q.questionType) ? q.testCases.filter(tc => !tc.isHidden || q.questionType !== 'CODING') : []
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit answers for a specific round
// @route   POST /api/student/test/:attemptId/round/:roundNumber/submit
const submitRoundData = async (req, res) => {
    try {
        const { attemptId, roundNumber } = req.params;
        const { answers, timeTaken } = req.body;

        const attempt = await TestAttempt.findById(attemptId);
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        // If attempt is already finished or malpracticed, don't allow submission
        if (['COMPLETED', 'MALPRACTICE', 'DISQUALIFIED'].includes(attempt.status)) {
            return res.status(400).json({ message: 'Test already finished, cannot submit data', status: attempt.status });
        }

        const roundAttempt = await RoundAttempt.findOne({ attemptId, roundNumber });
        if (!roundAttempt) return res.status(404).json({ message: 'Round attempt not found' });

        // Calculate score for the round
        const questions = await getRoundQuestions(attempt.companyId, roundAttempt.roundType, Number(roundNumber));
        const { score, correct, total } = await calculateScore(answers, questions);

        roundAttempt.answers = answers;
        roundAttempt.timeTaken = timeTaken;
        roundAttempt.score = score;
        roundAttempt.correctCount = correct;
        roundAttempt.totalQuestions = total;
        roundAttempt.completed = true;
        await roundAttempt.save();

        console.log(`submitRoundData: Round ${roundNumber} completed. Score: ${score}`);

        // Create the next round's RoundAttempt (if exists in blueprint)
        const nextRound = await getNextRound(attemptId, attempt.companyId, Number(roundNumber));

        res.json({
            message: 'Round submitted successfully',
            roundAttempt,
            nextRound: nextRound ? { roundNumber: nextRound.roundAttempt.roundNumber, roundType: nextRound.roundAttempt.roundType } : null
        });
    } catch (error) {
        console.error('submitRoundData error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get the latest attempt status for a company
// @route   GET /api/student/test/status/:companyId
const getAttemptStatus = async (req, res) => {
    try {
        const attempt = await TestAttempt.findOne({
            studentId: req.user._id,
            companyId: req.params.companyId
        }).sort({ createdAt: -1 });

        if (!attempt) {
            return res.json({ status: 'NONE' });
        }

        // Get completed round numbers for this attempt
        const roundAttempts = await RoundAttempt.find({
            attemptId: attempt._id
        }).sort({ roundNumber: 1 });

        const completedRounds = roundAttempts
            .filter(ra => ra.completed)
            .map(ra => ra.roundNumber);

        // Get total rounds from blueprint
        const InterviewBlueprint = require('../models/InterviewBlueprint');
        const blueprint = await InterviewBlueprint.findOne({ companyId: req.params.companyId });
        const totalRounds = blueprint ? blueprint.rounds.length : 1;

        // Determine the next round to play
        const currentRound = completedRounds.length > 0
            ? Math.max(...completedRounds) + 1
            : 1;

        // AUTO-FINALIZE: If all rounds are completed but test is still IN_PROGRESS, finalize it now
        if (attempt.status === 'IN_PROGRESS' && currentRound > totalRounds) {
            console.log(`getAttemptStatus: Auto-finalizing attempt ${attempt._id} (all ${totalRounds} rounds completed)`);
            const models = { TestAttempt: require('../models/TestAttempt'), RoundAttempt: require('../models/RoundAttempt') };
            const finalized = await finalizeTestAttempt(attempt._id, models);

            return res.json({
                status: 'COMPLETED',
                attemptId: attempt._id,
                completedRounds,
                currentRound: null,
                totalRounds,
                score: finalized ? finalized.score : attempt.score
            });
        }

        // Lock completed logic
        if (['COMPLETED', 'DISQUALIFIED', 'MALPRACTICE'].includes(attempt.status)) {
            return res.json({
                status: attempt.status,
                attemptId: attempt._id,
                completedRounds,
                currentRound: null, // Ensure button does not render 'Continue'
                totalRounds,
                score: attempt.score
            });
        }

        res.json({
            status: attempt.status,
            attemptId: attempt._id,
            completedRounds,
            currentRound: currentRound <= totalRounds ? currentRound : null,
            totalRounds,
            score: attempt.score
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboard,
    enrollCompany,
    startTestAttempt,
    logViolation,
    markMalpractice,
    runCodeStub,
    runSqlStub,
    finishTestAttempt,
    getTestResult,
    getRoundData,
    submitRoundData,
    getAttemptStatus,
    markMalpractice,
    incrementViolationCount
};
