const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const blueprintColl = db.collection('interviewblueprints');
        const companyColl = db.collection('companies');

        const blueprints = await blueprintColl.find({}).toArray();
        console.log(`Found ${blueprints.length} blueprints:`);

        for (const bp of blueprints) {
            const company = await companyColl.findOne({ _id: bp.companyId });
            console.log(`Company: ${company ? company.name : 'Unknown'} (${bp.companyId})`);
            if (bp.rounds) {
                bp.rounds.forEach(r => {
                    console.log(`  - Round ${r.roundNumber}: ${r.roundType}`);
                });
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkCollections();
