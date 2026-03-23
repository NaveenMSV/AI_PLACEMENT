const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function checkSqlQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const sqlQuestions = await Question.find({ roundType: 'SQL' });
        console.log(`\nFound ${sqlQuestions.length} SQL questions.`);

        const companyIds = [...new Set(sqlQuestions.map(q => q.companyId?.toString()))];
        console.log(`Associated Company IDs: ${companyIds.join(', ') || 'None'}`);

        for (const id of companyIds) {
            if (id) {
                const company = await Company.findById(id);
                console.log(`- ID: ${id}, Name: ${company ? company.name : 'Unknown'}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSqlQuestions();
