const Execution = require('../models/Execution');
const TestCase = require('../models/TestCase');
const Bug = require('../models/Bug');
const emailService = require('../services/emailService');

class AutomationController {
  // Handle automation webhook/callback from Python service
  async handleAutomationResult(req, res) {
    try {
      const { executionId, status, errorMessage, screenshot, duration, stepResults } = req.body;

      if (!executionId) {
        return res.status(400).json({
          success: false,
          error: 'Execution ID is required'
        });
      }

      // Find execution
      const execution = await Execution.findById(executionId);
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
      }

      // Update execution
      execution.status = status || 'Completed';
      execution.errorMessage = errorMessage;
      execution.screenshot = screenshot;
      execution.endTime = new Date();
      
      if (duration) {
        execution.duration = duration;
      }
      
      if (stepResults && Array.isArray(stepResults)) {
        execution.stepResults = stepResults;
      }

      await execution.save();

      // Update test case statistics
      const testCase = await TestCase.findById(execution.testCaseId);
      if (testCase) {
        testCase.executionCount += 1;
        testCase.lastExecutedAt = new Date();
        testCase.lastExecutionStatus = status;

        if (status === 'Passed') {
          testCase.passCount += 1;
        } else if (status === 'Failed') {
          testCase.failCount += 1;

          // Auto-create bug on failure
          const bug = await this.createBugFromFailure(testCase, execution, errorMessage, screenshot);
          
          if (bug) {
            execution.bugCreated = true;
            execution.bugId = bug._id;
            await execution.save();

            // Send email notification
            try {
              await emailService.sendTestFailureNotification(execution, testCase, bug);
            } catch (emailError) {
              console.error('Email notification failed:', emailError);
            }
          }
        }

        await testCase.save();
      }

      res.json({
        success: true,
        message: 'Automation result processed successfully',
        execution: {
          id: execution._id,
          status: execution.status,
          bugCreated: execution.bugCreated
        }
      });

    } catch (error) {
      console.error('Handle automation result error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error processing automation result'
      });
    }
  }

  // Auto-create bug from test failure
  async createBugFromFailure(testCase, execution, errorMessage, screenshot) {
    try {
      const bug = await Bug.create({
        title: `[AUTO] Test Failed: ${testCase.title}`,
        description: `Automated test "${testCase.title}" failed during execution.
        
**Execution Details:**
- Execution ID: ${execution._id}
- Environment: ${execution.environment}
- Browser: ${execution.browser || 'N/A'}
- Triggered By: ${execution.triggerSource}

**Error Message:**
${errorMessage || 'No error message available'}

**Test Steps:**
${testCase.steps.map((step, idx) => `${idx + 1}. ${step.action}`).join('\n')}`,
        status: 'New',
        priority: this.determinePriority(testCase.priority),
        severity: 'Major',
        type: testCase.category === 'API' ? 'API' : 'Functional',
        environment: execution.environment,
        browser: execution.browser,
        testCaseId: testCase._id,
        executionId: execution._id,
        reportedBy: execution.triggeredBy,
        isAutomated: true,
        stepsToReproduce: testCase.steps.map(step => step.action),
        actualBehavior: errorMessage || 'Test execution failed',
        expectedBehavior: testCase.steps.map(step => step.expectedResult).join('; '),
        tags: ['automated', 'test-failure', ...(testCase.tags || [])],
        attachments: screenshot ? [{
          filename: `failure_${execution._id}.png`,
          url: screenshot,
          type: 'screenshot',
          uploadedAt: new Date()
        }] : []
      });

      console.log(`✅ Bug auto-created from test failure: ${bug._id}`);
      return bug;

    } catch (error) {
      console.error('Error creating bug from failure:', error);
      return null;
    }
  }

  // Determine bug priority based on test case priority
  determinePriority(testPriority) {
    const priorityMap = {
      'Critical': 'Critical',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low'
    };
    return priorityMap[testPriority] || 'Medium';
  }

  // Get automation statistics
  async getAutomationStats(req, res) {
    try {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Total automated executions
      const totalExecutions = await Execution.countDocuments({
        executionType: 'Automated',
        createdAt: { $gte: startDate }
      });

      // Execution results breakdown
      const executionsByStatus = await Execution.aggregate([
        {
          $match: {
            executionType: 'Automated',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate pass rate
      const passed = executionsByStatus.find(e => e._id === 'Passed')?.count || 0;
      const failed = executionsByStatus.find(e => e._id === 'Failed')?.count || 0;
      const total = passed + failed;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

      // Bugs created by automation
      const autoCreatedBugs = await Bug.countDocuments({
        isAutomated: true,
        createdAt: { $gte: startDate }
      });

      // Average execution duration
      const avgDuration = await Execution.aggregate([
        {
          $match: {
            executionType: 'Automated',
            status: { $in: ['Passed', 'Failed'] },
            duration: { $gt: 0 },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' }
          }
        }
      ]);

      // Most failed tests
      const mostFailedTests = await Execution.aggregate([
        {
          $match: {
            executionType: 'Automated',
            status: 'Failed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$testCaseId',
            failCount: { $sum: 1 }
          }
        },
        {
          $sort: { failCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'testcases',
            localField: '_id',
            foreignField: '_id',
            as: 'testCase'
          }
        },
        {
          $unwind: '$testCase'
        },
        {
          $project: {
            testCaseId: '$_id',
            title: '$testCase.title',
            category: '$testCase.category',
            failCount: 1
          }
        }
      ]);

      res.json({
        success: true,
        stats: {
          period: `Last ${days} days`,
          totalExecutions,
          executionsByStatus,
          passRate: parseFloat(passRate),
          autoCreatedBugs,
          averageDuration: avgDuration[0]?.avgDuration?.toFixed(2) || 0,
          mostFailedTests
        }
      });

    } catch (error) {
      console.error('Get automation stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error fetching automation statistics'
      });
    }
  }

  // Trigger batch execution
  async triggerBatchExecution(req, res) {
    try {
      const { testCaseIds, environment, browser } = req.body;

      if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Test case IDs array is required'
        });
      }

      const executions = [];

      for (const testCaseId of testCaseIds) {
        const testCase = await TestCase.findById(testCaseId);
        
        if (!testCase) {
          console.warn(`Test case ${testCaseId} not found, skipping...`);
          continue;
        }

        if (!testCase.isAutomated) {
          console.warn(`Test case ${testCaseId} is not automated, skipping...`);
          continue;
        }

        // Create execution record
        const execution = await Execution.create({
          testCaseId,
          executionType: 'Automated',
          status: 'Pending',
          triggeredBy: req.user._id,
          triggerSource: 'API',
          environment: environment || 'Testing',
          browser: browser || 'Chrome'
        });

        executions.push(execution);
      }

      res.json({
        success: true,
        message: `Batch execution queued for ${executions.length} test cases`,
        executions: executions.map(e => ({
          id: e._id,
          testCaseId: e.testCaseId,
          status: e.status
        }))
      });

    } catch (error) {
      console.error('Trigger batch execution error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error triggering batch execution'
      });
    }
  }

  // Get flaky tests (tests that sometimes pass, sometimes fail)
  async getFlakyTests(req, res) {
    try {
      const { threshold = 0.3, minExecutions = 5 } = req.query;

      const flakyTests = await TestCase.aggregate([
        {
          $match: {
            executionCount: { $gte: parseInt(minExecutions) },
            passCount: { $gt: 0 },
            failCount: { $gt: 0 }
          }
        },
        {
          $addFields: {
            passRate: {
              $multiply: [
                { $divide: ['$passCount', '$executionCount'] },
                100
              ]
            },
            failRate: {
              $multiply: [
                { $divide: ['$failCount', '$executionCount'] },
                100
              ]
            }
          }
        },
        {
          $match: {
            failRate: { $gte: parseFloat(threshold) * 100 },
            passRate: { $gte: parseFloat(threshold) * 100 }
          }
        },
        {
          $sort: { failRate: -1 }
        },
        {
          $project: {
            title: 1,
            category: 1,
            priority: 1,
            executionCount: 1,
            passCount: 1,
            failCount: 1,
            passRate: { $round: ['$passRate', 2] },
            failRate: { $round: ['$failRate', 2] }
          }
        }
      ]);

      res.json({
        success: true,
        count: flakyTests.length,
        flakyTests
      });

    } catch (error) {
      console.error('Get flaky tests error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error fetching flaky tests'
      });
    }
  }
}

module.exports = new AutomationController();