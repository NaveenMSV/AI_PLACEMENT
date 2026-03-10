const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/placement_simulator').then(async () => {
    const db = mongoose.connection.db;

    // Step 1: Get all attempts grouped by companyId
    const attempts = await db.collection('testattempts').find({}).sort({ createdAt: -1 }).toArray();

    // Group by companyId
    const groups = {};
    for (const a of attempts) {
        const key = String(a.companyId);
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
    }

    console.log('Company groups found:', Object.keys(groups).length);

    for (const [companyId, atts] of Object.entries(groups)) {
        console.log(`\nCompany ${companyId}: ${atts.length} attempts`);

        // Keep the latest attempt (first one since sorted desc)
        const keepAttempt = atts[0];
        const deleteIds = atts.slice(1).map(a => a._id);

        console.log(`  Keeping: ${keepAttempt._id} (status=${keepAttempt.status})`);
        console.log(`  Deleting: ${deleteIds.length} stale attempts`);

        // Delete stale attempts and their round attempts
        if (deleteIds.length > 0) {
            await db.collection('testattempts').deleteMany({ _id: { $in: deleteIds } });
            await db.collection('roundattempts').deleteMany({ attemptId: { $in: deleteIds } });
        }

        // Check if the kept attempt has completed round attempts
        const completedRounds = await db.collection('roundattempts').find({
            attemptId: keepAttempt._id,
            completed: true
        }).toArray();

        if (completedRounds.length > 0 && keepAttempt.status === 'IN_PROGRESS') {
            // This attempt has completed rounds - mark it as COMPLETED
            let totalScore = 0;
            completedRounds.forEach(r => totalScore += (r.score || 0));

            await db.collection('testattempts').updateOne(
                { _id: keepAttempt._id },
                { $set: { status: 'COMPLETED', endTime: new Date(), score: totalScore } }
            );
            console.log(`  Updated ${keepAttempt._id} to COMPLETED, score=${totalScore}`);
        } else if (completedRounds.length === 0 && keepAttempt.status === 'IN_PROGRESS') {
            // No completed rounds, just a stale attempt - delete it too
            await db.collection('testattempts').deleteOne({ _id: keepAttempt._id });
            await db.collection('roundattempts').deleteMany({ attemptId: keepAttempt._id });
            console.log(`  Deleted stale attempt ${keepAttempt._id} (no completed rounds)`);
        }
    }

    // Verify
    console.log('\n=== FINAL STATE ===');
    const remaining = await db.collection('testattempts').find({}).toArray();
    for (const a of remaining) {
        console.log(`${a._id}: status=${a.status}, score=${a.score}`);
    }

    process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
