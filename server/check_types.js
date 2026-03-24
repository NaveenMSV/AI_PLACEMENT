const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function checkRoundTypes() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const roundTypes = await Question.distinct('roundType');
        console.log('Unique Round Types in Questions:', roundTypes);

        const questionTypes = await Question.distinct('questionType');
        console.log('Unique Question Types in Questions:', questionTypes);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkRoundTypes();
