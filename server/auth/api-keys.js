/**
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

/**
 * API Key Manager for LokiVector
 * Handles generation, validation, and management of API keys
 */

const crypto = require('crypto');

/**
 * API Key Manager
 */
class APIKeyManager {
  constructor(db) {
    this.db = db;
    this.keysCollection = null;
    this._initializeCollection();
  }

  /**
   * Initialize the API keys collection
   * @private
   */
  _initializeCollection() {
    this.keysCollection = this.db.getCollection('__api_keys__');
    if (!this.keysCollection) {
      this.keysCollection = this.db.addCollection('__api_keys__', {
        unique: ['id', 'keyHash'],
        indices: ['userId', 'prefix', 'createdAt']
      });
    }
  }

  /**
   * Generate a secure random token
   * @param {number} length - Length of token in bytes
   * @returns {string} Base64 encoded token
   */
  _generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Hash API key using SHA-256
   * @param {string} key - API key to hash
   * @returns {string} Hashed key
   */
  _hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Generate a new API key
   * @param {string} userId - User ID
   * @param {object} permissions - Permissions object
   * @param {object} metadata - Optional metadata
   * @returns {object} { id, key } - Key ID and the actual key (returned only once)
   */
  generateKey(userId, permissions = {}, metadata = {}) {
    const id = `key_${this._generateSecureToken(16)}`;
    const key = `lvk_${this._generateSecureToken(32)}`; // LokiVector Key prefix
    const keyHash = this._hashKey(key);
    
    const keyDoc = {
      id,
      userId,
      keyHash,
      prefix: 'lvk_',
      createdAt: Date.now(),
      expiresAt: null, // null = never expires
      lastUsed: null,
      permissions: {
        collections: permissions.collections || ['*'], // '*' = all, or specific list
        operations: permissions.operations || ['read', 'write'], // read, write, admin
        rateLimit: permissions.rateLimit || {
          requests: 1000,
          window: '1h' // 1h, 1d, 1w
        }
      },
      metadata: {
        name: metadata.name || 'Unnamed Key',
        description: metadata.description || '',
        ...metadata
      }
    };

    this.keysCollection.insert(keyDoc);

    // Return key only once - never store the plain key
    return { id, key };
  }

  /**
   * Validate an API key
   * @param {string} key - API key to validate
   * @returns {object|null} Key document if valid, null otherwise
   */
  validateKey(key) {
    if (!key || !key.startsWith('lvk_')) {
      return null;
    }

    const keyHash = this._hashKey(key);
    const keyDoc = this.keysCollection.findOne({ keyHash });

    if (!keyDoc) {
      return null;
    }

    // Check expiration
    if (keyDoc.expiresAt && keyDoc.expiresAt < Date.now()) {
      return null; // Expired
    }

    // Update last used
    keyDoc.lastUsed = Date.now();
    this.keysCollection.update(keyDoc);

    return keyDoc;
  }

  /**
   * Revoke an API key
   * @param {string} keyId - Key ID to revoke
   * @returns {boolean} True if revoked, false if not found
   */
  revokeKey(keyId) {
    const keyDoc = this.keysCollection.findOne({ id: keyId });
    if (!keyDoc) {
      return false;
    }

    this.keysCollection.remove(keyDoc);
    return true;
  }

  /**
   * List all keys for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of key documents (without keyHash)
   */
  listKeys(userId) {
    const keys = this.keysCollection.find({ userId });
    return keys.map(key => {
      const { keyHash, ...safeKey } = key;
      return safeKey;
    });
  }

  /**
   * Get key by ID (without sensitive data)
   * @param {string} keyId - Key ID
   * @returns {object|null} Key document without keyHash
   */
  getKey(keyId) {
    const keyDoc = this.keysCollection.findOne({ id: keyId });
    if (!keyDoc) {
      return null;
    }

    const { keyHash, ...safeKey } = keyDoc;
    return safeKey;
  }

  /**
   * Update key permissions
   * @param {string} keyId - Key ID
   * @param {object} permissions - New permissions
   * @returns {boolean} True if updated, false if not found
   */
  updatePermissions(keyId, permissions) {
    const keyDoc = this.keysCollection.findOne({ id: keyId });
    if (!keyDoc) {
      return false;
    }

    keyDoc.permissions = { ...keyDoc.permissions, ...permissions };
    this.keysCollection.update(keyDoc);
    return true;
  }

  /**
   * Set key expiration
   * @param {string} keyId - Key ID
   * @param {number|null} expiresAt - Expiration timestamp (null = never expires)
   * @returns {boolean} True if updated, false if not found
   */
  setExpiration(keyId, expiresAt) {
    const keyDoc = this.keysCollection.findOne({ id: keyId });
    if (!keyDoc) {
      return false;
    }

    keyDoc.expiresAt = expiresAt;
    this.keysCollection.update(keyDoc);
    return true;
  }

  /**
   * Rotate a key (create new, revoke old)
   * @param {string} keyId - Old key ID
   * @param {string} userId - User ID
   * @param {object} permissions - Permissions for new key
   * @returns {object} { id, key } - New key
   */
  rotateKey(keyId, userId, permissions = {}) {
    const oldKey = this.keysCollection.findOne({ id: keyId });
    if (!oldKey) {
      throw new Error('Key not found');
    }

    // Create new key with same permissions
    const newKey = this.generateKey(userId, oldKey.permissions, oldKey.metadata);

    // Revoke old key
    this.revokeKey(keyId);

    return newKey;
  }

  /**
   * Clean up expired keys
   * @returns {number} Number of keys removed
   */
  cleanupExpiredKeys() {
    const now = Date.now();
    const expired = this.keysCollection.find({
      expiresAt: { $lt: now }
    });

    expired.forEach(key => this.keysCollection.remove(key));
    return expired.length;
  }

  /**
   * Get statistics
   * @returns {object} Statistics
   */
  getStats() {
    const allKeys = this.keysCollection.find({});
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    return {
      total: allKeys.length,
      active: allKeys.filter(k => !k.expiresAt || k.expiresAt > now).length,
      expired: allKeys.filter(k => k.expiresAt && k.expiresAt <= now).length,
      usedToday: allKeys.filter(k => k.lastUsed && k.lastUsed > oneDayAgo).length
    };
  }
}

module.exports = APIKeyManager;

