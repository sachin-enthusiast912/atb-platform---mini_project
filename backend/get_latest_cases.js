const mongoose = require('mongoose');
const TestCase = require('./models/TestCase');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qa_platform')
  .then(async () => {
    const testcases = await TestCase.find({}).sort({createdAt: -1}).limit(5);
    console.log(JSON.stringify(testcases, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
