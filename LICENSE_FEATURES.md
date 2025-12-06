# LokiVector License Feature Mapping

**Effective Date:** 2025-12-06

This document provides a clear mapping of which features are available under MIT License and which require a Commercial License.

---

## MIT License Features (Open Source)

The following features are available under the MIT License and can be used freely for any purpose, including commercial use:

### Core Database
- ✅ Document store (JSON-like documents)
- ✅ Collection management
- ✅ Indexing (binary, unique indexes)
- ✅ Dynamic views
- ✅ Query API (MongoDB-like syntax)
- ✅ Persistence adapters (IndexedDB, File System, Memory)

### Vector Search
- ✅ HNSW vector index
- ✅ Vector similarity search
- ✅ Multiple distance metrics (Euclidean, Cosine, Inner Product)
- ✅ Vector index creation and management

### Basic Server
- ✅ HTTP REST API
- ✅ TCP server
- ✅ Basic API key authentication
- ✅ Basic rate limiting

### Durability & Crash Recovery
- ✅ Crash recovery (validated with E2E tests)
- ✅ Journal-based persistence
- ✅ Automatic data recovery
- ✅ Vector index recovery
- ✅ Basic durability guarantees

### Developer Tools
- ✅ CLI (basic commands)
- ✅ OpenAPI documentation
- ✅ Basic dashboard
- ✅ Examples and documentation

### Source Code
- ✅ All source code in `src/` directory (except Commercial Features)
- ✅ All test files
- ✅ All documentation files
- ✅ Build scripts and configuration

---

## Commercial License Features

The following features require a Commercial License and are **NOT** available under MIT:

### Replication
- ❌ Leader-Follower replication
- ❌ Persistent oplog
- ❌ Automatic failover
- ❌ Read scaling
- ❌ Geographic distribution support
- ❌ Replication monitoring and management

**Files/Directories:**
- `src/loki-oplog.js` (commercial version with advanced features)
- `server/replication/` (commercial features)
- Advanced replication tooling

### Advanced Caching
- ❌ Advanced MRU cache with configurable policies
- ❌ Cache warming strategies
- ❌ Performance optimization tools
- ❌ Cache analytics

**Files/Directories:**
- `src/mru-cache.js` (advanced commercial version)
- Advanced caching configurations

### Multi-Tenancy
- ❌ Tenant isolation
- ❌ Per-tenant resource limits
- ❌ Tenant-specific configurations
- ❌ Billing integration support

**Files/Directories:**
- `server/multi-tenant/` (if implemented)
- Multi-tenant management tools

### Enterprise Security
- ❌ SSO/SAML integration
- ❌ Fine-grained RBAC (Role-Based Access Control)
- ❌ Advanced audit logging
- ❌ Compliance features (SOC 2, GDPR ready)

**Files/Directories:**
- `server/auth/sso/` (if implemented)
- `server/auth/rbac/` (if implemented)
- `server/audit/` (if implemented)

### Enterprise Operations
- ❌ Automated backups
- ❌ Point-in-time recovery
- ❌ Disaster recovery planning
- ❌ Custom deployment architectures
- ❌ Enterprise deployment templates

**Files/Directories:**
- `deployment/enterprise/` (if implemented)
- Enterprise tooling

### Enterprise Monitoring
- ❌ Enterprise-grade metrics
- ❌ Custom dashboards
- ❌ Advanced alerting
- ❌ Performance analytics
- ❌ Capacity planning tools

**Files/Directories:**
- `server/monitoring/enterprise/` (if implemented)

### Support & Services
- ❌ Priority support
- ❌ SLA guarantees
- ❌ Dedicated account manager
- ❌ On-site training
- ❌ Custom consulting
- ❌ Architecture reviews

---

## Feature Status by Edition

### Community Edition (MIT)
- ✅ All MIT License Features
- ❌ No Commercial Features

### Pro Edition (Commercial)
- ✅ All MIT License Features
- ✅ Leader-Follower Replication
- ✅ Advanced MRU Cache
- ✅ Enhanced Dashboard
- ✅ Advanced Rate Limiting
- ✅ Deployment Templates
- ❌ Multi-Tenancy
- ❌ SSO/SAML
- ❌ Enterprise Security Features

### Enterprise Edition (Commercial)
- ✅ All MIT License Features
- ✅ All Pro Edition Features
- ✅ Multi-Tenancy
- ✅ SSO/SAML & RBAC
- ✅ Audit Logging
- ✅ Automated Backups
- ✅ Enterprise Monitoring
- ✅ 24/7 Support & SLA

---

## Source Code Organization

### MIT Licensed Code
```
src/
├── lokijs.js                    ✅ MIT
├── loki-hnsw-index.js          ✅ MIT
├── loki-vector-plugin.js       ✅ MIT
├── loki-indexed-adapter.js     ✅ MIT
├── loki-fs-sync-adapter.js     ✅ MIT
└── [other adapters]           ✅ MIT

server/
├── index.js                    ✅ MIT (basic features)
├── auth/
│   └── api-keys.js             ✅ MIT (basic)
└── middleware/
    ├── auth.js                 ✅ MIT (basic)
    └── rate-limit.js            ✅ MIT (basic)

docs/                           ✅ MIT
spec/                           ✅ MIT
```

### Commercial Licensed Code
```
src/
└── loki-oplog.js               ❌ Commercial (advanced features)

server/
├── replication/                ❌ Commercial
├── multi-tenant/               ❌ Commercial
├── auth/
│   ├── sso/                    ❌ Commercial
│   └── rbac/                   ❌ Commercial
├── audit/                      ❌ Commercial
└── monitoring/enterprise/      ❌ Commercial

deployment/enterprise/          ❌ Commercial
```

---

## Clarifications

### What "Commercial Use" Means

**Commercial use includes:**
- Using LokiVector in a product you sell
- Using LokiVector in an internal business system
- Offering LokiVector as a hosted service (SaaS)
- Using Commercial Features in any context

**Commercial use does NOT include:**
- Personal projects
- Educational use
- Open source projects (using MIT features only)
- Contributing to LokiVector itself

### Dual Licensing Model

LokiVector uses a **dual licensing model**:

1. **MIT License** - For open source and non-commercial use
2. **Commercial License** - For commercial use and enterprise features

You can use MIT features commercially, but Commercial Features require a paid license.

### Feature Development

- Features developed for Community Edition are MIT licensed
- Features developed for Pro/Enterprise are Commercial licensed
- The license type is determined at the time of feature development

---

## Questions?

- **License Questions:** See [LICENSE-COMMERCIAL.md](LICENSE-COMMERCIAL.md)
- **Feature Questions:** Open an issue on GitHub
- **Commercial Licensing:** Email commercial@lokivector.io

---

**Version:** 1.0  
**Last Updated:** 2025-12-06

