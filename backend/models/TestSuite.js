const mongoose = require('mongoose');

const testSuiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a test suite name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  testCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  schedule: {
    type: String, // Cron expression
    default: null
  },
  nextRunTime: {
    type: Date,
    default: null
  },
  lastRunTime: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Index
testSuiteSchema.index({ name: 1 });
testSuiteSchema.index({ isActive: 1 });

module.exports = mongoose.model('TestSuite', testSuiteSchema);