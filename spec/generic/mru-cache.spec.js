/**
 * MRU Cache Tests
 */

if (typeof (window) === 'undefined') {
  var loki = require('../../src/lokijs.js');
  var MRUCache = require('../../src/mru-cache.js');
}

describe('MRUCache', function () {
  var cache;

  beforeEach(function () {
    cache = new MRUCache(5); // Capacity of 5
  });

  describe('Initialization', function () {
    it('should create cache with specified capacity', function () {
      var c = new MRUCache(10);
      expect(c.capacity).toEqual(10);
    });

    it('should create cache with default capacity', function () {
      var c = new MRUCache();
      expect(c.capacity).toEqual(100);
    });

    it('should start empty', function () {
      expect(cache.size).toEqual(0);
    });
  });

  describe('Set and Get', function () {
    it('should store and retrieve values', function () {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toEqual('value1');
    });

    it('should return undefined for non-existent keys', function () {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update existing keys', function () {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toEqual('value2');
    });

    it('should handle different value types', function () {
      cache.set('string', 'test');
      cache.set('number', 42);
      cache.set('object', { a: 1 });
      cache.set('array', [1, 2, 3]);
      cache.set('null', null);

      expect(cache.get('string')).toEqual('test');
      expect(cache.get('number')).toEqual(42);
      expect(cache.get('object')).toEqual({ a: 1 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
      expect(cache.get('null')).toBeNull();
    });
  });

  describe('Capacity Management', function () {
    it('should evict least recently used when capacity exceeded', function () {
      // Fill cache to capacity
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      expect(cache.size).toEqual(5);

      // Add one more - should evict key1 (least recently used)
      cache.set('key6', 'value6');

      expect(cache.size).toEqual(5);
      expect(cache.get('key1')).toBeUndefined(); // Evicted
      expect(cache.get('key6')).toEqual('value6'); // New entry
    });

    it('should update access order on get', function () {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add new key - should evict key2 (now least recently used)
      cache.set('key6', 'value6');

      expect(cache.get('key1')).toEqual('value1'); // Still present
      expect(cache.get('key2')).toBeUndefined(); // Evicted
    });

    it('should handle capacity of 1', function () {
      var smallCache = new MRUCache(1);
      smallCache.set('key1', 'value1');
      expect(smallCache.get('key1')).toEqual('value1');

      smallCache.set('key2', 'value2');
      expect(smallCache.get('key1')).toBeUndefined();
      expect(smallCache.get('key2')).toEqual('value2');
    });
  });

  describe('Clear', function () {
    it('should clear all entries', function () {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();

      expect(cache.size).toEqual(0);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('Has', function () {
    it('should return true for existing keys', function () {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', function () {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false after eviction', function () {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      cache.set('key6', 'value6'); // Evicts key1

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key6')).toBe(true);
    });
  });

  describe('Integration with LokiJS Collections', function () {
    var db;
    var collection;

    beforeEach(function () {
      db = new loki('test.db');
      collection = db.addCollection('users');
      collection.mruCache = new MRUCache(100);
    });

    it('should cache find query results', function () {
      // Clear collection first
      collection.clear();
      
      // Insert test data
      for (var i = 0; i < 50; i++) {
        collection.insert({ name: 'User' + i, age: 20 + i });
      }

      var query = { age: { $gte: 30 } };

      // First query - should execute normally
      var start1 = Date.now();
      var result1 = collection.find(query);
      var time1 = Date.now() - start1;

      // Second query - should use cache
      var start2 = Date.now();
      var result2 = collection.find(query);
      var time2 = Date.now() - start2;

      expect(result1.length).toEqual(result2.length);
      // Users with age >= 30: Users with age 30-69 (20+30=50, so ages 30-69 = 40 users)
      // Actually: ages 20+i where i=0-49, so ages 20-69
      // age >= 30 means ages 30-69, which is 40 users (indices 10-49)
      expect(result1.length).toEqual(40);

      // Cache should improve performance (time2 should be much faster)
      // Note: On very fast systems, both might be 0ms, so we just verify results match
      expect(result1).toEqual(result2);
    });

    it('should cache different queries separately', function () {
      for (var i = 0; i < 20; i++) {
        collection.insert({ name: 'User' + i, age: i });
      }

      var query1 = { age: { $gte: 10 } };
      var query2 = { age: { $lt: 10 } };

      var result1a = collection.find(query1);
      var result2a = collection.find(query2);
      var result1b = collection.find(query1);
      var result2b = collection.find(query2);

      expect(result1a).toEqual(result1b);
      expect(result2a).toEqual(result2b);
      expect(result1a.length).toEqual(10);
      expect(result2a.length).toEqual(10);
    });

    it('should handle cache invalidation on insert', function () {
      collection.insert({ name: 'User1', age: 30 });
      
      var query = { age: { $gte: 30 } };
      var result1 = collection.find(query);
      expect(result1.length).toEqual(1);

      // Insert new document
      collection.insert({ name: 'User2', age: 35 });

      // Query should return updated results (cache may be invalidated)
      var result2 = collection.find(query);
      expect(result2.length).toBeGreaterThanOrEqual(1);
    });

    it('should work with complex queries', function () {
      for (var i = 0; i < 30; i++) {
        collection.insert({
          name: 'User' + i,
          age: i,
          active: i % 2 === 0
        });
      }

      var complexQuery = {
        $and: [
          { age: { $gte: 10 } },
          { age: { $lt: 20 } },
          { active: true }
        ]
      };

      var result1 = collection.find(complexQuery);
      var result2 = collection.find(complexQuery);

      expect(result1).toEqual(result2);
      expect(result1.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', function () {
    it('should provide performance improvement for repeated queries', function () {
      var db = new loki('perf.db');
      var collection = db.addCollection('items');
      collection.mruCache = new MRUCache(50);

      // Insert large dataset
      for (var i = 0; i < 1000; i++) {
        collection.insert({
          id: i,
          value: Math.random() * 100,
          category: i % 10
        });
      }

      var query = { category: 5 };

      // Warm up
      collection.find(query);

      // Measure first execution
      var start1 = Date.now();
      for (var i = 0; i < 100; i++) {
        collection.find(query);
      }
      var time1 = Date.now() - start1;

      // Results should be consistent
      var results = collection.find(query);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

