const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const rootDir = 'c:\\Users\\Naveen M S V\\OneDrive\\Desktop\\AI Placement management';
const serverDir = path.join(rootDir, 'server');
const envPath = path.join(serverDir, '.env');

require('dotenv').config({ path: envPath });

const Company = require(path.join(serverDir, 'models/Company'));
const Question = require(path.join(serverDir, 'models/Question'));
const TestAttempt = require(path.join(serverDir, 'models/TestAttempt'));

async function listData() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const companies = await Company.find({});
        console.log('\n--- COMPANIES ---');
        companies.forEach(c => {
            console.log(`ID: ${c._id}, Name: "${c.name}", CreatedAt: ${c.createdAt}`);
        });

        const attemptCount = await TestAttempt.countDocuments({});
        console.log(`\nTotal Test Attempts: ${attemptCount}`);
        
        const testAttempts = await TestAttempt.find({}).limit(10);
        console.log('Recent Attempts:');
        testAttempts.forEach(a => console.log(`Attempt ID: ${a._id}, User: ${a.studentId || a.userId}, Status: ${a.status}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listData();
