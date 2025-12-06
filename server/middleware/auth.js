/**
 * Authentication Middleware for LokiVector
 * Validates API keys and attaches user context to requests
 */

const APIKeyManager = require('../auth/api-keys');

/**
 * Create authentication middleware
 * @param {APIKeyManager} apiKeyManager - API Key Manager instance
 * @returns {Function} Express middleware
 */
function createAuthMiddleware(apiKeyManager) {
  if (!apiKeyManager) {
    // If no API key manager, allow all requests (development mode)
    return (req, res, next) => {
      req.userId = 'default';
      req.permissions = { collections: ['*'], operations: ['read', 'write', 'admin'] };
      next();
    };
  }
  /**
   * Authentication middleware
   */
  return function authenticateAPIKey(req, res, next) {
    // Get API key from header or query parameter
    const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide an API key in X-API-Key header, Authorization header, or apiKey query parameter'
      });
    }

    // Validate key
    const keyDoc = apiKeyManager.validateKey(apiKey);
    if (!keyDoc) {
      return res.status(401).json({
        error: 'Invalid or expired API key',
        message: 'The provided API key is invalid or has expired'
      });
    }

    // Attach key document and user context to request
    req.apiKey = keyDoc;
    req.userId = keyDoc.userId;
    req.permissions = keyDoc.permissions;

    // Check collection permissions if accessing a collection
    if (req.params.name) {
      const collectionName = req.params.name;
      const allowedCollections = keyDoc.permissions.collections;

      // If not '*' and collection not in list, deny access
      if (allowedCollections[0] !== '*' && !allowedCollections.includes(collectionName)) {
        return res.status(403).json({
          error: 'Access denied',
          message: `API key does not have access to collection '${collectionName}'`
        });
      }
    }

    // Check operation permissions
    const operation = getOperationFromRequest(req);
    if (operation && !keyDoc.permissions.operations.includes(operation)) {
      return res.status(403).json({
        error: 'Operation not allowed',
        message: `API key does not have permission for '${operation}' operation`
      });
    }

    next();
  };
}

/**
 * Get operation type from request
 * @param {object} req - Express request
 * @returns {string|null} Operation type (read, write, admin)
 */
function getOperationFromRequest(req) {
  const method = req.method.toUpperCase();
  const path = req.path;

  // Admin operations
  if (path.includes('/admin') || path.includes('/keys') || method === 'DELETE') {
    return 'admin';
  }

  // Write operations
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return 'write';
  }

  // Read operations
  if (method === 'GET') {
    return 'read';
  }

  return null;
}

/**
 * Optional authentication middleware (for public endpoints)
 * Attaches user context if API key is provided, but doesn't require it
 */
function optionalAuth(apiKeyManager) {
  if (!apiKeyManager) {
    return (req, res, next) => next(); // No-op if API key manager not available
  }
  
  return function optionalAuthenticate(req, res, next) {
    const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.query.apiKey;

    if (apiKey) {
      const keyDoc = apiKeyManager.validateKey(apiKey);
      if (keyDoc) {
        req.apiKey = keyDoc;
        req.userId = keyDoc.userId;
        req.permissions = keyDoc.permissions;
      }
    }

    next();
  };
}

module.exports = {
  createAuthMiddleware,
  optionalAuth
};

