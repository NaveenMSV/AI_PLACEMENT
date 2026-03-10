require('dotenv').config();
const mongoose = require('mongoose');
const TestAttempt = require('./models/TestAttempt');
const RoundAttempt = require('./models/RoundAttempt');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Group attempts by companyId + studentId
    const all = await TestAttempt.find().sort({ companyId: 1, createdAt: -1 });

    var currentKey = '';
    var dups = 0;
    for (const a of all) {
        var key = a.companyId + '_' + a.studentId;
        var marker = key === currentKey ? '  DUP>>> ' : '';
        if (key === currentKey) dups++;
        currentKey = key;

        var rounds = await RoundAttempt.find({ attemptId: a._id });
        var completedR = rounds.filter(function (r) { return r.completed; }).length;

        console.log(marker + 'COMPANY=' + a.companyId + ' STATUS=' + a.status + ' SCORE=' + a.score + ' ROUNDS=' + completedR + '/' + rounds.length + ' CREATED=' + a.createdAt.toISOString().substring(0, 19));
    }

    console.log('\nTotal duplicate entries: ' + dups);
    await mongoose.disconnect();
});
