/**
 * E2E Tests for LokiVector HTTP Server
 * 
 * These tests require the server to be running.
 * Run with: npm run test:e2e
 */

const fetch = require('node-fetch');
const path = require('path');

const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:4000';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('LokiVector HTTP Server E2E Tests', function() {
  let apiKey = null;
  let testCollection = 'e2e_test_' + Date.now();
  
  // Increase timeout for E2E tests
  jasmine.DEFAULT_TIMEOUT_INTERVAL = TEST_TIMEOUT;

  beforeAll(function(done) {
    // Wait a bit for server to be ready
    setTimeout(done, 2000);
  });

  describe('Health & Status', function() {
    it('should return server status', async function() {
      const res = await fetch(`${BASE_URL}/`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe('online');
      expect(data.engine).toBe('LokiJS + HNSW');
      expect(Array.isArray(data.collections)).toBe(true);
    });

    it('should return health check', async function() {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(typeof data.uptime).toBe('number');
      expect(typeof data.collections).toBe('number');
    });

    it('should return Prometheus metrics', async function() {
      const res = await fetch(`${BASE_URL}/metrics`);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/plain');
      
      const text = await res.text();
      expect(text).toContain('lokivector_collections_total');
      expect(text).toContain('lokivector_documents_total');
    });
  });

  describe('API Key Management', function() {
    it('should create an API key', async function() {
      const res = await fetch(`${BASE_URL}/api/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test_user',
          permissions: {
            collections: ['*'],
            operations: ['read', 'write'],
            rateLimit: {
              requests: 1000,
              window: '1h'
            }
          },
          metadata: {
            name: 'E2E Test Key',
            description: 'Key for E2E testing'
          }
        })
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.key).toBeDefined();
      expect(data.key).toMatch(/^lvk_/);
      
      // Save for later tests
      apiKey = data.key;
    });

    it('should list API keys', async function() {
      if (!apiKey) {
        // Create one if we don't have it
        const createRes = await fetch(`${BASE_URL}/api/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'test_user' })
        });
        const createData = await createRes.json();
        apiKey = createData.key;
      }

      const res = await fetch(`${BASE_URL}/api/keys`, {
        headers: { 'X-API-Key': apiKey }
      });

      expect(res.status).toBe(200);
      const keys = await res.json();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should get API key statistics', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/api/keys/stats`, {
        headers: { 'X-API-Key': apiKey }
      });

      expect(res.status).toBe(200);
      const stats = await res.json();
      expect(typeof stats.totalKeys).toBe('number');
      expect(typeof stats.activeKeys).toBe('number');
      expect(typeof stats.revokedKeys).toBe('number');
    });
  });

  describe('Collections', function() {
    it('should list collections', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections`, {
        headers: { 'X-API-Key': apiKey }
      });

      expect(res.status).toBe(200);
      const collections = await res.json();
      expect(Array.isArray(collections)).toBe(true);
    });

    it('should create a collection', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: testCollection,
          options: {
            unique: ['id']
          }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain('created');
    });

    it('should return 409 when creating duplicate collection', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: testCollection
        })
      });

      expect(res.status).toBe(409);
    });
  });

  describe('Documents CRUD', function() {
    it('should insert documents', async function() {
      if (!apiKey) return;

      const docs = [
        { id: 1, name: 'Product 1', price: 10.99, category: 'electronics' },
        { id: 2, name: 'Product 2', price: 20.99, category: 'books' },
        { id: 3, name: 'Product 3', price: 30.99, category: 'electronics' }
      ];

      const res = await fetch(`${BASE_URL}/collections/${testCollection}/insert`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(docs)
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe('Inserted successfully');
      expect(data.count).toBe(3);
    });

    it('should find documents', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${testCollection}/find`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: { category: 'electronics' },
          limit: 10
        })
      });

      expect(res.status).toBe(200);
      const results = await res.json();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].category).toBe('electronics');
    });

    it('should update documents', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${testCollection}/update`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: { category: 'electronics' },
          update: {
            $set: { price: 15.99, updated: true }
          }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain('Updated');
      expect(data.updated).toBe(2);
    });

    it('should remove documents', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${testCollection}/remove`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: { category: 'books' }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain('Removed');
      expect(data.removed).toBe(1);
    });
  });

  describe('Vector Search', function() {
    let vectorCollection = 'e2e_vectors_' + Date.now();

    it('should create a collection for vectors', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: vectorCollection
        })
      });

      expect(res.status).toBe(200);
    });

    it('should create a vector index', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${vectorCollection}/index`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field: 'embedding',
          options: {
            m: 16,
            efConstruction: 200
          }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain('Vector index created');
    });

    it('should insert documents with vectors', async function() {
      if (!apiKey) return;

      const docs = [
        { id: 1, text: 'hello world', embedding: [0.1, 0.2, 0.3, 0.4, 0.5] },
        { id: 2, text: 'goodbye world', embedding: [0.2, 0.3, 0.4, 0.5, 0.6] },
        { id: 3, text: 'test document', embedding: [0.3, 0.4, 0.5, 0.6, 0.7] }
      ];

      const res = await fetch(`${BASE_URL}/collections/${vectorCollection}/insert`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(docs)
      });

      expect(res.status).toBe(200);
    });

    it('should perform vector search', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${vectorCollection}/search`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: [0.15, 0.25, 0.35, 0.45, 0.55],
          field: 'embedding',
          k: 2
        })
      });

      expect(res.status).toBe(200);
      const results = await res.json();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should perform hybrid search', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${vectorCollection}/search`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: [0.15, 0.25, 0.35, 0.45, 0.55],
          field: 'embedding',
          filter: { id: { $gte: 1 } },
          k: 2,
          hybrid: true
        })
      });

      expect(res.status).toBe(200);
      const results = await res.json();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Authentication & Rate Limiting', function() {
    it('should require API key for protected endpoints', async function() {
      const res = await fetch(`${BASE_URL}/collections`, {
        method: 'GET'
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('should reject invalid API key', async function() {
      const res = await fetch(`${BASE_URL}/collections`, {
        headers: { 'X-API-Key': 'invalid_key_12345' }
      });

      expect(res.status).toBe(401);
    });

    it('should include rate limit headers', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections`, {
        headers: { 'X-API-Key': apiKey }
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('MRU Cache', function() {
    it('should enable MRU cache on collection', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${testCollection}/cache`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          capacity: 500
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toContain('MRU Cache enabled');
    });
  });

  describe('Error Handling', function() {
    it('should return 404 for non-existent collection', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/nonexistent/find`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: {} })
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('not found');
    });

    it('should return 400 for invalid request', async function() {
      if (!apiKey) return;

      const res = await fetch(`${BASE_URL}/collections/${testCollection}/update`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required 'query' and 'update'
        })
      });

      expect(res.status).toBe(400);
    });
  });
});

