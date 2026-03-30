const express = require('express');
const router = express.Router();
const Bug = require('../models/Bug');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

// @route   POST /api/bugs
// @desc    Create a new bug
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      severity, 
      type,
      assignedTo,
      testCaseId,
      executionId,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      environment,
      browser,
      operatingSystem,
      tags
    } = req.body;
    
    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide title and description' 
      });
    }
    
    // Create bug
    const bug = await Bug.create({
      title,
      description,
      priority,
      severity,
      type,
      assignedTo,
      testCaseId,
      executionId,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      environment,
      browser,
      operatingSystem,
      tags,
      reportedBy: req.user._id,
      isAutomated: req.body.isAutomated || false
    });
    
    // Populate references
    await bug.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'testCaseId', select: 'title category' }
    ]);

    // Send email notification if it's an automated bug
    if (req.body.sendNotification || req.body.isAutomated) {
      try {
        await emailService.sendBugNotification(bug);
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    res.status(201).json({
      success: true,
      bug
    });
    
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error creating bug' 
    });
  }
});

// @route   GET /api/bugs
// @desc    Get all bugs with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, severity, assignedTo, reportedBy, search } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (severity) filter.severity = severity;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (reportedBy) filter.reportedBy = reportedBy;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const bugs = await Bug.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('testCaseId', 'title category')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: bugs.length,
      bugs
    });
    
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching bugs' 
    });
  }
});

// @route   GET /api/bugs/:id
// @desc    Get single bug
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('testCaseId', 'title category steps')
      .populate('executionId')
      .populate('comments.userId', 'name email');
    
    if (!bug) {
      return res.status(404).json({ 
        success: false,
        error: 'Bug not found' 
      });
    }
    
    res.json({
      success: true,
      bug
    });
    
  } catch (error) {
    console.error('Get bug error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching bug' 
    });
  }
});

// @route   PUT /api/bugs/:id
// @desc    Update bug
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ 
        success: false,
        error: 'Bug not found' 
      });
    }
    
    const allowedUpdates = [
      'title', 'description', 'status', 'priority', 'severity', 
      'type', 'assignedTo', 'stepsToReproduce', 'expectedBehavior',
      'actualBehavior', 'environment', 'browser', 'operatingSystem', 'tags'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        bug[field] = req.body[field];
      }
    });
    
    await bug.save();
    await bug.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' }
    ]);
    
    res.json({
      success: true,
      bug
    });
    
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating bug' 
    });
  }
});

// @route   POST /api/bugs/:id/comments
// @desc    Add comment to bug
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide comment text' 
      });
    }
    
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ 
        success: false,
        error: 'Bug not found' 
      });
    }
    
    bug.comments.push({
      userId: req.user._id,
      text
    });
    
    await bug.save();
    await bug.populate('comments.userId', 'name email');
    
    res.json({
      success: true,
      comments: bug.comments
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error adding comment' 
    });
  }
});

// @route   DELETE /api/bugs/:id
// @desc    Delete bug
// @access  Private (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Only admins can delete bugs' 
      });
    }
    
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ 
        success: false,
        error: 'Bug not found' 
      });
    }
    
    await bug.deleteOne();
    
    res.json({
      success: true,
      message: 'Bug deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error deleting bug' 
    });
  }
});

module.exports = router;