/**
 * Shell command - Interactive shell (SQLite-like)
 */

const readline = require('readline');
const http = require('http');

function shell(options) {
  const port = options.port || 4000;
  const host = options.host || 'localhost';
  const apiKey = options.key || process.env.LOKIVECTOR_API_KEY;

  console.log('LokiVector Interactive Shell');
  console.log('Type "help" for commands, "exit" to quit\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'lokivector> '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === 'exit' || input === 'quit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }

    if (input === 'help') {
      showHelp();
      rl.prompt();
      return;
    }

    // Parse command
    const [command, ...args] = input.split(' ');
    
    try {
      await executeCommand(command, args, { port, host, apiKey });
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

function showHelp() {
  console.log(`
Available commands:
  collections          List all collections
  create <name>        Create a collection
  insert <coll> <doc>  Insert document (JSON)
  find <coll> <query>  Find documents (JSON query)
  search <coll> <vec>  Vector search (JSON array)
  stats                Show server statistics
  help                 Show this help
  exit                 Exit shell
`);
}

async function executeCommand(command, args, options) {
  const { port, host, apiKey } = options;
  const baseUrl = `http://${host}:${port}`;
  const headers = apiKey ? { 'X-API-Key': apiKey } : {};

  switch (command) {
    case 'collections':
      await makeRequest(`${baseUrl}/collections`, { headers });
      break;

    case 'create':
      if (!args[0]) {
        console.log('Usage: create <collection-name>');
        return;
      }
      await makeRequest(`${baseUrl}/collections`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: args[0] })
      });
      break;

    case 'stats':
      await makeRequest(`${baseUrl}/stats`, { headers });
      break;

    default:
      console.log(`Unknown command: ${command}. Type "help" for available commands.`);
  }
}

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
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
          } catch (e) {
            console.log(data);
          }
          resolve();
        } else {
          console.error(`Error ${res.statusCode}: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
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

module.exports = shell;

