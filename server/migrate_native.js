const mongoose = require('mongoose');
require('dotenv').config();

async function migrateNative() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const cursor = coll.find({ companyId: { $type: 'string' } });
        const count = await coll.countDocuments({ companyId: { $type: 'string' } });
        console.log(`Found ${count} questions with string companyId.`);

        let updated = 0;
        const questions = await cursor.toArray();
        for (const q of questions) {
            if (mongoose.Types.ObjectId.isValid(q.companyId)) {
                await coll.updateOne(
                    { _id: q._id },
                    { $set: { companyId: new mongoose.Types.ObjectId(q.companyId) } }
                );
                updated++;
            }
        }

        console.log(`Successfully migrated ${updated} questions using native driver.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Native migration error:', err);
    }
}

migrateNative();
