require('dotenv').config();
const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');
const Question = require('./models/Question');

// Reimport the score calculation
const { calculateScore } = require('./services/resultEngineService');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected. Recalculating scores...');

    const completedAttempts = await TestAttempt.find({ status: 'COMPLETED' });
    console.log('Found ' + completedAttempts.length + ' completed attempts');

    for (const attempt of completedAttempts) {
        const rounds = await RoundAttempt.find({ attemptId: attempt._id });
        let totalScore = 0;
        let totalQuestions = 0;

        for (const round of rounds) {
            if (round.answers) {
                // Get the questions for this round
                const questions = await Question.find({ companyId: attempt.companyId, roundType: round.roundType });

                if (questions.length > 0) {
                    // Recalculate score 
                    const answersObj = round.answers instanceof Map ? Object.fromEntries(round.answers) : round.answers;
                    const result = calculateScore(answersObj, questions);
                    totalScore += result.score;
                    totalQuestions += result.total;

                    // Update round score
                    round.score = result.score;
                    await round.save();
                    console.log('  Round ' + round.roundNumber + ' (' + round.roundType + '): ' + result.correct + '/' + result.total + ' = ' + result.score + ' pts');
                }
            }
        }

        // Update attempt score as percentage
        const maxPoints = totalQuestions > 0 ? totalQuestions * 5 : 1;
        const scorePercent = totalQuestions > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;

        attempt.score = scorePercent;
        await attempt.save();
        console.log('Attempt ' + attempt._id + ': Total=' + totalScore + '/' + (totalQuestions * 5) + ' = ' + scorePercent + '%');
    }

    await mongoose.disconnect();
    console.log('Done recalculating scores!');
});
