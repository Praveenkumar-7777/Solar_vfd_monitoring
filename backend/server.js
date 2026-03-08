require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const vfdRoutes = require('./routes/vfdRoutes');

const app = express();
let server;
let shuttingDown = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api', vfdRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Erostar Star Enterprises - Solar VFD Monitoring API',
    version: '1.0.0',
    endpoints: {
      auth: [
        'POST /api/login',
        'POST /api/create-user',
        'POST /api/create-admin',
        'GET /api/me',
        'GET /api/users'
      ],
      vfd: [
        'POST /api/vfd-data',
        'GET /api/my-device-data',
        'GET /api/device-history/:deviceId',
        'GET /api/all-vfd-data',
        'GET /api/devices',
        'GET /api/statistics',
        'DELETE /api/vfd-data',
        'POST /api/motor-control',
        'GET /api/motor-command/:deviceId',
        'GET /api/motor-status/:deviceId',
        'GET /api/all-motor-status'
      ]
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.json({
    success: dbConnected,
    status: dbConnected ? 'healthy' : 'degraded',
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const validateMongoUri = () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || !mongoUri.trim()) {
    throw new Error('MONGODB_URI is missing in environment variables');
  }

  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  return mongoUri;
};

const startServer = async () => {
  try {
    const mongoUri = validateMongoUri();

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Connected to MongoDB Atlas');

    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('ℹ️ Check Atlas Network Access (IP whitelist) and database credentials.');
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`\n${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      console.log('✅ HTTP server closed');
    }

    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
