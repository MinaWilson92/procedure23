// server.js - HSBC Procedures Hub - Main Entry Point

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import route modules
const authRoutes = require('./routes/auth');
const procedureRoutes = require('./routes/procedures');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const sharepointRoutes = require('./routes/sharepoint');
const systemRoutes = require('./routes/system');
const debugRoutes = require('./routes/debug');
const fileRoutes = require('./routes/files');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import utilities
const { initializeDirectories } = require('./utils/fileSystem');
const config = require('./config/config');

const app = express();
const port = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Initialize required directories and files
initializeDirectories();

// Apply authentication middleware
app.use(authMiddleware);

// Serve static files from React build
app.use('/ProceduresHubEG6', express.static(path.join(__dirname, 'build')));

// Serve uploaded files
app.use('/ProceduresHubEG6/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/ProceduresHubEG6/api/auth', authRoutes);
app.use('/ProceduresHubEG6/api/procedures', procedureRoutes);
app.use('/ProceduresHubEG6/api/admin', adminRoutes);
app.use('/ProceduresHubEG6/api/user', userRoutes);
app.use('/ProceduresHubEG6/api/sharepoint', sharepointRoutes);
app.use('/ProceduresHubEG6/api/system', systemRoutes);
app.use('/ProceduresHubEG6/api/test', debugRoutes);
app.use('/ProceduresHubEG6/api/debug', debugRoutes);
app.use('/ProceduresHubEG6/api/files', fileRoutes);

// Catch-all route for React Router (must be last)
app.get('/ProceduresHubEG6/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/ProceduresHubEG6/');
});

// Error handling middleware
app.use(errorHandler);

// 404 handler for API routes
app.use('/ProceduresHubEG6/api/*', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
app.listen(port, () => {
  console.log('\n🚀 HSBC Procedures Hub Server Started');
  console.log('=====================================');
  console.log(`📡 Server running on port: ${port}`);
  console.log(`🌐 Main URL: http://localhost:${port}/ProceduresHubEG6/`);
  console.log(`🧪 Test page: http://localhost:${port}/ProceduresHubEG6/test`);
  console.log(`📊 Health check: http://localhost:${port}/ProceduresHubEG6/api/system/health`);
  console.log('=====================================');
  console.log(`📁 Data directory: ${config.DATA_DIR}`);
  console.log(`📤 Uploads directory: ${config.UPLOADS_DIR}`);
  console.log(`🔑 Admin users: ${config.ROLES.admins.join(', ')}`);
  console.log(`📎 SharePoint integration: ${config.SHAREPOINT.siteUrl ? 'Enabled' : 'Disabled'}`);
  console.log('=====================================');
  console.log('✅ Server is ready to handle requests');
  console.log('💡 For localhost testing, visit the test page or set a test cookie');
  console.log('🔧 Check /api/debug for troubleshooting information\n');
});