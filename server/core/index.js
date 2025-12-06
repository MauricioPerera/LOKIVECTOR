/**
 * LokiVector Core - MIT Licensed
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * 
 * Commercial features are located in /commercial and /enterprise directories.
 * See LICENSE_FEATURES.md for details.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const loki = require('../../src/core/lokijs.js');
const HNSWIndex = require('../../src/core/loki-hnsw-index.js');
require('../../src/core/loki-vector-plugin.js');
const APIKeyManager = require('../core/auth/api-keys.js');
const { createAuthMiddleware, optionalAuth } = require('../core/middleware/auth.js');
const { RateLimiter, createRateLimitMiddleware } = require('../core/middleware/rate-limit.js');
const { requireCommercial } = require('../../src/core/edition.js');

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/loki-vector.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increase limit for large vector payloads

app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});

// SaaS Middleware (Enable if env var SAAS_MODE=true)
const { saasMiddleware, apiKeys } = require('../saas-middleware');

if (process.env.SAAS_MODE === 'true') {
    console.log('SaaS Mode Enabled: API Keys required');
    app.use(saasMiddleware);
} else {
    console.log('SaaS Mode Disabled');
}

// Initialize Database
const db = new loki(DB_PATH, {
  autoload: true,
  autosave: true,
  autosaveInterval: 5000,
  persistenceMethod: 'fs',
  adapter: new loki.LokiFsAdapter()
});

// Global variables for auth (initialized after database loads)
let apiKeyManager = null;
let rateLimiter = null;
let authMiddleware = null;
let rateLimitMiddleware = null;

// Initialize authentication after database loads
function initializeAuth() {
  apiKeyManager = new APIKeyManager(db);
  rateLimiter = new RateLimiter();
  authMiddleware = createAuthMiddleware(apiKeyManager);
  rateLimitMiddleware = createRateLimitMiddleware(rateLimiter);
  
  // Create aliases for easier use
  const authenticate = authMiddleware;
  const rateLimit = rateLimitMiddleware;
  
  // Register API key management endpoints
  app.post('/api/keys', (req, res) => {
    try {
      const { userId = 'default', permissions = {}, metadata = {} } = req.body;
      const newKey = apiKeyManager.generateKey(userId, permissions, metadata);
      res.status(201).json(newKey);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/keys', authenticate, rateLimit, (req, res) => {
    try {
      const userId = req.query.userId || '*';
      const keys = apiKeyManager.listKeys(userId);
      res.json(keys);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/keys/:keyId', authenticate, rateLimit, (req, res) => {
    try {
      const keys = apiKeyManager.listKeys('*');
      const key = keys.find(k => k.keyId === req.params.keyId);
      if (!key) {
        return res.status(404).json({ error: 'API key not found' });
      }
      res.json(key);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/keys/:keyId', authenticate, rateLimit, (req, res) => {
    try {
      const revoked = apiKeyManager.revokeKey(req.params.keyId);
      if (!revoked) {
        return res.status(404).json({ error: 'API key not found' });
      }
      res.json({ message: 'API key revoked' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/keys/stats', authenticate, rateLimit, (req, res) => {
    try {
      const stats = apiKeyManager.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Wait for database to load before initializing auth
db.on('loaded', () => {
  console.log('Database loaded, initializing auth...');
  initializeAuth();
});

// Serve Swagger UI (if swagger-ui-express is available)
app.get('/swagger', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>LokiVector API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api-docs',
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
    `);
});

// 1. Get Server Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    engine: 'LokiJS + HNSW',
    edition: 'MIT',
    collections: db.listCollections().map(c => c.name)
  });
});

// 2. List Collections (with metadata)
app.get('/collections', (req, res) => {
  try {
    // Optional auth - check if API key is provided
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collections = db.listCollections().map(c => {
      const coll = db.getCollection(c.name);
      if (!coll) return null;

      let size = 0;
      try {
        size = JSON.stringify(coll.data).length;
      } catch (e) {
        console.warn(`Could not calculate size for collection ${c.name}:`, e.message);
      }

      return {
        name: c.name,
        count: coll.count(),
        size: size, // Approximate size in bytes
        hasVectorIndex: !!coll.get && !!coll.getHnswIndex() // Check if HNSW index exists
      };
    }).filter(Boolean); // Filter out nulls

    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Collection
app.post('/collections/:name', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collectionName = req.params.name;
    const options = req.body.options || {};
    
    // Check if collection already exists
    if (db.getCollection(collectionName)) {
      return res.status(409).json({ error: `Collection '${collectionName}' already exists` });
    }
    
    const collection = db.addCollection(collectionName, options);
    res.status(201).json({ 
      name: collection.name,
      count: collection.count()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Collection Info
app.get('/collections/:name', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.json({
      name: collection.name,
      count: collection.count(),
      hasVectorIndex: !!collection.get && !!collection.getHnswIndex()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Insert Documents
app.post('/collections/:name/insert', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const documents = Array.isArray(req.body) ? req.body : [req.body];
    const inserted = collection.insert(documents);
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Find Documents
app.post('/collections/:name/find', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const query = req.body.query || {};
    const results = collection.find(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Documents
app.post('/collections/:name/update', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const updateFunction = req.body.updateFunction;
    const query = req.body.query || {};
    
    if (updateFunction) {
      // Use update function
      const results = collection.find(query);
      results.forEach(doc => {
        const updated = updateFunction(doc);
        if (updated) {
          collection.update(doc);
        }
      });
      res.json({ updated: results.length });
    } else {
      // Use update object
      const updateObj = req.body.update || {};
      const results = collection.findAndUpdate(query, (obj) => {
        Object.assign(obj, updateObj);
        return obj;
      });
      res.json({ updated: results.length });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Remove Documents
app.post('/collections/:name/remove', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const query = req.body.query || {};
    const removed = collection.findAndRemove(query);
    res.json({ removed: removed.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Vector Search
app.post('/collections/:name/vector/search', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const vector = req.body.vector;
    const limit = req.body.limit || 10;
    const distance = req.body.distance || 'euclidean';
    
    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({ error: 'Vector must be an array' });
    }
    
    const results = collection.vectorSearch(vector, { limit, distance });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Create Vector Index
app.post('/collections/:name/vector/index', (req, res) => {
  try {
    // Optional auth
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    if (apiKey && apiKeyManager) {
      const keyRecord = apiKeyManager.validateKey(apiKey);
      if (!keyRecord) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }
    }
    
    const collection = db.getCollection(req.params.name);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const options = req.body.options || {};
    collection.createVectorIndex(options);
    res.json({ message: 'Vector index created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve OpenAPI YAML
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../../docs/openapi.yaml'));
});

// Serve Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dashboard/index.html'));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`LokiVector Server (MIT Edition) running on http://localhost:${PORT}`);
  console.log(`Edition: MIT (Community Edition)`);
  console.log(`Commercial features require Pro or Enterprise license.`);
  console.log(`See LICENSE_FEATURES.md for details.`);
});

module.exports = { app, server, db };

