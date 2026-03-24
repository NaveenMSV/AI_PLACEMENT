const mongoose = require('mongoose');
require('dotenv').config();

async function checkRawCoding() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const qs = await coll.find({ roundType: /CODING/i }).toArray();
        console.log(`Found ${qs.length} questions matching /CODING/i`);

        qs.slice(0, 10).forEach(q => {
            console.log(`ID: ${q._id}, RoundType: "${q.roundType}", CompanyId: "${q.companyId}" (Type: ${typeof q.companyId})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkRawCoding();
