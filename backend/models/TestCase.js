const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a test case title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['UI', 'API', 'Integration', 'Regression', 'Performance', 'Authentication'],
    default: 'UI'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    expectedResult: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Deprecated'],
    default: 'Active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  automationScript: {
    type: String, // Path to automation script
    default: null
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastExecutedAt: {
    type: Date,
    default: null
  },
  executionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster searches
testCaseSchema.index({ title: 'text', description: 'text' });
testCaseSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('TestCase', testCaseSchema);