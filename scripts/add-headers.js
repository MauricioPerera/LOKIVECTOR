#!/usr/bin/env node

/**
 * Script to add license headers to files
 * 
 * Usage:
 *   node scripts/add-headers.js --type=MIT --dir=core/
 *   node scripts/add-headers.js --type=COMMERCIAL --dir=commercial/
 */

const fs = require('fs');
const path = require('path');

const MIT_HEADER = `/**
 * LokiVector Core - MIT Licensed
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * This file is part of the MIT-licensed LokiVector core.
 * Commercial modules are located in /commercial directory.
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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * See LICENSE for full MIT license terms.
 */`;

const COMMERCIAL_HEADER = `/**
 * LokiVector Commercial Module - Proprietary License
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * This file is part of the Commercial-licensed LokiVector.
 * Unauthorized copying, hosting, or redistribution is prohibited.
 * 
 * This software is NOT open source. Commercial license required.
 * See LICENSE-COMMERCIAL.md for licensing terms.
 * 
 * For commercial licensing: commercial@lokivector.io
 * 
 * All rights reserved.
 */`;

function getHeader(type) {
  if (type === 'MIT') {
    return MIT_HEADER;
  } else if (type === 'COMMERCIAL') {
    return COMMERCIAL_HEADER;
  }
  throw new Error(`Unknown header type: ${type}`);
}

function hasHeader(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('LokiVector') && 
         (content.includes('MIT Licensed') || content.includes('Commercial Module'));
}

function addHeader(filePath, headerType) {
  if (hasHeader(filePath)) {
    console.log(`Skipping ${filePath} (already has header)`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const header = getHeader(headerType);
  const newContent = header + '\n\n' + content;
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Added ${headerType} header to ${filePath}`);
}

function processDirectory(dir, headerType, extensions = ['.js', '.ts']) {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist`);
    return;
  }

  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (file.name.startsWith('.') || file.name === 'node_modules') {
        continue;
      }
      processDirectory(fullPath, headerType, extensions);
    } else if (file.isFile()) {
      const ext = path.extname(file.name);
      if (extensions.includes(ext)) {
        addHeader(fullPath, headerType);
      }
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let type = 'MIT';
let dir = 'src';

for (const arg of args) {
  if (arg.startsWith('--type=')) {
    type = arg.split('=')[1].toUpperCase();
  } else if (arg.startsWith('--dir=')) {
    dir = arg.split('=')[1];
  }
}

if (!['MIT', 'COMMERCIAL'].includes(type)) {
  console.error('Invalid type. Use --type=MIT or --type=COMMERCIAL');
  process.exit(1);
}

console.log(`Adding ${type} headers to files in ${dir}/`);
processDirectory(dir, type);

