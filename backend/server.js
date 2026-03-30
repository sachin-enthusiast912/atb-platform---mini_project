const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const bcrypt = require('bcryptjs');

const password = "mySecret123";
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log("Hashed password:", hash);
console.log("Password matches:", bcrypt.compareSync("mySecret123", hash));

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/testcases', require('./routes/testcases'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/executions', require('./routes/executions'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'QA Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      testCases: '/api/testcases',
      bugs: '/api/bugs',
      executions: '/api/executions',
      dashboard: '/api/dashboard'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;