const mongoose = require('mongoose');

async function listCollections() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in placement_simulator:");
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listCollections();
