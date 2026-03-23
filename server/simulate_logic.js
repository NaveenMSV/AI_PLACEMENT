const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
const User = require('./models/User');
require('dotenv').config();

async function simulate(type = 'CODING') {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to DB: ${mongoose.connection.name}`);
    
    console.log('--- ALL COMPANIES ---');
    const all = await Company.find();
    all.forEach(c => console.log(`- "${c.name}"`));

    // Mimic challengeController.js logic
    const companyName = type === 'SQL' ? 'SQL Practice' : 'Coding Practice';
    const cpCompany = await Company.findOne({ name: companyName });
    
    console.log(`Looking for company: "${companyName}"`);
    if (cpCompany) {
        console.log(`Found company ID: ${cpCompany._id}`);
    } else {
        console.log('Company NOT FOUND');
    }

    let query = { questionType: type };
    if (cpCompany) {
        const cpCount = await Question.countDocuments({ ...query, companyId: cpCompany._id });
        console.log(`Questions for this company with type ${type}: ${cpCount}`);
        if (cpCount > 0) {
            query.companyId = cpCompany._id;
        }
    }
    
    console.log('Final Query:', JSON.stringify(query));
    const count = await Question.countDocuments(query);
    console.log(`Final Count: ${count}`);

    if (count > 0) {
        const random = Math.floor(Math.random() * count);
        const question = await Question.findOne(query).skip(random);
        console.log('Selected Question:', question.question.substring(0, 50));
    } else {
        console.log('RESULT: 404 would be returned');
    }

    process.exit(0);
}

simulate('CODING');
