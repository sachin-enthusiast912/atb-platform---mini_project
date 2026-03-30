const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Only create transporter if email credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        console.log('✅ Email service initialized');
      } catch (error) {
        console.warn('⚠️  Email service initialization failed:', error.message);
        this.transporter = null;
      }
    } else {
      console.warn('⚠️  Email credentials not configured - email notifications disabled');
      this.transporter = null;
    }
  }

  async sendBugNotification(bug) {
    // Skip if transporter not available
    if (!this.transporter) {
      console.warn('Email service not configured, skipping notification');
      return null;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // In production, send to team or assigned person
        subject: `🐛 New Bug Report: ${bug.title}`,
        html: this.generateBugEmailHTML(bug)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Bug notification email sent:', info.messageId);
      return info;
      
    } catch (error) {
      console.error('❌ Error sending bug notification:', error.message);
      return null;
    }
  }

  async sendTestFailureNotification(execution, testCase, bug) {
    // Skip if transporter not available
    if (!this.transporter) {
      console.warn('Email service not configured, skipping notification');
      return null;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `❌ Test Failed: ${testCase.title}`,
        html: this.generateTestFailureEmailHTML(execution, testCase, bug)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test failure notification sent:', info.messageId);
      return info;
      
    } catch (error) {
      console.error('❌ Error sending test failure notification:', error.message);
      return null;
    }
  }

  generateBugEmailHTML(bug) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 20px; }
          .bug-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc3545; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .badge { display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }
          .badge-critical { background-color: #dc3545; color: white; }
          .badge-high { background-color: #fd7e14; color: white; }
          .badge-medium { background-color: #ffc107; color: #333; }
          .badge-low { background-color: #28a745; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐛 New Bug Reported</h1>
          </div>
          <div class="content">
            <div class="bug-info">
              <h2>${bug.title}</h2>
              <p><strong>Description:</strong> ${bug.description}</p>
              <p>
                <strong>Priority:</strong> 
                <span class="badge badge-${bug.priority.toLowerCase()}">${bug.priority}</span>
              </p>
              <p>
                <strong>Severity:</strong> 
                <span class="badge badge-${bug.severity.toLowerCase()}">${bug.severity}</span>
              </p>
              <p><strong>Status:</strong> ${bug.status}</p>
              <p><strong>Environment:</strong> ${bug.environment}</p>
              ${bug.testCaseId ? `<p><strong>Related Test Case:</strong> ${bug.testCaseId.title}</p>` : ''}
              <p><strong>Reported By:</strong> ${bug.reportedBy.name}</p>
              <p><strong>Created At:</strong> ${new Date(bug.createdAt).toLocaleString()}</p>
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/bugs/${bug._id}" 
                 style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Bug Details
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from QA Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateTestFailureEmailHTML(execution, testCase, bug) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 20px; }
          .test-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc3545; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Test Execution Failed</h1>
          </div>
          <div class="content">
            <div class="test-info">
              <h2>${testCase.title}</h2>
              <p><strong>Category:</strong> ${testCase.category}</p>
              <p><strong>Execution ID:</strong> ${execution._id}</p>
              <p><strong>Started:</strong> ${new Date(execution.startTime).toLocaleString()}</p>
              <p><strong>Ended:</strong> ${new Date(execution.endTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${execution.duration} seconds</p>
              ${execution.errorMessage ? `<p><strong>Error:</strong> ${execution.errorMessage}</p>` : ''}
            </div>
            ${bug ? `
              <div class="test-info">
                <h3>🐛 Bug Automatically Created</h3>
                <p><strong>Bug ID:</strong> ${bug._id}</p>
                <p><strong>Title:</strong> ${bug.title}</p>
                <p><strong>Priority:</strong> ${bug.priority}</p>
              </div>
            ` : ''}
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/executions/${execution._id}" 
                 style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Execution Details
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from QA Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();