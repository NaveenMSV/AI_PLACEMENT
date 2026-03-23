require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Question = require('./models/Question');
  const counts = await Question.aggregate([{ $group: { _id: '$questionType', count: { $sum: 1 } } }]);
  console.log('Aggregated by questionType:', counts);
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
