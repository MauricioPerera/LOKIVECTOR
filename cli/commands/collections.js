/**
 * Collections commands - Manage collections
 */

const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

const collectionsCommand = {
  list: async (options) => {
    const port = options.port || 4000;
    const apiKey = options.key || process.env.LOKIVECTOR_API_KEY;
    const url = `http://localhost:${port}/collections`;
    
    const headers = apiKey ? { 'X-API-Key': apiKey } : {};

    try {
      const collections = await makeRequest(url, { headers });
      
      if (Array.isArray(collections) && collections.length === 0) {
        console.log('No collections found.');
        return;
      }

      console.log(`\nFound ${collections.length} collection(s):\n`);
      collections.forEach(coll => {
        console.log(`  ${coll.name}`);
        console.log(`    Documents: ${coll.count || 0}`);
        console.log(`    Size: ${formatSize(coll.size || 0)}`);
        console.log(`    Has Vector Index: ${coll.hasVectorIndex ? 'Yes' : 'No'}`);
        console.log('');
      });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      if (!apiKey) {
        console.log('\nTip: Set LOKIVECTOR_API_KEY environment variable or use --key option');
      }
    }
  },

  create: async (name, options) => {
    const port = options.port || 4000;
    const apiKey = options.key || process.env.LOKIVECTOR_API_KEY;
    const url = `http://localhost:${port}/collections`;
    
    const headers = {
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      'Content-Type': 'application/json'
    };

    try {
      const result = await makeRequest(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      });

      console.log(`\n✓ Collection '${name}' created successfully.`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
};

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = collectionsCommand;

