const mongoose = require('mongoose');
const Question = require('./models/Question');
const Company = require('./models/Company');
require('dotenv').config();

async function checkAllCoding() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const codingQs = await Question.find({ roundType: 'CODING' }).lean();
        console.log(`Found ${codingQs.length} CODING questions.`);

        const companies = await Company.find().lean();
        const companyMap = {};
        companies.forEach(c => companyMap[c._id.toString()] = c.name);

        console.log('\nDistribution:');
        const stats = {};
        codingQs.forEach(q => {
            const cid = q.companyId?.toString();
            const cname = companyMap[cid] || 'UNKNOWN';
            stats[cid] = stats[cid] || { name: cname, count: 0 };
            stats[cid].count++;
        });

        for (const cid in stats) {
            console.log(` - Company: ${stats[cid].name} (${cid}) -> ${stats[cid].count} questions`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkAllCoding();
