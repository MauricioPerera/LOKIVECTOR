/**
 * Stats command - Show server statistics
 */

const http = require('http');

function stats(options) {
  const port = options.port || 4000;
  const apiKey = options.key || process.env.LOKIVECTOR_API_KEY;
  const url = `http://localhost:${port}/stats`;

  const headers = apiKey ? { 'X-API-Key': apiKey } : {};

  const req = http.get(url, { headers }, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const stats = JSON.parse(data);
          console.log('\n📊 Server Statistics\n');
          console.log(`  Collections: ${stats.collections || 0}`);
          console.log(`  Total Documents: ${stats.totalDocuments || 0}`);
          console.log(`  Total Vectors: ${stats.totalVectors || 0}`);
          console.log(`  Storage Used: ${formatSize(stats.storageUsed || 0)}`);
          console.log(`  Uptime: ${formatUptime(stats.uptime)}`);
          if (stats.requestsToday) {
            console.log(`  Requests Today: ${stats.requestsToday}`);
          }
        } catch (e) {
          console.log(data);
        }
      } else {
        console.error(`Error ${res.statusCode}: ${data}`);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`Error: ${err.message}`);
    console.log('\nMake sure the server is running: loki-vector start');
  });

  req.setTimeout(5000, () => {
    req.destroy();
    console.error('Request timeout. Is the server running?');
  });
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1020;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
  if (!seconds) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${Math.floor(seconds)}s`;
}

module.exports = stats;

