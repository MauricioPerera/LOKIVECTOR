# LokiVector Editions

LokiVector is available in three editions, each designed for different use cases and requirements.

---

## 🆓 Community Edition (Open Source)

**License:** MIT  
**Price:** Free  
**Target:** Developers, startups, open source projects

### Features

✅ **Core Database**
- Document store with JSON-like documents
- Flexible schema, no migrations needed
- In-memory performance with disk persistence

✅ **Vector Search**
- HNSW (Hierarchical Navigable Small World) index
- Approximate nearest neighbor search
- Support for multiple distance metrics (Euclidean, Cosine, Inner Product)
- Semantic search capabilities

✅ **Server & API**
- HTTP REST API
- Raw TCP server for low-latency operations
- API key authentication
- Basic rate limiting

✅ **Durability & Crash Recovery**
- Crash-safe with validated recovery
- Automatic data persistence
- Journal consistency
- Vector index recovery
- End-to-end crash recovery tests

✅ **Developer Experience**
- Node.js and browser support
- Simple API, easy integration
- Comprehensive documentation
- Active community support

### Use Cases

- Prototyping and development
- Small to medium applications
- Open source projects
- Learning and experimentation
- Embedded applications

### Limitations

- Single-node deployment
- Basic caching
- Community support only
- No replication
- No multi-tenant support

---

## 💼 Pro Edition (Commercial)

**License:** Commercial  
**Price:** Contact for pricing  
**Target:** Growing businesses, production applications

### Everything in Community, Plus:

✅ **Replication**
- Leader-follower replication
- Automatic failover
- Read scaling
- Geographic distribution support

✅ **Advanced Caching**
- MRU (Most Recently Used) cache
- Configurable cache policies
- Cache warming strategies
- Performance optimization

✅ **Enhanced Server Features**
- Advanced rate limiting
- Request prioritization
- Connection pooling
- Load balancing support

✅ **Dashboard & Monitoring**
- Web-based admin dashboard
- Real-time metrics
- Collection management
- API key management
- Health monitoring

✅ **Deployment Tools**
- Docker Compose templates
- Kubernetes Helm charts
- Deployment automation
- Configuration management

✅ **Support**
- Email support (business hours)
- Documentation priority
- Bug fix priority
- Feature request consideration

### Use Cases

- Production applications
- Growing startups
- Medium-sized businesses
- Applications requiring high availability
- Multi-region deployments

---

## 🏢 Enterprise Edition (Commercial)

**License:** Commercial  
**Price:** Custom pricing  
**Target:** Large organizations, mission-critical systems

### Everything in Pro, Plus:

✅ **Multi-Tenancy**
- Tenant isolation
- Per-tenant resource limits
- Tenant-specific configurations
- Billing integration support

✅ **Advanced Security**
- SSO/SAML integration
- Fine-grained RBAC (Role-Based Access Control)
- Audit logging
- Compliance features (SOC 2, GDPR ready)

✅ **Enterprise Operations**
- Automated backups
- Point-in-time recovery
- Disaster recovery planning
- Custom deployment architectures

✅ **Advanced Monitoring**
- Enterprise-grade metrics
- Custom dashboards
- Alerting and notifications
- Performance analytics
- Capacity planning tools

✅ **Support & Services**
- 24/7 priority support
- SLA guarantees (99.9% uptime)
- Dedicated account manager
- On-site training
- Custom consulting
- Architecture reviews

✅ **Compliance & Governance**
- Audit trails
- Data retention policies
- Compliance reporting
- Security certifications

### Use Cases

- Large enterprises
- Mission-critical systems
- Regulated industries
- High-scale applications
- Multi-tenant SaaS platforms

---

## Comparison Table

| Feature | Community | Pro | Enterprise |
|---------|-----------|-----|------------|
| **License** | MIT | Commercial | Commercial |
| **Price** | Free | Paid | Custom |
| **Core Database** | ✅ | ✅ | ✅ |
| **Vector Search** | ✅ | ✅ | ✅ |
| **Crash Recovery** | ✅ | ✅ | ✅ |
| **HTTP/TCP Server** | ✅ | ✅ | ✅ |
| **API Keys** | ✅ | ✅ | ✅ |
| **Replication** | ❌ | ✅ | ✅ |
| **Advanced Caching** | ❌ | ✅ | ✅ |
| **Dashboard** | Basic | ✅ | ✅ |
| **Multi-Tenancy** | ❌ | ❌ | ✅ |
| **SSO/SAML** | ❌ | ❌ | ✅ |
| **RBAC** | ❌ | ❌ | ✅ |
| **Audit Logging** | ❌ | ❌ | ✅ |
| **Automated Backups** | ❌ | ❌ | ✅ |
| **Support** | Community | Business Hours | 24/7 |
| **SLA** | ❌ | ❌ | ✅ |
| **Training** | ❌ | ❌ | ✅ |

---

## Migration Path

You can start with Community Edition and upgrade as your needs grow:

1. **Start:** Community Edition for development and prototyping
2. **Scale:** Upgrade to Pro when you need replication and production features
3. **Enterprise:** Move to Enterprise for mission-critical deployments

All editions use the same core codebase, making upgrades seamless.

---

## Getting Started

- **Community:** Just clone and use! See [README.md](README.md)
- **Pro/Enterprise:** Contact us at **commercial@lokivector.io**

---

## Questions?

- **Community Edition:** Open an issue on GitHub
- **Commercial Licensing:** Email commercial@lokivector.io
- **General Questions:** See [Documentation](docs/)

