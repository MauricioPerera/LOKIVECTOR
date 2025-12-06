# Launch Post: Introducing LokiVector

## For Hacker News / Reddit / Dev.to

---

**Title:** Introducing LokiVector: An Embedded Document + Vector Database with Crash-Tested Durability

**Body:**

Hey HN/Reddit/dev community,

I'm excited to open-source **LokiVector** - an embedded document database with vector search capabilities, built for modern AI applications.

### What Makes It Different

Most vector databases are either:
- Cloud-only services (expensive, vendor lock-in)
- Complex to deploy (require Kubernetes, lots of moving parts)
- Missing durability guarantees (what happens if it crashes?)

LokiVector solves this by being:
- ✅ **Embeddable** - Runs in Node.js or browser, no external services
- ✅ **Crash-Safe** - Validated with automated E2E crash recovery tests
- ✅ **Simple** - JSON documents + vector search, no schema migrations
- ✅ **Fast** - In-memory performance with disk persistence

### The Durability Story

This is what I'm most proud of. We test crash recovery across:
- Documents and collections
- Vector indexes (HNSW)
- Replication state (oplog)
- Partial writes and idempotency

All validated with 7 comprehensive E2E test scenarios. You can literally kill the process mid-write and it recovers correctly.

**We test crash recovery across documents, collections, vector indexes and replication with automated end-to-end tests.**

### What's Included

**Core:**
- Document store (JSON-like, flexible schema)
- Vector search (HNSW index)
- HTTP REST API + TCP server
- API key authentication
- Crash recovery & durability

**Pro/Enterprise (commercial):**
- Leader-follower replication
- Advanced caching
- Multi-tenant support
- SSO/SAML, RBAC
- 24/7 support

### Use Cases

- Semantic search in RAG applications
- Document similarity and clustering
- Recommendation systems
- Real-time analytics
- Embedded AI applications

### Tech Stack

- Node.js (works in browser too)
- HNSW algorithm for vector search
- Journal-based persistence
- Express.js for HTTP server

### Getting Started

```bash
npm install lokijs
```

```javascript
const loki = require('lokijs');
require('lokijs/src/loki-vector-plugin');

const db = new loki('example.db', { autosave: true });
const items = db.addCollection('items', {
  vectorIndices: { embedding: { m: 16 } }
});

items.insert({ id: 1, embedding: [0.1, 0.2, 0.3] });
const results = items.findNearest('embedding', [0.1, 0.2, 0.3], 5);
```

### Documentation

- [Full Documentation](https://github.com/MauricioPerera/db)
- [Durability & Crash Recovery](docs/DURABILITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Editions Comparison](EDITIONS.md)

### License

Community Edition: MIT (free for open source and non-commercial use)  
Pro/Enterprise: Commercial license available

### Why Open Source This?

I built this because I needed a crash-safe vector database that I could embed in applications without vendor lock-in. The durability testing was crucial - I've seen too many databases lose data on crashes.

I'm open-sourcing the core because:
1. I believe in open source
2. I want community feedback
3. Commercial features (replication, multi-tenant) fund development

### What's Next

- More vector distance metrics
- Graph database capabilities (in progress)
- Performance optimizations
- Community feedback and contributions

### Try It Out

```bash
git clone https://github.com/MauricioPerera/db.git
cd db
npm install
npm test
node server/index.js
```

I'd love to hear your feedback, use cases, and contributions!

**GitHub:** https://github.com/MauricioPerera/db  
**Docs:** https://github.com/MauricioPerera/db/tree/main/docs  
**Issues:** https://github.com/MauricioPerera/db/issues

---

## For Twitter/X

**Thread:**

1/ 🚀 Introducing **LokiVector** - an embedded document + vector database with crash-tested durability.

Built for AI apps that need fast, reliable, crash-safe data storage.

✅ Document store  
✅ Vector search (HNSW)  
✅ Crash-safe with validated recovery  
✅ HTTP + TCP servers  

2/ What makes it different?

Most vector DBs are cloud-only or missing durability guarantees.

LokiVector is:
- Embeddable (Node.js/browser)
- Crash-safe (validated with E2E tests)
- Simple (JSON docs, no migrations)
- Fast (in-memory + disk)

3/ The durability story:

We test crash recovery across documents, collections, vector indexes, and replication with automated end-to-end tests.

You can kill the process mid-write and it recovers correctly. Zero data loss.

4/ Use cases:
- Semantic search (RAG)
- Document similarity
- Recommendations
- Real-time analytics
- Embedded AI apps

5/ Getting started:

```bash
npm install lokijs
```

```javascript
const db = new loki('example.db');
const items = db.addCollection('items', {
  vectorIndices: { embedding: { m: 16 } }
});
```

6/ License:
- Community: MIT (free)
- Pro/Enterprise: Commercial

Open source core, commercial features fund development.

7/ Try it:

```bash
git clone https://github.com/MauricioPerera/db.git
cd db && npm install && npm test
```

Docs: https://github.com/MauricioPerera/db

Feedback welcome! 🎉

---

## For LinkedIn

**Post:**

Excited to open-source **LokiVector** - an embedded document and vector database designed for modern AI applications.

**The Problem:**
Most vector databases are either cloud-only (expensive, vendor lock-in) or missing critical durability guarantees. What happens when your database crashes mid-write?

**The Solution:**
LokiVector combines:
- Document store (flexible JSON, no schema migrations)
- Vector search (HNSW for semantic search)
- Crash-safe durability (validated with automated E2E tests)
- Embeddable (runs in Node.js or browser)

**What Makes It Different:**
We test crash recovery across documents, collections, vector indexes, and replication with automated end-to-end tests. You can literally kill the process mid-write and it recovers correctly.

**Use Cases:**
- Semantic search in RAG applications
- Document similarity and clustering
- Recommendation systems
- Real-time analytics
- Embedded AI applications

**License Model:**
- Community Edition: MIT (free for open source)
- Pro/Enterprise: Commercial (replication, multi-tenant, support)

Open source core, commercial features fund sustainable development.

**Try It:**
```bash
npm install lokijs
```

Full documentation and examples: https://github.com/MauricioPerera/db

I'd love to hear your feedback and use cases!

#OpenSource #Database #VectorSearch #AI #MachineLearning #DeveloperTools

