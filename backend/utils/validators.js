const { body, param, query, validationResult } = require('express-validator');

class Validators {
  // Validation middleware wrapper
  static validate(validations) {
    return async (req, res, next) => {
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    };
  }

  // User validation rules
  static registerUser() {
    return [
      body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
      body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
      body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
      body('role')
        .optional()
        .isIn(['tester', 'developer', 'admin']).withMessage('Invalid role')
    ];
  }

  static loginUser() {
    return [
      body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
      body('password')
        .notEmpty().withMessage('Password is required')
    ];
  }

  static updateProfile() {
    return [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
      body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
    ];
  }

  static changePassword() {
    return [
      body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
      body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    ];
  }

  // Test case validation rules
  static createTestCase() {
    return [
      body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
      body('category')
        .optional()
        .isIn(['UI', 'API', 'Integration', 'Regression', 'Performance', 'Security'])
        .withMessage('Invalid category'),
      body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid priority'),
      body('steps')
        .isArray({ min: 1 }).withMessage('At least one test step is required'),
      body('steps.*.stepNumber')
        .isInt({ min: 1 }).withMessage('Step number must be a positive integer'),
      body('steps.*.action')
        .trim()
        .notEmpty().withMessage('Step action is required'),
      body('steps.*.expectedResult')
        .trim()
        .notEmpty().withMessage('Expected result is required'),
      body('tags')
        .optional()
        .isArray().withMessage('Tags must be an array')
    ];
  }

  static updateTestCase() {
    return [
      param('id')
        .isMongoId().withMessage('Invalid test case ID'),
      body('title')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
      body('category')
        .optional()
        .isIn(['UI', 'API', 'Integration', 'Regression', 'Performance', 'Security'])
        .withMessage('Invalid category'),
      body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid priority'),
      body('status')
        .optional()
        .isIn(['Active', 'Inactive', 'Deprecated', 'Draft'])
        .withMessage('Invalid status')
    ];
  }

  // Bug validation rules
  static createBug() {
    return [
      body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
      body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),
      body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid priority'),
      body('severity')
        .optional()
        .isIn(['Minor', 'Major', 'Critical', 'Blocker'])
        .withMessage('Invalid severity'),
      body('type')
        .optional()
        .isIn(['Functional', 'UI', 'Performance', 'Security', 'Data', 'API', 'Other'])
        .withMessage('Invalid bug type'),
      body('assignedTo')
        .optional()
        .isMongoId().withMessage('Invalid assigned user ID'),
      body('testCaseId')
        .optional()
        .isMongoId().withMessage('Invalid test case ID')
    ];
  }

  static updateBug() {
    return [
      param('id')
        .isMongoId().withMessage('Invalid bug ID'),
      body('status')
        .optional()
        .isIn(['New', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Reopened', 'Rejected'])
        .withMessage('Invalid status'),
      body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid priority'),
      body('severity')
        .optional()
        .isIn(['Minor', 'Major', 'Critical', 'Blocker'])
        .withMessage('Invalid severity')
    ];
  }

  static addComment() {
    return [
      param('id')
        .isMongoId().withMessage('Invalid bug ID'),
      body('text')
        .trim()
        .notEmpty().withMessage('Comment text is required')
        .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters')
    ];
  }

  // Execution validation rules
  static createExecution() {
    return [
      body('testCaseId')
        .notEmpty().withMessage('Test case ID is required')
        .isMongoId().withMessage('Invalid test case ID'),
      body('executionType')
        .optional()
        .isIn(['Manual', 'Automated'])
        .withMessage('Invalid execution type'),
      body('environment')
        .optional()
        .isIn(['Development', 'Staging', 'Production', 'Testing'])
        .withMessage('Invalid environment')
    ];
  }

  // Query parameter validation
  static paginationParams() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ];
  }

  static searchParams() {
    return [
      query('search')
        .optional()
        .trim()
        .isLength({ min: 2 }).withMessage('Search term must be at least 2 characters')
    ];
  }

  // MongoDB ID validation
  static mongoId(paramName = 'id') {
    return [
      param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName}`)
    ];
  }
}

module.exports = Validators;