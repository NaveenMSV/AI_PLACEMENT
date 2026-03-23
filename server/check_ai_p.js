const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function check() {
    await mongoose.connect('mongodb://127.0.0.1:27017/ai-placement');
    console.log('--- ai-placement DB ---');
    const companies = await Company.find();
    for (const c of companies) {
        const qCount = await Question.countDocuments({ companyId: c._id });
        console.log(`- "${c.name}" (${c._id}) | Questions: ${qCount}`);
    }
    process.exit(0);
}
check();
