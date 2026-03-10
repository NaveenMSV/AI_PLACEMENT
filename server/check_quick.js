require('dotenv').config();
const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const all = await TestAttempt.find().sort({ createdAt: -1 }).limit(10);
    for (const a of all) {
        console.log('STATUS=' + a.status + ' SCORE=' + a.score + ' COMPANY=' + a.companyId + ' STUDENT=' + a.studentId);
    }
    await mongoose.disconnect();
});
