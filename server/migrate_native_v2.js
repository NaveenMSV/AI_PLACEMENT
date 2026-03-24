const mongoose = require('mongoose');
require('dotenv').config();

async function migrateNativeV2() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        // Try both alias 'string' and type code 2
        const cursor = coll.find({ companyId: { $type: 2 } });
        const count = await coll.countDocuments({ companyId: { $type: 2 } });
        console.log(`Found ${count} questions with string companyId (type 2).`);

        let updated = 0;
        const questions = await cursor.toArray();
        for (const q of questions) {
            const val = q.companyId;
            if (typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)) {
                await coll.updateOne(
                    { _id: q._id },
                    { $set: { companyId: new mongoose.Types.ObjectId(val) } }
                );
                updated++;
            }
        }

        console.log(`Successfully migrated ${updated} questions.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Migration V2 error:', err);
    }
}

migrateNativeV2();
