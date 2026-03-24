const fs = require('fs');
const path = require('path');
const { parseAndSeedCsv } = require('./services/csvParserService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testCsvSeeding() {
    const testFilePath = path.join(__dirname, 'test_coding.csv');
    const csvContent = `Title,Question,Example,Test_Case,Test_Case_Expected_Output
"Reverse a binary tree","Given the root...","Input: root...","[1, 2, 3, 4, 5]","[5, 4, 3, 2, 1]"
"Reverse a binary tree","Given the root...","Input: root...","[]","[]"`;

    fs.writeFileSync(testFilePath, csvContent);

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const companyId = new mongoose.Types.ObjectId(); // Mock company
        const result = await parseAndSeedCsv(testFilePath, companyId, 1, 'CODING');
        
        console.log(`Seeded ${result.count} questions.`);
        
        if (result.count > 0) {
            const Question = require('./models/Question');
            const questions = await Question.find({ companyId });
            console.log('Seeded Questions:', JSON.stringify(questions, null, 2));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    }
}

testCsvSeeding();
