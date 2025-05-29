// middleware/errorHandler.js - Error handling middleware

function errorHandler(err, req, res, next) {
  console.error('🚨 Unhandled error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: isDevelopment ? err.stack : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || Date.now().toString()
  });
}

module.exports = errorHandler;