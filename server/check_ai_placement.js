const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function check() {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/ai-placement');
    console.log(`Connected to DB: ${conn.connection.name}`);
    const count = await Question.countDocuments({});
    console.log(`Total questions in ai-placement: ${count}`);
    
    const coding = await Question.countDocuments({ questionType: 'CODING' });
    console.log(`Coding questions: ${coding}`);
    
    process.exit(0);
}
check();
