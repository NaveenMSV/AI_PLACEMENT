const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function checkIndiumQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const company = await Company.findOne({ name: /indium tech/i });
        if (!company) {
            console.log('Company "indium tech" not found');
            process.exit(1);
        }

        console.log(`\nChecking indium tech (${company._id}):`);
        const questions = await Question.find({ companyId: company._id });
        console.log(`Total questions: ${questions.length}`);
        
        questions.forEach(q => {
            console.log(`- ID: ${q._id}, Type: ${q.questionType}, Round: ${q.roundType}, Text: ${q.question.substring(0, 50)}...`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkIndiumQuestions();
