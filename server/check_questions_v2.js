const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function checkQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const total = await Question.countDocuments({});
        console.log(`Total questions in DB: ${total}`);

        const last10 = await Question.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('\nLast 10 questions:');
        last10.forEach(q => {
            console.log(`- ID: ${q._id}, Text: ${q.question?.substring(0, 30)}..., Type: ${q.questionType}, Round: ${q.roundType}, Company: ${q.companyId}`);
        });

        const sqlQuestions = await Question.find({ questionType: 'SQL' });
        console.log(`\nTotal SQL Questions: ${sqlQuestions.length}`);
        
        const sqlRoundQuestions = await Question.find({ roundType: 'SQL' });
        console.log(`Total questions with roundType "SQL": ${sqlRoundQuestions.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkQuestions();
