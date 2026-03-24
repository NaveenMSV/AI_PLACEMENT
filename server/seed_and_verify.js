const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');

async function seedAndVerify() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const codingPractice = await Company.findOne({ name: 'Coding Practice' });
        const sqlPractice = await Company.findOne({ name: 'SQL Practice' });

        if (!codingPractice || !sqlPractice) {
            console.error('Practice companies not found!');
            process.exit(1);
        }

        console.log(`Coding ID: ${codingPractice._id}`);
        console.log(`SQL ID: ${sqlPractice._id}`);

        // Clear existing
        await Question.deleteMany({ companyId: { $in: [codingPractice._id, sqlPractice._id] } });
        console.log('Cleared existing practice questions.');

        // Seed 2 sample coding
        const codingDocs = [
            {
                companyId: codingPractice._id,
                roundType: 'CODING',
                questionType: 'CODING',
                question: 'Test Coding 1',
                difficulty: 'Easy',
                testCases: [{ input: '1', expectedOutput: '1' }],
                boilerplates: {}
            },
            {
                companyId: codingPractice._id,
                roundType: 'CODING',
                questionType: 'CODING',
                question: 'Test Coding 2',
                difficulty: 'Medium',
                testCases: [{ input: '2', expectedOutput: '2' }],
                boilerplates: {}
            }
        ];

        // Seed 2 sample SQL
        const sqlDocs = [
            {
                companyId: sqlPractice._id,
                roundType: 'SQL',
                questionType: 'SQL',
                question: 'Test SQL 1',
                difficulty: 'Medium',
                correctAnswer: 'SELECT 1;',
                testCases: [{ input: 'schema', expectedOutput: 'SELECT 1;' }]
            },
            {
                companyId: sqlPractice._id,
                roundType: 'SQL',
                questionType: 'SQL',
                question: 'Test SQL 2',
                difficulty: 'Hard',
                correctAnswer: 'SELECT 2;',
                testCases: [{ input: 'schema', expectedOutput: 'SELECT 2;' }]
            }
        ];

        await Question.insertMany([...codingDocs, ...sqlDocs]);
        console.log('Inserted 4 test questions.');

        const count = await Question.countDocuments({ companyId: { $in: [codingPractice._id, sqlPractice._id] } });
        console.log(`Verification Count: ${count}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedAndVerify();
