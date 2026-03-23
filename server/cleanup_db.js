const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Company = require('./models/Company');
const Question = require('./models/Question');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');
const Leaderboard = require('./models/Leaderboard');
const WarningLog = require('./models/WarningLog');
const User = require('./models/User');

async function cleanup() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // 1. Delete Collections
        console.log('Deleting Company records...');
        await Company.deleteMany({});

        console.log('Deleting Question records...');
        await Question.deleteMany({});

        console.log('Deleting TestAttempt records...');
        await TestAttempt.deleteMany({});

        console.log('Deleting RoundAttempt records...');
        await RoundAttempt.deleteMany({});

        console.log('Deleting Leaderboard records...');
        await Leaderboard.deleteMany({});

        console.log('Deleting WarningLog records...');
        await WarningLog.deleteMany({});

        // 2. Reset Student Progress
        console.log('Resetting student progress flags...');
        await User.updateMany(
            { role: 'student' },
            {
                $set: {
                    enrolledCompanies: [],
                    totalAttempts: 0,
                    averageScore: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastChallengeDate: null,
                    currentChallengeId: null,
                    isCurrentChallengePassed: false,
                    currentSqlChallengeId: null,
                    isCurrentSqlChallengePassed: false
                }
            }
        );

        console.log('\n--- CLEANUP COMPLETE ---');
        const companyCount = await Company.countDocuments({});
        const questionCount = await Question.countDocuments({});
        const attemptCount = await TestAttempt.countDocuments({});
        
        console.log(`Companies: ${companyCount}`);
        console.log(`Questions: ${questionCount}`);
        console.log(`Test Attempts: ${attemptCount}`);

        process.exit(0);
    } catch (err) {
        console.error('FAIL:', err.message);
        process.exit(1);
    }
}

cleanup();
