const mongoose = require('mongoose');

async function checkDups() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Company = mongoose.model('Company', new mongoose.Schema({ name: String }, { strict: false }));
        const companies = await Company.find({ name: { $regex: /Practice/i } });
        
        console.log("Matching companies:");
        companies.forEach(c => {
            console.log(`- ${c.name}: ${c._id}`);
        });

        const Question = mongoose.model('Question', new mongoose.Schema({ companyId: mongoose.Schema.Types.Mixed }, { strict: false }));
        const total = await Question.countDocuments({});
        console.log(`\nTotal questions in DB: ${total}`);

        const sample = await Question.findOne({});
        if (sample) {
            console.log(`Sample Question companyId: ${sample.companyId}`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDups();
