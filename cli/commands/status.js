/**
 * Status command - Check server status
 */

const http = require('http');

function status(options) {
  const port = options.port || 4000;
  const host = options.host || 'localhost';
  const url = `http://${host}:${port}/health`;

  console.log(`Checking server status at ${url}...`);

  const req = http.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const health = JSON.parse(data);
          console.log('\n✓ Server is running');
          console.log(`  Status: ${health.status}`);
          console.log(`  Uptime: ${formatUptime(health.uptime)}`);
          console.log(`  Collections: ${health.collections || 'N/A'}`);
          console.log(`  Version: ${health.version || 'N/A'}`);
        } catch (e) {
          console.log('\n✓ Server is running (health endpoint responded)');
        }
      } else {
        console.log(`\n⚠ Server responded with status ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    console.log(`\n✗ Server is not running`);
    console.log(`  Error: ${err.message}`);
    console.log(`\nStart the server with: loki-vector start`);
  });

  req.setTimeout(5000, () => {
    req.destroy();
    console.log('\n✗ Server is not responding (timeout)');
  });
}

function formatUptime(seconds) {
  if (!seconds) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

module.exports = status;

