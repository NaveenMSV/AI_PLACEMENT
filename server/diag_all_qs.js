const mongoose = require('mongoose');
const Company = require('./models/Company');
const Question = require('./models/Question');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        const questions = await Question.find({});
        const companies = await Company.find({});
        
        console.log('Total Questions:', questions.length);
        console.log('Total Companies:', companies.length);

        const companyMap = {};
        companies.forEach(c => {
            companyMap[c._id.toString()] = c.name;
        });

        const qByCompany = {};
        questions.forEach(q => {
            const cid = q.companyId?.toString() || 'NULL';
            const name = companyMap[cid] || 'UNKNOWN';
            const key = `${name} (${cid})`;
            qByCompany[key] = (qByCompany[key] || 0) + 1;
        });

        console.log('\nQuestion Distribution:');
        Object.entries(qByCompany).forEach(([key, count]) => {
            console.log(`- ${key}: ${count} questions`);
        });

        const zep = companies.find(c => c.name.toLowerCase().includes('zep'));
        if (zep) {
            console.log(`\nSpecific check for Zep: ID=${zep._id}`);
            const zepQs = await Question.find({ companyId: zep._id });
            console.log(`Zep Questions Count: ${zepQs.length}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
