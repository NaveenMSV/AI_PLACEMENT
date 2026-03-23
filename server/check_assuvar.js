const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/assuvar';

async function checkAssuvar() {
    console.log(`\nChecking DB: ${uri}`);
    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        const collections = await conn.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        for (const coll of collections) {
            const Model = conn.model(coll.name, new mongoose.Schema({}, { strict: false }), coll.name);
            const count = await Model.countDocuments({});
            console.log(`Collection ${coll.name} Count: ${count}`);
            
            if (count > 0 && (coll.name.toLowerCase().includes('question'))) {
               const sample = await Model.findOne({});
               console.log(`Sample from ${coll.name}: ${JSON.stringify(sample).substring(0, 100)}...`);
            }
        }
        
        await conn.close();
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
    process.exit(0);
}

checkAssuvar();
