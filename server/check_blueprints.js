const mongoose = require('mongoose');
const Company = require('./models/Company');
const InterviewBlueprint = require('./models/InterviewBlueprint');
const Question = require('./models/Question');
require('dotenv').config();

async function checkBlueprints() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const companies = await Company.find({});
        console.log(`\nCompanies (${companies.length}):`);
        for (const company of companies) {
            const blueprint = await InterviewBlueprint.findOne({ companyId: company._id });
            const sqlCount = await Question.countDocuments({ companyId: company._id, roundType: 'SQL' });
            console.log(`- ${company.name} (${company._id}): Rounds: ${blueprint ? blueprint.rounds.map(r => r.roundType).join(', ') : 'None'}, SQL Questions: ${sqlCount}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBlueprints();
