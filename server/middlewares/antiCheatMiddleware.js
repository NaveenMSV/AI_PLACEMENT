const TestAttempt = require('../models/TestAttempt');

const enforceAntiCheat = async (req, res, next) => {
    const { attemptId } = req.body;

    if (!attemptId && req.params.attemptId) {
        req.body.attemptId = req.params.attemptId;
    }

    const idToUse = attemptId || req.params.attemptId;

    if (!idToUse) {
        return next(); // Pass through if no attempt id found in this route
    }

    try {
        const attempt = await TestAttempt.findById(idToUse);

        if (!attempt) {
            return res.status(404).json({ message: 'Test attempt not found' });
        }

        if (attempt.status === 'DISQUALIFIED') {
            return res.status(403).json({
                message: 'This test attempt has been disqualified due to multiple anti-cheat violations.',
                status: 'DISQUALIFIED'
            });
        }

        if (attempt.status === 'COMPLETED') {
            return res.status(400).json({
                message: 'This test attempt is already completed.',
                status: 'COMPLETED'
            });
        }

        // Attach attempt for downstream use
        req.testAttempt = attempt;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error enforcing anti-cheat rules' });
    }
};

module.exports = { enforceAntiCheat };
