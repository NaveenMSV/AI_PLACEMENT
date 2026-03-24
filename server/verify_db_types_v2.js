const mongoose = require('mongoose');

async function verify() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        const Company = mongoose.model('Company', new mongoose.Schema({ name: String }, { strict: false }));
        const Question = mongoose.model('Question', new mongoose.Schema({ companyId: mongoose.Schema.Types.Mixed }, { strict: false }));

        const codingPractice = await Company.findOne({ name: 'Coding Practice' });
        const sqlPractice = await Company.findOne({ name: 'SQL Practice' });

        console.log("Registered IDs:");
        console.log(`Coding Practice: ${codingPractice?._id} (${typeof codingPractice?._id})`);
        console.log(`SQL Practice: ${sqlPractice?._id} (${typeof sqlPractice?._id})`);

        const allQuestions = await Question.find({});
        console.log(`\nTotal questions in DB: ${allQuestions.length}`);

        const companyIds = [...new Set(allQuestions.map(q => q.companyId?.toString()))];
        console.log("\nCompany IDs found in Questions collection:");
        for (const id of companyIds) {
            const count = allQuestions.filter(q => q.companyId?.toString() === id).length;
            const company = await Company.findById(id);
            console.log(`- ${id}: ${count} questions (Company: ${company?.name || 'NOT FOUND'})`);
            
            // Check type of first match
            const firstMatch = allQuestions.find(q => q.companyId?.toString() === id);
            console.log(`  Type in DB: ${typeof firstMatch.companyId} (isObject: ${mongoose.Types.ObjectId.isValid(firstMatch.companyId)})`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verify();
