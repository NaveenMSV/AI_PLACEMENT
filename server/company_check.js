const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const company = await Company.findOne({ name: 'Coding Practice' });
    if (!company) {
        console.log('Coding Practice company NOT FOUND');
        process.exit(0);
    }
    console.log(`Company ID: ${company._id}`);
    const questions = await Question.find({ companyId: company._id });
    console.log(`Questions found for this company: ${questions.length}`);
    if (questions.length > 0) {
        questions.forEach((q, i) => {
            console.log(`${i+1}. roundType: ${q.roundType}, questionType: ${q.questionType}, q: ${q.question.substring(0, 30)}...`);
        });
    }
    process.exit(0);
}
check();
