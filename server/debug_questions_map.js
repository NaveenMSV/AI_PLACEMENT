const mongoose = require('mongoose');
const Company = require('./models/Company');
const Question = require('./models/Question');
const InterviewBlueprint = require('./models/InterviewBlueprint');

const MONGO_URI = 'mongodb://127.0.0.1:27017/placement_simulator';

async function debug() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const questions = await Question.find({});
        console.log(`Total Questions: ${questions.length}`);

        const companyMap = {};
        for (const q of questions) {
            const compId = q.companyId.toString();
            companyMap[compId] = (companyMap[compId] || 0) + 1;
        }

        console.log('Question Distribution by Company ID:');
        for (const [id, count] of Object.entries(companyMap)) {
            const company = await Company.findById(id);
            console.log(`ID: ${id} | Name: ${company ? company.name : 'UNKNOWN'} | Count: ${count}`);
        }

        const logiii = await Company.findOne({ name: 'logiii' });
        if (logiii) {
            console.log('\n--- logiii Details ---');
            console.log('ID:', logiii._id);
            const logiiiRounds = await Question.find({ companyId: logiii._id });
            console.log('Questions found for logiii:', logiiiRounds.length);
            
            const blueprint = await InterviewBlueprint.findOne({ companyId: logiii._id });
            console.log('Blueprint found:', !!blueprint);
            if (blueprint) console.log('Blueprint rounds count:', blueprint.rounds?.length);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
