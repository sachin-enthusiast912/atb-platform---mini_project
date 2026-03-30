const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a bug title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a bug description'],
    trim: true
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Reopened'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  severity: {
    type: String,
    enum: ['Minor', 'Major', 'Critical', 'Blocker'],
    default: 'Major'
  },
  type: {
    type: String,
    enum: ['Functional', 'UI', 'Performance', 'Security', 'Other'],
    default: 'Functional'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase',
    default: null
  },
  executionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Execution',
    default: null
  },
  environment: {
    type: String,
    default: 'Development'
  },
  browser: {
    type: String,
    default: null
  },
  stepsToReproduce: [{
    type: String
  }],
  attachments: [{
    filename: String,
    url: String,
    type: {
      type: String,
      enum: ['screenshot', 'video', 'log', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isAutomated: {
    type: Boolean,
    default: false // True if created by automation
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes
bugSchema.index({ status: 1, priority: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ testCaseId: 1 });

module.exports = mongoose.model('Bug', bugSchema);