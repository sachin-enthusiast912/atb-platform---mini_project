const { spawn } = require('child_process');
const path = require('path');
const Execution = require('../models/Execution');
const TestCase = require('../models/TestCase');
const Bug = require('../models/Bug');
const emailService = require('./emailService');

class AutomationService {
  async executeTest(testCaseId, executionId, userId) {
    try {
      const testCase = await TestCase.findById(testCaseId);
      const execution = await Execution.findById(executionId);
      
      if (!testCase || !execution) {
        throw new Error('Test case or execution not found');
      }

      // Path to Python automation service
      const pythonScriptPath = path.join(__dirname, '../../automation-service/test_runner.py');
      
      // Spawn Python process
      const pythonProcess = spawn('python3', [
        pythonScriptPath,
        testCaseId,
        executionId
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[Automation] ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`[Automation Error] ${data}`);
      });

      pythonProcess.on('close', async (code) => {
        try {
          await this.handleTestCompletion(execution, testCase, output, errorOutput, code, userId);
        } catch (error) {
          console.error('Error handling test completion:', error);
        }
      });

      return { success: true, executionId };
      
    } catch (error) {
      console.error('Error executing test:', error);
      throw error;
    }
  }

  async handleTestCompletion(execution, testCase, output, errorOutput, exitCode, userId) {
    try {
      // Parse test result
      let testResult = {
        status: 'Failed',
        errorMessage: null,
        screenshot: null
      };

      if (exitCode === 0) {
        // Try to parse JSON result from output
        const resultMatch = output.match(/RESULT:(.+)/);
        if (resultMatch) {
          testResult = JSON.parse(resultMatch[1]);
        } else {
          testResult.status = 'Passed';
        }
      } else {
        testResult.errorMessage = errorOutput || 'Test execution failed';
      }

      // Update execution
      execution.status = testResult.status;
      execution.errorMessage = testResult.errorMessage;
      execution.screenshot = testResult.screenshot;
      execution.endTime = new Date();
      await execution.save();

      // Update test case statistics
      testCase.executionCount += 1;
      testCase.lastExecutedAt = new Date();
      testCase.lastExecutionStatus = testResult.status;
      
      if (testResult.status === 'Passed') {
        testCase.passCount += 1;
      } else if (testResult.status === 'Failed') {
        testCase.failCount += 1;
        
        // Auto-create bug
        const bug = await this.createBugFromFailure(testCase, execution, testResult, userId);
        
        // Send email notification
        await emailService.sendTestFailureNotification(execution, testCase, bug);
      }
      
      await testCase.save();

      console.log(`✅ Test execution completed: ${testResult.status}`);
      
    } catch (error) {
      console.error('Error in handleTestCompletion:', error);
    }
  }

  async createBugFromFailure(testCase, execution, testResult, userId) {
    try {
      const bug = await Bug.create({
        title: `Automated Test Failed: ${testCase.title}`,
        description: `Test case "${testCase.title}" failed during automated execution.\n\nError: ${testResult.errorMessage || 'Unknown error'}`,
        status: 'New',
        priority: testCase.priority || 'High',
        severity: 'Major',
        type: 'Functional',
        environment: execution.environment,
        browser: execution.browser,
        testCaseId: testCase._id,
        executionId: execution._id,
        reportedBy: userId,
        isAutomated: true,
        stepsToReproduce: testCase.steps.map(step => step.action),
        attachments: testResult.screenshot ? [{
          filename: `failure_${execution._id}.png`,
          url: testResult.screenshot,
          type: 'screenshot'
        }] : []
      });

      // Update execution with bug reference
      execution.bugCreated = true;
      execution.bugId = bug._id;
      await execution.save();

      console.log(`🐛 Bug auto-created: ${bug._id}`);
      
      return bug;
      
    } catch (error) {
      console.error('Error creating bug from failure:', error);
      return null;
    }
  }
}

module.exports = new AutomationService();