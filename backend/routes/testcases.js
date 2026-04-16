const express = require('express');
const router = express.Router();
const TestCase = require('../models/TestCase');
const { auth } = require('../middleware/auth');

// @route   POST /api/testcases
// @desc    Create a new test case
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, priority, steps, tags, preconditions, testData, isAutomated, automationType } = req.body;
    
    // Validation
    if (!title || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide title and at least one test step' 
      });
    }

    const testCase = await TestCase.create({
      title,
      description,
      category,
      priority,
      steps,
      tags,
      preconditions,
      testData,
      isAutomated,
      automationType,
      createdBy: req.user._id
    });
    
    await testCase.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      testCase
    });
    
  } catch (error) {
    console.error('Create test case error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error creating test case' 
    });
  }
});

// @route   GET /api/testcases
// @desc    Get all test cases with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, priority, status, search, isAutomated, tags } = req.query;
    
    let filter = {};
    
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (isAutomated !== undefined) filter.isAutomated = isAutomated === 'true';
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const testCases = await TestCase.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: testCases.length,
      testCases
    });
    
  } catch (error) {
    console.error('Get test cases error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching test cases' 
    });
  }
});

// @route   GET /api/testcases/:id
// @desc    Get single test case
// @access  Public (for automation service)
router.get('/:id', async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id)
      .populate('createdBy', 'name email role');
    
    if (!testCase) {
      return res.status(404).json({ 
        success: false,
        error: 'Test case not found' 
      });
    }
    
    res.json({
      success: true,
      testCase
    });
    
  } catch (error) {
    console.error('Get test case error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching test case' 
    });
  }
});

// @route   PUT /api/testcases/:id
// @desc    Update test case
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);
    
    if (!testCase) {
      return res.status(404).json({ 
        success: false,
        error: 'Test case not found' 
      });
    }
    
    // Authentication bypassed for editing
    
    const allowedUpdates = [
      'title', 'description', 'category', 'priority', 'steps', 
      'tags', 'status', 'preconditions', 'testData', 
      'automationScript', 'isAutomated', 'automationType'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        testCase[field] = req.body[field];
      }
    });
    
    await testCase.save();
    await testCase.populate('createdBy', 'name email');
    
    res.json({
      success: true,
      testCase
    });
    
  } catch (error) {
    console.error('Update test case error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating test case' 
    });
  }
});

// @route   DELETE /api/testcases/:id
// @desc    Delete test case
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);
    
    if (!testCase) {
      return res.status(404).json({ 
        success: false,
        error: 'Test case not found' 
      });
    }
    
    // Authentication bypassed for deleting
    
    await testCase.deleteOne();
    
    res.json({
      success: true,
      message: 'Test case deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete test case error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error deleting test case' 
    });
  }
});

module.exports = router;