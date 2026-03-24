const DailyChallenge = require('../models/DailyChallenge');
const Question = require('../models/Question');
const User = require('../models/User');

// @desc    Get the daily challenge for today
// @route   GET /api/challenge/today
// @access  Private
const getDailyChallenge = async (req, res) => {
    try {
        const { type = 'CODING' } = req.query; // Default to CODING for backward compatibility
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const user = await User.findById(req.user._id);

        // Check if user has a current challenge of this type and its status
        // We use different fields if we want separate tracks, but for now let's use a single daily track
        // or prefix the field based on type if we want them independent.
        // The user's request sounds like they want the "daily challenge" to persist until passed.
        // Let's use separate fields in the User model if they don't exist, or just use one for now.
        // Actually, let's make them independent by using the type in search.
        
        const challengeField = type === 'SQL' ? 'currentSqlChallengeId' : 'currentChallengeId';
        const passedField = type === 'SQL' ? 'isCurrentSqlChallengePassed' : 'isCurrentChallengePassed';

        // 0. Check if there is an EXPLICIT DailyChallenge set for today (Admin manual set)
        const dailyManual = await DailyChallenge.findOne({ date: today, type: type }).populate('questionId');

        if (dailyManual && dailyManual.questionId && (!user[challengeField] || user[challengeField].toString() !== dailyManual.questionId._id.toString())) {
            // Admin has pushed a new specific challenge, override the student's current logic
            user[challengeField] = dailyManual.questionId._id;
            user[passedField] = false;
            await user.save();

            return res.json({
                questionId: dailyManual.questionId,
                date: today,
                difficulty: dailyManual.questionId.difficulty || 'Medium',
                isPassed: false
            });
        }

        if (user[challengeField]) {
            const question = await Question.findById(user[challengeField]);
            if (question) {
                // If it's a new day and the previous one was passed, we need a new one
                if (user[passedField]) {
                    const lastDate = user.lastChallengeDate ? new Date(user.lastChallengeDate) : null;
                    if (lastDate) lastDate.setHours(0, 0, 0, 0);

                    if (lastDate && lastDate.getTime() < today.getTime()) {
                        // Clear old passed challenge to pick new one below
                        user[passedField] = false;
                        user[challengeField] = null;
                        // Don't save yet, we'll save after picking new one
                    } else {
                        return res.json({
                            questionId: question,
                            date: today,
                            difficulty: question.difficulty || 'Medium',
                            isPassed: true
                        });
                    }
                } else {
                    // IF NOT PASSED: Always return the SAME question (the persistence requirement)
                    return res.json({
                        questionId: question,
                        date: today,
                        difficulty: question.difficulty || 'Medium',
                        isPassed: false
                    });
                }
            }
        }

        // Pick a challenge for today of this type
        let challenge = await DailyChallenge.findOne({ date: today, type: type }).populate('questionId');

        if (!challenge) {
            const Company = require('../models/Company');
            const companyName = type === 'SQL' ? 'SQL Practice' : 'Coding Practice';
            const cpCompany = await Company.findOne({ name: companyName });
            
            let query = { questionType: type };
            if (cpCompany) {
                const cpCount = await Question.countDocuments({ ...query, companyId: cpCompany._id });
                if (cpCount > 0) {
                    query.companyId = cpCompany._id;
                }
            }

            const count = await Question.countDocuments(query);
            console.log('challengeController.js query:', query, 'count:', count);
            if (count === 0) {
                console.log('Returning 404 because count === 0');
                return res.status(404).json({ message: `No ${type.toLowerCase()} questions available` });
            }
            const random = Math.floor(Math.random() * count);
            const randomQuestion = await Question.findOne(query).skip(random);

            challenge = await DailyChallenge.create({
                questionId: randomQuestion._id,
                date: today,
                difficulty: randomQuestion.difficulty || 'Medium',
                type: type
            });
            challenge = await challenge.populate('questionId');
        }

        if (challenge && !challenge.questionId) {
            // Handle case where challenge exists but question was deleted
            await DailyChallenge.deleteOne({ _id: challenge._id });
            return res.status(404).json({ message: "Daily challenge question no longer exists. Please refresh." });
        }

        // Assign to user
        user[challengeField] = challenge.questionId._id;
        user[passedField] = false;
        await user.save();

        res.json(challenge);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit daily challenge and update streak
// @route   POST /api/challenge/submit
// @access  Private
const submitChallenge = async (req, res) => {
    try {
        const { questionId, passed, type = 'CODING' } = req.body;
        if (!passed) {
            return res.json({ message: 'Challenge not passed, streak unchanged' });
        }

        const user = await User.findById(req.user._id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDate = user.lastChallengeDate ? new Date(user.lastChallengeDate) : null;
        if (lastDate) lastDate.setHours(0, 0, 0, 0);

        // Update passed flag for this specific challenge
        const passedField = type === 'SQL' ? 'isCurrentSqlChallengePassed' : 'isCurrentChallengePassed';
        
        // Prevent multiple streak increments for the same question if already passed
        if (user[passedField] && lastDate && lastDate.getTime() === today.getTime()) {
            return res.json({ message: 'Challenge already completed today', streak: user.currentStreak });
        }

        user[passedField] = true;

        // Streak logic: increase on pass
        // User requested "streak should increase or else it remains same"
        // This traditionally means if you skip a day it breaks, but if you pass it goes up.
        // To be safe and "LeetCode-like", we ensure it increments when they pass a NEW question.
        
        user.currentStreak += 1;

        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }

        user.lastChallengeDate = today;
        await user.save();

        res.json({
            message: 'Challenge submitted! Streak updated.',
            streak: user.currentStreak,
            longestStreak: user.longestStreak
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user streak info
// @route   GET /api/challenge/streak
// @access  Private
const getStreakInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('currentStreak longestStreak lastChallengeDate');
        
        // Streak reset only happens if they completely missed the window 
        // We'll be lenient: as long as they passed SOMETHING recently, or let's just 
        // REMOVE auto-reset here to satisfy "it remains same" requirement.
        // In a true LeetCode environment, streaks persist until you fail to PASS on a new day.
        
        // Let's only reset if they haven't passed anything in 48 hours
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDate = user.lastChallengeDate ? new Date(user.lastChallengeDate) : null;
        if (lastDate) lastDate.setHours(0, 0, 0, 0);

        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        if (lastDate && lastDate.getTime() < twoDaysAgo.getTime()) {
             user.currentStreak = 0;
             await user.save();
        }

        res.json({
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastChallengeDate: user.lastChallengeDate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin manually sets the daily coding challenge question
// @route   POST /api/challenge/admin/set
// @access  Private/Admin
const setManualDailyChallenge = async (req, res) => {
    try {
        const { questionId, type = 'CODING', date } = req.body;

        if (!questionId) {
            return res.status(400).json({ message: 'questionId is required' });
        }

        // Verify the question exists
        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        // Upsert the DailyChallenge for this date and type
        let challenge = await DailyChallenge.findOneAndUpdate(
            { date: targetDate, type: type },
            {
                questionId: question._id,
                date: targetDate,
                difficulty: question.difficulty || 'Medium',
                type: type
            },
            { upsert: true, new: true }
        );

        challenge = await challenge.populate('questionId');

        res.json({
            message: `Daily ${type} challenge set successfully for ${targetDate.toDateString()}`,
            challenge
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDailyChallenge,
    submitChallenge,
    getStreakInfo,
    setManualDailyChallenge
};
