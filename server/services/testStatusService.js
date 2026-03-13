const TestAttempt = require('../models/TestAttempt');
const RoundAttempt = require('../models/RoundAttempt');
const InterviewBlueprint = require('../models/InterviewBlueprint');
const Company = require('../models/Company');
const { finalizeTestAttempt } = require('./resultEngineService');

/**
 * Get the total number of rounds for a company
 */
const getCompanyTotalRounds = async (companyId) => {
    // 1. Try Blueprint
    const blueprint = await InterviewBlueprint.findOne({ companyId });
    if (blueprint && blueprint.rounds.length > 0) {
        return blueprint.rounds.length;
    }

    // 2. Try Company model field (legacy/fallback)
    const company = await Company.findById(companyId);

    // 3. Dynamic count from questions (matches publicController preview)
    const Question = require('../models/Question');
    const distinctRounds = await Question.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        { $group: { _id: { roundNumber: "$roundNumber", roundType: "$roundType" } } }
    ]);
    
    if (distinctRounds.length > 0) return distinctRounds.length;

    if (company && company.numberOfRounds) {
        return company.numberOfRounds;
    }

    // 3. Fallback
    return 1;
};

/**
 * Check if an attempt is logically finished and finalize it if so
 */
const checkAndFinalizeAttempt = async (attemptId) => {
    try {
        const attempt = await TestAttempt.findById(attemptId);
        if (!attempt || attempt.status !== 'IN_PROGRESS') return attempt;

        const totalRounds = await getCompanyTotalRounds(attempt.companyId);
        
        // Get completed round numbers
        const roundAttempts = await RoundAttempt.find({ attemptId, completed: true });
        const completedRoundNumbers = roundAttempts.map(ra => ra.roundNumber);
        const currentRound = completedRoundNumbers.length > 0 ? Math.max(...completedRoundNumbers) + 1 : 1;

        if (currentRound > totalRounds) {
            console.log(`[testStatusService] Auto-finalizing attempt ${attemptId} (${completedRoundNumbers.length}/${totalRounds} rounds done)`);
            const models = { TestAttempt, RoundAttempt };
            return await finalizeTestAttempt(attemptId, models);
        }

        return attempt;
    } catch (error) {
        console.error('[testStatusService] checkAndFinalizeAttempt error:', error);
        return null;
    }
};

module.exports = {
    getCompanyTotalRounds,
    checkAndFinalizeAttempt
};
