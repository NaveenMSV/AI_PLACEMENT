const mongoose = require('mongoose');
const Company = require('./models/Company');
const Question = require('./models/Question');
const InterviewBlueprint = require('./models/InterviewBlueprint');

const MONGO_URI = 'mongodb://127.0.0.1:27017/placement_simulator';

async function syncAll() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const companies = await Company.find({});
        console.log(`Checking ${companies.length} companies...`);

        for (const company of companies) {
            const companyId = company._id;
            const questionsCount = await Question.countDocuments({ companyId });

            if (questionsCount > 0) {
                console.log(`Syncing blueprint for ${company.name} (${questionsCount} questions)...`);
                
                const distinctRounds = await Question.aggregate([
                    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
                    { $group: { 
                        _id: { roundNumber: "$roundNumber", roundType: "$roundType" }, 
                        count: { $sum: 1 } 
                    } },
                    { $sort: { "_id.roundNumber": 1 } }
                ]);

                if (distinctRounds.length > 0) {
                    const blueprint = await InterviewBlueprint.findOne({ companyId });
                    const roundsData = distinctRounds.map(dr => {
                        const existingRound = blueprint?.rounds?.find(r => r.roundNumber === (dr._id.roundNumber || 1));
                        return {
                            roundNumber: dr._id.roundNumber || 1,
                            roundType: dr._id.roundType || 'MCQ',
                            duration: existingRound?.duration || 30,
                            totalQuestions: dr.count
                        };
                    });
                    
                    await InterviewBlueprint.findOneAndUpdate(
                        { companyId },
                        { $set: { rounds: roundsData } },
                        { upsert: true }
                    );
                    console.log(`  -> Synced ${roundsData.length} rounds.`);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
}

syncAll();
