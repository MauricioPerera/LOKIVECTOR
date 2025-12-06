# LokiVector

**The AI-Era Embedded Database: Document Store + Vector Search with Crash-Tested Durability**

LokiVector combines the simplicity of a document database with the power of vector search, 
backed by enterprise-grade durability and crash recovery. Built for modern AI applications 
that need fast, reliable, and crash-safe data storage.

[![Join the chat at https://gitter.im/techfort/LokiJS](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/techfort/LokiJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
![alt CI-badge](https://travis-ci.org/techfort/LokiJS.svg?branch=master)
[![npm version](https://badge.fury.io/js/lokijs.svg)](http://badge.fury.io/js/lokijs)
[![alt packagequality](http://npm.packagequality.com/shield/lokijs.svg)](http://packagequality.com/#?package=lokijs)

## 🚀 What's New: LokiVector MVP

This fork extends LokiJS with production-ready features for the AI era:

- ✅ **Vector Search** - HNSW-based similarity search for embeddings
- ✅ **HTTP Server** - RESTful API with authentication and rate limiting
- ✅ **Replication** - Leader-Follower replication with persistent oplog
- ✅ **MRU Cache** - 200× speedup for frequent queries
- ✅ **API Keys** - Secure API key management
- ✅ **Dashboard** - Web-based administration dashboard
- ✅ **CLI** - Command-line interface for server management
- ✅ **OpenAPI Docs** - Complete API documentation with Swagger UI

## 📚 Documentation

### Core Documentation
- **[Full Documentation Index](docs/INDEX.md)** - Complete documentation guide
- **[Replication Guide](docs/REPLICATION.md)** - Leader-Follower replication
- **[Vector Search Guide](docs/VECTOR_SEARCH.md)** - HNSW vector similarity search
- **[MRU Cache Guide](docs/MRU_CACHE.md)** - Query result caching
- **[TCP Server Guide](docs/TCP_SERVER.md)** - High-performance TCP server

### MVP Documentation
- **[Quick Start Guide](GUIA_RAPIDA_MVP.md)** - Get started in 5 minutes
- **[MVP Architecture](ARQUITECTURA_MVP.md)** - Technical architecture
- **[Roadmap](ROADMAP_EJECUTABLE.md)** - Product roadmap
- **[API Documentation](docs/openapi.yaml)** - OpenAPI 3.0 specification

## 🎯 Quick Start

### Install

```bash
npm install lokijs
```

### Basic Usage

```javascript
const loki = require('lokijs');
const db = new loki('example.db');

// Add a collection
const users = db.addCollection('users');

// Insert documents
users.insert({ name: 'John', age: 30 });
users.insert({ name: 'Jane', age: 25 });

// Query
const results = users.find({ age: { $gte: 25 } });
console.log(results);
```

### Vector Search

```javascript
const products = db.addCollection('products');

// Create vector index
products.ensureVectorIndex('embedding', { m: 16, efConstruction: 200 });

// Insert documents with vectors
products.insert({ 
  name: 'Product 1', 
  embedding: [0.1, 0.2, 0.3, 0.4, 0.5] 
});

// Search for similar vectors
const results = products.findNearest('embedding', [0.15, 0.25, 0.35, 0.45, 0.55], 5);
```

### HTTP Server

```bash
# Start the server
node server/index.js

# Create an API key
curl -X POST http://localhost:4000/api/keys \
  -H "Content-Type: application/json" \
  -d '{"metadata":{"name":"My Key"}}'

# Use the API
curl -H "X-API-Key: YOUR_KEY" http://localhost:4000/collections
```

### Dashboard

Access the web dashboard at:
```
http://localhost:4000/dashboard
```

### CLI

```bash
# Install CLI globally
npm install -g lokijs

# Initialize project
loki-vector init

# Start server
loki-vector start

# Create API key
loki-vector key create

# List collections
loki-vector collections list
```

## 🛡️ Durability & Crash Recovery

LokiVector is **crash-safe** and validated with comprehensive end-to-end tests. 
We test crash recovery across documents, collections, vector indexes, and replication 
with automated end-to-end tests.

### What We Guarantee

✅ **Complete Data Recovery** - All documents recover after crashes  
✅ **Vector Index Integrity** - HNSW indexes rebuild correctly  
✅ **Oplog Consistency** - Replication logs maintain consistency  
✅ **Partial Write Safety** - No corruption from interrupted operations  
✅ **Idempotent Operations** - Safe to retry after failures  
✅ **Stress Tested** - Validated through multiple sequential crashes  

### How It Works

LokiVector uses a combination of:
- **Journal-based persistence** - All changes logged before commit
- **Automatic recovery** - Validates and repairs on startup
- **Index reconstruction** - Vector indexes rebuild if needed
- **Oplog consistency** - Replication state maintained across crashes

See [Durability Documentation](docs/DURABILITY.md) for technical details.

### Test Coverage

Our crash recovery suite includes:
- 7 comprehensive E2E test scenarios
- Document recovery validation
- Vector index recovery validation
- Replication consistency checks
- Partial write handling
- Idempotency verification
- Stress tests with multiple sequential crashes

**Result:** 0 data loss, 0 corruption, 100% recovery rate in all tested scenarios.

---

## 📊 Features

### Core Features
- **Document Store** - Fast in-memory document database
- **Indexing** - Unique and binary indexes for high performance
- **Views** - Dynamic views with filters and sorting
- **Persistence** - Multiple adapters (IndexedDB, File System, Memory)
- **Query API** - MongoDB-like query syntax

### Advanced Features
- **Vector Search** - HNSW algorithm for approximate nearest neighbor search
- **Replication** - Leader-Follower replication with oplog
- **MRU Cache** - Most Recently Used cache for query results
- **HTTP Server** - RESTful API with Express.js
- **TCP Server** - High-performance raw TCP server
- **Authentication** - API key-based authentication
- **Rate Limiting** - Configurable rate limits per API key
- **Dashboard** - Web-based administration interface
- **CLI** - Command-line interface
- **OpenAPI** - Complete API documentation

## 🏗️ Architecture

### Components

```
LokiJS Core
├── Document Store
├── Indexing System
├── Persistence Adapters
└── Query Engine

LokiVector Extensions
├── Vector Search (HNSW)
├── Replication (Leader-Follower)
├── MRU Cache
├── HTTP Server
├── TCP Server
├── Authentication (API Keys)
├── Rate Limiting
├── Dashboard
└── CLI
```

## 📈 Performance

- **Query Speed**: < 1ms for indexed queries
- **Vector Search**: < 0.5ms per search (HNSW)
- **MRU Cache**: 200× speedup for cached queries
- **TCP Server**: < 1ms latency
- **Memory**: Efficient in-memory storage

## 🧪 Testing

```bash
# Run unit tests
npm run test:node

# Run browser tests
npm run test:browser

# Run E2E tests (requires server running)
npm run test:e2e

# Run all tests
npm test
```

## 📦 Installation

### NPM

```bash
npm install lokijs
```

### Browser

```html
<script src="lokijs.min.js"></script>
```

## 🔧 Configuration

### Environment Variables

```bash
# Server port
PORT=4000

# Replication role
REPLICATION_ROLE=leader  # or 'follower'

# Leader URL (for followers)
LEADER_URL=http://localhost:4000

# Sync interval (for followers)
SYNC_INTERVAL=5000

# Database file
DB_FILE=data/loki-vector.db
```

## 📝 Examples

See the `examples/` directory for:
- Basic usage examples
- Vector search examples
- TCP server examples
- Replication examples
- HTTP API examples

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📜 License & Editions

LokiVector is available in three editions:

### 🆓 Community Edition (MIT License)
**Free and open source** - Perfect for development, prototyping, and open source projects.

**Includes:**
- Core document store
- Vector search (HNSW)
- HTTP/TCP server
- Crash recovery & durability
- API keys & basic rate limiting
- Community support

### 💼 Pro Edition (Commercial License)
**For production applications** - Includes replication, advanced caching, dashboard, and business support.

**Adds:**
- Leader-follower replication
- Advanced MRU cache
- Web dashboard
- Enhanced rate limiting
- Deployment templates
- Business hours support

### 🏢 Enterprise Edition (Commercial License)
**For mission-critical systems** - Multi-tenancy, SSO/SAML, RBAC, audit logs, and 24/7 support.

**Adds:**
- Multi-tenant support
- SSO/SAML integration
- Fine-grained RBAC
- Audit logging
- Automated backups
- 24/7 support & SLA

See [Editions Comparison](EDITIONS.md) for detailed feature comparison.

**Commercial Licensing:** Contact us at commercial@lokivector.io

---

## 📄 License

### Open Source (MIT)
Community Edition features are licensed under the MIT License. See [LICENSE](LICENSE) for details.

### Commercial License
Commercial features require a Commercial License. See [LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md) for terms.

### Feature Mapping
See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for a complete mapping of which features are MIT vs Commercial.

### Trademark
"LokiVector" is a trademark. See [TRADEMARK_POLICY.md](TRADEMARK_POLICY.md) for usage guidelines.

## 🙏 Acknowledgments

- Original LokiJS by Joe Minichino and contributors
- HNSW algorithm implementation
- Express.js for HTTP server
- All contributors and users

## 🔗 Links

- **GitHub**: https://github.com/MauricioPerera/db
- **Documentation**: See `docs/` directory
- **Issues**: GitHub Issues
- **Chat**: Gitter

---

**LokiJS** - Fast, flexible, and powerful document database  
**LokiVector** - Production-ready extensions for the AI era
