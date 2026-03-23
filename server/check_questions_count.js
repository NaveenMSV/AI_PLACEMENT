const mongoose = require('mongoose');
const Question = require('./models/Question');

const MONGO_URI = 'mongodb://127.0.0.1:27017/placement_simulator';

async function checkQuestions() {
    try {
        await mongoose.connect(MONGO_URI);
        const count = await Question.countDocuments();
        console.log('Total questions:', count);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkQuestions();
