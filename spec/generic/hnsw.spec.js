/**
 * HNSW Vector Index Tests
 */

if (typeof require !== 'undefined') {
  var loki = require("../../src/core/lokijs.js")');
  try {
    var HNSWIndex = require("../../src/core/loki-hnsw-index.js")');
    require("../../src/core/loki-vector-plugin.js")');
  } catch (e) {
    // Ignore require errors, might be running in browser/karma
  }
}

if (typeof HNSWIndex === 'undefined') {
  // In browser environment, it might be exposed as global or under window
  if (typeof window !== 'undefined' && window.LokiHNSWIndex) {
    HNSWIndex = window.LokiHNSWIndex;
  } else if (typeof global !== 'undefined' && global.LokiHNSWIndex) {
    HNSWIndex = global.LokiHNSWIndex;
  } else if (typeof LokiHNSWIndex !== 'undefined') {
    // Fallback for Karma if loaded as a script
    HNSWIndex = LokiHNSWIndex;
  }
}

describe('HNSWIndex', function () {
  var index;

  beforeEach(function () {
    index = new HNSWIndex({
      M: 16,
      efConstruction: 100,
      efSearch: 50,
      distanceFunction: 'euclidean'
    });
  });

  describe('Initialization', function () {
    it('should create index with default parameters', function () {
      var idx = new HNSWIndex();
      expect(idx.M).toEqual(16);
      expect(idx.efConstruction).toEqual(200);
      expect(idx.efSearch).toEqual(50);
    });

    it('should create index with custom parameters', function () {
      var idx = new HNSWIndex({
        M: 32,
        efConstruction: 300,
        efSearch: 100,
        distanceFunction: 'cosine'
      });
      expect(idx.M).toEqual(32);
      expect(idx.efConstruction).toEqual(300);
      expect(idx.efSearch).toEqual(100);
      expect(idx.distanceFunctionName).toEqual('cosine');
    });
  });

  describe('Insert', function () {
    it('should insert single vector', function () {
      index.insert(1, [1, 2, 3]);
      expect(index.nodeCount).toEqual(1);
      expect(index.has(1)).toBe(true);
    });

    it('should insert multiple vectors', function () {
      index.insert(1, [1, 0, 0]);
      index.insert(2, [0, 1, 0]);
      index.insert(3, [0, 0, 1]);
      expect(index.nodeCount).toEqual(3);
    });

    it('should auto-detect dimensions', function () {
      index.insert(1, [1, 2, 3, 4, 5]);
      expect(index.dimensions).toEqual(5);
    });

    it('should throw on dimension mismatch', function () {
      index.insert(1, [1, 2, 3]);
      expect(function () {
        index.insert(2, [1, 2]);
      }).toThrow();
    });

    it('should throw on empty vector', function () {
      expect(function () {
        index.insert(1, []);
      }).toThrow();
    });
  });

  describe('Search', function () {
    beforeEach(function () {
      // Insert test vectors
      index.insert(1, [0, 0, 0]);
      index.insert(2, [1, 0, 0]);
      index.insert(3, [0, 1, 0]);
      index.insert(4, [0, 0, 1]);
      index.insert(5, [1, 1, 0]);
      index.insert(6, [1, 0, 1]);
      index.insert(7, [0, 1, 1]);
      index.insert(8, [1, 1, 1]);
    });

    it('should find exact match', function () {
      var results = index.search([0, 0, 0], 1);
      expect(results.length).toEqual(1);
      expect(results[0].id).toEqual(1);
      expect(results[0].distance).toEqual(0);
    });

    it('should find k nearest neighbors', function () {
      var results = index.search([0, 0, 0], 3);
      expect(results.length).toEqual(3);
      // First result should be exact match
      expect(results[0].id).toEqual(1);
    });

    it('should return results sorted by distance', function () {
      var results = index.search([0.5, 0.5, 0.5], 5);
      for (var i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
      }
    });

    it('should return empty array for empty index', function () {
      var emptyIndex = new HNSWIndex();
      var results = emptyIndex.search([1, 2, 3], 5);
      expect(results.length).toEqual(0);
    });
  });

  describe('Remove', function () {
    it('should remove vector', function () {
      index.insert(1, [1, 0, 0]);
      index.insert(2, [0, 1, 0]);
      index.remove(1);
      expect(index.nodeCount).toEqual(1);
      expect(index.has(1)).toBe(false);
      expect(index.has(2)).toBe(true);
    });

    it('should update entry point after removal', function () {
      index.insert(1, [1, 0, 0]);
      index.remove(1);
      expect(index.nodeCount).toEqual(0);
      expect(index.entryPoint).toBeNull();
    });
  });

  describe('Update', function () {
    it('should update vector', function () {
      index.insert(1, [0, 0, 0]);
      index.update(1, [1, 1, 1]);

      var results = index.search([1, 1, 1], 1);
      expect(results[0].id).toEqual(1);
      expect(results[0].distance).toEqual(0);
    });
  });

  describe('Clear', function () {
    it('should clear all vectors', function () {
      index.insert(1, [1, 0, 0]);
      index.insert(2, [0, 1, 0]);
      index.clear();
      expect(index.nodeCount).toEqual(0);
      expect(index.entryPoint).toBeNull();
    });
  });

  describe('Serialization', function () {
    it('should serialize and deserialize', function () {
      index.insert(1, [1, 0, 0]);
      index.insert(2, [0, 1, 0]);
      index.insert(3, [0, 0, 1]);

      var serialized = index.serialize();
      var restored = HNSWIndex.fromSerialized(serialized);

      expect(restored.nodeCount).toEqual(3);
      expect(restored.dimensions).toEqual(3);

      // Search should work on restored index
      var results = restored.search([1, 0, 0], 1);
      expect(results[0].id).toEqual(1);
    });
  });

  describe('Statistics', function () {
    it('should return stats', function () {
      index.insert(1, [1, 0, 0]);
      index.insert(2, [0, 1, 0]);
      index.insert(3, [0, 0, 1]);

      var stats = index.getStats();
      expect(stats.nodeCount).toEqual(3);
      expect(stats.dimensions).toEqual(3);
      expect(stats.M).toEqual(16);
    });
  });

  describe('Distance Functions', function () {
    it('should use euclidean distance', function () {
      var idx = new HNSWIndex({ distanceFunction: 'euclidean' });
      idx.insert(1, [0, 0]);
      idx.insert(2, [3, 4]);

      var results = idx.search([0, 0], 2);
      expect(results[0].id).toEqual(1);
      expect(results[1].distance).toBeCloseTo(5, 5);
    });

    it('should use cosine distance', function () {
      var idx = new HNSWIndex({ distanceFunction: 'cosine' });
      idx.insert(1, [1, 0]);
      idx.insert(2, [0, 1]);
      idx.insert(3, [1, 1]);

      // Vector [1, 0] should be closest to itself
      var results = idx.search([1, 0], 1);
      expect(results[0].id).toEqual(1);
    });
  });
});

describe('LokiJS Vector Plugin', function () {
  var db;
  var collection;

  beforeEach(function () {
    db = new loki('test.db');
    collection = db.addCollection('documents');
  });

  describe('ensureVectorIndex', function () {
    it('should create vector index', function () {
      var index = collection.ensureVectorIndex('embedding', {
        M: 16,
        distanceFunction: 'euclidean'
      });
      expect(index).toBeDefined();
      expect(collection.vectorIndices['embedding']).toBeDefined();
    });

    it('should index existing documents', function () {
      collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      collection.insert({ name: 'doc2', embedding: [0, 1, 0] });

      var index = collection.ensureVectorIndex('embedding');
      expect(index.nodeCount).toEqual(2);
    });
  });

  describe('findNearest', function () {
    beforeEach(function () {
      collection.insert({ name: 'doc1', embedding: [1, 0, 0], category: 'A' });
      collection.insert({ name: 'doc2', embedding: [0, 1, 0], category: 'B' });
      collection.insert({ name: 'doc3', embedding: [0, 0, 1], category: 'A' });
      collection.insert({ name: 'doc4', embedding: [1, 1, 0], category: 'B' });
      collection.insert({ name: 'doc5', embedding: [0.9, 0.1, 0], category: 'A' });
      collection.ensureVectorIndex('embedding');
    });

    it('should find nearest neighbors', function () {
      var results = collection.findNearest('embedding', [1, 0, 0], { k: 2 });
      expect(results.length).toEqual(2);
      expect(results[0].name).toEqual('doc1');
    });

    it('should include distance', function () {
      var results = collection.findNearest('embedding', [1, 0, 0], {
        k: 1,
        includeDistance: true
      });
      expect(results[0].$distance).toBeDefined();
      expect(results[0].$similarity).toBeDefined();
    });

    it('should apply filter', function () {
      var results = collection.findNearest('embedding', [1, 0, 0], {
        k: 5,
        filter: { category: 'A' }
      });
      results.forEach(function (doc) {
        expect(doc.category).toEqual('A');
      });
    });
  });

  describe('findSimilar', function () {
    beforeEach(function () {
      collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      collection.insert({ name: 'doc2', embedding: [0.9, 0.1, 0] });
      collection.insert({ name: 'doc3', embedding: [0, 1, 0] });
      collection.ensureVectorIndex('embedding');
    });

    it('should find similar documents', function () {
      var doc1 = collection.findOne({ name: 'doc1' });
      var results = collection.findSimilar('embedding', doc1, { k: 2 });

      expect(results.length).toEqual(2);
      // Should not include doc1 itself
      results.forEach(function (doc) {
        expect(doc.name).not.toEqual('doc1');
      });
    });

    it('should find similar by id', function () {
      var doc1 = collection.findOne({ name: 'doc1' });
      var results = collection.findSimilar('embedding', doc1.$loki, { k: 1 });
      expect(results.length).toEqual(1);
    });
  });

  describe('hybridSearch', function () {
    beforeEach(function () {
      collection.insert({ name: 'red apple', embedding: [1, 0, 0], type: 'fruit' });
      collection.insert({ name: 'green apple', embedding: [0.8, 0.2, 0], type: 'fruit' });
      collection.insert({ name: 'red car', embedding: [0.9, 0.1, 0], type: 'vehicle' });
      collection.insert({ name: 'blue car', embedding: [0, 0, 1], type: 'vehicle' });
      collection.ensureVectorIndex('embedding');
    });

    it('should combine vector and query search', function () {
      var results = collection.hybridSearch(
        'embedding',
        [1, 0, 0],
        { type: 'fruit' },
        { k: 2, vectorWeight: 0.5 }
      );

      expect(results.length).toEqual(2);
      expect(results[0].$score).toBeDefined();
      expect(results[0].$vectorScore).toBeDefined();
      expect(results[0].$queryMatch).toBeDefined();
    });
  });

  describe('Auto-update on insert/update/remove', function () {
    beforeEach(function () {
      collection.ensureVectorIndex('embedding');
    });

    it('should update index on insert', function () {
      collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      var index = collection.getVectorIndex('embedding');
      expect(index.nodeCount).toEqual(1);
    });

    it('should update index on update', function () {
      var doc = collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      doc.embedding = [0, 1, 0];
      collection.update(doc);

      var results = collection.findNearest('embedding', [0, 1, 0], { k: 1 });
      expect(results[0].$distance).toEqual(0);
    });

    it('should update index on remove', function () {
      var doc = collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      collection.remove(doc);

      var index = collection.getVectorIndex('embedding');
      expect(index.nodeCount).toEqual(0);
    });
  });

  describe('Persistence', function () {
    it('should persist and restore vector indices', function () {
      collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      collection.insert({ name: 'doc2', embedding: [0, 1, 0] });
      collection.ensureVectorIndex('embedding');

      // Serialize
      var serialized = db.serialize();

      // Create new db and load
      var db2 = new loki('test2.db');
      db2.loadJSON(serialized);

      var coll2 = db2.getCollection('documents');

      // Vector index should be restored
      var results = coll2.findNearest('embedding', [1, 0, 0], { k: 1 });
      expect(results[0].name).toEqual('doc1');
    });
  });

  describe('Statistics', function () {
    it('should return vector index stats', function () {
      collection.insert({ name: 'doc1', embedding: [1, 0, 0] });
      collection.insert({ name: 'doc2', embedding: [0, 1, 0] });
      collection.ensureVectorIndex('embedding');

      var stats = collection.getVectorIndexStats('embedding');
      expect(stats.nodeCount).toEqual(2);
      expect(stats.dimensions).toEqual(3);
    });
  });

  describe('Nested Properties', function () {
    it('should support dot notation for nested vectors', function () {
      collection.insert({
        name: 'doc1',
        data: { embedding: [1, 0, 0] }
      });
      collection.insert({
        name: 'doc2',
        data: { embedding: [0, 1, 0] }
      });

      collection.ensureVectorIndex('data.embedding');

      var results = collection.findNearest('data.embedding', [1, 0, 0], { k: 1 });
      expect(results[0].name).toEqual('doc1');
    });
  });
});

describe('Large Scale Performance', function () {
  it('should handle 1000 vectors efficiently', function () {
    var index = new HNSWIndex({
      M: 16,
      efConstruction: 100,
      efSearch: 50
    });

    var dimensions = 128;
    var count = 1000;

    // Insert vectors
    var startInsert = Date.now();
    for (var i = 0; i < count; i++) {
      var vector = [];
      for (var j = 0; j < dimensions; j++) {
        vector.push(Math.random());
      }
      index.insert(i, vector);
    }
    var insertTime = Date.now() - startInsert;

    expect(index.nodeCount).toEqual(count);
    console.log('Insert ' + count + ' vectors: ' + insertTime + 'ms');

    // Search
    var queryVector = [];
    for (var j = 0; j < dimensions; j++) {
      queryVector.push(Math.random());
    }

    var startSearch = Date.now();
    var searchIterations = 100;
    for (var i = 0; i < searchIterations; i++) {
      index.search(queryVector, 10);
    }
    var searchTime = Date.now() - startSearch;

    console.log('Search ' + searchIterations + ' times: ' + searchTime + 'ms (' + (searchTime / searchIterations).toFixed(2) + 'ms/search)');

    // Search should be fast (< 10ms per search on average)
    expect(searchTime / searchIterations).toBeLessThan(50);
  });
});
