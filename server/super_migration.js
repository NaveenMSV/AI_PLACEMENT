const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
const User = require('./models/User');
require('dotenv').config();

const uris = [
    'mongodb://127.0.0.1:27017/placement_simulator',
    'mongodb://127.0.0.1:27017/ai-placement'
];

const ADMIN_ID = new mongoose.Types.ObjectId('69ad818d3aa013c4173c6ed3');

async function migrateAll() {
    for (const uri of uris) {
        console.log(`\n>>> Migrating DB: ${uri}`);
        try {
            const conn = await mongoose.createConnection(uri).asPromise();
            const QModel = conn.model('Question', Question.schema);
            const CModel = conn.model('Company', Company.schema);
            const UModel = conn.model('User', User.schema);

            let cpCompany = await CModel.findOne({ name: 'Coding Practice' });
            let spCompany = await CModel.findOne({ name: 'SQL Practice' });
            
            if (!cpCompany) {
                cpCompany = await CModel.create({ 
                    name: 'Coding Practice',
                    description: 'Daily coding challenges to improve logic and programming skills.',
                    estimatedDuration: 60,
                    numberOfRounds: 1,
                    createdByAdmin: ADMIN_ID
                });
                console.log(`Created Coding Practice company in ${uri}`);
            }
            if (!spCompany) {
                spCompany = await CModel.create({ 
                    name: 'SQL Practice',
                    description: 'SQL queries and database practice challenges.',
                    estimatedDuration: 45,
                    numberOfRounds: 1,
                    createdByAdmin: ADMIN_ID
                });
                console.log(`Created SQL Practice company in ${uri}`);
            }

            // Cleanup empty duplicates (just in case they exist from previous failed attempts)
            const duplicates = await CModel.find({ name: { $in: ['Coding Practice', 'SQL Practice'] } });
            for (const d of duplicates) {
                const count = await QModel.countDocuments({ companyId: d._id });
                if (count === 0 && d._id.toString() !== cpCompany._id.toString() && d._id.toString() !== spCompany._id.toString()) {
                    await CModel.deleteOne({ _id: d._id });
                    console.log(`Deleted empty duplicate ${d.name} (${d._id})`);
                }
            }

            const unknownIds = ['69bb8fe32fc673d773893da2', '69bb93b98765a3189687c6ec', '69bb8fe02fc673d773893da2'];
            
            for (const id of unknownIds) {
                const oid = new mongoose.Types.ObjectId(id);
                
                // Migrate SQL questions
                const sqlRes = await QModel.updateMany(
                    { companyId: oid, $or: [{ questionType: 'SQL' }, { roundType: 'SQL' }] },
                    { $set: { companyId: spCompany._id, questionType: 'SQL', roundType: 'SQL' } }
                );
                if (sqlRes.modifiedCount > 0) console.log(`Migrated ${sqlRes.modifiedCount} SQL questions from ${id}`);

                // Migrate everything else to Coding Practice
                const codingRes = await QModel.updateMany(
                    { companyId: oid, questionType: { $ne: 'SQL' } },
                    { $set: { companyId: cpCompany._id, questionType: 'CODING', roundType: 'CODING' } }
                );
                if (codingRes.modifiedCount > 0) console.log(`Migrated ${codingRes.modifiedCount} Coding questions from ${id}`);
            }

            // Reset user challenge data
            const resetRes = await UModel.updateMany({}, { 
                $set: { 
                    currentChallengeId: null, 
                    isCurrentChallengePassed: false, 
                    currentSqlChallengeId: null, 
                    isCurrentSqlChallengePassed: false, 
                    lastChallengeDate: null 
                } 
            });
            console.log(`Reset challenge data for ${resetRes.modifiedCount} users in ${uri}`);

            await conn.close();
        } catch (err) {
            console.error(`Error migrating ${uri}: ${err.message}`);
        }
    }
    process.exit(0);
}

migrateAll();
