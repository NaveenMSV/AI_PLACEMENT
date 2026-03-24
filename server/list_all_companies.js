const mongoose = require('mongoose');
const Company = require('./models/Company');
require('dotenv').config();

async function check() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        const companies = await Company.find({});
        console.log('Registered Companies:');
        companies.forEach(c => {
            console.log(`- ${c.name}: ${c._id}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
