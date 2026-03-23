const mongoose = require('mongoose');

const uris = [
    'mongodb://127.0.0.1:27017/placement_simulator',
    'mongodb://127.0.0.1:27017/ai-placement'
];

async function checkDbs() {
    for (const uri of uris) {
        console.log(`\nChecking DB: ${uri}`);
        try {
            const conn = await mongoose.createConnection(uri).asPromise();
            const collections = await conn.db.listCollections().toArray();
            console.log('Collections:', collections.map(c => c.name));
            
            const QModel = conn.model('Question', new mongoose.Schema({}, { strict: false }));
            const count = await QModel.countDocuments({});
            console.log(`Total Questions: ${count}`);
            
            if (count > 0) {
                const codingCount = await QModel.countDocuments({ questionType: 'CODING' });
                const sqlCount = await QModel.countDocuments({ questionType: 'SQL' });
                console.log(`- Coding: ${codingCount}`);
                console.log(`- SQL: ${sqlCount}`);
                
                const sample = await QModel.findOne({ questionType: 'CODING' });
                if (sample) {
                    console.log(`Sample Question: ${sample.question.substring(0, 50)}...`);
                }
            }
            
            await conn.close();
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }
    }
    process.exit(0);
}

checkDbs();
