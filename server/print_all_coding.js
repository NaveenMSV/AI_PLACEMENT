const mongoose = require('mongoose');
require('dotenv').config();

async function printAllCoding() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const qs = await coll.find({ roundType: /CODING/i }).toArray();
        console.log(`Found ${qs.length} questions.`);

        qs.forEach((q, i) => {
            console.log(`${i+1}. ID: ${q._id}, Company: "${q.companyId}", Type: "${q.roundType}", RoundNum: ${q.roundNumber}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

printAllCoding();
