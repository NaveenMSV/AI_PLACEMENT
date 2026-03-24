const mongoose = require('mongoose');
require('dotenv').config();

async function listColls() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_simulator');
        const db = mongoose.connection.db;
        const colls = await db.listCollections().toArray();
        colls.forEach(c => console.log(c.name));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listColls();
