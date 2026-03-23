const mongoose = require('mongoose');
require('dotenv').config();

async function listDbs() {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017');
    const admin = new mongoose.mongo.Admin(conn.connection.db);
    const result = await admin.listDatabases();
    console.log('--- DATABASES ---');
    result.databases.forEach(db => console.log(`- ${db.name}`));
    process.exit(0);
}
listDbs();
