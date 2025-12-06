const net = require('net');
const loki = require('../src/lokijs.js');

const PORT = process.env.TCP_PORT || 5000;
const DB_NAME = 'tcp-server.db';

const db = new loki(DB_NAME);
const collections = {};

function getCollection(name) {
  if (!collections[name]) {
    collections[name] = db.addCollection(name);
  }
  return collections[name];
}

const server = net.createServer((socket) => {
  console.log('Client connected');

  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString();
    
    // Simple protocol: newline delimited JSON
    let delimiterIndex;
    while ((delimiterIndex = buffer.indexOf('\n')) !== -1) {
      const message = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 1);
      
      try {
        const request = JSON.parse(message);
        handleRequest(socket, request);
      } catch (err) {
        console.error('Invalid JSON:', err.message);
        socket.write(JSON.stringify({ error: 'Invalid JSON' }) + '\n');
      }
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
  
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

function handleRequest(socket, request) {
  const { id, action, collection, data, query } = request;
  
  try {
    const col = getCollection(collection);
    let result;
    
    switch (action) {
      case 'insert':
        result = col.insert(data);
        break;
      case 'find':
        result = col.find(query);
        break;
      case 'findOne':
        result = col.findOne(query);
        break;
      case 'update':
        // data should contain the updated document
        // If data doesn't have $loki or meta, we might need to find the document first
        if (data && !data.$loki && query) {
            const doc = col.findOne(query);
            if (doc) {
                // Merge updates into existing doc
                Object.assign(doc, data);
                result = col.update(doc);
            } else {
                throw new Error('Document not found for update');
            }
        } else {
            result = col.update(data);
        }
        break;
      case 'remove':
        // data should be the document or query
        if (query && !data) {
            result = col.chain().find(query).remove();
        } else {
            result = col.remove(data);
        }
        break;
      case 'count':
        // Collection.count() is not standard in all LokiJS versions or behaves differently.
        // Using chain().find(query).count() is more reliable.
        result = col.chain().find(query || {}).count();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    const response = { id, result };
    socket.write(JSON.stringify(response) + '\n');
    
  } catch (err) {
    const response = { id, error: err.message };
    socket.write(JSON.stringify(response) + '\n');
  }
}

server.listen(PORT, () => {
  console.log(`LokiJS TCP Server running on port ${PORT}`);
});
