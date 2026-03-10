require('dotenv').config();
const mongoose = require('mongoose');
const RoundAttempt = require('./models/RoundAttempt');
const Question = require('./models/Question');
const TestAttempt = require('./models/TestAttempt');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const latest = await TestAttempt.findOne().sort({ createdAt: -1 });
    const rounds = await RoundAttempt.find({ attemptId: latest._id });

    for (const round of rounds) {
        console.log('=== Round ' + round.roundNumber + ' (' + round.roundType + ') ===');

        if (!round.answers) {
            console.log('  No answers submitted');
            continue;
        }

        // Check if answers is a Map or Object
        console.log('  Answers type: ' + typeof round.answers);
        console.log('  Answers constructor: ' + round.answers.constructor.name);

        let answersObj;
        if (round.answers instanceof Map) {
            answersObj = Object.fromEntries(round.answers);
        } else if (round.answers.toJSON) {
            answersObj = round.answers.toJSON();
        } else {
            answersObj = round.answers;
        }

        const entries = Object.entries(answersObj);
        console.log('  Total answers: ' + entries.length);

        // Get all questions for this company/round
        const questions = await Question.find({ companyId: latest.companyId, roundType: round.roundType });
        console.log('  Questions in DB: ' + questions.length);

        // Show first 5 comparisons
        for (const [qId, studentAnswer] of entries.slice(0, 5)) {
            const q = questions.find(qq => qq._id.toString() === qId);
            if (q) {
                console.log('  ---');
                console.log('  QID: ' + qId);
                console.log('  Student answer: "' + studentAnswer + '" (type: ' + typeof studentAnswer + ')');
                console.log('  Correct answer: "' + q.correctAnswer + '"');
                console.log('  Options: ' + JSON.stringify(q.options));

                // Try the same logic as calculateScore
                const studentStr = String(studentAnswer).trim().toLowerCase();
                let correctStr = String(q.correctAnswer).trim().toLowerCase();
                if (/^[a-d]$/i.test(q.correctAnswer.trim()) && q.options && q.options.length > 0) {
                    const letterIndex = q.correctAnswer.trim().toUpperCase().charCodeAt(0) - 65;
                    if (letterIndex >= 0 && letterIndex < q.options.length) {
                        correctStr = q.options[letterIndex].trim().toLowerCase();
                    }
                }
                console.log('  After transform - student: "' + studentStr + '" correct: "' + correctStr + '"');
                console.log('  MATCH: ' + (studentStr === correctStr));
            } else {
                console.log('  QID ' + qId + ' NOT FOUND in questions list');
            }
        }
    }

    await mongoose.disconnect();
});
