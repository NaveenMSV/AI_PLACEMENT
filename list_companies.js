const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });

const Company = require('./server/models/Company');
const Question = require('./server/models/Question');
const TestAttempt = require('./server/models/TestAttempt');

async function listData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const companies = await Company.find({});
        console.log('--- COMPANIES ---');
        companies.forEach(c => {
            console.log(`ID: ${c._id}, Name: "${c.name}", CreatedAt: ${c.createdAt}`);
        });

        const attemptCount = await TestAttempt.countDocuments({});
        console.log(`\nTotal Test Attempts: ${attemptCount}`);

        const questionCount = await Question.countDocuments({});
        console.log(`Total Questions: ${questionCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listData();
