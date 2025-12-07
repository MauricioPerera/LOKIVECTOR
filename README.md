# LokiVector

**The AI-Era Embedded Database: Document Store + Vector Search with Crash-Tested Durability**

LokiVector combines the simplicity of a document database with the power of vector search, 
backed by enterprise-grade durability and crash recovery. Built for modern AI applications 
that need fast, reliable, and crash-safe data storage.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](https://github.com/MauricioPerera/LOKIVECTOR/releases)
[![GitHub stars](https://img.shields.io/github/stars/MauricioPerera/LOKIVECTOR?style=social)](https://github.com/MauricioPerera/LOKIVECTOR)

## 🎉 Latest Release: v0.1.0

**Community Edition (MIT License)** - First public release with crash-tested durability and vector search.

### What's New in v0.1.0

This release includes production-ready features for the AI era:

- ✅ **Vector Search** - HNSW-based similarity search for embeddings
- ✅ **HTTP Server** - RESTful API with authentication and rate limiting
- ✅ **API Keys** - Secure API key management
- ✅ **Rate Limiting** - Configurable rate limits per API key
- ✅ **CLI** - Command-line interface for server management
- ✅ **OpenAPI Docs** - Complete API documentation with Swagger UI
- ✅ **Crash Recovery** - Validated crash recovery with E2E tests

**Commercial Features (Pro/Enterprise):**
- 💼 **Replication** - Leader-Follower replication with persistent oplog
- 💼 **Advanced MRU Cache** - 200× speedup for frequent queries
- 💼 **Dashboard** - Web-based administration dashboard

## 📚 Documentation

### Core Documentation
- **[Full Documentation Index](docs/INDEX.md)** - Complete documentation guide
- **[Vector Search Guide](docs/VECTOR_SEARCH.md)** - HNSW vector similarity search
- **[TCP Server Guide](docs/TCP_SERVER.md)** - High-performance TCP server
- **[Durability Guide](docs/DURABILITY.md)** - Crash recovery and data integrity

### Commercial Documentation (Pro/Enterprise)
- **[Replication Guide](docs/REPLICATION.md)** - Leader-Follower replication (Commercial)
- **[MRU Cache Guide](docs/MRU_CACHE.md)** - Advanced query result caching (Commercial)

### MVP Documentation
- **[Quick Start Guide](GUIA_RAPIDA_MVP.md)** - Get started in 5 minutes
- **[MVP Architecture](ARQUITECTURA_MVP.md)** - Technical architecture
- **[Roadmap](ROADMAP_EJECUTABLE.md)** - Product roadmap
- **[API Documentation](docs/openapi.yaml)** - OpenAPI 3.0 specification

## 🎯 Quick Start

### Install

```bash
npm install @lokivector/core
```

### Basic Usage

```javascript
const loki = require('@lokivector/core');
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
node server/core/index.js

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
npm install -g @lokivector/core

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
We test crash recovery across documents, collections, and vector indexes 
with automated end-to-end tests.

### What We Guarantee

✅ **Complete Data Recovery** - All documents recover after crashes  
✅ **Vector Index Integrity** - HNSW indexes rebuild correctly  
✅ **Partial Write Safety** - No corruption from interrupted operations  
✅ **Idempotent Operations** - Safe to retry after failures  
✅ **Stress Tested** - Validated through multiple sequential crashes

**Note:** Oplog consistency and replication recovery are tested in Commercial editions. See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for details.  

### How It Works

LokiVector uses a combination of:
- **Journal-based persistence** - All changes logged before commit
- **Automatic recovery** - Validates and repairs on startup
- **Index reconstruction** - Vector indexes rebuild if needed

See [Durability Documentation](docs/DURABILITY.md) for technical details.

### Test Coverage

Our crash recovery suite includes:
- 7 comprehensive E2E test scenarios
- Document recovery validation
- Vector index recovery validation
- Partial write handling
- Idempotency verification
- Stress tests with multiple sequential crashes

**Note:** Replication consistency checks are part of Commercial edition tests. See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for details.

**Result:** 0 data loss, 0 corruption, 100% recovery rate in all tested scenarios.

---

## 📊 Features

### Core Features
- **Document Store** - Fast in-memory document database
- **Indexing** - Unique and binary indexes for high performance
- **Views** - Dynamic views with filters and sorting
- **Persistence** - Multiple adapters (IndexedDB, File System, Memory)
- **Query API** - MongoDB-like query syntax

### Advanced Features (Community Edition - MIT)
- **Vector Search** - HNSW algorithm for approximate nearest neighbor search
- **HTTP Server** - RESTful API with Express.js
- **TCP Server** - High-performance raw TCP server
- **Authentication** - API key-based authentication
- **Rate Limiting** - Configurable rate limits per API key
- **CLI** - Command-line interface
- **OpenAPI** - Complete API documentation
- **Crash Recovery** - Validated crash recovery with E2E tests

### Commercial Features (Pro/Enterprise - Commercial License)
- **Replication** - Leader-Follower replication with persistent oplog
- **Advanced MRU Cache** - Most Recently Used cache for query results (200× speedup)
- **Dashboard** - Web-based administration interface
- **Multi-Tenant Support** - Isolated data per tenant (Enterprise)
- **SSO/SAML** - Single sign-on integration (Enterprise)
- **RBAC** - Fine-grained role-based access control (Enterprise)
- **Audit Logs** - Comprehensive audit logging (Enterprise)

See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for complete feature mapping.

## 🏗️ Architecture

### Components

```
LokiJS Core [MIT]
├── Document Store
├── Indexing System
├── Persistence Adapters
└── Query Engine

LokiVector Extensions [MIT]
├── Vector Search (HNSW)
├── HTTP Server
├── TCP Server
├── Authentication (API Keys)
├── Rate Limiting
└── CLI

Commercial Features [Commercial License]
├── Replication (Leader-Follower)
├── Advanced MRU Cache
└── Dashboard
```

## 📈 Performance

- **Query Speed**: < 1ms for indexed queries
- **Vector Search**: < 0.5ms per search (HNSW)
- **TCP Server**: < 1ms latency
- **Memory**: Efficient in-memory storage

**Note:** Advanced MRU Cache (200× speedup) is available in Commercial editions. See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for details.

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
npm install @lokivector/core
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

# Replication role (Commercial feature - requires Pro/Enterprise license)
# REPLICATION_ROLE=leader  # or 'follower'
# LEADER_URL=http://localhost:4000
# SYNC_INTERVAL=5000

# Database file
DB_FILE=data/loki-vector.db
```

## 📝 Examples

See the `examples/` directory for:
- Basic usage examples
- Vector search examples
- TCP server examples
- HTTP API examples

**Note:** Replication examples are available in Commercial editions. See [LICENSE_FEATURES.md](LICENSE_FEATURES.md) for details.

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

- **GitHub**: https://github.com/MauricioPerera/LOKIVECTOR
- **Releases**: https://github.com/MauricioPerera/LOKIVECTOR/releases
- **Issues**: https://github.com/MauricioPerera/LOKIVECTOR/issues
- **Documentation**: See `docs/` directory
- **Issues**: GitHub Issues
- **Chat**: Gitter

---

**LokiJS** - Fast, flexible, and powerful document database  
**LokiVector** - Production-ready extensions for the AI era
