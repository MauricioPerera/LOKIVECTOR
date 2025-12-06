/**
 * Logs command - View server logs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function logs(options) {
  const follow = options.follow || false;
  const lines = parseInt(options.lines || 50);
  const logFile = path.join(process.cwd(), 'logs', 'lokivector.log');

  if (!fs.existsSync(logFile)) {
    console.log('No log file found. Logs will appear here when the server starts.');
    return;
  }

  if (follow) {
    // Follow logs (tail -f)
    console.log(`Following logs from ${logFile}...\n`);
    const stream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      console.log(line);
    });

    // Watch for new lines
    fs.watchFile(logFile, { interval: 1000 }, () => {
      const newLines = fs.readFileSync(logFile, 'utf8').split('\n').slice(-10);
      newLines.forEach(line => {
        if (line.trim()) console.log(line);
      });
    });

    console.log('Press Ctrl+C to stop following logs');
  } else {
    // Show last N lines
    const content = fs.readFileSync(logFile, 'utf8');
    const allLines = content.split('\n').filter(line => line.trim());
    const lastLines = allLines.slice(-lines);

    console.log(`Last ${lastLines.length} lines from ${logFile}:\n`);
    lastLines.forEach(line => console.log(line));
  }
}

module.exports = logs;

