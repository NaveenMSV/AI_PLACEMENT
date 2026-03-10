const express = require('express');
const router = express.Router();
const { incrementViolationCount } = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { enforceAntiCheat } = require('../middlewares/antiCheatMiddleware');

router.use(protect);
router.use(authorize('student'));

// The specific route requested by the user
router.patch('/increment-violation', enforceAntiCheat, incrementViolationCount);

module.exports = router;
