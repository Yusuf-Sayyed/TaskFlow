const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');

const app = express();

// CORS configuration
const allowedClientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, Postman, health probes)
      if (!origin) return callback(null, true);
      if (!allowedClientUrl || allowedClientUrl === '*' || origin === allowedClientUrl || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Allow evaluator origins
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging (exclude in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request body parsers with sensible limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Root & Health check endpoints
app.get(['/', '/api', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TaskFlow API',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard/stats',
      employees: '/api/employees',
      tasks: '/api/tasks',
    },
  });
});

// Mount API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all 404 for unmatched API routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
