const mongoose = require('mongoose');
const TestCase = require('./models/TestCase');

async function fixTest() {
  try {
    await mongoose.connect('mongodb://localhost:27017/qa_platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to DB');
    
    // ID from the user's logs
    const testId = '69bcf49db6ccab8e0a08f50c';
    const testCase = await TestCase.findById(testId);
    
    if (!testCase) {
      console.log('Test case not found');
      process.exit(1);
    }
    
    // Replace steps with perfect generic execution syntax
    testCase.steps = [
      {
        stepNumber: 1,
        action: 'NAVIGATE https://www.google.com',
        expectedResult: 'ASSERT_VISIBLE textarea[name="q"]'
      },
      {
        stepNumber: 2,
        action: 'TYPE textarea[name="q"] Selenium WebDriver',
        expectedResult: 'ASSERT_URL google'
      },
      {
        stepNumber: 3,
        action: 'WAIT 2',
        expectedResult: 'Text is entered visibly'
      },
      {
        stepNumber: 4,
        action: 'CLICK input[name="btnK"]',
        expectedResult: 'ASSERT_URL search'
      },
      {
        stepNumber: 5,
        action: 'WAIT 3',
        expectedResult: 'ASSERT_VISIBLE h3'
      }
    ];
    
    await testCase.save();
    console.log('Successfully updated test case with perfect syntax!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTest();
