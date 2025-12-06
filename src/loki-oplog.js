/**
 * LokiJS Oplog (Operation Log)
 * 
 * Persistent operation log for replication support.
 * Stores all operations (Insert, Update, Remove) with timestamps and sequence numbers
 * to enable multiple followers to sync from the leader.
 * 
 * @author LokiJS Extended
 * @license MIT
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.LokiOplog = factory();
  }
}(this, function () {
  'use strict';

  /**
   * Oplog Entry structure:
   * {
   *   sequence: number,      // Monotonically increasing sequence number
   *   timestamp: number,      // Unix timestamp in milliseconds
   *   collection: string,    // Collection name
   *   operation: string,     // 'I' (Insert), 'U' (Update), 'R' (Remove)
   *   document: object,      // The document (for I/U) or document reference (for R)
   *   metadata: object       // Additional metadata (optional)
   * }
   */

  /**
   * LokiOplog - Operation Log for Replication
   * @constructor
   * @param {object} options Configuration options
   * @param {number} options.maxSize Maximum number of entries before rotation (default: 10000)
   * @param {number} options.retentionDays Number of days to retain entries (default: 7)
   * @param {Loki} options.db Loki database instance for persistence (optional)
   * @param {string} options.collectionName Name of the oplog collection (default: '__oplog__')
   */
  function LokiOplog(options) {
    options = options || {};
    
    this.maxSize = options.maxSize || 10000;
    this.retentionDays = options.retentionDays || 7;
    this.db = options.db || null;
    this.collectionName = options.collectionName || '__oplog__';
    
    // In-memory storage (fallback if no DB)
    this.entries = [];
    this.sequence = 0;
    this.collection = null;
    
    // Initialize collection if DB is provided
    if (this.db) {
      this._initializeCollection();
    }
  }

  /**
   * Initialize the oplog collection in the database
   * @private
   */
  LokiOplog.prototype._initializeCollection = function () {
    if (!this.db) return;
    
    // Get or create the oplog collection
    this.collection = this.db.getCollection(this.collectionName);
    if (!this.collection) {
      this.collection = this.db.addCollection(this.collectionName, {
        indices: ['sequence', 'timestamp', 'collection'],
        unique: ['sequence']
      });
    }
    
    // Get the highest sequence number
    var maxEntry = this.collection.chain().simplesort('sequence', true).limit(1).data();
    if (maxEntry.length > 0) {
      this.sequence = maxEntry[0].sequence || 0;
    }
  };

  /**
   * Append an operation to the oplog
   * @param {string} collection Collection name
   * @param {string} operation Operation type ('I', 'U', 'R')
   * @param {object} document Document or document reference
   * @param {object} metadata Optional metadata
   * @returns {number} Sequence number of the appended entry
   */
  LokiOplog.prototype.append = function (collection, operation, document, metadata) {
    this.sequence++;
    
    var entry = {
      sequence: this.sequence,
      timestamp: Date.now(),
      collection: collection,
      operation: operation,
      document: document,
      metadata: metadata || {}
    };
    
    // Store in collection if available
    if (this.collection) {
      this.collection.insert(entry);
      this._cleanup();
    } else {
      // Fallback to in-memory storage
      this.entries.push(entry);
      if (this.entries.length > this.maxSize) {
        this.entries.shift(); // Remove oldest entry
      }
    }
    
    return this.sequence;
  };

  /**
   * Get entries since a specific sequence number
   * @param {number} sinceSequence Sequence number to start from (exclusive)
   * @param {number} limit Maximum number of entries to return (default: 1000)
   * @returns {Array} Array of oplog entries
   */
  LokiOplog.prototype.getSince = function (sinceSequence, limit) {
    limit = limit || 1000;
    sinceSequence = sinceSequence || 0;
    
    if (this.collection) {
      // Query from database
      var results = this.collection
        .chain()
        .find({ sequence: { $gt: sinceSequence } })
        .simplesort('sequence')
        .limit(limit)
        .data();
      return results;
    } else {
      // Query from in-memory storage
      return this.entries
        .filter(function (entry) {
          return entry.sequence > sinceSequence;
        })
        .sort(function (a, b) {
          return a.sequence - b.sequence;
        })
        .slice(0, limit);
    }
  };

  /**
   * Get entries in a range
   * @param {number} fromSequence Starting sequence (inclusive)
   * @param {number} toSequence Ending sequence (inclusive)
   * @returns {Array} Array of oplog entries
   */
  LokiOplog.prototype.getRange = function (fromSequence, toSequence) {
    if (this.collection) {
      // Use $and to ensure both conditions are applied correctly
      return this.collection
        .chain()
        .find({
          $and: [
            { sequence: { $gte: fromSequence } },
            { sequence: { $lte: toSequence } }
          ]
        })
        .simplesort('sequence')
        .data();
    } else {
      return this.entries.filter(function (entry) {
        return entry.sequence >= fromSequence && entry.sequence <= toSequence;
      }).sort(function (a, b) {
        return a.sequence - b.sequence;
      });
    }
  };

  /**
   * Get entries for a specific collection since a sequence
   * @param {string} collection Collection name
   * @param {number} sinceSequence Sequence number to start from
   * @param {number} limit Maximum number of entries
   * @returns {Array} Array of oplog entries
   */
  LokiOplog.prototype.getSinceForCollection = function (collection, sinceSequence, limit) {
    limit = limit || 1000;
    sinceSequence = sinceSequence || 0;
    
    if (this.collection) {
      return this.collection
        .chain()
        .find({
          collection: collection,
          sequence: { $gt: sinceSequence }
        })
        .simplesort('sequence')
        .limit(limit)
        .data();
    } else {
      return this.entries
        .filter(function (entry) {
          return entry.collection === collection && entry.sequence > sinceSequence;
        })
        .sort(function (a, b) {
          return a.sequence - b.sequence;
        })
        .slice(0, limit);
    }
  };

  /**
   * Get the latest sequence number
   * @returns {number} Latest sequence number
   */
  LokiOplog.prototype.getLatestSequence = function () {
    return this.sequence;
  };

  /**
   * Cleanup old entries based on retention policy
   * @private
   */
  LokiOplog.prototype._cleanup = function () {
    if (!this.collection) return;
    
    var cutoffTime = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    var cutoffSequence = this.sequence - this.maxSize;
    
    // Remove entries older than retention period or beyond max size
    var toRemove = this.collection
      .chain()
      .find({
        $or: [
          { timestamp: { $lt: cutoffTime } },
          { sequence: { $lt: cutoffSequence } }
        ]
      })
      .data();
    
    if (toRemove.length > 0) {
      this.collection.remove(toRemove);
    }
  };

  /**
   * Get statistics about the oplog
   * @returns {object} Statistics object
   */
  LokiOplog.prototype.getStats = function () {
    var stats = {
      totalEntries: 0,
      latestSequence: this.sequence,
      oldestSequence: 0,
      collections: {}
    };
    
    if (this.collection) {
      stats.totalEntries = this.collection.count();
      var oldest = this.collection.chain().simplesort('sequence').limit(1).data();
      if (oldest.length > 0) {
        stats.oldestSequence = oldest[0].sequence;
      }
      
      // Count by collection
      var allEntries = this.collection.find({});
      allEntries.forEach(function (entry) {
        if (!stats.collections[entry.collection]) {
          stats.collections[entry.collection] = 0;
        }
        stats.collections[entry.collection]++;
      });
    } else {
      stats.totalEntries = this.entries.length;
      if (this.entries.length > 0) {
        stats.oldestSequence = this.entries[0].sequence;
        this.entries.forEach(function (entry) {
          if (!stats.collections[entry.collection]) {
            stats.collections[entry.collection] = 0;
          }
          stats.collections[entry.collection]++;
        });
      }
    }
    
    return stats;
  };

  /**
   * Clear all entries (use with caution)
   */
  LokiOplog.prototype.clear = function () {
    if (this.collection) {
      this.collection.clear();
      // Also reset sequence tracking
      this.sequence = 0;
    } else {
      this.entries = [];
      this.sequence = 0;
    }
  };

  return LokiOplog;
}));

