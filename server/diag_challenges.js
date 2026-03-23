const mongoose = require('mongoose');
const DailyChallenge = require('./models/DailyChallenge');
const dotenv = require('dotenv');

dotenv.config();

async function checkDailyChallenges() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        const challenges = await DailyChallenge.find().sort({ date: -1 });
        console.log('--- Current Daily Challenges ---');
        challenges.forEach(c => {
            console.log(`[${c.type}] Date: ${c.date.toISOString().split('T')[0]}, QID: ${c.questionId}`);
        });
        
        // Count duplicates
        const pipeline = [
            { $group: { _id: { date: "$date", type: "$type" }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ];
        const duplicates = await DailyChallenge.aggregate(pipeline);
        console.log('Duplicates:', duplicates.length);

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

checkDailyChallenges();
