const mongoose = require('mongoose');
require('dotenv').config();

async function fixQuestions() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const Company = mongoose.model('Company', new mongoose.Schema({ name: String }));
        const Question = mongoose.model('Question', new mongoose.Schema({ companyId: String, roundType: String }));

        const codingPractice = await Company.findOne({ name: /Coding Practice/i });
        if (!codingPractice) {
            console.error('Coding Practice company not found');
            process.exit(1);
        }

        console.log(`Found Coding Practice company: ${codingPractice._id}`);

        const unknownId = '69c1012d0bc0515';
        const result = await Question.updateMany(
            { companyId: unknownId },
            { companyId: codingPractice._id.toString() }
        );

        console.log(`Updated ${result.modifiedCount} questions from ${unknownId} to ${codingPractice._id}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixQuestions();
