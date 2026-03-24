const mongoose = require('mongoose');

async function verifyTypes() {
    try {
        const mongoUri = 'mongodb://127.0.0.1:27017/placement_simulator';
        await mongoose.connect(mongoUri);
        
        // Use a generic model for checking types
        const Question = mongoose.model('Question', new mongoose.Schema({ 
            companyId: mongoose.Schema.Types.Mixed,
            question: String,
            roundType: String
        }, { strict: false }));

        const Company = mongoose.model('Company', new mongoose.Schema({ 
            name: String
        }, { strict: false }));

        const codingPractice = await Company.findOne({ name: 'Coding Practice' });
        console.log(`Coding Practice ID: ${codingPractice._id} (${typeof codingPractice._id})`);
        console.log(`Is ObjectId? ${codingPractice._id instanceof mongoose.Types.ObjectId}`);

        const sample = await Question.findOne({ companyId: codingPractice._id });
        if (sample) {
            console.log(`Sample Question CompanyId: ${sample.companyId} (${typeof sample.companyId})`);
            console.log(`Is ObjectId? ${sample.companyId instanceof mongoose.Types.ObjectId}`);
            console.log(`Question: ${sample.question.substring(0, 50)}...`);
            console.log(`Round: ${sample.roundType}`);
        } else {
            console.log("No questions found for the Coding Practice ID using direct match.");
            // Try matching with string
            const sampleStr = await Question.findOne({ companyId: codingPractice._id.toString() });
            if (sampleStr) {
                console.log("Found question using STRING companyId match!");
                console.log(`Sample Question CompanyId Type: ${typeof sampleStr.companyId}`);
            }
        }

        const total = await Question.countDocuments({ companyId: codingPractice._id });
        const totalStr = await Question.countDocuments({ companyId: codingPractice._id.toString() });
        console.log(`Count using ObjectId: ${total}`);
        console.log(`Count using String: ${totalStr}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verifyTypes();
