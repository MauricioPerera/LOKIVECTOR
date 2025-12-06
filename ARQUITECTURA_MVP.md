# Arquitectura del MVP: LokiVector

**Objetivo:** Diseño técnico del MVP comercial (6-8 semanas)

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    LokiVector MVP                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   REST API   │  │  TCP Server   │  │  WebSocket   │ │
│  │   (Express)  │  │  (Custom)     │  │  (Optional)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                              │
│                  ┌─────────▼─────────┐                   │
│                  │   API Gateway     │                   │
│                  │  (Auth + Rate     │                   │
│                  │   Limiting)       │                   │
│                  └─────────┬─────────┘                   │
│                            │                              │
│                  ┌─────────▼─────────┐                   │
│                  │   Core Engine      │                   │
│                  │  - LokiJS          │                   │
│                  │  - Vector Search   │                   │
│                  │  - Replication     │                   │
│                  │  - MRU Cache      │                   │
│                  └─────────┬─────────┘                   │
│                            │                              │
│                  ┌─────────▼─────────┐                   │
│                  │   Persistence     │                   │
│                  │  - File System   │                   │
│                  │  - IndexedDB      │                   │
│                  │  - Memory         │                   │
│                  └───────────────────┘                   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Dashboard (React/Svelte)               │   │
│  │  - Collections Management                        │   │
│  │  - API Keys Management                          │   │
│  │  - Metrics & Logs                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Módulo de Autenticación

### API Keys

**Estructura:**
```javascript
{
  id: "key_abc123",
  userId: "user_xyz",
  keyHash: "sha256_hash",
  prefix: "lvk_", // LokiVector Key prefix
  createdAt: Date,
  expiresAt: Date | null,
  permissions: {
    collections: ["*"], // "*" = all, or specific list
    operations: ["read", "write"], // read, write, admin
    rateLimit: {
      requests: 1000,
      window: "1h" // 1h, 1d, 1w
    }
  },
  metadata: {
    name: "Production Key",
    description: "Key for production API"
  }
}
```

**Implementación:**
```javascript
// server/auth/api-keys.js
class APIKeyManager {
  constructor(db) {
    this.db = db;
    this.keysCollection = db.addCollection('api_keys', {
      unique: ['id'],
      indices: ['userId', 'prefix']
    });
  }
  
  generateKey(userId, permissions) {
    const id = `key_${generateId()}`;
    const key = `lvk_${generateSecureToken(32)}`;
    const keyHash = hashSHA256(key);
    
    this.keysCollection.insert({
      id,
      userId,
      keyHash,
      prefix: 'lvk_',
      createdAt: Date.now(),
      expiresAt: null,
      permissions,
      metadata: {}
    });
    
    return { id, key }; // Return key only once
  }
  
  validateKey(key) {
    const keyHash = hashSHA256(key);
    const keyDoc = this.keysCollection.findOne({ keyHash });
    
    if (!keyDoc) return null;
    if (keyDoc.expiresAt && keyDoc.expiresAt < Date.now()) {
      return null; // Expired
    }
    
    return keyDoc;
  }
}
```

**Middleware:**
```javascript
// server/middleware/auth.js
function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const keyDoc = apiKeyManager.validateKey(apiKey);
  if (!keyDoc) {
    return res.status(401).json({ error: 'Invalid or expired API key' });
  }
  
  req.apiKey = keyDoc;
  req.userId = keyDoc.userId;
  next();
}
```

---

## ⚡ Módulo de Rate Limiting

### Implementación

**Estructura:**
```javascript
// server/middleware/rate-limit.js
class RateLimiter {
  constructor() {
    this.requests = new Map(); // In-memory for MVP
    // Future: Use Redis for distributed
  }
  
  checkLimit(apiKeyId, endpoint, limit, window) {
    const key = `${apiKeyId}:${endpoint}`;
    const now = Date.now();
    const windowMs = this.parseWindow(window);
    
    if (!this.requests.has(key)) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }
    
    const record = this.requests.get(key);
    
    if (now > record.resetAt) {
      // Window expired, reset
      record.count = 1;
      record.resetAt = now + windowMs;
      return { allowed: true, remaining: limit - 1 };
    }
    
    if (record.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0,
        resetAt: record.resetAt
      };
    }
    
    record.count++;
    return { 
      allowed: true, 
      remaining: limit - record.count 
    };
  }
  
  parseWindow(window) {
    // "1h" -> 3600000ms
    const match = window.match(/^(\d+)([hdw])$/);
    if (!match) return 3600000; // Default 1h
    
    const [, amount, unit] = match;
    const multipliers = { h: 3600000, d: 86400000, w: 604800000 };
    return parseInt(amount) * multipliers[unit];
  }
}
```

**Middleware:**
```javascript
function rateLimit(req, res, next) {
  const apiKey = req.apiKey;
  const endpoint = req.path;
  const { requests, window } = apiKey.permissions.rateLimit;
  
  const result = rateLimiter.checkLimit(
    apiKey.id,
    endpoint,
    requests,
    window
  );
  
  // Set headers
  res.set({
    'X-RateLimit-Limit': requests,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': result.resetAt
  });
  
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      resetAt: result.resetAt
    });
  }
  
  next();
}
```

---

## 📊 Dashboard (React/Svelte)

### Estructura de Componentes

```
Dashboard/
├── App.jsx
├── components/
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── CollectionsList.jsx
│   ├── CollectionCard.jsx
│   ├── APIKeysList.jsx
│   ├── APIKeyForm.jsx
│   ├── Metrics.jsx
│   └── Logs.jsx
├── services/
│   ├── api.js
│   └── auth.js
└── styles/
    └── main.css
```

### API Endpoints para Dashboard

```javascript
// Dashboard-specific endpoints
app.get('/api/dashboard/stats', authenticateAPIKey, (req, res) => {
  const stats = {
    collections: db.listCollections().length,
    totalDocuments: db.listCollections().reduce((sum, coll) => 
      sum + coll.count(), 0),
    totalVectors: getTotalVectors(),
    storageUsed: getStorageSize(),
    requestsToday: getRequestsCount(req.userId, 'today')
  };
  res.json(stats);
});

app.get('/api/dashboard/collections', authenticateAPIKey, (req, res) => {
  const collections = db.listCollections().map(coll => ({
    name: coll.name,
    count: coll.count(),
    size: getCollectionSize(coll),
    hasVectorIndex: coll.hasVectorIndex(),
    createdAt: coll.meta.created
  }));
  res.json(collections);
});

app.get('/api/dashboard/logs', authenticateAPIKey, (req, res) => {
  const logs = getRecentLogs(req.userId, 100);
  res.json(logs);
});
```

---

## 🐳 Docker Setup

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Expose ports
EXPOSE 4000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  lokivector:
    build: .
    ports:
      - "4000:4000"  # HTTP
      - "5000:5000"  # TCP
    environment:
      - PORT=4000
      - TCP_PORT=5000
      - NODE_ENV=production
      - DATA_DIR=/data
    volumes:
      - ./data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
```

---

## 🛠️ CLI Tool

### Estructura

```javascript
// cli/loki-vector.js
#!/usr/bin/env node

const { program } = require('commander');
const { startServer } = require('./commands/start');
const { createKey } = require('./commands/keys');
const { listCollections } = require('./commands/collections');
const { stats } = require('./commands/stats');

program
  .name('loki-vector')
  .description('LokiVector CLI - AI-Era Embedded Database')
  .version('1.0.0');

program
  .command('start')
  .description('Start LokiVector server')
  .option('-p, --port <port>', 'HTTP port', '4000')
  .option('-t, --tcp-port <port>', 'TCP port', '5000')
  .option('-d, --data-dir <dir>', 'Data directory', './data')
  .action(startServer);

program
  .command('key:create')
  .description('Create new API key')
  .option('-n, --name <name>', 'Key name')
  .option('-u, --user <user>', 'User ID')
  .action(createKey);

program
  .command('collections:list')
  .description('List all collections')
  .option('-k, --key <key>', 'API key')
  .action(listCollections);

program
  .command('stats')
  .description('Show server statistics')
  .option('-k, --key <key>', 'API key')
  .action(stats);

program.parse();
```

---

## 📚 OpenAPI Specification

### Estructura Base

```yaml
openapi: 3.0.0
info:
  title: LokiVector API
  version: 1.0.0
  description: AI-Era Embedded Database API

servers:
  - url: http://localhost:4000
    description: Local server
  - url: https://api.lokivector.com
    description: Production server

security:
  - ApiKeyAuth: []

paths:
  /collections:
    get:
      summary: List collections
      security:
        - ApiKeyAuth: []
      responses:
        200:
          description: List of collections
    post:
      summary: Create collection
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                options:
                  type: object
      responses:
        201:
          description: Collection created

  /collections/{name}/insert:
    post:
      summary: Insert documents
      security:
        - ApiKeyAuth: []
      parameters:
        - name: name
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                documents:
                  type: array
                  items:
                    type: object
      responses:
        200:
          description: Documents inserted

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

---

## 🧪 Testing Strategy

### E2E Tests

```javascript
// tests/e2e/api.test.js
describe('API E2E Tests', () => {
  let apiKey;
  
  beforeAll(async () => {
    // Create test API key
    apiKey = await createTestAPIKey();
  });
  
  test('Create collection with API key', async () => {
    const response = await request(app)
      .post('/collections')
      .set('X-API-Key', apiKey)
      .send({ name: 'test', options: {} });
    
    expect(response.status).toBe(201);
  });
  
  test('Rate limiting works', async () => {
    // Make requests up to limit
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/collections')
        .set('X-API-Key', apiKey);
    }
    
    // Next request should be rate limited
    const response = await request(app)
      .get('/collections')
      .set('X-API-Key', apiKey);
    
    expect(response.status).toBe(429);
  });
});
```

---

## 📊 Métricas y Monitoreo

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    collections: db.listCollections().length,
    version: require('./package.json').version
  };
  
  res.json(health);
});
```

### Metrics Endpoint (Prometheus-ready)

```javascript
app.get('/metrics', (req, res) => {
  const metrics = [
    `# HELP lokivector_collections_total Total number of collections`,
    `# TYPE lokivector_collections_total gauge`,
    `lokivector_collections_total ${db.listCollections().length}`,
    ``,
    `# HELP lokivector_documents_total Total number of documents`,
    `# TYPE lokivector_documents_total gauge`,
    `lokivector_documents_total ${getTotalDocuments()}`,
    // ... more metrics
  ].join('\n');
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});
```

---

## 🚀 Deployment

### Variables de Entorno

```bash
# .env.example
PORT=4000
TCP_PORT=5000
NODE_ENV=production
DATA_DIR=./data
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
API_KEYS_ENABLED=true
```

### Startup Script

```javascript
// server/index.js (enhanced)
async function startServer() {
  // Initialize database
  await databaseInitialize();
  
  // Initialize API key manager
  const apiKeyManager = new APIKeyManager(db);
  
  // Setup middleware
  app.use(authenticateAPIKey);
  app.use(rateLimit);
  
  // Start servers
  const httpServer = app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
  });
  
  const tcpServer = startTCPServer(TCP_PORT);
  console.log(`TCP server running on port ${TCP_PORT}`);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    httpServer.close();
    tcpServer.close();
    db.save();
  });
}
```

---

## 📝 Checklist de Implementación

### Semana 1-2: Auth + Rate Limiting
- [ ] API Key Manager
- [ ] Key generation/validation
- [ ] Rate limiter
- [ ] Middleware integration
- [ ] Tests

### Semana 3-4: Dashboard
- [ ] React/Svelte setup
- [ ] Collections list
- [ ] API keys management
- [ ] Basic metrics
- [ ] Logs viewer

### Semana 5: Documentation
- [ ] OpenAPI spec
- [ ] Quick start guide
- [ ] Code examples
- [ ] API reference

### Semana 6: Infrastructure
- [ ] Docker setup
- [ ] CLI tool
- [ ] Health checks
- [ ] Metrics endpoint

### Semana 7-8: Polish
- [ ] E2E tests
- [ ] Benchmarks
- [ ] Bug fixes
- [ ] Performance optimization

---

**Arquitectura lista para implementar** ✅

