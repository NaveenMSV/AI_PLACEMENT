const mongoose = require('mongoose');
const Company = require('./models/Company');
const Question = require('./models/Question');
const InterviewBlueprint = require('./models/InterviewBlueprint');

const MONGO_URI = 'mongodb://127.0.0.1:27017/placement_simulator';

async function testPreview() {
    try {
        await mongoose.connect(MONGO_URI);
        const companyId = '69b25c9518aa72ddd794571a'; // logiii ID

        console.log('Testing Preview for ID:', companyId);

        const blueprint = await InterviewBlueprint.findOne({ companyId });
        console.log('Blueprint found:', !!blueprint);

        const questionsCount = await Question.countDocuments({ companyId });
        console.log('Questions count (simple):', questionsCount);

        const distinctRounds = await Question.aggregate([
            { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
            { $group: { 
                _id: { roundNumber: "$roundNumber", roundType: "$roundType" }, 
                count: { $sum: 1 } 
            } },
            { $sort: { "_id.roundNumber": 1 } }
        ]);

        console.log('Distinct Rounds from Aggregate:', JSON.stringify(distinctRounds, null, 2));

        const virtualRounds = distinctRounds.map(dr => ({
            roundNumber: dr._id.roundNumber || 1,
            roundType: dr._id.roundType || 'MCQ',
            duration: 30,
            totalQuestions: dr.count
        }));

        console.log('Virtual Rounds:', JSON.stringify(virtualRounds, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
}

testPreview();
