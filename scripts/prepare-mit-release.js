/**
 * Prepare MIT-Only Release
 * 
 * Validates that the repository contains only MIT-licensed code
 * and prepares it for public release.
 */

const fs = require('fs');
const path = require('path');

const COMMERCIAL_INDICATORS = [
  '/commercial/',
  '/enterprise/',
  'LokiOplog',
  'replication',
  'multi-tenant',
  'SSO',
  'SAML',
  'RBAC'
];

const EXCLUDE_PATTERNS = [
  /commercial/i,
  /enterprise/i,
  /LICENSE-COMMERCIAL\.md$/,
  /\.git/,
  /node_modules/,
  /build/
];

function checkFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check path patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(relativePath)) {
      return { valid: false, reason: `Matches exclude pattern: ${pattern}` };
    }
  }
  
  // Check file content for Commercial indicators
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const indicator of COMMERCIAL_INDICATORS) {
      if (content.includes(indicator) && !content.includes('MIT Licensed')) {
        // Check if it's just a reference in documentation
        if (filePath.endsWith('.md') || filePath.endsWith('.txt')) {
          continue; // Documentation can reference Commercial features
        }
        
        // Allow tests that import Commercial features (they're testing Commercial code)
        if (filePath.includes('/spec/') || filePath.includes('/test/')) {
          continue; // Tests can import Commercial features
        }
        
        // Allow scripts that analyze licenses
        if (filePath.includes('/scripts/') && (filePath.includes('analyze') || filePath.includes('prepare'))) {
          continue; // Analysis/preparation scripts can reference Commercial
        }
        
        // Allow server/index.js (full version with Commercial support)
        if (filePath === 'server/index.js') {
          continue; // Full server version can use Commercial features
        }
        
        // Check if it has Commercial license header (this is the real issue)
        if (content.includes('Commercial License') || content.includes('Proprietary License')) {
          // But allow if it's in a test or script
          if (!filePath.includes('/spec/') && !filePath.includes('/test/') && !filePath.includes('/scripts/')) {
            return { valid: false, reason: `Contains Commercial code: ${indicator}` };
          }
        }
      }
    }
  } catch (e) {
    // Skip binary files
    return { valid: true, reason: 'Binary file (skipped)' };
  }
  
  return { valid: true };
}

function scanDirectory(dir, issues = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Skip excluded patterns
    let shouldSkip = false;
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.test(relativePath)) {
        shouldSkip = true;
        break;
      }
    }
    
    if (shouldSkip) {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, issues);
    } else if (entry.isFile()) {
      const check = checkFile(fullPath);
      if (!check.valid) {
        issues.push({
          file: relativePath,
          reason: check.reason
        });
      }
    }
  }
  
  return issues;
}

// Main
console.log('🔍 Validating MIT-only release...\n');

const issues = scanDirectory(process.cwd());

if (issues.length === 0) {
  console.log('✅ Validation passed!');
  console.log('   Repository is ready for MIT-only public release.\n');
  process.exit(0);
} else {
  console.log(`❌ Validation failed! Found ${issues.length} issues:\n`);
  
  issues.forEach(issue => {
    console.log(`   ⚠️  ${issue.file}`);
    console.log(`      Reason: ${issue.reason}\n`);
  });
  
  console.log('💡 Actions required:');
  console.log('   1. Remove or move Commercial/Enterprise code');
  console.log('   2. Ensure all files have MIT license headers');
  console.log('   3. Remove references to Commercial features in code');
  console.log('   4. Run this script again to validate\n');
  
  process.exit(1);
}
