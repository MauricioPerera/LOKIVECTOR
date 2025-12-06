#!/bin/bash

# Create MIT-Only Release
# 
# This script prepares a MIT-only release by:
# 1. Validating no Commercial code is present
# 2. Creating a clean release branch
# 3. Tagging the release
# 4. Preparing for NPM publish

set -e

VERSION=${1:-"0.1.0"}
RELEASE_BRANCH="release/v${VERSION}"

echo "🚀 Creating MIT-only release v${VERSION}..."
echo ""

# Step 1: Validate MIT-only
echo "📋 Step 1: Validating MIT-only code..."
node scripts/prepare-mit-release.js

if [ $? -ne 0 ]; then
    echo "❌ Validation failed. Fix issues before creating release."
    exit 1
fi

echo "✅ Validation passed"
echo ""

# Step 2: Check git status
echo "📋 Step 2: Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: Uncommitted changes detected"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 3: Create release branch
echo "📋 Step 3: Creating release branch..."
git checkout -b "$RELEASE_BRANCH"

# Step 4: Ensure all headers are present
echo "📋 Step 4: Adding license headers..."
node scripts/add-license-headers.js

# Step 5: Create tag
echo "📋 Step 5: Creating git tag..."
git add .
git commit -m "Release v${VERSION} - MIT-only" || true
git tag -a "v${VERSION}" -m "Release v${VERSION} - MIT-only Community Edition"

echo ""
echo "✅ Release v${VERSION} created!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the release branch: git checkout $RELEASE_BRANCH"
echo "   2. Push to GitHub: git push origin $RELEASE_BRANCH && git push origin v${VERSION}"
echo "   3. Create GitHub release from tag"
echo "   4. Publish to NPM: npm publish (from release branch)"
echo ""

