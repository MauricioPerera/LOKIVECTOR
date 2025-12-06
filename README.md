# LokiJS

The super fast in-memory javascript document oriented database.

## 📚 Documentation

- **[Full Documentation Index](docs/INDEX.md)** - Complete documentation guide
- **[Replication Guide](docs/REPLICATION.md)** - Leader-Follower replication
- **[Vector Search Guide](docs/VECTOR_SEARCH.md)** - HNSW vector similarity search
- **[MRU Cache Guide](docs/MRU_CACHE.md)** - Query result caching
- **[TCP Server Guide](docs/TCP_SERVER.md)** - High-performance TCP server

Enable offline-syncing to your SQL/NoSQL database servers with [SyncProxy](https://www.syncproxy.com) !! Code-free real time syncing, ideal for mobile, electron and web apps.

[![Join the chat at https://gitter.im/techfort/LokiJS](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/techfort/LokiJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
![alt CI-badge](https://travis-ci.org/techfort/LokiJS.svg?branch=master)
[![npm version](https://badge.fury.io/js/lokijs.svg)](http://badge.fury.io/js/lokijs)
[![alt packagequality](http://npm.packagequality.com/shield/lokijs.svg)](http://packagequality.com/#?package=lokijs)

## Overview

LokiJS is a document oriented database written in javascript, published under MIT License.
Its purpose is to store javascript objects as documents in a nosql fashion and retrieve them with a similar mechanism.
Runs in node (including cordova/phonegap and node-webkit),  [nativescript](http://www.nativescript.org) and the browser.
LokiJS is ideal for the following scenarios: 

1. client-side in-memory db is ideal (e.g., a session store)
2. performance critical applications
3. cordova/phonegap mobile apps where you can leverage the power of javascript and avoid interacting with native databases
4. data sets loaded into a browser page and synchronised at the end of the work session
5. node-webkit desktop apps
6. nativescript mobile apps that mix the power and ubiquity of javascript with native performance and ui

LokiJS supports indexing and views and achieves high-performance through maintaining unique and binary indexes (indices) for data.

## TCP Server

LokiJS includes a raw TCP server for high-performance, low-latency operations. The server is production-ready and fully tested.

For detailed documentation, see [docs/TCP_SERVER.md](docs/TCP_SERVER.md).

### Usage

```bash
# Start the TCP server
node server/tcp-server.js
```

### Protocol

The TCP server uses a simple newline-delimited JSON protocol.

**Request:**
```json
{
  "id": 1,
  "action": "find",
  "collection": "users",
  "query": { "age": { "$gt": 25 } }
}
```

**Response:**
```json
{
  "id": 1,
  "result": [...]
}
```

**Supported Actions:**
- `insert`: Insert a document.
- `find`: Find documents matching a query.
- `findOne`: Find a single document.
- `update`: Update a document. Supports finding by query if `$loki` ID is missing.
- `remove`: Remove documents. Supports removing by query.
- `count`: Count documents matching a query.

### Note on Update and Remove

For `update` and `remove` actions, if the provided data does not include the `$loki` ID, the server will attempt to find the document using the provided `query`. This ensures that you can update or remove documents based on their properties even if you don't have their internal ID.

## MRU Cache

LokiJS includes an MRU (Most Recently Used) cache to significantly improve query performance for frequent queries. The cache stores the results of `find()` queries and retrieves them instantly when the same query is executed again.

**Performance:** Up to 200x speedup for cached queries (0.16ms → 0.0006ms)

For detailed documentation, see [docs/MRU_CACHE.md](docs/MRU_CACHE.md).

### Usage

The cache is integrated into the `find()` method and works transparently. To enable it, you need to instantiate an `MRUCache` and attach it to your collection.

```javascript
var MRUCache = require('./src/mru-cache.js');
var users = db.addCollection('users');

// Enable MRU Cache with a capacity of 100 items
users.mruCache = new MRUCache(100);

// First query (executes normally and caches result)
users.find({ age: { $gt: 25 } });

// Second query (retrieves result from cache)
users.find({ age: { $gt: 25 } });
```

### HTTP API

You can enable the cache for a collection via the HTTP API:

```bash
POST /collections/:name/cache
{
  "capacity": 100
}
```

### Performance

Benchmarks show significant performance improvements for cached queries:

- **Without Cache**: ~0.16ms - 0.26ms per operation
- **With Cache**: ~0.0006ms - 0.0008ms per operation

This represents a speedup of over **200x** for frequent queries.

## Vector Search

LokiJS includes full support for vector similarity search using the HNSW (Hierarchical Navigable Small World) algorithm. This enables efficient nearest neighbor search for high-dimensional vectors, ideal for AI/ML applications, embeddings, and semantic search.

**Features:**
- HNSW algorithm for efficient approximate nearest neighbor search
- Support for Euclidean and Cosine distance functions
- Hybrid search (vector + query filters)
- Automatic index updates
- Index persistence
- Nested property support

For detailed documentation, see [docs/VECTOR_SEARCH.md](docs/VECTOR_SEARCH.md).

### Usage

```javascript
// Enable vector plugin
require('loki-vector-plugin');

var db = new loki('sandbox.db');
var items = db.addCollection('items');

// Create a vector index
items.ensureVectorIndex("embedding", {
  M: 16,              // Max connections per node (default: 16)
  efConstruction: 100, // Exploration factor during construction (default: 200)
  efSearch: 50,        // Exploration factor during search (default: 50)
  distanceFunction: 'cosine' // 'euclidean' or 'cosine' (default: 'euclidean')
});

// Insert documents with vectors
items.insert({ name: 'apple', embedding: [1, 0, 0] });
items.insert({ name: 'banana', embedding: [0, 1, 0] });

// Find nearest neighbors
var results = items.findNearest("embedding", [0.9, 0.1, 0], 5);
// results: [{ name: 'apple', dist: ... }, { name: 'banana', dist: ... }]
```

## LokiVector Server

A lightweight standalone server for vector search is included in `server/`.

### Run with Docker (Recommended)

```bash
# Build the image
docker build -t loki-vector-server .

# Run the server (persisting data to ./docker_data)
docker run -p 4000:4000 -v $(pwd)/docker_data:/app/data loki-vector-server
```

### Start Server Locally
```bash
node server/index.js
# Server runs on port 4000 by default
```

### API Endpoints

- **GET /**: Server status
- **POST /collections**: Create collection
  - Body: `{ "name": "items" }`
- **POST /collections/:name/index**: Create vector index
  - Body: `{ "field": "vector", "options": { "M": 16, "efConstruction": 100 } }`
- **POST /collections/:name/insert**: Insert documents
  - Body: `[{ "name": "doc1", "vector": [...] }]`
- **POST /collections/:name/search**: Search
  - Body: `{ "field": "vector", "vector": [...], "limit": 10 }`
- **POST /collections/:name/cache**: Enable MRU Cache
  - Body: `{ "capacity": 100 }`

### Replication and Clustering

LokiJS supports a Leader-Follower replication model for high availability and read scaling.

#### Run Cluster with Docker Compose

```bash
# Start a Leader-Follower cluster
docker compose up -d --build

# Leader runs on port 4000
# Follower runs on port 4001
```

#### Environment Variables

- `PORT`: Server port (default: 4000)
- `REPLICATION_ROLE`: `leader` or `follower` (default: `leader`)
- `LEADER_URL`: URL of the leader server (required for followers, e.g., `http://leader:4000`)
- `SYNC_INTERVAL`: Sync interval in ms for followers (default: 5000)

## KeyValueStore Optimization

The KeyValueStore implementation has been optimized to use a `Map` (O(1)) instead of binary search (O(log n)). This significantly improves performance for large datasets.

- **Previous Implementation**: Binary search on a sorted array.
- **New Implementation**: Javascript `Map` object.
- **Performance Gain**: Constant time complexity for `get` and `set` operations.

## MongoDB Compatibility

LokiJS now includes a compatibility layer for MongoDB-style CRUD operations.

- `insertOne(doc)`
- `insertMany(docs)`
- `updateOne(filter, update)`
- `updateMany(filter, update)`
- `deleteOne(filter)`
- `deleteMany(filter)`
- `countDocuments(filter)`

Supported update operators:
- `$set`: Sets the value of a field.
- `$inc`: Increments the value of a field.
