const mongoose = require('mongoose');
const Question = require('./models/Question');

const MONGO_URI = 'mongodb://127.0.0.1:27017/placement_simulator';

async function dumpQuestions() {
    try {
        await mongoose.connect(MONGO_URI);
        const codingQuestions = await Question.find({ questionType: 'CODING' });
        console.log(JSON.stringify(codingQuestions, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dumpQuestions();
