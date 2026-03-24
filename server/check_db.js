const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function checkQuestions() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
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

        // Check specifically for CODING questions
        const codingQuestions = await Question.find({ roundType: 'CODING' }).limit(5);
        if (codingQuestions.length > 0) {
            console.log('\nSample CODING questions:');
            codingQuestions.forEach(q => {
                console.log(` - [${q.companyId}] Round: ${q.roundNumber}, Type: ${q.questionType}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkQuestions();
