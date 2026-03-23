const express = require('express');
const router = express.Router();
const { getDailyChallenge, submitChallenge, getStreakInfo, setManualDailyChallenge } = require('../controllers/challengeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.get('/today', getDailyChallenge);
router.post('/submit', submitChallenge);
router.get('/streak', getStreakInfo);

// Admin-only: manually set the daily challenge
router.post('/admin/set', authorize('admin'), setManualDailyChallenge);

module.exports = router;
