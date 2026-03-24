const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');
const Question = require('./models/Question');
require('dotenv').config();

async function testAdminReviewLogic() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        // Get a latest attempt
        const attempt = await TestAttempt.findOne().sort({ createdAt: -1 });
        if (!attempt) return console.log('No attempts found');

        const roundAttempts = await RoundAttempt.find({ attemptId: attempt._id }).lean();
        
        console.log(`Processing ${roundAttempts.length} rounds for attempt ${attempt._id}`);

        const enrichedRounds = await Promise.all(roundAttempts.map(async (ra) => {
            const answerMap = ra.answers || {};
            const questionIds = Object.keys(answerMap);
            console.log(`Round ${ra.roundNumber} (${ra.roundType}) has ${questionIds.length} answers.`);

            const dbQuestions = await Question.find({ _id: { $in: questionIds.filter(id => mongoose.Types.ObjectId.isValid(id) || id === 'default') } }).lean();
            console.log(`  Found ${dbQuestions.length} matching questions in DB.`);

            const dbQMap = {};
            dbQuestions.forEach(q => dbQMap[q._id.toString()] = q);

            const allQuestions = questionIds.map(id => {
                if (dbQMap[id]) return dbQMap[id];
                return {
                    _id: id,
                    question: id === 'default' ? "General/Introductory Question" : `Question (ID: ${id})`,
                    roundType: ra.roundType,
                    isVirtual: true
                };
            });

            console.log(`  Total synthesized questions: ${allQuestions.length}`);
            return { ...ra, questions: allQuestions };
        }));

        enrichedRounds.forEach(r => {
            if (r.questions.length > 0) {
                console.log(`Round ${r.roundNumber} finalized questions:`, r.questions.map(q => q._id));
            }
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testAdminReviewLogic();
