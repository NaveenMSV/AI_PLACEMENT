const mongoose = require('mongoose');
const Company = require('./models/Company');
const Question = require('./models/Question');
const InterviewBlueprint = require('./models/InterviewBlueprint');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const company = await Company.findOne({ name: /zep/i });
        if (!company) {
            console.log('Company zep not found');
            process.exit();
        }
        console.log('Company:', { id: company._id, name: company.name, rounds: company.numberOfRounds });

        const blueprint = await InterviewBlueprint.findOne({ companyId: company._id });
        if (!blueprint) {
            console.log('No blueprint found for zep');
        } else {
            console.log('Blueprint Rounds:', blueprint.rounds.map(r => ({
                num: r.roundNumber,
                type: r.roundType,
                total: r.totalQuestions
            })));
        }

        const questions = await Question.find({ companyId: company._id });
        console.log('Questions Found:', questions.length);
        if (questions.length > 0) {
            const counts = {};
            questions.forEach(q => {
                const key = `Round ${q.roundNumber} - ${q.roundType}`;
                counts[key] = (counts[key] || 0) + 1;
            });
            console.log('Question Distribution:', counts);
            
            // Log first question details
            console.log('First Question Sample:', {
                id: questions[0]._id,
                roundType: questions[0].roundType,
                roundNumber: questions[0].roundNumber,
                questionType: questions[0].questionType
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
