/**
 * Init command - Initialize a new LokiVector project
 */

const fs = require('fs');
const path = require('path');

function init(dir) {
  const projectDir = path.resolve(dir);
  
  console.log(`Initializing LokiVector project in ${projectDir}...`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Create data directory
  const dataDir = path.join(projectDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created data directory');
  }

  // Create .env file if it doesn't exist
  const envFile = path.join(projectDir, '.env');
  if (!fs.existsSync(envFile)) {
    const envContent = `# LokiVector Configuration
PORT=4000
TCP_PORT=5000
DATA_DIR=./data
NODE_ENV=development
LOG_LEVEL=info
`;
    fs.writeFileSync(envFile, envContent);
    console.log('✓ Created .env file');
  }

  // Create package.json if it doesn't exist
  const packageFile = path.join(projectDir, 'package.json');
  if (!fs.existsSync(packageFile)) {
    const packageContent = {
      name: path.basename(projectDir),
      version: '1.0.0',
      description: 'LokiVector project',
      main: 'index.js',
      scripts: {
        start: 'loki-vector start',
        dev: 'loki-vector start --dev'
      },
      dependencies: {
        'lokivector': 'latest'
      }
    };
    fs.writeFileSync(packageFile, JSON.stringify(packageContent, null, 2));
    console.log('✓ Created package.json');
  }

  // Create README if it doesn't exist
  const readmeFile = path.join(projectDir, 'README.md');
  if (!fs.existsSync(readmeFile)) {
    const readmeContent = `# LokiVector Project

This is a LokiVector project.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the server:
\`\`\`bash
npm start
\`\`\`

3. Create an API key:
\`\`\`bash
loki-vector key create
\`\`\`

## Documentation

Visit https://lokivector.com/docs for full documentation.
`;
    fs.writeFileSync(readmeFile, readmeContent);
    console.log('✓ Created README.md');
  }

  console.log('\n✓ Project initialized successfully!');
  console.log('\nNext steps:');
  console.log('  1. npm install');
  console.log('  2. loki-vector start');
  console.log('  3. loki-vector key create');
}

module.exports = init;

