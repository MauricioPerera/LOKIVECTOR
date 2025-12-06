# E2E Tests for LokiVector Server

## Overview

End-to-end tests for the LokiVector HTTP server. These tests verify that all API endpoints work correctly in an integrated environment.

## Prerequisites

1. **Server must be running**
   ```bash
   node server/index.js
   ```

2. **Node.js dependencies**
   - `node-fetch` (already in dependencies)

## Running Tests

### Option 1: Run E2E tests only
```bash
npm run test:e2e
```

### Option 2: Run with custom server URL
```bash
TEST_SERVER_URL=http://localhost:4000 npm run test:e2e
```

### Option 3: Run all tests (unit + E2E)
```bash
npm run test:node && npm run test:e2e
```

## Test Coverage

### Health & Status
- ✅ Server status endpoint
- ✅ Health check endpoint
- ✅ Prometheus metrics endpoint

### API Key Management
- ✅ Create API key
- ✅ List API keys
- ✅ Get API key statistics
- ✅ Revoke API key (via DELETE)

### Collections
- ✅ List collections
- ✅ Create collection
- ✅ Duplicate collection handling

### Documents CRUD
- ✅ Insert documents (single & multiple)
- ✅ Find documents with queries
- ✅ Update documents with operators
- ✅ Remove documents

### Vector Search
- ✅ Create vector index
- ✅ Insert documents with vectors
- ✅ Vector similarity search
- ✅ Hybrid search (vector + filter)

### Authentication & Security
- ✅ API key required for protected endpoints
- ✅ Invalid API key rejection
- ✅ Rate limiting headers

### Features
- ✅ MRU cache enablement
- ✅ Error handling (404, 400, etc.)

## Test Structure

Tests are organized by feature area:
- `Health & Status` - Basic server endpoints
- `API Key Management` - Authentication system
- `Collections` - Collection operations
- `Documents CRUD` - Document operations
- `Vector Search` - Vector similarity search
- `Authentication & Rate Limiting` - Security features
- `MRU Cache` - Caching features
- `Error Handling` - Error responses

## Notes

- Tests use a unique collection name per run (timestamp-based)
- API keys created during tests are cleaned up automatically
- Tests have a 30-second timeout for network operations
- Tests require the server to be running on the default port (4000)

## Troubleshooting

### Server not running
```
Error: connect ECONNREFUSED 127.0.0.1:4000
```
**Solution:** Start the server first: `node server/index.js`

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Solution:** Stop the existing server or change the port

### API key creation fails
**Solution:** Check that the API key manager is initialized correctly

