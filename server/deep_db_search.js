const mongoose = require('mongoose');

async function deepSearch() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/admin');
        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        
        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            console.log(`\n>>> DB: ${dbName}`);
            const dbConn = mongoose.connection.useDb(dbName);
            const collections = await dbConn.db.listCollections().toArray();
            
            for (const coll of collections) {
                const count = await dbConn.collection(coll.name).countDocuments({ questionType: 'CODING' });
                if (count > 0) {
                    console.log(`[FOUND] Collection: ${coll.name} | Coding Questions: ${count}`);
                    const sample = await dbConn.collection(coll.name).findOne({ questionType: 'CODING' });
                    console.log(`Sample: ${sample.question.substring(0, 100)}...`);
                }
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deepSearch();
