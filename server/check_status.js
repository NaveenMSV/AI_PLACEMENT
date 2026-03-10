require('dotenv').config();
const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const all = await TestAttempt.find().sort({ createdAt: -1 }).limit(10);
    console.log('=== Test Attempts ===');
    for (const a of all) {
        const rounds = await RoundAttempt.find({ attemptId: a._id });
        const completedRounds = rounds.filter(r => r.completed).length;
        const roundScores = rounds.map(r => 'R' + r.roundNumber + ':' + (r.score || 0) + (r.completed ? '(done)' : '(pending)'));
        console.log('ID=' + a._id + ' STATUS=' + a.status + ' SCORE=' + a.score + ' WARN=' + a.warningsCount + ' ROUNDS=' + completedRounds + '/' + rounds.length + ' ' + roundScores.join(','));
    }
    await mongoose.disconnect();
});
