/**
 * Key commands - Manage API keys
 */

const APIKeyManager = require('../../server/auth/api-keys');
const loki = require('../../src/lokijs.js');
const path = require('path');
const fs = require('fs');

function getDB() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = path.join(dataDir, 'lokivector.db');
  return new loki(dbPath, { autoload: true, autosave: true });
}

const keyCommand = {
  create: (options) => {
    const db = getDB();
    const apiKeyManager = new APIKeyManager(db);
    
    const permissions = {
      collections: options.collections.split(',').map(c => c.trim()),
      operations: options.operations.split(',').map(o => o.trim()),
      rateLimit: {
        requests: parseInt(options.rateLimit || 1000),
        window: options.window || '1h'
      }
    };

    const metadata = {
      name: options.name || 'CLI Generated Key',
      description: `Created via CLI at ${new Date().toISOString()}`
    };

    const { id, key } = apiKeyManager.generateKey(
      options.user || 'default',
      permissions,
      metadata
    );

    console.log('\n✓ API Key created successfully!');
    console.log(`\nKey ID: ${id}`);
    console.log(`API Key: ${key}`);
    console.log('\n⚠️  IMPORTANT: Save this key now. It will not be shown again.');
    console.log('\nUsage:');
    console.log(`  export LOKIVECTOR_API_KEY="${key}"`);
    console.log(`  curl -H "X-API-Key: ${key}" http://localhost:4000/collections`);
  },

  list: (options) => {
    const db = getDB();
    const apiKeyManager = new APIKeyManager(db);
    
    const userId = options.user || null;
    const keys = userId 
      ? apiKeyManager.listKeys(userId)
      : apiKeyManager.listKeys('*'); // List all if no user filter

    if (keys.length === 0) {
      console.log('No API keys found.');
      return;
    }

    console.log(`\nFound ${keys.length} API key(s):\n`);
    keys.forEach(key => {
      console.log(`  ID: ${key.id}`);
      console.log(`  Name: ${key.metadata.name}`);
      console.log(`  User: ${key.userId}`);
      console.log(`  Created: ${new Date(key.createdAt).toLocaleString()}`);
      console.log(`  Last Used: ${key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}`);
      console.log(`  Expires: ${key.expiresAt ? new Date(key.expiresAt).toLocaleString() : 'Never'}`);
      console.log('');
    });
  },

  revoke: (keyId) => {
    const db = getDB();
    const apiKeyManager = new APIKeyManager(db);
    
    if (apiKeyManager.revokeKey(keyId)) {
      console.log(`\n✓ API key ${keyId} revoked successfully.`);
    } else {
      console.log(`\n✗ API key ${keyId} not found.`);
    }
  }
};

module.exports = keyCommand;

