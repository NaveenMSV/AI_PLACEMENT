const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const questions = await Question.find({}).limit(150);
    console.log(`Checking ${questions.length} questions...`);
    
    questions.forEach(q => {
        if (q.companyId && q.companyId.toString() === '69bb8fe32fc673d773893da2') {
            console.log(`ID: ${q._id}, companyId: ${q.companyId}, Type: ${typeof q.companyId}, Constructor: ${q.companyId.constructor.name}`);
        }
    });
    process.exit(0);
}
check();
