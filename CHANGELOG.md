# Changelog

All notable changes to LokiVector will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-12-06

### 🎉 Initial Public Release

#### Added

**Core Database**
- Document store with JSON-like documents
- Flexible schema, no migrations needed
- In-memory performance with disk persistence
- Binary and unique indexes
- Dynamic views
- MongoDB-like query syntax

**Vector Search**
- HNSW (Hierarchical Navigable Small World) index
- Approximate nearest neighbor search
- Support for multiple distance metrics (Euclidean, Cosine, Inner Product)
- Semantic search capabilities
- Vector index creation and management

**Server & API**
- HTTP REST API with Express.js
- Raw TCP server for low-latency operations
- API key authentication system
- Configurable rate limiting per API key
- Health check endpoint
- Metrics endpoint

**Replication** (Commercial)
- Leader-Follower replication
- Persistent oplog
- Automatic synchronization
- Read scaling support

**Durability & Crash Recovery**
- Crash-safe with validated recovery
- Journal-based persistence
- Automatic data recovery
- Vector index recovery
- Oplog consistency
- Comprehensive E2E crash recovery tests (7 scenarios)
- 0 data loss, 0 corruption guarantee

**Developer Tools**
- CLI (loki-vector) for server management
- Web-based admin dashboard
- OpenAPI 3.0 documentation with Swagger UI
- Comprehensive examples and guides

**Documentation**
- Complete technical documentation
- Durability & Crash Recovery guide
- Deployment guide (Docker, Kubernetes, Nginx)
- Replication guide
- Vector search guide
- API documentation (OpenAPI)

**Legal & Licensing**
- MIT License for Community Edition
- Commercial License for Pro/Enterprise
- Complete feature mapping (MIT vs Commercial)
- Trademark policy
- Legal compliance checklist

#### Security
- API key management with secure hashing
- Rate limiting per API key
- Authentication middleware
- Input validation

#### Performance
- MRU cache for query results (200× speedup)
- Optimized vector search (HNSW algorithm)
- Efficient in-memory storage
- Low-latency TCP server

#### Testing
- Comprehensive unit tests
- Integration tests
- E2E tests for HTTP server
- **Crash recovery E2E tests (7 scenarios)**
- Test helpers for crash simulation
- Database save validation helpers

---

## [Unreleased]

### Planned
- Graph database capabilities
- Additional vector distance metrics
- Performance optimizations
- Enhanced monitoring
- Multi-tenant support (Enterprise)
- SSO/SAML integration (Enterprise)
- Advanced RBAC (Enterprise)

---

## Version History

- **0.1.0** (2025-12-06) - Initial public release with crash-tested durability

---

**For detailed release notes, see:** [GitHub Releases](https://github.com/MauricioPerera/db/releases)
