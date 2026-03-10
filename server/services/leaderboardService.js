const Leaderboard = require('../models/Leaderboard');

const updateLeaderboard = async (companyId, studentId, score, timeTaken) => {
    try {
        // Upsert the student score if it's better than their previous one
        // In our case, a student only has one attempt, so we just upsert
        await Leaderboard.findOneAndUpdate(
            { companyId, studentId },
            { score, timeTaken },
            { upsert: true, new: true }
        );

        // Recalculate ranks for this company
        const competitors = await Leaderboard.find({ companyId })
            .sort({ score: -1, timeTaken: 1 }); // Higher score first, then lower time

        // Bulk update the new ranks
        const bulkOps = competitors.map((competitor, index) => ({
            updateOne: {
                filter: { _id: competitor._id },
                update: { $set: { rank: index + 1 } }
            }
        }));

        if (bulkOps.length > 0) {
            await Leaderboard.bulkWrite(bulkOps);
        }

    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
};

module.exports = { updateLeaderboard };
