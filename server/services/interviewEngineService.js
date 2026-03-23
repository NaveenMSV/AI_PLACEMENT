const RoundAttempt = require('../models/RoundAttempt');
const InterviewBlueprint = require('../models/InterviewBlueprint');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');

const startTest = async (studentId, companyId) => {
    const attempt = await TestAttempt.create({
        studentId,
        companyId,
        status: 'IN_PROGRESS',
        startTime: new Date()
    });

    let blueprint = await InterviewBlueprint.findOne({ companyId });

    // If no blueprint, create a default one based on available questions
    if (!blueprint) {
        const uniqueRounds = await Question.distinct('roundType', { companyId });
        if (uniqueRounds.length > 0) {
            blueprint = await InterviewBlueprint.create({
                companyId,
                rounds: uniqueRounds.map((type, index) => ({
                    roundNumber: index + 1,
                    roundType: type,
                    duration: 30, // Default 30 mins
                    totalQuestions: 10, // Added missing required field
                    weight: Math.floor(100 / uniqueRounds.length)
                }))
            });
        }
    }

    if (blueprint && blueprint.rounds.length > 0) {
        const firstRound = blueprint.rounds.find(r => r.roundNumber === 1);
        if (firstRound) {
            await RoundAttempt.create({
                attemptId: attempt._id,
                roundNumber: 1,
                roundType: firstRound.roundType,
                status: 'IN_PROGRESS'
            });
        }
    } else {
        // Absolute fallback if no questions found either
        await RoundAttempt.create({
            attemptId: attempt._id,
            roundNumber: 1,
            roundType: 'APTITUDE',
            status: 'IN_PROGRESS'
        });
    }

    return attempt;
};

const getNextRound = async (attemptId, companyId, currentRoundNumber) => {
    const currentIteration = Number(currentRoundNumber);
    const nextRoundNumber = currentIteration + 1;
    const blueprint = await InterviewBlueprint.findOne({ companyId });

    if (!blueprint) return null;

    const nextRoundMeta = blueprint.rounds.find(r => r.roundNumber === nextRoundNumber);

    if (!nextRoundMeta) {
        // No more rounds
        return null;
    }

    // Create or return existing round attempt
    let roundAttempt = await RoundAttempt.findOne({ attemptId, roundNumber: nextRoundNumber });

    if (!roundAttempt) {
        roundAttempt = await RoundAttempt.create({
            attemptId,
            roundNumber: nextRoundNumber,
            roundType: nextRoundMeta.roundType
        });
    }

    return { roundAttempt, meta: nextRoundMeta };
};

const getRoundQuestions = async (companyId, roundType, roundNumber) => {
    // First try strict filtering by companyId + roundType + roundNumber
    if (roundNumber) {
        const questions = await Question.find({ companyId, roundType, roundNumber });
        if (questions.length > 0) return questions;
    }
    // Fallback: filter by companyId + roundType only (backward compat)
    const questions = await Question.find({ companyId, roundType });
    return questions;
};

const syncBlueprintWithRound = async (companyId, roundNumber, roundType) => {
    const num = Number(roundNumber);
    let blueprint = await InterviewBlueprint.findOne({ companyId });

    const roundData = {
        roundNumber: num,
        roundType: roundType.toUpperCase(),
        duration: 30, // Default
        totalQuestions: 10 // Default
    };

    if (!blueprint) {
        blueprint = await InterviewBlueprint.create({
            companyId,
            rounds: [roundData]
        });
    } else {
        const roundIndex = blueprint.rounds.findIndex(r => r.roundNumber === num);
        if (roundIndex !== -1) {
            blueprint.rounds[roundIndex].roundType = roundType.toUpperCase();
        } else {
            blueprint.rounds.push(roundData);
            blueprint.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
        }
        await blueprint.save();
    }
    return blueprint;
};

module.exports = { startTest, getNextRound, getRoundQuestions, syncBlueprintWithRound };
