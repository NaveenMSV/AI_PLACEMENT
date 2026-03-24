const mongoose = require('mongoose');
const Company = require('./models/Company');
const Question = require('./models/Question');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        const questions = await Question.find({});
        console.log('Total Questions:', questions.length);

        const companyIds = [...new Set(questions.map(q => q.companyId?.toString()))];
        console.log('Unique Company IDs in Questions:', companyIds);

        for (const id of companyIds) {
            if (!id) {
                console.log('Questions with NULL companyId:', questions.filter(q => !q.companyId).length);
                continue;
            }
            const company = await Company.findById(id);
            console.log(`- Company ID ${id}: ${company ? company.name : 'UNKNOWN'} (${questions.filter(q => q.companyId?.toString() === id).length} questions)`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
