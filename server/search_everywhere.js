const mongoose = require('mongoose');
require('dotenv').config();

async function search() {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017');
    const admin = new mongoose.mongo.Admin(conn.connection.db);
    const result = await admin.listDatabases();
    
    for (const dbInfo of result.databases) {
        if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
        
        try {
            const dbConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`).asPromise();
            const collections = await dbConn.db.listCollections().toArray();
            const qCol = collections.find(c => c.name === 'questions');
            
            if (qCol) {
                const count = await dbConn.collection('questions').countDocuments({});
                console.log(`Database: ${dbInfo.name} | Questions: ${count}`);
                if (count > 0) {
                    const sample = await dbConn.collection('questions').findOne({});
                    console.log(`Sample RoundType: ${sample.roundType}, QuestionType: ${sample.questionType}`);
                }
            } else {
                console.log(`Database: ${dbInfo.name} | No 'questions' collection found.`);
            }
            await dbConn.close();
        } catch (e) {
            console.log(`Error checking ${dbInfo.name}: ${e.message}`);
        }
    }
    process.exit(0);
}
search();
