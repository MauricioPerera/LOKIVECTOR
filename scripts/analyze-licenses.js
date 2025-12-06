/**
 * LokiVector Commercial Module - Proprietary License
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * This file is part of LokiVector Commercial Edition.
 * Unauthorized copying, hosting, or redistribution is prohibited.
 * 
 * This software is licensed under the LokiVector Commercial License.
 * See LICENSE-COMMERCIAL.md for terms.
 * 
 * For licensing inquiries: commercial@lokivector.io
 * 
 * All rights reserved.
 */

#!/usr/bin/env node

/**
 * Analyze License Distribution
 * 
 * Analyzes the codebase to identify which files are MIT vs Commercial
 * based on LICENSE_FEATURES.md mapping
 */

const fs = require('fs');
const path = require('path');

const MIT_FEATURES = [
  'lokijs.js',
  'loki-hnsw-index.js',
  'loki-vector-plugin.js',
  'loki-indexed-adapter.js',
  'loki-fs-sync-adapter.js',
  'api-keys.js', // versión básica
  'auth.js', // versión básica
  'rate-limit.js' // versión básica
];

const COMMERCIAL_FEATURES = [
  'loki-oplog.js',
  'mru-cache.js', // versión avanzada
  'replication',
  'dashboard', // versión completa
  'advanced-cache'
];

const ENTERPRISE_FEATURES = [
  'multi-tenant',
  'sso',
  'rbac',
  'audit'
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  let license = 'UNKNOWN';
  let reason = '';
  
  // Check by filename
  if (MIT_FEATURES.some(f => fileName.includes(f))) {
    license = 'MIT';
    reason = 'Filename matches MIT feature list';
  } else if (COMMERCIAL_FEATURES.some(f => fileName.includes(f) || content.includes(f))) {
    license = 'COMMERCIAL';
    reason = 'Filename or content matches Commercial feature';
  } else if (ENTERPRISE_FEATURES.some(f => fileName.includes(f) || content.includes(f))) {
    license = 'ENTERPRISE';
    reason = 'Filename or content matches Enterprise feature';
  } else if (content.includes('LokiOplog') || content.includes('replication')) {
    license = 'COMMERCIAL';
    reason = 'Contains replication code';
  } else if (content.includes('multi-tenant') || content.includes('SSO') || content.includes('RBAC')) {
    license = 'ENTERPRISE';
    reason = 'Contains enterprise features';
  } else if (filePath.includes('/src/') && !filePath.includes('/commercial/') && !filePath.includes('/enterprise/')) {
    license = 'MIT';
    reason = 'Core source file (default MIT)';
  } else if (filePath.includes('/server/') && !filePath.includes('/commercial/') && !filePath.includes('/enterprise/')) {
    // Check if it's basic server code
    if (content.includes('replication') || content.includes('LokiOplog')) {
      license = 'COMMERCIAL';
      reason = 'Server file contains Commercial features';
    } else {
      license = 'MIT';
      reason = 'Basic server code (default MIT)';
    }
  }
  
  return { license, reason };
}

function scanDirectory(dir, results = { MIT: [], COMMERCIAL: [], ENTERPRISE: [], UNKNOWN: [] }) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .git, etc.
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'build') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      const analysis = analyzeFile(fullPath);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      results[analysis.license].push({
        path: relativePath,
        reason: analysis.reason
      });
    }
  }
  
  return results;
}

// Main
console.log('🔍 Analyzing codebase for license distribution...\n');

const results = scanDirectory(process.cwd());

console.log('📊 Results:\n');
console.log(`✅ MIT: ${results.MIT.length} files`);
console.log(`💼 COMMERCIAL: ${results.COMMERCIAL.length} files`);
console.log(`🏢 ENTERPRISE: ${results.ENTERPRISE.length} files`);
console.log(`❓ UNKNOWN: ${results.UNKNOWN.length} files\n`);

if (results.UNKNOWN.length > 0) {
  console.log('⚠️  UNKNOWN files (need manual review):');
  results.UNKNOWN.forEach(f => console.log(`   - ${f.path}`));
  console.log('');
}

if (results.COMMERCIAL.length > 0) {
  console.log('💼 COMMERCIAL files:');
  results.COMMERCIAL.forEach(f => console.log(`   - ${f.path} (${f.reason})`));
  console.log('');
}

if (results.ENTERPRISE.length > 0) {
  console.log('🏢 ENTERPRISE files:');
  results.ENTERPRISE.forEach(f => console.log(`   - ${f.path} (${f.reason})`));
  console.log('');
}

// Save results
fs.writeFileSync(
  'license-analysis.json',
  JSON.stringify(results, null, 2)
);

console.log('✅ Analysis saved to license-analysis.json');

