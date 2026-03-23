const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Company = require('./models/Company');
const TestAttempt = require('./models/TestAttempt');
const Question = require('./models/Question');
const RoundAttempt = require('./models/RoundAttempt');
const Leaderboard = require('./models/Leaderboard');

async function listData() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator';
        console.log(`Connecting to ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const companies = await Company.find({});
        console.log('\n--- COMPANIES ---');
        companies.forEach(c => {
            console.log(`ID: ${c._id}, Name: "${c.name}", CreatedAt: ${c.createdAt}`);
        });

        const attemptCount = await TestAttempt.countDocuments({});
        console.log(`\nTotal Test Attempts: ${attemptCount}`);
        
        process.exit(0);
    } catch (err) {
        console.error('FAIL:', err.message);
        process.exit(1);
    }
}

listData();
