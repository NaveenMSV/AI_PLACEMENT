require('dotenv').config();
const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');
const Question = require('./models/Question');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Get the latest attempt
    const latest = await TestAttempt.findOne().sort({ createdAt: -1 });
    console.log('Latest Attempt: STATUS=' + latest.status + ' SCORE=' + latest.score);

    // Get round attempts
    const rounds = await RoundAttempt.find({ attemptId: latest._id });
    for (const r of rounds) {
        console.log('\nRound ' + r.roundNumber + ' (' + r.roundType + '): score=' + r.score + ' completed=' + r.completed);

        // Show answers
        if (r.answers) {
            const answerEntries = Object.entries(r.answers instanceof Map ? Object.fromEntries(r.answers) : r.answers);
            console.log('  Answers count: ' + answerEntries.length);
            for (const [qId, answer] of answerEntries.slice(0, 3)) {
                // Find the question
                const q = await Question.findById(qId);
                if (q) {
                    console.log('  Q: ' + q.question.substring(0, 50) + '...');
                    console.log('    Student: "' + answer + '" Correct: "' + q.correctAnswer + '"');
                    console.log('    Options: ' + q.options.join(' | '));
                    console.log('    RoundNumber on Q: ' + q.roundNumber);
                } else {
                    console.log('  Q ' + qId + ' NOT FOUND in DB!');
                }
            }
        }

        // Count questions for this company/round
        const qCount = await Question.countDocuments({ companyId: latest.companyId, roundType: r.roundType });
        const qCountWithRound = await Question.countDocuments({ companyId: latest.companyId, roundType: r.roundType, roundNumber: r.roundNumber });
        console.log('  Questions in DB (by roundType): ' + qCount + ', (by roundType+roundNumber): ' + qCountWithRound);
    }

    await mongoose.disconnect();
});
