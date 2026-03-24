const mongoose = require('mongoose');
require('dotenv').config();

async function migrateForce() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const allQs = await coll.find({}).toArray();
        console.log(`Scanning ${allQs.length} questions...`);

        let updated = 0;
        for (const q of allQs) {
            const val = q.companyId;
            if (val && typeof val === 'string' && mongoose.Types.ObjectId.isValid(val)) {
                const newId = new mongoose.Types.ObjectId(val);
                await coll.updateOne(
                    { _id: q._id },
                    { $set: { companyId: newId } }
                );
                updated++;
            }
        }

        console.log(`Force migration complete. Updated ${updated} questions.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Force migration error:', err);
    }
}

migrateForce();
