require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Question = require('./models/Question');
  const codingQs = await Question.find({ testCases: { $exists: true, $not: {$size: 0} } });
  console.log('Questions with test cases:', codingQs.length);
  if (codingQs.length > 0) {
    console.log('Sample questionType of those with test cases:', codingQs[0].questionType);
  }
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
