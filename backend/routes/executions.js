const express = require('express');
const router = express.Router();
const Execution = require('../models/Execution');
const TestCase = require('../models/TestCase');
const Bug = require('../models/Bug');
const { auth } = require('../middleware/auth');
const axios = require('axios');

const AUTOMATION_SERVICE_URL = process.env.AUTOMATION_SERVICE_URL || 'http://localhost:5001';

// @route   POST /api/executions
// @desc    Create and trigger test execution
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { testCaseId, executionType, environment, browser } = req.body;

    console.log('='.repeat(60));
    console.log('📝 POST /api/executions - Creating execution');
    console.log('Test Case ID:', testCaseId);
    console.log('Execution Type:', executionType);
    console.log('='.repeat(60));

    // Validate test case exists
    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      console.log('❌ Test case not found:', testCaseId);
      return res.status(404).json({
        success: false,
        error: 'Test case not found'
      });
    }

    console.log('✅ Test case found:', testCase.title);

    // Create execution record
    const execution = new Execution({
      testCaseId,
      executionType: executionType || 'Automated',
      status: 'Pending',
      environment: environment || 'Testing',
      browser: browser || 'Chrome',
      triggeredBy: req.user.id,
      startTime: new Date()
    });

    await execution.save();
    console.log('✅ Execution created in database:', execution._id);

    // Trigger automation service
    console.log('🤖 Triggering automation service...');
    console.log('Automation URL:', AUTOMATION_SERVICE_URL);
    
    const payload = {
      testCaseId: testCaseId,
      executionId: execution._id.toString()
    };
    
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const automationResponse = await axios.post(
        `${AUTOMATION_SERVICE_URL}/execute`,
        payload,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Automation service responded:', automationResponse.status);
      console.log('Response data:', JSON.stringify(automationResponse.data, null, 2));

      // Update execution status to Running
      execution.status = 'Running';
      await execution.save();

      console.log('✅ Execution updated to Running');
      console.log('='.repeat(60));

      return res.status(201).json({
        success: true,
        execution: execution,
        automation: automationResponse.data
      });

    } catch (automationError) {
      console.log('='.repeat(60));
      console.error('❌ AUTOMATION SERVICE ERROR');
      console.error('Error message:', automationError.message);
      console.error('Error code:', automationError.code);
      
      if (automationError.response) {
        console.error('Response status:', automationError.response.status);
        console.error('Response data:', automationError.response.data);
      }
      
      console.log('='.repeat(60));
      
      // Update execution to Error
      execution.status = 'Error';
      execution.errorMessage = `Failed to trigger automation: ${automationError.message}`;
      execution.endTime = new Date();
      await execution.save();

      return res.status(500).json({
        success: false,
        error: 'Failed to trigger automation service',
        details: automationError.message,
        execution: execution
      });
    }

  } catch (error) {
    console.error('❌ Execution creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/executions
// @desc    Get all executions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const executions = await Execution.find()
      .populate('testCaseId', 'title category')
      .populate('triggeredBy', 'name email')
      .populate('bugId', 'title status')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      executions
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/executions/:id
// @desc    Get execution by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate('testCaseId')
      .populate('triggeredBy', 'name email')
      .populate('bugId');

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      execution
    });
  } catch (error) {
    console.error('Error fetching execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   PUT /api/executions/:id
// @desc    Update execution
// @access  Private (should be public for automation service)
router.put('/:id', async (req, res) => {
  try {
    console.log('📝 PUT /api/executions/:id');
    console.log('Execution ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));

    const execution = await Execution.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!execution) {
      console.log('❌ Execution not found:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    // Auto-create bug if test failed and no bug is attached yet
    if (execution.status === 'Failed' && !execution.bugId) {
      console.log('🐞 Auto-creating bug for failed execution...');
      
      const testCase = await TestCase.findById(execution.testCaseId);
      
      const bug = new Bug({
        title: `Automated Test Failure: ${testCase ? testCase.title : execution.testCaseId}`,
        description: `Automated test execution failed.\n\nError Message: ${execution.errorMessage || req.body.errorMessage || 'No error message provided'}\n\nExecution ID: ${execution._id}`,
        status: 'New',
        priority: 'High',
        severity: 'Major',
        type: 'Functional',
        reportedBy: execution.triggeredBy,
        testCaseId: execution.testCaseId,
        executionId: execution._id,
        environment: execution.environment,
        browser: execution.browser,
        isAutomated: true
      });
      
      await bug.save();
      
      // Attach bug to execution
      execution.bugId = bug._id;
      await execution.save();
      
      console.log('✅ Bug auto-created successfully:', bug._id);
    }

    console.log('✅ Execution updated successfully');

    res.json({
      success: true,
      execution
    });
  } catch (error) {
    console.error('❌ Error updating execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   DELETE /api/executions/:id
// @desc    Delete execution
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    // Use deleteOne instead of remove which is deprecated
    await execution.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;