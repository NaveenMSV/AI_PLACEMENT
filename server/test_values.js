const mongoose = require('mongoose');
const path = require('path');
const rootDir = 'c:/Users/Naveen M S V/OneDrive/Desktop/AI Placement management';
require('dotenv').config({ path: path.join(rootDir, 'server/.env') });
const User = require(path.join(rootDir, 'server/models/User'));
const { generateToken } = require(path.join(rootDir, 'server/utils/securityHelper'));

async function getToken() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin found');
            process.exit(1);
        }
        const token = generateToken(admin._id, admin.role);
        console.log('TOKEN:' + token);
        console.log('COMPANY_ID:' + (await require(path.join(rootDir, 'server/models/Company')).findOne())._id);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
getToken();
