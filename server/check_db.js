const mongoose = require('mongoose');
require('dotenv').config();

const CompanySchema = new mongoose.Schema({ name: String });
const QuestionSchema = new mongoose.Schema({ question: String, companyId: mongoose.Schema.Types.ObjectId, createdAt: Date, questionType: String });
const DailyChallengeSchema = new mongoose.Schema({ date: Date, questionId: mongoose.Schema.Types.ObjectId, type: String });

const Company = mongoose.model('CompanyDiag', CompanySchema, 'companies');
const Question = mongoose.model('QuestionDiag', QuestionSchema, 'questions');
const DailyChallenge = mongoose.model('DailyChallengeDiag', DailyChallengeSchema, 'dailychallenges');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const cp = await Company.findOne({ name: 'Coding Practice' });
        console.log('Coding Practice Company:', cp ? { id: cp._id, name: cp.name } : 'NOT FOUND');
        
        const latestQuestions = await Question.find({}).sort({ createdAt: -1 }).limit(5);
        console.log('Latest 5 Questions:', latestQuestions.map(q => ({ 
            text: q.question.substring(0, 30), 
            company: q.companyId, 
            type: q.questionType,
            created: q.createdAt 
        })));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayChallenge = await DailyChallenge.findOne({ date: today, type: 'CODING' });
        console.log('Today\'s Challenge for CODING:', todayChallenge ? { id: todayChallenge._id, qId: todayChallenge.questionId } : 'None set yet');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
