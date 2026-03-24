const mongoose = require('mongoose');

async function totalCount() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Question = mongoose.model('Question', new mongoose.Schema({ companyId: mongoose.Schema.Types.Mixed }, { strict: false }));

        const total = await Question.countDocuments({});
        console.log(`Total questions in whole database: ${total}`);

        // Also check how many have NO companyId
        const noId = await Question.countDocuments({ companyId: { $exists: false } });
        console.log(`Questions with NO companyId: ${noId}`);

        // Questions with null companyId
        const nullId = await Question.countDocuments({ companyId: null });
        console.log(`Questions with NULL companyId: ${nullId}`);

        // Questions with truncated ID specifically
        const truncatedId = '69c1012d0bc0515';
        const truncatedCount = await Question.countDocuments({ companyId: truncatedId });
        console.log(`Questions still with truncated ID '${truncatedId}': ${truncatedCount}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

totalCount();
