const express = require('express');
const router = express.Router();
const {
    getDashboard,
    enrollCompany,
    startTestAttempt,
    logViolation,
    runCodeStub,
    runSqlStub,
    finishTestAttempt,
    getTestResult,
    getRoundData,
    submitRoundData,
    getAttemptStatus,
    markMalpractice
} = require('../controllers/studentController');
const {
    getDashboardStats,
    getEnrolledTracks,
    refreshDashboardStats
} = require('../controllers/studentStatsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { enforceAntiCheat } = require('../middlewares/antiCheatMiddleware');

// Base student protections
router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getDashboard);
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/tracks', getEnrolledTracks);
router.post('/dashboard/refresh', refreshDashboardStats);
router.post('/enroll/:companyId', enrollCompany);

// Test Engine Routes (Requires AntiCheat checking on specific routes)
router.post('/test/start/:companyId', startTestAttempt);
router.post('/security/violation', enforceAntiCheat, logViolation);

// Stubs
router.post('/code/run', runCodeStub);
router.post('/sql/run', runSqlStub);

router.post('/test/:attemptId/finish', enforceAntiCheat, finishTestAttempt);
router.get('/test/:attemptId/round/:roundNumber', getRoundData);
router.post('/test/:attemptId/round/:roundNumber/submit', enforceAntiCheat, submitRoundData); // Added enforceAntiCheat
router.get('/test/status/:companyId', getAttemptStatus);
router.get('/results/:attemptId', getTestResult);

// --- Proctoring Routes ---
router.post('/security/malpractice', enforceAntiCheat, markMalpractice); // Added new route

// Placeholder for remaining round specific data retrieval/submission
// router.get('/test/:attemptId/round/:roundNumber', ... )
// router.post('/test/:attemptId/round/:roundNumber/submit', ... )

module.exports = router;
