const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class Helpers {
  /**
   * Generate a random string
   * @param {number} length - Length of the random string
   * @returns {string} Random string
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a unique filename
   * @param {string} originalName - Original filename
   * @returns {string} Unique filename
   */
  static generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = this.generateRandomString(8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Calculate pass rate percentage
   * @param {number} passed - Number of passed tests
   * @param {number} total - Total number of tests
   * @returns {number} Pass rate percentage
   */
  static calculatePassRate(passed, total) {
    if (total === 0) return 0;
    return parseFloat(((passed / total) * 100).toFixed(2));
  }

  /**
   * Format duration in seconds to human readable format
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  static formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Sanitize filename to prevent directory traversal
   * @param {string} filename - Filename to sanitize
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Create directory if it doesn't exist
   * @param {string} dirPath - Directory path
   */
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Delete file if it exists
   * @param {string} filePath - File path
   */
  static async deleteFileIfExists(filePath) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Paginate array
   * @param {Array} array - Array to paginate
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} Paginated result
   */
  static paginate(array, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const paginatedItems = array.slice(offset, offset + limit);
    const totalPages = Math.ceil(array.length / limit);

    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: array.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Group array by key
   * @param {Array} array - Array to group
   * @param {string} key - Key to group by
   * @returns {Object} Grouped object
   */
  static groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in ms
   * @returns {Promise}
   */
  static async retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.sleep(delay * Math.pow(2, i));
      }
    }
  }

  /**
   * Get date range for filters
   * @param {string} period - Period (today, week, month, year)
   * @returns {Object} Start and end dates
   */
  static getDateRange(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    return {
      startDate,
      endDate: now
    };
  }

  /**
   * Extract error message from error object
   * @param {Error} error - Error object
   * @returns {string} Error message
   */
  static getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unknown error occurred';
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate execution summary
   * @param {Array} executions - Array of executions
   * @returns {Object} Summary statistics
   */
  static generateExecutionSummary(executions) {
    const total = executions.length;
    const passed = executions.filter(e => e.status === 'Passed').length;
    const failed = executions.filter(e => e.status === 'Failed').length;
    const skipped = executions.filter(e => e.status === 'Skipped').length;
    const error = executions.filter(e => e.status === 'Error').length;

    const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgDuration = total > 0 ? totalDuration / total : 0;

    return {
      total,
      passed,
      failed,
      skipped,
      error,
      passRate: this.calculatePassRate(passed, total - skipped),
      totalDuration: this.formatDuration(totalDuration),
      avgDuration: this.formatDuration(avgDuration)
    };
  }

  /**
   * Parse cron expression to human readable format
   * @param {string} cronExpression - Cron expression
   * @returns {string} Human readable format
   */
  static parseCronExpression(cronExpression) {
    // Simple parser for common patterns
    const patterns = {
      '0 0 * * *': 'Daily at midnight',
      '0 */6 * * *': 'Every 6 hours',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 1 * *': 'Monthly on the 1st',
      '*/15 * * * *': 'Every 15 minutes',
      '0 9 * * 1-5': 'Weekdays at 9 AM'
    };

    return patterns[cronExpression] || cronExpression;
  }

  /**
   * Get status color for UI
   * @param {string} status - Status value
   * @returns {string} Color code
   */
  static getStatusColor(status) {
    const colors = {
      // Execution statuses
      'Passed': '#28a745',
      'Failed': '#dc3545',
      'Pending': '#ffc107',
      'Running': '#17a2b8',
      'Skipped': '#6c757d',
      'Error': '#dc3545',
      
      // Bug statuses
      'New': '#007bff',
      'In Progress': '#17a2b8',
      'Fixed': '#28a745',
      'Verified': '#28a745',
      'Closed': '#6c757d',
      'Reopened': '#fd7e14',
      'Rejected': '#dc3545',
      
      // Priority levels
      'Critical': '#dc3545',
      'High': '#fd7e14',
      'Medium': '#ffc107',
      'Low': '#28a745'
    };

    return colors[status] || '#6c757d';
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Convert object to query string
   * @param {Object} params - Parameters object
   * @returns {string} Query string
   */
  static objectToQueryString(params) {
    return Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}

module.exports = Helpers;