const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function migrateCompanyIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const questions = await Question.find({});
        console.log(`Checking ${questions.length} questions...`);

        let updatedCount = 0;
        for (const q of questions) {
            if (typeof q.companyId === 'string') {
                try {
                    q.companyId = new mongoose.Types.ObjectId(q.companyId);
                    await q.save();
                    updatedCount++;
                } catch (e) {
                    // Skip if not a valid ObjectId string
                    console.log(`Skipping invalid companyId string for question ${q._id}: ${q.companyId}`);
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} questions.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('Migration error:', err);
    }
}

migrateCompanyIds();
