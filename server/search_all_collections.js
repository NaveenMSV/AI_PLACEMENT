const mongoose = require('mongoose');

async function searchAll() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/admin');
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        
        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'config', 'local'].includes(dbName)) continue;
            
            console.log(`\n--- DB: ${dbName} ---`);
            const dbConn = mongoose.connection.useDb(dbName);
            const collections = await dbConn.db.listCollections().toArray();
            
            for (const coll of collections) {
                const count = await dbConn.collection(coll.name).countDocuments({});
                console.log(`Collection: ${coll.name} | Count: ${count}`);
                
                if (count > 0 && (coll.name.toLowerCase().includes('question') || coll.name.toLowerCase().includes('practice'))) {
                    const sample = await dbConn.collection(coll.name).findOne({});
                    console.log(`Sample: ${JSON.stringify(sample).substring(0, 150)}...`);
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

searchAll();
