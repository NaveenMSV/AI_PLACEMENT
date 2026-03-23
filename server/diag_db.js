const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');
const Question = require('./models/Question');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const cp = await Company.findOne({ name: 'Coding Practice' });
        console.log('Coding Practice ID:', cp ? cp._id : 'NOT FOUND');
        
        const latest = await Question.find()
            .sort({ createdAt: -1 })
            .limit(10);
            
        console.log('Latest 10 Questions:');
        latest.forEach(q => {
            console.log(`- Title: ${q.question.substring(0, 30)}..., CompanyID: ${q.companyId}, Created: ${q.createdAt}`);
        });
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
