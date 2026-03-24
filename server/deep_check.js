const mongoose = require('mongoose');
require('dotenv').config();

async function deepCheck() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const coll = db.collection('questions');

        const q = await coll.findOne({ roundType: 'CODING' });
        if (q) {
            console.log('Microsoft CODING question keys:', Object.keys(q));
            for (const key in q) {
                console.log(`  - ${key}: value="${q[key]}", type=${typeof q[key]}, constructor=${q[key]?.constructor?.name}`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

deepCheck();
