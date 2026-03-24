const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function checkQuestionCompany() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const uniqueCompanyIds = await Question.distinct('companyId');
        console.log('Unique companyIds in Questions:', uniqueCompanyIds);

        for (const id of uniqueCompanyIds) {
            const company = await Company.findById(id);
            const count = await Question.countDocuments({ companyId: id });
            console.log(`Company ID: ${id} -> Name: ${company ? company.name : 'MISMATCH'} (${count} questions)`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkQuestionCompany();
