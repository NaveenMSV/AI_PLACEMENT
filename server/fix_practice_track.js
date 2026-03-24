const mongoose = require('mongoose');
const InterviewBlueprint = require('./models/InterviewBlueprint');
const Question = require('./models/Question');
require('dotenv').config();

async function fixPracticeTrack() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const practiceTrackId = '67e0e7cdcd60515173e5bf1d';
        const blueprint = await InterviewBlueprint.findOne({ companyId: practiceTrackId });

        if (blueprint) {
            console.log('Original Blueprint Rounds:', blueprint.rounds.map(r => `${r.roundNumber}:${r.roundType}`));
            
            // Fix duplicate round numbers and order
            blueprint.rounds = [
                { roundNumber: 1, roundType: 'APTITUDE', duration: 30, totalQuestions: 10 },
                { roundNumber: 2, roundType: 'TECHNICAL_INTERVIEW', duration: 30, totalQuestions: 5 },
                { roundNumber: 3, roundType: 'CODING', duration: 45, totalQuestions: 2 },
                { roundNumber: 4, roundType: 'SQL', duration: 30, totalQuestions: 5 }
            ];
            await blueprint.save();
            console.log('Updated Blueprint Rounds:', blueprint.rounds.map(r => `${r.roundNumber}:${r.roundType}`));
        }

        // Update questions roundNumber
        // CODING questions -> Round 3
        const codingRes = await Question.updateMany(
            { companyId: practiceTrackId, roundType: 'CODING' },
            { $set: { roundNumber: 3 } }
        );
        console.log(`Updated ${codingRes.modifiedCount} CODING questions to roundNumber: 3`);

        // SQL questions -> Round 4
        const sqlRes = await Question.updateMany(
            { companyId: practiceTrackId, roundType: 'SQL' },
            { $set: { roundNumber: 4 } }
        );
        console.log(`Updated ${sqlRes.modifiedCount} SQL questions to roundNumber: 4`);

        // Microsoft CODING questions -> Round 2 (matching its blueprint)
        const microsoftId = '67e0e7cdcd60515173e5bf11';
        const msRes = await Question.updateMany(
            { companyId: microsoftId, roundType: 'CODING' },
            { $set: { roundNumber: 2 } }
        );
        console.log(`Updated ${msRes.modifiedCount} Microsoft CODING questions to roundNumber: 2`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

fixPracticeTrack();
