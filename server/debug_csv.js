const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const { parseAndSeedCsv } = require('./services/csvParserService');
const Company = require('./models/Company');

async function test() {
    try {
        console.log('Connecting to DB:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        const company = await Company.findOne();
        if (!company) {
            console.error('No company found to test with');
            process.exit(1);
        }

        const filePath = path.join(__dirname, 'uploads/file-1772983762274.csv');
        console.log(`Processing ${filePath} for company ${company._id} (${company.name})`);

        if (!require('fs').existsSync(filePath)) {
            console.error('FILE DOES NOT EXIST:', filePath);
            process.exit(1);
        }

        const count = await parseAndSeedCsv(filePath, company._id);
        console.log('Success! count:', count);
        process.exit(0);
    } catch (error) {
        console.error('FAILED AT TEST LEVEL:', error);
        process.exit(1);
    }
}

test();
