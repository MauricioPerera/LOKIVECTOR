/**
 * Start command - Start LokiVector server
 */

const path = require('path');
const { spawn } = require('child_process');

function start(options) {
  const port = options.port || process.env.PORT || 4000;
  const tcpPort = options.tcpPort || process.env.TCP_PORT || 5000;
  const dataDir = path.resolve(options.dataDir || process.env.DATA_DIR || './data');
  const dev = options.dev || false;

  console.log('Starting LokiVector server...');
  console.log(`  HTTP Port: ${port}`);
  console.log(`  TCP Port: ${tcpPort}`);
  console.log(`  Data Directory: ${dataDir}`);
  console.log(`  Mode: ${dev ? 'Development' : 'Production'}`);
  console.log('');

  // Set environment variables
  process.env.PORT = port;
  process.env.TCP_PORT = tcpPort;
  process.env.DATA_DIR = dataDir;
  process.env.NODE_ENV = dev ? 'development' : 'production';

  // Start server
  const serverPath = path.join(__dirname, '../../server/index.js');
  
  if (dev) {
    // Use nodemon or similar for auto-reload
    console.log('Starting in development mode...');
    const nodemon = require('nodemon');
    nodemon({
      script: serverPath,
      watch: ['server', 'src'],
      ext: 'js',
      env: process.env
    });
  } else {
    // Start normally
    const server = require(serverPath);
    console.log('Server started successfully!');
    console.log(`  HTTP: http://localhost:${port}`);
    console.log(`  TCP: localhost:${tcpPort}`);
    console.log('\nPress Ctrl+C to stop');
  }
}

module.exports = start;

