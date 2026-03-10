// Script to fix stale IN_PROGRESS attempts and recalculate scores
require('dotenv').config();
const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator';

async function fixStaleAttempts() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all IN_PROGRESS attempts
    const staleAttempts = await TestAttempt.find({ status: 'IN_PROGRESS' });
    console.log(`Found ${staleAttempts.length} IN_PROGRESS attempts`);

    for (const attempt of staleAttempts) {
        const rounds = await RoundAttempt.find({ attemptId: attempt._id });
        const completedRounds = rounds.filter(r => r.completed);

        console.log(`\nAttempt ${attempt._id}:`);
        console.log(`  Company: ${attempt.companyId}`);
        console.log(`  Total rounds: ${rounds.length}, Completed: ${completedRounds.length}`);

        // If ALL rounds are completed, mark the attempt as COMPLETED
        if (rounds.length > 0 && completedRounds.length === rounds.length) {
            let totalScore = 0;
            let totalQuestions = 0;
            completedRounds.forEach(ra => {
                totalScore += (ra.score || 0);
                if (ra.answers && typeof ra.answers === 'object') {
                    totalQuestions += Object.keys(ra.answers).length;
                }
            });

            const maxPoints = totalQuestions > 0 ? totalQuestions * 5 : 1;
            const scorePercent = totalQuestions > 0 ? Math.round((totalScore / maxPoints) * 100) : totalScore;

            attempt.status = 'COMPLETED';
            attempt.endTime = new Date();
            attempt.score = scorePercent;
            await attempt.save();
            console.log(`  ✅ Fixed: COMPLETED with score ${scorePercent}%`);
        } else if (completedRounds.length > 0) {
            console.log(`  ⏳ Partially completed (${completedRounds.length}/${rounds.length} rounds) - keeping IN_PROGRESS`);
        } else {
            console.log(`  ❌ No completed rounds - keeping IN_PROGRESS`);
        }
    }

    // Also show all attempts and their statuses
    const allAttempts = await TestAttempt.find().sort({ createdAt: -1 }).limit(20);
    console.log('\n--- Latest 20 attempts ---');
    for (const a of allAttempts) {
        const roundCount = await RoundAttempt.countDocuments({ attemptId: a._id });
        const completedCount = await RoundAttempt.countDocuments({ attemptId: a._id, completed: true });
        console.log(`${a._id} | Company: ${a.companyId} | Status: ${a.status} | Score: ${a.score} | Rounds: ${completedCount}/${roundCount}`);
    }

    await mongoose.disconnect();
    console.log('\nDone!');
}

fixStaleAttempts().catch(console.error);
