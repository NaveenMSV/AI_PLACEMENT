const mongoose = require('mongoose');
require('dotenv').config();

async function checkZep() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Question = mongoose.model('Question', new mongoose.Schema({ companyId: String }));
        const zepId = '69c11543cfedd1e914407a31';
        
        const count = await Question.countDocuments({ companyId: zepId });
        console.log(`Zep (${zepId}): ${count} questions`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkZep();
