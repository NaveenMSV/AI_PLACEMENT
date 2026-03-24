const mongoose = require('mongoose');
const InterviewBlueprint = require('./models/InterviewBlueprint');
require('dotenv').config();

async function checkBlueprints() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const blueprints = await InterviewBlueprint.find().populate('companyId', 'name');
        console.log(`Found ${blueprints.length} blueprints:`);

        for (const bp of blueprints) {
            if (!bp.companyId) {
                console.log(`Blueprint ${bp._id} has no associated company.`);
                continue;
            }
            console.log(`Company: ${bp.companyId.name} (${bp.companyId._id})`);
            if (bp.rounds && bp.rounds.length > 0) {
                bp.rounds.forEach(r => {
                    console.log(`  - Round ${r.roundNumber}: ${r.roundType} (${r.totalQuestions} questions)`);
                });
            } else {
                console.log('  No rounds defined in blueprint.');
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error in checkBlueprints:', err);
    }
}

checkBlueprints();
