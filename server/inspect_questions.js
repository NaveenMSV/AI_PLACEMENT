const mongoose = require('mongoose');
require('dotenv').config();

async function inspectQuestions() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Question = mongoose.model('Question', new mongoose.Schema({ 
            companyId: mongoose.Schema.Types.ObjectId,
            question: String,
            roundType: String,
            questionType: String
        }));

        const codingPracticeId = '69c1012d0bc0515173e568f0';
        
        const questions = await Question.find({ companyId: codingPracticeId }).limit(5);
        console.log(`Found ${questions.length} samples for Coding Practice:`);
        questions.forEach((q, i) => {
            console.log(`${i+1}. [${q.questionType}] ${q.question.substring(0, 50)}... (Round: ${q.roundType})`);
        });

        const total = await Question.countDocuments({ companyId: codingPracticeId });
        console.log(`Total questions for Coding Practice: ${total}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectQuestions();
