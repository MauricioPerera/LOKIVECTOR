#!/usr/bin/env node

/**
 * Add License Headers to Files
 * 
 * Adds appropriate license headers to all source files based on their location
 * and content analysis
 */

const fs = require('fs');
const path = require('path');

const MIT_HEADER = `/**
 * LokiVector Core - MIT Licensed
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * 
 * Commercial features are located in /commercial and /enterprise directories.
 * See LICENSE_FEATURES.md for details.
 */
`;

const COMMERCIAL_HEADER = `/**
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
`;

const ENTERPRISE_HEADER = `/**
 * LokiVector Enterprise Module - Proprietary License
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * This file is part of LokiVector Enterprise Edition.
 * Unauthorized copying, hosting, or redistribution is prohibited.
 * 
 * This software is licensed under the LokiVector Commercial License.
 * See LICENSE-COMMERCIAL.md for terms.
 * 
 * For licensing inquiries: commercial@lokivector.io
 * 
 * All rights reserved.
 */
`;

function hasLicenseHeader(content) {
  return content.includes('Copyright (c) 2025') || 
         content.includes('LokiVector') && content.includes('License');
}

function determineLicense(filePath, content) {
  if (filePath.includes('/commercial/')) {
    return 'COMMERCIAL';
  }
  if (filePath.includes('/enterprise/')) {
    return 'ENTERPRISE';
  }
  if (filePath.includes('/core/')) {
    return 'MIT';
  }
  
  // Heuristic based on content
  if (content.includes('LokiOplog') || content.includes('replication')) {
    return 'COMMERCIAL';
  }
  if (content.includes('multi-tenant') || content.includes('SSO') || content.includes('RBAC')) {
    return 'ENTERPRISE';
  }
  
  // Default for core files
  if (filePath.includes('/src/') || filePath.includes('/server/')) {
    return 'MIT';
  }
  
  return null;
}

function addHeader(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (hasLicenseHeader(content)) {
    return { action: 'SKIP', reason: 'Already has license header' };
  }
  
  const license = determineLicense(filePath, content);
  
  if (!license) {
    return { action: 'SKIP', reason: 'Could not determine license' };
  }
  
  let header;
  if (license === 'MIT') {
    header = MIT_HEADER;
  } else if (license === 'COMMERCIAL') {
    header = COMMERCIAL_HEADER;
  } else {
    header = ENTERPRISE_HEADER;
  }
  
  if (!dryRun) {
    const newContent = header + '\n' + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
  
  return { action: 'ADD', license, header: header.substring(0, 50) + '...' };
}

function processDirectory(dir, results = { added: 0, skipped: 0 }, dryRun = false) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'build') {
      continue;
    }
    
    if (entry.isDirectory()) {
      processDirectory(fullPath, results, dryRun);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      const result = addHeader(fullPath, dryRun);
      if (result.action === 'ADD') {
        results.added++;
        if (!dryRun) {
          console.log(`✅ Added ${result.license} header to ${path.relative(process.cwd(), fullPath)}`);
        } else {
          console.log(`[DRY RUN] Would add ${result.license} header to ${path.relative(process.cwd(), fullPath)}`);
        }
      } else {
        results.skipped++;
      }
    }
  }
  
  return results;
}

// Main
const dryRun = process.argv.includes('--dry-run');

if (dryRun) {
  console.log('🔍 [DRY RUN] Analyzing files for license headers...\n');
} else {
  console.log('📝 Adding license headers to files...\n');
}

const results = processDirectory(process.cwd(), { added: 0, skipped: 0 }, dryRun);

console.log(`\n✅ Complete:`);
console.log(`   Added: ${results.added}`);
console.log(`   Skipped: ${results.skipped}`);

if (dryRun) {
  console.log('\n💡 Run without --dry-run to apply changes');
}

