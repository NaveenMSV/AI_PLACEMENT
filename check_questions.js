const mongoose = require('mongoose');
const Question = require('./server/models/Question');
require('dotenv').config({ path: './server/.env' });

async function checkQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const questions = await Question.find({}).sort({ createdAt: -1 }).limit(10);
        console.log('Last 10 questions:');
        questions.forEach(q => {
            console.log(`- ID: ${q._id}, Text: ${q.question.substring(0, 30)}..., Type: ${q.questionType}, Round: ${q.roundType}, Company: ${q.companyId}`);
        });

        const sqlQuestions = await Question.find({ questionType: 'SQL' });
        console.log(`\nTotal SQL Questions: ${sqlQuestions.length}`);
        
        const codingQuestions = await Question.find({ questionType: 'CODING' });
        console.log(`Total CODING Questions: ${codingQuestions.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkQuestions();
