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
 * MRU Cache implementation
 * 
 * @param {number} capacity - Maximum number of items to store in the cache
 */
function MRUCache(capacity) {
  this.capacity = capacity || 100; // Default capacity
  this.cache = new Map();
}

MRUCache.prototype = {
  get: function(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Move to most recently used (end of Map)
    var value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  },
  
  set: function(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove most recently used (last item) - Wait, MRU means Most Recently Used replacement policy?
      // Usually caches use LRU (Least Recently Used) eviction.
      // If it's MRU eviction, we remove the most recently used.
      // If it's LRU eviction, we remove the least recently used.
      // The user asked for "Mejoras en la caché MRU".
      // MRU Cache usually implies "Most Recently Used" eviction policy, which is useful for cyclic scans.
      // BUT, often people say MRU when they mean "Keep MRU, Evict LRU".
      // Let's assume standard LRU cache behavior (Evict LRU) because that's what's generally useful for DBs
      // unless we have specific cyclic patterns.
      // Actually, let's check if there is any existing cache to improve.
      // The task says "Mejoras en la caché MRU", implying there might be one or we need to add one.
      
      // If I look at LokiJS source, I don't see an explicit MRU cache class.
      // I'll implement a standard LRU cache which keeps MRU items.
      
      // Map iterates in insertion order.
      // keys().next().value is the first inserted (Least Recently Used if we re-insert on access).
      var firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  },
  
  clear: function() {
    this.cache.clear();
  },
  
  has: function(key) {
    return this.cache.has(key);
  },
  
  get size() {
    return this.cache.size;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MRUCache;
}
