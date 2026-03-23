const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function checkRecentQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const questions = await Question.find({}).sort({ createdAt: -1 }).limit(10).populate('companyId');
        console.log('\nLast 10 questions:');
        questions.forEach(q => {
            console.log(`- ID: ${q._id}, Text: ${q.question?.substring(0, 30)}..., Type: ${q.questionType}, Round: ${q.roundType}, Company: ${q.companyId?.name} (${q.companyId?._id})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRecentQuestions();
