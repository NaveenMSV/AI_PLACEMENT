const mongoose = require('mongoose');
require('dotenv').config();

async function fixFinalNative() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const microsoftId = new mongoose.Types.ObjectId('67e0e7cdcd60515173e5bf11');
        const practiceTrackId = new mongoose.Types.ObjectId('67e0e7cdcd60515173e5bf1d');

        // Update Microsoft CODING -> Round 2
        const res1 = await coll.updateMany(
            { companyId: microsoftId, roundType: 'CODING' },
            { $set: { roundNumber: 2 } }
        );
        console.log(`Microsoft CODING: Updated ${res1.modifiedCount} documents.`);

        // Update Practice Track CODING -> Round 3
        const res2 = await coll.updateMany(
            { companyId: practiceTrackId, roundType: 'CODING' },
            { $set: { roundNumber: 3 } }
        );
        console.log(`Practice Track CODING: Updated ${res2.modifiedCount} documents.`);

        // Update Practice Track SQL -> Round 4
        const res3 = await coll.updateMany(
            { companyId: practiceTrackId, roundType: 'SQL' },
            { $set: { roundNumber: 4 } }
        );
        console.log(`Practice Track SQL: Updated ${res3.modifiedCount} documents.`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

fixFinalNative();
