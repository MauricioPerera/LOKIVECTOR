const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const loki = require('../src/lokijs.js');
const HNSWIndex = require('../src/loki-hnsw-index.js');
require('../src/loki-vector-plugin.js');
const LokiOplog = require('../src/loki-oplog.js');

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/loki-vector.db');

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
const { saasMiddleware, apiKeys } = require('./saas-middleware');
// Move middleware mounting AFTER bodyParser but BEFORE routes
// Actually, it is already after bodyParser.
// The issue might be that app.use(saasMiddleware) is inside the if block, but maybe the request is not hitting it?
// Or the path is not matching?
// Let's add logging to confirm saasMiddleware is actually mounted.

if (process.env.SAAS_MODE === 'true') {
    console.log('SaaS Mode Enabled: API Keys required');
    app.use(saasMiddleware);
} else {
    console.log('SaaS Mode Disabled');
}

// Initialize Database
const db = new loki(DB_PATH, {
  autosave: true,
  autosaveInterval: 4000,
  autoload: true,
  autoloadCallback: databaseInitialize
});

// Initialize Oplog for Leader
let oplog = null;
if (REPLICATION_ROLE === 'leader') {
  oplog = new LokiOplog({
    db: db,
    maxSize: 10000,
    retentionDays: 7,
    collectionName: '__oplog__'
  });
}

// Helper function to setup oplog hooks for a collection
function _setupCollectionOplogHooks(coll) {
  if (!oplog || !coll) return;
  
  // Check if hooks are already set up
  if (coll._oplogHooksSetup) return;
  coll._oplogHooksSetup = true;
  
  // Hook into insert events
  var originalInsert = coll.insert.bind(coll);
  coll.insert = function(docs) {
    var result = originalInsert(docs);
    var docsArray = Array.isArray(result) ? result : [result];
    docsArray.forEach(function(doc) {
      if (oplog && doc) {
        oplog.append(coll.name, 'I', doc, {});
      }
    });
    return result;
  };
  
  // Hook into update events
  var originalUpdate = coll.update.bind(coll);
  coll.update = function(doc) {
    var result = originalUpdate(doc);
    if (oplog && result) {
      oplog.append(coll.name, 'U', doc, {});
    }
    return result;
  };
  
  // Hook into remove events
  var originalRemove = coll.remove.bind(coll);
  coll.remove = function(doc) {
    var result = originalRemove(doc);
    if (oplog && result) {
      oplog.append(coll.name, 'R', doc, {});
    }
    return result;
  };
}

function databaseInitialize() {
  console.log('Database loaded/initialized');
  
  // Initialize oplog after DB is loaded
  if (REPLICATION_ROLE === 'leader' && oplog && !oplog.collection) {
    oplog._initializeCollection();
    console.log('Oplog initialized for replication');
    
    // Setup hooks for existing collections
    db.listCollections().forEach(function(coll) {
      _setupCollectionOplogHooks(coll);
    });
  }
  
  // Initialize replication if configured
  if (process.env.REPLICATION_ROLE === 'follower') {
    startFollowerSync();
  }
}

// Replication Configuration
const REPLICATION_ROLE = process.env.REPLICATION_ROLE || 'leader'; // 'leader' or 'follower'
const LEADER_URL = process.env.LEADER_URL || 'http://localhost:4000';
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL) || 5000;

// Helper to enable changes API on all collections
function enableChangesApi() {
  db.listCollections().forEach(coll => {
    if (coll.disableChangesApi) {
      coll.setChangesApi(true);
      coll.setChangesApi(true); // Enable delta changes too? LokiJS API check needed, usually setChangesApi(true) enables it.
    }
  });
}

// Routes

// 0. Serve Admin Dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin_dashboard.html'));
});

// 1. Get Server Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    engine: 'LokiJS + HNSW',
    role: REPLICATION_ROLE,
    collections: db.listCollections().map(c => c.name)
  });
});

// REPLICATION ENDPOINTS (Only active on Leader)
app.get('/replication/changes', (req, res) => {
  if (REPLICATION_ROLE !== 'leader') {
    return res.status(403).json({ error: 'Only leader can serve changes' });
  }

  if (!oplog) {
    return res.status(500).json({ error: 'Oplog not initialized' });
  }

  // Get the last sequence the follower has seen
  var sinceSequence = parseInt(req.query.since || '0', 10);
  var limit = parseInt(req.query.limit || '1000', 10);
  
  // Get entries from oplog since the last sequence
  var entries = oplog.getSince(sinceSequence, limit);
  
  // Group entries by collection
  var changes = {};
  entries.forEach(function(entry) {
    if (!changes[entry.collection]) {
      changes[entry.collection] = [];
    }
    changes[entry.collection].push({
      operation: entry.operation,
      obj: entry.document,
      sequence: entry.sequence,
      timestamp: entry.timestamp
    });
  });
  
  var latestSequence = oplog.getLatestSequence();
  
  res.json({ 
    changes: changes,
    latestSequence: latestSequence,
    count: entries.length
  });
});

// Get oplog statistics
app.get('/replication/oplog/stats', (req, res) => {
  if (REPLICATION_ROLE !== 'leader') {
    return res.status(403).json({ error: 'Only leader can serve oplog stats' });
  }
  
  if (!oplog) {
    return res.status(500).json({ error: 'Oplog not initialized' });
  }
  
  res.json(oplog.getStats());
});

// FOLLOWER LOGIC
// Store the last sequence number we've processed
var lastProcessedSequence = 0;

// Try to load last sequence from a metadata collection
function loadLastSequence() {
  try {
    var metaColl = db.getCollection('__follower_metadata__');
    if (metaColl) {
      var meta = metaColl.findOne({ type: 'lastSequence' });
      if (meta) {
        lastProcessedSequence = meta.value || 0;
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

// Save the last sequence number
function saveLastSequence(sequence) {
  try {
    var metaColl = db.getCollection('__follower_metadata__');
    if (!metaColl) {
      metaColl = db.addCollection('__follower_metadata__');
    }
    var meta = metaColl.findOne({ type: 'lastSequence' });
    if (meta) {
      meta.value = sequence;
      metaColl.update(meta);
    } else {
      metaColl.insert({ type: 'lastSequence', value: sequence });
    }
  } catch (e) {
    // Ignore errors
  }
}

async function startFollowerSync() {
  console.log(`Starting follower sync with leader at ${LEADER_URL}`);
  
  // Load last processed sequence
  loadLastSequence();
  
  setInterval(async () => {
    try {
      // Use native fetch if available (Node.js 18+), otherwise fallback to node-fetch
      const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
      const url = `${LEADER_URL}/replication/changes?since=${lastProcessedSequence}&limit=1000`;
      const response = await fetchFn(url);
      if (!response.ok) {
        console.error('Failed to fetch changes from leader');
        return;
      }
      
      const data = await response.json();
      const { changes, latestSequence, count } = data;
      
      if (!changes || Object.keys(changes).length === 0) {
        // Update last sequence even if no changes (to stay in sync)
        if (latestSequence) {
          lastProcessedSequence = latestSequence;
          saveLastSequence(lastProcessedSequence);
        }
        return;
      }
      
      console.log(`Applying ${count || 0} changes (sequence ${lastProcessedSequence} -> ${latestSequence})...`);
      
      // Apply changes
      // changes structure: { collectionName: [ { name: 'col', operation: 'I', obj: ... } ] }
      Object.keys(changes).forEach(colName => {
        let coll = db.getCollection(colName);
        if (!coll) {
          // If collection doesn't exist, create it (we need options though...)
          // For now, create with default options
          coll = db.addCollection(colName);
        }
        
        const colChanges = changes[colName];
        colChanges.forEach(change => {
            try {
                switch(change.operation) {
                    case 'I': // Insert
                        // Use a UUID or external ID field if available for matching
                        // Otherwise, try to match by $loki if present
                        var existing = null;
                        if (change.obj.uuid) {
                            existing = coll.findOne({ uuid: change.obj.uuid });
                        } else if (change.obj.id) {
                            existing = coll.findOne({ id: change.obj.id });
                        } else if (change.obj.$loki) {
                            existing = coll.get(change.obj.$loki);
                        }
                        
                        if (!existing) {
                            // Insert new document, but preserve UUID/id if present
                            const docToInsert = { ...change.obj };
                            // Remove internal LokiJS fields to let it generate new ones
                            delete docToInsert.$loki;
                            delete docToInsert.meta;
                            coll.insert(docToInsert);
                        }
                        break;
                    case 'U': // Update
                        // Find document by UUID, id, or $loki
                        var docToUpdate = null;
                        if (change.obj.uuid) {
                            docToUpdate = coll.findOne({ uuid: change.obj.uuid });
                        } else if (change.obj.id) {
                            docToUpdate = coll.findOne({ id: change.obj.id });
                        } else if (change.obj.$loki) {
                            docToUpdate = coll.get(change.obj.$loki);
                        }
                        
                        if (docToUpdate) {
                            // Merge changes into existing document
                            Object.keys(change.obj).forEach(key => {
                                if (key !== '$loki' && key !== 'meta' && key !== 'uuid' && key !== 'id') {
                                    docToUpdate[key] = change.obj[key];
                                }
                            });
                            coll.update(docToUpdate);
                        } else {
                            // Document not found, insert as new
                            const docToInsert = { ...change.obj };
                            delete docToInsert.$loki;
                            delete docToInsert.meta;
                            coll.insert(docToInsert);
                        }
                        break;
                    case 'R': // Remove
                        // Find document by UUID, id, or $loki
                        var docToRemove = null;
                        if (change.obj.uuid) {
                            docToRemove = coll.findOne({ uuid: change.obj.uuid });
                        } else if (change.obj.id) {
                            docToRemove = coll.findOne({ id: change.obj.id });
                        } else if (change.obj.$loki) {
                            docToRemove = coll.get(change.obj.$loki);
                        }
                        
                        if (docToRemove) {
                            coll.remove(docToRemove);
                        }
                        break;
                }
            } catch (e) {
                console.error('Error applying change', e);
            }
        });
      });
      
      // Update last processed sequence
      if (latestSequence) {
        lastProcessedSequence = latestSequence;
        saveLastSequence(lastProcessedSequence);
      }
      
    } catch (err) {
      console.error('Sync error:', err.message);
    }
  }, SYNC_INTERVAL);
}

// 2. Create Collection
app.post('/collections', (req, res) => {
  const { name, options } = req.body;
  if (!name) return res.status(400).json({ error: 'Collection name required' });
  
  let coll = db.getCollection(name);
  if (coll) return res.status(409).json({ error: 'Collection already exists' });
  
  coll = db.addCollection(name, options);
  // Enable ChangesAPI for replication
  coll.setChangesApi(true);
  
  // Hook into collection events to log to oplog (if leader)
  if (oplog) {
    _setupCollectionOplogHooks(coll);
  }
  
  res.json({ message: `Collection '${name}' created` });
});

// 3. Create Vector Index
app.post('/collections/:name/index', (req, res) => {
  const { name } = req.params;
  const { field, options } = req.body;
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    coll.ensureVectorIndex(field, options);
    res.json({ message: `Vector index created on field '${field}'` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Insert Document(s)
app.post('/collections/:name/insert', (req, res) => {
  const { name } = req.params;
  const docs = req.body; // Can be object or array
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    const result = coll.insert(docs);
    res.json({ 
      message: 'Inserted successfully', 
      count: Array.isArray(result) ? result.length : 1 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Find Documents (Standard Query)
app.post('/collections/:name/find', (req, res) => {
  const { name } = req.params;
  const { query, limit } = req.body;
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    let results = coll.find(query || {});
    if (limit) results = results.slice(0, limit);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Search (Vector or Hybrid)
app.post('/collections/:name/search', (req, res) => {
  const { name } = req.params;
  const { vector, field, limit, filter } = req.body;
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    let results;
    if (vector) {
      if (filter) {
        // Hybrid search
        results = coll.hybridSearch(field, vector, filter, { k: limit || 10 });
      } else {
        // Pure vector search
        results = coll.findNearest(field, vector, limit || 10);
      }
    } else if (filter) {
        // Standard LokiJS find
        results = coll.find(filter);
        if (limit) results = results.slice(0, limit);
    } else {
        results = coll.find({});
        if (limit) results = results.slice(0, limit);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Document(s)
app.post('/collections/:name/update', (req, res) => {
  const { name } = req.params;
  const { query, update } = req.body;
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    if (!query || !update) {
      return res.status(400).json({ error: 'query and update are required' });
    }
    
    // Find documents matching query
    const docs = coll.find(query);
    if (docs.length === 0) {
      return res.json({ message: 'No documents found to update', updated: 0 });
    }
    
    // Apply updates
    let updated = 0;
    docs.forEach(doc => {
      // Apply $set operator
      if (update.$set) {
        Object.keys(update.$set).forEach(key => {
          doc[key] = update.$set[key];
        });
      }
      // Apply $inc operator
      if (update.$inc) {
        Object.keys(update.$inc).forEach(key => {
          if (typeof doc[key] !== 'number') doc[key] = 0;
          doc[key] += update.$inc[key];
        });
      }
      // Apply other update operators as needed
      coll.update(doc);
      updated++;
    });
    
    res.json({ message: 'Updated successfully', updated: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Remove Document(s)
app.post('/collections/:name/remove', (req, res) => {
  const { name } = req.params;
  const { query } = req.body;
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }
    
    // Find documents matching query
    const docs = coll.find(query);
    if (docs.length === 0) {
      return res.json({ message: 'No documents found to remove', removed: 0 });
    }
    
    // Remove documents
    let removed = 0;
    docs.forEach(doc => {
      coll.remove(doc);
      removed++;
    });
    
    res.json({ message: 'Removed successfully', removed: removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Enable MRU Cache
app.post('/collections/:name/cache', (req, res) => {
  const { name } = req.params;
  const { capacity } = req.body;
  
  const coll = db.getCollection(name);
  if (!coll) return res.status(404).json({ error: 'Collection not found' });
  
  try {
    const MRUCache = require('../src/mru-cache.js');
    coll.mruCache = new MRUCache(capacity || 100);
    res.json({ message: `MRU Cache enabled for collection '${name}' with capacity ${capacity || 100}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Admin Stats Endpoint
// In a real app, protect this with a SUPER_ADMIN_SECRET
app.get('/admin/stats', (req, res) => {
  const { apiKeys } = require('./saas-middleware');
  
  // Basic System Stats
  const systemStats = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    collections: db.listCollections().length,
    totalDocuments: db.listCollections().reduce((sum, c) => {
        // Debug log to inspect collection object
        // console.log('Collection Name:', c.name);
        // console.log('c.count type:', typeof c.count);
        // console.log('c.data length:', c.data ? c.data.length : 'undefined'); // This line might be causing the issue if c.data access throws

        let count = 0;
        try {
             // Safe check for count function
            if (c && Object.prototype.hasOwnProperty.call(c, 'count') && typeof c.count === 'function') {
                count = c.count();
            } 
            // Safe check for data array
            else if (c && c.data && Array.isArray(c.data)) {
                count = c.data.length;
            }
        } catch (e) {
            console.error('Error getting count for collection:', c ? c.name : 'unknown', e);
        }
        return sum + count;
    }, 0)
  };

  // SaaS Client Stats
  const clientStats = [];
  if (apiKeys) {
    apiKeys.forEach((data, key) => {
      clientStats.push({
        key: key.substring(0, 6) + '...', // Mask key
        fullKey: key, // For admin actions
        plan: data.plan,
        usage: data.requests,
        limit: data.limit,
        percent: ((data.requests / data.limit) * 100).toFixed(1) + '%'
      });
    });
  }

  res.json({ system: systemStats, clients: clientStats });
});

// 11. Admin API Key Management
app.post('/admin/keys', (req, res) => {
    // In production, protect with SUPER_ADMIN_SECRET
    const { key, plan, limit, collections } = req.body;
    if (!key || !plan) return res.status(400).json({ error: 'Key and Plan are required' });

    if (apiKeys.has(key)) return res.status(409).json({ error: 'Key already exists' });

    apiKeys.set(key, {
        plan,
        requests: 0,
        limit: limit || 1000,
        collections: collections || []
    });

    res.json({ message: `API Key '${key}' created for plan '${plan}'` });
});

app.delete('/admin/keys/:key', (req, res) => {
    // In production, protect with SUPER_ADMIN_SECRET
    const { key } = req.params;
    if (!apiKeys.has(key)) return res.status(404).json({ error: 'Key not found' });

    apiKeys.delete(key);
    res.json({ message: `API Key '${key}' deleted` });
});

// Start Server
app.listen(PORT, () => {
  console.log(`LokiVector Server running on http://localhost:${PORT}`);
});
