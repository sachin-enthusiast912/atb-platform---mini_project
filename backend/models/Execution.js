const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema({
  testCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase',
    required: true
  },
  testSuiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSuite',
    default: null
  },
  executionType: {
    type: String,
    enum: ['Manual', 'Automated'],
    default: 'Manual'
  },
  status: {
    type: String,
    enum: ['Pending', 'Running', 'Passed', 'Failed', 'Skipped', 'Error'],
    default: 'Pending'
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  triggerSource: {
    type: String,
    enum: ['Manual', 'CI/CD', 'Scheduled', 'API'],
    default: 'Manual'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  environment: {
    type: String,
    enum: ['Development', 'Staging', 'Production', 'Testing'],
    default: 'Testing'
  },
  browser: {
    type: String,
    default: null
  },
  browserVersion: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  stackTrace: {
    type: String,
    default: null
  },
  screenshot: {
    type: String,
    default: null
  },
  video: {
    type: String,
    default: null
  },
  logs: {
    type: String,
    default: null
  },
  consoleOutput: [{
    type: {
      type: String,
      enum: ['log', 'warn', 'error', 'info']
    },
    message: String,
    timestamp: Date
  }],
  stepResults: [{
    stepNumber: Number,
    status: {
      type: String,
      enum: ['Passed', 'Failed', 'Skipped']
    },
    actualResult: String,
    screenshot: String,
    duration: Number
  }],
  bugCreated: {
    type: Boolean,
    default: false
  },
  bugId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug',
    default: null
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes
executionSchema.index({ testCaseId: 1, createdAt: -1 });
executionSchema.index({ status: 1 });
executionSchema.index({ triggeredBy: 1 });

// Calculate duration before saving
executionSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = (this.endTime - this.startTime) / 1000; // Convert to seconds
  }
  next();
});

module.exports = mongoose.model('Execution', executionSchema);