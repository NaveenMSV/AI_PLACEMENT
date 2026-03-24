const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function testQuery() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const companyId = '67e0e7cdcd60515173e5bf11'; // Microsoft
        const roundType = 'CODING';

        console.log(`Querying for Company: ${companyId}, RoundType: ${roundType}`);
        
        // Try with String
        const q1 = await Question.find({ companyId, roundType });
        console.log(`Query with String companyId found: ${q1.length} questions`);

        // Try with ObjectId
        const q2 = await Question.find({ companyId: new mongoose.Types.ObjectId(companyId), roundType });
        console.log(`Query with ObjectId companyId found: ${q2.length} questions`);

        // Try without companyId to see if any coding questions exist
        const q3 = await Question.find({ roundType });
        console.log(`Query for all CODING questions found: ${q3.length} questions`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testQuery();
