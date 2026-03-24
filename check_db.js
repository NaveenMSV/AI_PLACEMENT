const mongoose = require('mongoose');
const Question = require('./server/models/Question');
const Company = require('./server/models/Company');
require('dotenv').config({ path: './server/.env' });

async function checkQuestions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-placement');
        console.log('Connected to MongoDB');

        const companies = await Company.find({}, 'name _id');
        console.log(`Found ${companies.length} companies:`);

        for (const comp of companies) {
            const counts = await Question.aggregate([
                { $match: { companyId: comp._id } },
                { $group: { _id: '$roundType', count: { $sum: 1 } } }
            ]);
            console.log(`Company: ${comp.name} (${comp._id})`);
            if (counts.length === 0) {
                console.log('  No questions found.');
            } else {
                counts.forEach(c => console.log(`  - ${c._id}: ${c.count} questions`));
            }
        }

        const totalQuestions = await Question.countDocuments();
        console.log(`Total questions in database: ${totalQuestions}`);
        
        const noCompany = await Question.countDocuments({ companyId: null });
        console.log(`Questions with no companyId: ${noCompany}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkQuestions();
