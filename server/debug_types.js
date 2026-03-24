const mongoose = require('mongoose');
require('dotenv').config();

async function debugTypes() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const qs = await coll.find({ roundType: 'CODING' }).toArray();
        console.log(`Found ${qs.length} CODING questions.`);

        for (const q of qs) {
            const type = typeof q.companyId;
            const constr = q.companyId?.constructor?.name;
            const val = q.companyId;
            console.log(`ID: ${q._id}, companyId: "${val}", type: ${type}, constr: ${constr}`);
            
            if (type === 'string' && mongoose.Types.ObjectId.isValid(val)) {
                console.log(`  Updating ${q._id} to ObjectId...`);
                const res = await coll.updateOne(
                    { _id: q._id },
                    { $set: { companyId: new mongoose.Types.ObjectId(val) } }
                );
                console.log(`  Update result: ${res.modifiedCount}`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

debugTypes();
