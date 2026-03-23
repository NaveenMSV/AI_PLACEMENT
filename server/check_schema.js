const mongoose = require('mongoose');
const Question = require('./models/Question');

const MONGO_URI = 'mongodb://127.0.0.1:27017/placement_simulator';

async function checkSchema() {
    try {
        await mongoose.connect(MONGO_URI);
        const types = await Question.distinct('questionType');
        console.log('Distinct questionTypes:', types);
        
        const sample = await Question.findOne();
        console.log('Sample question:', JSON.stringify(sample, null, 2));
        
        const coding = await Question.find({ questionType: 'CODING' }).limit(1);
        console.log('Sample CODING question:', JSON.stringify(coding, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
