const express = require('express');
const router = express.Router();
const TestCase = require('../models/TestCase');
const Bug = require('../models/Bug');
const Execution = require('../models/Execution');
const { auth } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get counts
    const totalTestCases = await TestCase.countDocuments();
    const activeTestCases = await TestCase.countDocuments({ status: 'Active' });
    const automatedTests = await TestCase.countDocuments({ isAutomated: true });
    
    const totalBugs = await Bug.countDocuments();
    const openBugs = await Bug.countDocuments({ 
      status: { $in: ['New', 'In Progress', 'Reopened'] } 
    });
    const criticalBugs = await Bug.countDocuments({ 
      priority: 'Critical',
      status: { $ne: 'Closed' }
    });
    
    const totalExecutions = await Execution.countDocuments();
    const recentExecutions = await Execution.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    
    // Test cases by category
    const testsByCategory = await TestCase.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Test cases by priority
    const testsByPriority = await TestCase.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Bugs by status
    const bugsByStatus = await Bug.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Bugs by priority
    const bugsByPriority = await Bug.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Recent execution results
    const executionResults = await Execution.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Calculate pass rate
    const passedCount = executionResults.find(r => r._id === 'Passed')?.count || 0;
    const failedCount = executionResults.find(r => r._id === 'Failed')?.count || 0;
    const totalRuns = passedCount + failedCount;
    const passRate = totalRuns > 0 ? ((passedCount / totalRuns) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      stats: {
        testCases: {
          total: totalTestCases,
          active: activeTestCases,
          automated: automatedTests,
          manual: totalTestCases - automatedTests,
          byCategory: testsByCategory,
          byPriority: testsByPriority
        },
        bugs: {
          total: totalBugs,
          open: openBugs,
          critical: criticalBugs,
          byStatus: bugsByStatus,
          byPriority: bugsByPriority
        },
        executions: {
          total: totalExecutions,
          recent: recentExecutions,
          passRate: parseFloat(passRate),
          results: executionResults
        }
      }
    });
    
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching dashboard statistics' 
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity
// @access  Private
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent executions
    const recentExecutions = await Execution.find()
      .populate('testCaseId', 'title')
      .populate('triggeredBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // Get recent bugs
    const recentBugs = await Bug.find()
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      recentExecutions,
      recentBugs
    });
    
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching recent activity' 
    });
  }
});

// @route   GET /api/dashboard/trends
// @desc    Get execution trends
// @access  Private
router.get('/trends', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trends = await Execution.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    res.json({
      success: true,
      trends
    });
    
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching trends' 
    });
  }
});

module.exports = router;