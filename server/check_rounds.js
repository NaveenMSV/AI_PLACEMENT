const mongoose = require('mongoose');
const RoundAttempt = require('./models/RoundAttempt');
const TestAttempt = require('./models/TestAttempt');
require('dotenv').config();

async function checkRoundAttempts() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const latestAttempts = await TestAttempt.find().sort({ createdAt: -1 }).limit(5);
        console.log(`Checking ${latestAttempts.length} latest test attempts:`);

        for (const ta of latestAttempts) {
            const rounds = await RoundAttempt.find({ attemptId: ta._id }).sort({ roundNumber: 1 });
            console.log(`TestAttempt: ${ta._id} (Status: ${ta.status})`);
            rounds.forEach(r => {
                console.log(`  - Round ${r.roundNumber}: ${r.roundType} (Completed: ${r.completed}, Score: ${r.score})`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkRoundAttempts();
