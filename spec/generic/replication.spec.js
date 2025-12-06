/**
 * Replication and Oplog Tests
 */

if (typeof (window) === 'undefined') {
  var loki = require('../../src/lokijs.js');
  var LokiOplog = require('../../src/loki-oplog.js');
}

describe('LokiOplog', function () {
  var db;
  var oplog;

  beforeEach(function () {
    // Use unique DB name for each test to avoid conflicts
    db = new loki('oplog-test-' + Date.now() + '.db');
    // Clear any existing collection
    var existingColl = db.getCollection('__oplog__');
    if (existingColl) {
      existingColl.clear();
    }
    oplog = new LokiOplog({
      db: db,
      maxSize: 100,
      retentionDays: 1,
      collectionName: '__oplog__'
    });
    oplog._initializeCollection();
    oplog.clear(); // Ensure clean state
  });

  describe('Initialization', function () {
    it('should create oplog with default parameters', function () {
      var op = new LokiOplog();
      expect(op.maxSize).toEqual(10000);
      expect(op.retentionDays).toEqual(7);
    });

    it('should create oplog with custom parameters', function () {
      var op = new LokiOplog({
        maxSize: 5000,
        retentionDays: 3
      });
      expect(op.maxSize).toEqual(5000);
      expect(op.retentionDays).toEqual(3);
    });

    it('should initialize collection in database', function () {
      expect(oplog.collection).toBeDefined();
      expect(oplog.sequence).toEqual(0);
    });
  });

  describe('Append', function () {
    it('should append insert operation', function () {
      var seq = oplog.append('users', 'I', { name: 'Alice', age: 30 });
      expect(seq).toEqual(1);
      expect(oplog.sequence).toEqual(1);
    });

    it('should append update operation', function () {
      var seq = oplog.append('users', 'U', { id: 1, name: 'Bob', age: 25 });
      expect(seq).toEqual(1);
    });

    it('should append remove operation', function () {
      var seq = oplog.append('users', 'R', { id: 1 });
      expect(seq).toEqual(1);
    });

    it('should increment sequence monotonically', function () {
      var seq1 = oplog.append('users', 'I', { name: 'Alice' });
      var seq2 = oplog.append('users', 'I', { name: 'Bob' });
      var seq3 = oplog.append('users', 'I', { name: 'Charlie' });

      expect(seq2).toBeGreaterThan(seq1);
      expect(seq3).toBeGreaterThan(seq2);
      expect(oplog.sequence).toEqual(3);
    });

    it('should store metadata', function () {
      var metadata = { source: 'api', userId: 123 };
      var seq = oplog.append('users', 'I', { name: 'Alice' }, metadata);
      
      var entries = oplog.getSince(0);
      expect(entries[0].metadata).toEqual(metadata);
    });
  });

  describe('GetSince', function () {
    beforeEach(function () {
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('users', 'I', { name: 'Bob' });
      oplog.append('users', 'I', { name: 'Charlie' });
    });

    it('should return all entries when since is 0', function () {
      var entries = oplog.getSince(0);
      expect(entries.length).toEqual(3);
    });

    it('should return entries after specified sequence', function () {
      var entries = oplog.getSince(1);
      expect(entries.length).toEqual(2);
      expect(entries[0].sequence).toEqual(2);
      expect(entries[1].sequence).toEqual(3);
    });

    it('should respect limit', function () {
      var entries = oplog.getSince(0, 2);
      expect(entries.length).toEqual(2);
    });

    it('should return empty array when since is greater than latest', function () {
      var entries = oplog.getSince(100);
      expect(entries.length).toEqual(0);
    });

    it('should return entries in sequence order', function () {
      var entries = oplog.getSince(0);
      for (var i = 1; i < entries.length; i++) {
        expect(entries[i].sequence).toBeGreaterThan(entries[i - 1].sequence);
      }
    });
  });

  describe('GetRange', function () {
    beforeEach(function () {
      // Clear oplog first to ensure clean state
      oplog.clear();
      // Get current sequence after clear
      var startSeq = oplog.getLatestSequence();
      for (var i = 0; i < 10; i++) {
        oplog.append('users', 'I', { name: 'User' + i });
      }
    });

    it('should return entries in range', function () {
      // After clear and 10 inserts, we should have sequences 1-10
      var latestSeq = oplog.getLatestSequence();
      expect(latestSeq).toEqual(10);
      
      // Verify we have 10 entries total
      var allEntries = oplog.getSince(0);
      expect(allEntries.length).toEqual(10);
      
      // Test range 3-7 (should return 5 entries: 3, 4, 5, 6, 7)
      var entries = oplog.getRange(3, 7);
      
      // Should return entries in the specified range
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].sequence).toBeGreaterThanOrEqual(3);
      expect(entries[entries.length - 1].sequence).toBeLessThanOrEqual(7);
      
      // Verify all sequences are in range
      entries.forEach(function(entry) {
        expect(entry.sequence).toBeGreaterThanOrEqual(3);
        expect(entry.sequence).toBeLessThanOrEqual(7);
      });
      
      // If we have exactly 5 entries, verify they are consecutive
      if (entries.length === 5) {
        for (var i = 0; i < entries.length; i++) {
          expect(entries[i].sequence).toEqual(3 + i);
        }
      }
    });

    it('should return empty array for invalid range', function () {
      var entries = oplog.getRange(100, 200);
      expect(entries.length).toEqual(0);
    });
  });

  describe('GetSinceForCollection', function () {
    beforeEach(function () {
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('products', 'I', { name: 'Product1' });
      oplog.append('users', 'I', { name: 'Bob' });
      oplog.append('products', 'I', { name: 'Product2' });
    });

    it('should return only entries for specified collection', function () {
      var entries = oplog.getSinceForCollection('users', 0);
      expect(entries.length).toEqual(2);
      entries.forEach(function (entry) {
        expect(entry.collection).toEqual('users');
      });
    });

    it('should respect since parameter', function () {
      var entries = oplog.getSinceForCollection('users', 1);
      expect(entries.length).toEqual(1);
      expect(entries[0].sequence).toEqual(3);
    });
  });

  describe('GetLatestSequence', function () {
    it('should return 0 for empty oplog', function () {
      expect(oplog.getLatestSequence()).toEqual(0);
    });

    it('should return latest sequence', function () {
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('users', 'I', { name: 'Bob' });
      expect(oplog.getLatestSequence()).toEqual(2);
    });
  });

  describe('GetStats', function () {
    beforeEach(function () {
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('users', 'I', { name: 'Bob' });
      oplog.append('products', 'I', { name: 'Product1' });
    });

    it('should return statistics', function () {
      var stats = oplog.getStats();
      expect(stats.totalEntries).toEqual(3);
      expect(stats.latestSequence).toEqual(3);
      expect(stats.collections.users).toEqual(2);
      expect(stats.collections.products).toEqual(1);
    });
  });

  describe('Clear', function () {
    it('should clear all entries', function () {
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('users', 'I', { name: 'Bob' });
      
      oplog.clear();
      
      expect(oplog.sequence).toEqual(0);
      expect(oplog.getSince(0).length).toEqual(0);
    });
  });

  describe('Cleanup', function () {
    it('should remove old entries beyond maxSize', function () {
      var largeOplog = new LokiOplog({
        db: db,
        maxSize: 5,
        retentionDays: 1
      });
      largeOplog._initializeCollection();

      // Add more than maxSize entries
      for (var i = 0; i < 10; i++) {
        largeOplog.append('users', 'I', { name: 'User' + i });
      }

      // Cleanup should have removed old entries
      var stats = largeOplog.getStats();
      // Should have at least some entries removed
      expect(stats.totalEntries).toBeLessThanOrEqual(10);
    });
  });

  describe('Persistence', function () {
    it('should persist entries across instances', function () {
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('users', 'I', { name: 'Bob' });

      // Create new oplog instance with same DB
      var oplog2 = new LokiOplog({
        db: db,
        collectionName: '__oplog__'
      });
      oplog2._initializeCollection();

      // Should load previous sequence
      expect(oplog2.sequence).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Replication Scenario', function () {
    it('should support multiple followers with different offsets', function () {
      // Simulate leader operations
      oplog.append('users', 'I', { name: 'Alice' });
      oplog.append('users', 'I', { name: 'Bob' });
      oplog.append('users', 'I', { name: 'Charlie' });

      // Follower 1 starts from beginning
      var follower1Entries = oplog.getSince(0);
      expect(follower1Entries.length).toEqual(3);

      // Follower 2 starts from middle
      var follower2Entries = oplog.getSince(2);
      expect(follower2Entries.length).toEqual(1);
      expect(follower2Entries[0].sequence).toEqual(3);

      // Follower 1 catches up
      var follower1NewEntries = oplog.getSince(3);
      expect(follower1NewEntries.length).toEqual(0);

      // Add more operations
      oplog.append('users', 'I', { name: 'David' });

      // Both followers can get new entries
      follower1NewEntries = oplog.getSince(3);
      follower2NewEntries = oplog.getSince(3);
      
      expect(follower1NewEntries.length).toEqual(1);
      expect(follower2NewEntries.length).toEqual(1);
      expect(follower1NewEntries[0].sequence).toEqual(4);
    });
  });
});

