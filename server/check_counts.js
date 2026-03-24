const mongoose = require('mongoose');
require('dotenv').config();

async function checkCounts() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Company = mongoose.model('Company', new mongoose.Schema({ name: String }));
        const Question = mongoose.model('Question', new mongoose.Schema({ companyId: String }));

        const codingPractice = await Company.findOne({ name: /Coding Practice/i });
        const sqlPractice = await Company.findOne({ name: /SQL Practice/i });

        if (codingPractice) {
            const count = await Question.countDocuments({ companyId: codingPractice._id.toString() });
            console.log(`Coding Practice (${codingPractice._id}): ${count} questions`);
        } else {
            console.log('Coding Practice not found');
        }

        if (sqlPractice) {
            const count = await Question.countDocuments({ companyId: sqlPractice._id.toString() });
            console.log(`SQL Practice (${sqlPractice._id}): ${count} questions`);
        } else {
            console.log('SQL Practice not found');
        }

        const unknownCount = await Question.countDocuments({ companyId: '69c1012d0bc0515173e568f0' });
        console.log(`Unknown ID count: ${unknownCount}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkCounts();
