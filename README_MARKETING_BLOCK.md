# Marketing Blocks for README

## Tagline (Top of README)

```markdown
# LokiVector

**The AI-Era Embedded Database: Document Store + Vector Search with Crash-Tested Durability**

LokiVector combines the simplicity of a document database with the power of vector search, 
backed by enterprise-grade durability and crash recovery. Built for modern AI applications 
that need fast, reliable, and crash-safe data storage.
```

---

## Why LokiVector Section

```markdown
## Why LokiVector?

### 🚀 Built for AI Applications
- **Vector Search**: HNSW index for semantic search and similarity queries
- **Document Store**: Flexible JSON-like documents, no schema migrations
- **Fast**: In-memory performance with disk persistence

### 🛡️ Enterprise-Grade Durability
- **Crash-Safe**: Validated with automated end-to-end crash recovery tests
- **Data Integrity**: Automatic recovery of documents, collections, and vector indexes
- **No Data Loss**: Journal consistency ensures durability even after unexpected crashes

### ⚡ Production-Ready
- **HTTP & TCP Servers**: REST API and low-latency TCP interface
- **Authentication**: API key management with rate limiting
- **Monitoring**: Built-in health checks and metrics
- **Deployment**: Docker, Kubernetes, and cloud-ready

### 🎯 Simple Yet Powerful
- **Easy Integration**: Simple API, works in Node.js and browsers
- **No Dependencies**: Lightweight, embeddable database
- **Comprehensive Docs**: Full documentation with examples
```

---

## Durability & Crash Recovery Section

```markdown
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
```

---

## License & Editions Section

```markdown
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
```

---

## Quick Start Section (Enhanced)

```markdown
## 🚀 Quick Start

### Installation

```bash
npm install lokijs
```

### Basic Usage

```javascript
const loki = require('lokijs');
require('lokijs/src/loki-vector-plugin');

// Create database
const db = new loki('example.db', {
  autosave: true,
  autosaveInterval: 4000
});

// Create collection with vector index
const items = db.addCollection('items', {
  vectorIndices: {
    embedding: {
      m: 16,
      efConstruction: 200,
      efSearch: 50
    }
  }
});

// Insert documents with vectors
items.insert({
  id: 1,
  name: 'Document 1',
  embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
});

// Vector search
const results = items.findNearest('embedding', [0.1, 0.2, 0.3, 0.4, 0.5], 5);
```

### HTTP Server

```bash
# Start server
node server/index.js

# Create API key
curl -X POST http://localhost:4000/api/keys \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1"}'

# Use API key
curl -H "X-API-Key: YOUR_KEY" \
  http://localhost:4000/collections
```

See [Documentation](docs/) for more examples.
```

---

## Features Section (Enhanced)

```markdown
## ✨ Features

### Core Database
- 📄 **Document Store** - JSON-like documents, flexible schema
- 🔍 **Vector Search** - HNSW index for semantic search
- ⚡ **High Performance** - In-memory with disk persistence
- 🔄 **Replication** - Leader-follower replication (Pro/Enterprise)

### Durability & Reliability
- 🛡️ **Crash-Safe** - Validated crash recovery
- 💾 **Data Integrity** - Journal-based persistence
- 🔧 **Auto-Recovery** - Automatic index reconstruction
- ✅ **Tested** - Comprehensive E2E crash recovery tests

### Server & API
- 🌐 **HTTP Server** - RESTful API
- 🔌 **TCP Server** - Low-latency interface
- 🔐 **Authentication** - API key management
- 📊 **Rate Limiting** - Configurable request limits

### Developer Experience
- 📚 **Well Documented** - Comprehensive guides
- 🐳 **Docker Ready** - Containerized deployment
- ☸️ **Kubernetes** - Helm charts available
- 🧪 **Tested** - Full test coverage
```

---

## Use Cases Section

```markdown
## 🎯 Use Cases

### AI & Machine Learning
- **Semantic Search** - Find similar documents using embeddings
- **RAG Applications** - Store and search vectorized knowledge bases
- **Recommendation Systems** - Similarity-based recommendations
- **NLP Applications** - Document similarity and clustering

### Modern Applications
- **Real-time Analytics** - Fast queries on document data
- **Content Management** - Flexible document storage
- **IoT Applications** - Embedded database for edge devices
- **Microservices** - Lightweight, embeddable database

### Enterprise
- **Multi-tenant SaaS** - Isolated data per tenant (Enterprise)
- **High Availability** - Replication for failover (Pro/Enterprise)
- **Compliance** - Audit logs and data retention (Enterprise)
- **Mission-Critical** - Crash-safe with validated recovery
```

