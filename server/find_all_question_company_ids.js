const mongoose = require('mongoose');

async function surveyIds() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Question = mongoose.model('Question', new mongoose.Schema({ 
            companyId: mongoose.Schema.Types.Mixed
        }, { strict: false }));

        const ids = await Question.aggregate([
            {
                $group: {
                    _id: "$companyId",
                    count: { $sum: 1 },
                    type: { $first: { $type: "$companyId" } }
                }
            }
        ]);

        console.log("Question distribution by companyId:");
        ids.forEach(id => {
            console.log(`- ID: ${id._id} (Count: ${id.count}, Type: ${id.type})`);
        });

        const Company = mongoose.model('Company', new mongoose.Schema({ name: String }, { strict: false }));
        const companies = await Company.find({});
        console.log("\nRegistered Companies:");
        companies.forEach(c => {
            console.log(`- ${c.name}: ${c._id} (Type: ${typeof c._id})`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

surveyIds();
