const mongoose = require('mongoose');
require('dotenv').config();

async function checkRawQuestions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const sample = await coll.findOne({ roundType: 'CODING' });
        if (sample) {
            console.log('Sample CODING question:');
            console.log('  _id type:', typeof sample._id, sample._id.constructor.name);
            console.log('  companyId type:', typeof sample.companyId, sample.companyId?.constructor?.name);
            console.log('  companyId value:', sample.companyId);
            console.log('  roundType:', sample.roundType);
            console.log('  roundNumber:', sample.roundNumber);
        } else {
            console.log('No CODING questions found.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkRawQuestions();
