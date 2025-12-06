/**
 * LokiJS Vector Search Plugin
 *
 * Extends LokiJS with vector search capabilities using HNSW index.
 * Enables semantic search, similarity search, and nearest neighbor queries.
 *
 * @requires loki-hnsw-index.js
 * @license MIT
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./lokijs', './loki-hnsw-index'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('./lokijs'), require('./loki-hnsw-index'));
  } else {
    factory(root.loki, root.LokiHNSWIndex);
  }
}(this, function (Loki, HNSWIndex) {
  'use strict';

  // Reference to Collection prototype
  var Collection = Loki.Collection;

  /**
   * Original Collection initialization - we'll wrap it
   */
  var originalCollectionInit = Collection;

  /**
   * Extend Collection constructor to support vector indices
   */
  function extendCollection(loki) {
    var OriginalCollection = loki.Collection;

    // Store reference to HNSWIndex for serialization
    loki.HNSWIndex = HNSWIndex;

    /**
     * Add vectorIndices to Collection initialization
     */
    var originalAddCollection = loki.prototype.addCollection;
    loki.prototype.addCollection = function (name, options) {
      var collection = originalAddCollection.call(this, name, options);

      // Initialize vector indices container
      if (!collection.vectorIndices) {
        collection.vectorIndices = {};
      }

      // Process vector index options
      if (options && options.vectorIndices) {
        var vectorOptions = options.vectorIndices;
        for (var property in vectorOptions) {
          if (vectorOptions.hasOwnProperty(property)) {
            collection.ensureVectorIndex(property, vectorOptions[property]);
          }
        }
      }

      return collection;
    };

    /**
     * Extend Collection prototype with vector methods
     */

    /**
     * Ensure a vector index exists for a property
     *
     * @param {string} property - Property name containing vectors
     * @param {Object} options - HNSW index options
     * @param {number} [options.M=16] - Max connections per node
     * @param {number} [options.efConstruction=200] - Construction search size
     * @param {number} [options.efSearch=50] - Query search size
     * @param {string} [options.distanceFunction='euclidean'] - Distance metric
     * @param {number} [options.dimensions=null] - Vector dimensions (auto-detected)
     * @returns {HNSWIndex} The vector index
     * @memberof Collection
     */
    OriginalCollection.prototype.ensureVectorIndex = function (property, options) {
      if (!this.vectorIndices) {
        this.vectorIndices = {};
      }

      // If index already exists and not forcing rebuild, return it
      if (this.vectorIndices[property]) {
        return this.vectorIndices[property];
      }

      options = options || {};
      options.vectorProperty = property;

      // Create new HNSW index
      var index = new HNSWIndex(options);
      this.vectorIndices[property] = index;

      // Index existing documents
      var data = this.data;
      for (var i = 0; i < data.length; i++) {
        var doc = data[i];
        var vector = getNestedProperty(doc, property);
        if (vector && Array.isArray(vector)) {
          index.insert(doc.$loki, vector);
        }
      }

      this.dirty = true;
      return index;
    };

    /**
     * Remove a vector index
     *
     * @param {string} property - Property name of vector index to remove
     * @memberof Collection
     */
    OriginalCollection.prototype.removeVectorIndex = function (property) {
      if (this.vectorIndices && this.vectorIndices[property]) {
        delete this.vectorIndices[property];
        this.dirty = true;
      }
    };

    /**
     * Get a vector index
     *
     * @param {string} property - Property name
     * @returns {HNSWIndex|null}
     * @memberof Collection
     */
    OriginalCollection.prototype.getVectorIndex = function (property) {
      return this.vectorIndices ? this.vectorIndices[property] : null;
    };

    /**
     * Find nearest neighbors to a query vector
     *
     * @param {string} property - Property name containing vectors
     * @param {Array} queryVector - Query vector
     * @param {Object} options - Search options
     * @param {number} [options.k=10] - Number of neighbors to return
     * @param {number} [options.ef=50] - Search expansion factor (higher = more accurate)
     * @param {boolean} [options.includeDistance=true] - Include distance in results
     * @param {Object} [options.filter=null] - Additional filter to apply to results
     * @returns {Array} Array of documents with optional distance
     * @memberof Collection
     */
    OriginalCollection.prototype.findNearest = function (property, queryVector, options) {
      options = options || {};
      var k = options.k || 10;
      var ef = options.ef || 50;
      var includeDistance = options.includeDistance !== false;
      var filter = options.filter || null;

      // Ensure vector index exists
      var index = this.vectorIndices ? this.vectorIndices[property] : null;
      if (!index) {
        throw new Error('Vector index not found for property: ' + property + '. Call ensureVectorIndex() first.');
      }

      // Search for more candidates if we have a filter
      var searchK = filter ? k * 3 : k;
      var searchEf = filter ? Math.max(ef, searchK * 2) : ef;

      // Perform HNSW search
      var results = index.search(queryVector, searchK, searchEf);

      // Map results to documents
      var self = this;
      var documents = [];

      for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var doc = self.get(result.id);

        if (!doc) continue;

        // Apply filter if provided
        if (filter) {
          var matches = matchesQuery(doc, filter);
          if (!matches) continue;
        }

        if (includeDistance) {
          // Clone doc and add distance
          var docWithDistance = clone(doc);
          docWithDistance.$distance = result.distance;
          docWithDistance.$similarity = 1 / (1 + result.distance);
          documents.push(docWithDistance);
        } else {
          documents.push(doc);
        }

        if (documents.length >= k) break;
      }

      return documents;
    };

    /**
     * Find documents similar to another document
     *
     * @param {string} property - Property name containing vectors
     * @param {Object|number} docOrId - Document or $loki id
     * @param {Object} options - Search options (same as findNearest)
     * @returns {Array} Array of similar documents (excludes the source document)
     * @memberof Collection
     */
    OriginalCollection.prototype.findSimilar = function (property, docOrId, options) {
      var doc = typeof docOrId === 'object' ? docOrId : this.get(docOrId);
      if (!doc) {
        throw new Error('Document not found');
      }

      var vector = getNestedProperty(doc, property);
      if (!vector || !Array.isArray(vector)) {
        throw new Error('Document does not have a valid vector at property: ' + property);
      }

      options = options || {};
      var k = (options.k || 10) + 1; // +1 because we'll exclude the source doc

      var results = this.findNearest(property, vector, {
        k: k,
        ef: options.ef,
        includeDistance: options.includeDistance,
        filter: options.filter
      });

      // Filter out the source document
      var sourceId = doc.$loki;
      return results.filter(function (d) {
        return d.$loki !== sourceId;
      }).slice(0, options.k || 10);
    };

    /**
     * Hybrid search: combine vector similarity with traditional query
     *
     * @param {string} property - Property name containing vectors
     * @param {Array} queryVector - Query vector
     * @param {Object} query - Traditional LokiJS query
     * @param {Object} options - Search options
     * @param {number} [options.k=10] - Number of results
     * @param {number} [options.vectorWeight=0.5] - Weight for vector score (0-1)
     * @returns {Array} Array of documents sorted by combined score
     * @memberof Collection
     */
    OriginalCollection.prototype.hybridSearch = function (property, queryVector, query, options) {
      options = options || {};
      var k = options.k || 10;
      var vectorWeight = options.vectorWeight !== undefined ? options.vectorWeight : 0.5;
      var textWeight = 1 - vectorWeight;

      // Get vector search results (get more to have candidates)
      var vectorResults = this.findNearest(property, queryVector, {
        k: k * 3,
        ef: options.ef || 100,
        includeDistance: true
      });

      // Get traditional query results
      var queryResults = this.find(query);
      var queryResultsMap = {};
      queryResults.forEach(function (doc) {
        queryResultsMap[doc.$loki] = true;
      });

      // Calculate combined scores
      var maxDistance = 0;
      vectorResults.forEach(function (doc) {
        if (doc.$distance > maxDistance) maxDistance = doc.$distance;
      });

      var scoredResults = [];
      vectorResults.forEach(function (doc) {
        var inQueryResults = queryResultsMap[doc.$loki] ? 1 : 0;
        var normalizedVectorScore = 1 - (doc.$distance / (maxDistance || 1));

        var combinedScore = (vectorWeight * normalizedVectorScore) + (textWeight * inQueryResults);

        var result = clone(doc);
        result.$score = combinedScore;
        result.$vectorScore = normalizedVectorScore;
        result.$queryMatch = inQueryResults === 1;
        scoredResults.push(result);
      });

      // Sort by combined score (descending)
      scoredResults.sort(function (a, b) {
        return b.$score - a.$score;
      });

      return scoredResults.slice(0, k);
    };

    /**
     * Hook into insert to update vector indices
     */
    var originalInsertOne = OriginalCollection.prototype.insertOne;
    OriginalCollection.prototype.insertOne = function (doc, bulkInsert) {
      var result = originalInsertOne.call(this, doc, bulkInsert);

      // Update vector indices
      if (result && this.vectorIndices) {
        for (var property in this.vectorIndices) {
          if (this.vectorIndices.hasOwnProperty(property)) {
            var vector = getNestedProperty(result, property);
            if (vector && Array.isArray(vector)) {
              this.vectorIndices[property].insert(result.$loki, vector);
            }
          }
        }
      }

      return result;
    };

    /**
     * Hook into update to update vector indices
     */
    var originalUpdate = OriginalCollection.prototype.update;
    OriginalCollection.prototype.update = function (doc) {
      var result = originalUpdate.call(this, doc);

      // Update vector indices
      if (this.vectorIndices) {
        for (var property in this.vectorIndices) {
          if (this.vectorIndices.hasOwnProperty(property)) {
            var vector = getNestedProperty(doc, property);
            if (vector && Array.isArray(vector)) {
              this.vectorIndices[property].update(doc.$loki, vector);
            }
          }
        }
      }

      return result;
    };

    /**
     * Hook into remove to update vector indices
     */
    var originalRemove = OriginalCollection.prototype.remove;
    OriginalCollection.prototype.remove = function (doc) {
      // Remove from vector indices before removing document
      if (this.vectorIndices && doc.$loki) {
        for (var property in this.vectorIndices) {
          if (this.vectorIndices.hasOwnProperty(property)) {
            this.vectorIndices[property].remove(doc.$loki);
          }
        }
      }

      return originalRemove.call(this, doc);
    };

    /**
     * Hook into clear to clear vector indices
     */
    var originalClear = OriginalCollection.prototype.clear;
    OriginalCollection.prototype.clear = function (options) {
      // Clear vector indices
      if (this.vectorIndices) {
        for (var property in this.vectorIndices) {
          if (this.vectorIndices.hasOwnProperty(property)) {
            this.vectorIndices[property].clear();
          }
        }
      }

      return originalClear.call(this, options);
    };

    /**
     * Extend serialization to include vector indices
     */
    var originalSerialize = loki.prototype.serialize;
    loki.prototype.serialize = function (options) {
      // Serialize vector indices before main serialization
      this.collections.forEach(function (coll) {
        if (coll.vectorIndices) {
          coll._serializedVectorIndices = {};
          for (var property in coll.vectorIndices) {
            if (coll.vectorIndices.hasOwnProperty(property)) {
              coll._serializedVectorIndices[property] = coll.vectorIndices[property].serialize();
            }
          }
        }
      });

      var result = originalSerialize.call(this, options);

      // Clean up temporary serialization data
      this.collections.forEach(function (coll) {
        delete coll._serializedVectorIndices;
      });

      return result;
    };

    /**
     * Extend deserialization to restore vector indices
     */
    var originalLoadJSON = loki.prototype.loadJSON;
    loki.prototype.loadJSON = function (serializedDb, options) {
      // Pre-process to extract vector indices before loadJSON processes the data
      var vectorIndicesMap = {};

      // Parse the serialized data to extract vector indices
      var dbObject;
      try {
        if (typeof serializedDb === 'string') {
          // Check if it's destructured serialization (not pure JSON)
          // Destructured serialization might contain non-JSON delimiters
          // If JSON.parse fails, we might be dealing with destructured data which 
          // this plugin interceptor shouldn't try to parse as a whole JSON
          try {
            dbObject = JSON.parse(serializedDb);
          } catch (e) {
            // It might be destructured serialization which is not valid JSON
            // In this case we can't extract vector indices easily from the string
            // Let the original loadJSON handle it
            originalLoadJSON.call(this, serializedDb, options);
            return;
          }
        } else {
          dbObject = serializedDb;
        }
      } catch (e) {
        // Fallback to original method on any error
        originalLoadJSON.call(this, serializedDb, options);
        return;
      }

      // Extract vector indices from collections before they get processed
      if (dbObject.collections) {
        dbObject.collections.forEach(function (coll, idx) {
          if (coll._serializedVectorIndices) {
            vectorIndicesMap[coll.name] = coll._serializedVectorIndices;
          }
        });
      }

      // Call original loadJSON
      originalLoadJSON.call(this, serializedDb, options);

      // Restore vector indices to collections
      var self = this;
      this.collections.forEach(function (coll) {
        if (vectorIndicesMap[coll.name]) {
          coll.vectorIndices = {};
          var serializedIndices = vectorIndicesMap[coll.name];
          for (var property in serializedIndices) {
            if (serializedIndices.hasOwnProperty(property)) {
              var index = HNSWIndex.fromSerialized(serializedIndices[property]);
              coll.vectorIndices[property] = index;
            }
          }
        }
      });
    };

    /**
     * Get vector index statistics
     *
     * @param {string} property - Property name
     * @returns {Object} Index statistics
     * @memberof Collection
     */
    OriginalCollection.prototype.getVectorIndexStats = function (property) {
      var index = this.vectorIndices ? this.vectorIndices[property] : null;
      if (!index) {
        return null;
      }
      return index.getStats();
    };

    /**
     * Rebuild vector index from scratch
     *
     * @param {string} property - Property name
     * @param {Object} options - New index options (optional)
     * @memberof Collection
     */
    OriginalCollection.prototype.rebuildVectorIndex = function (property, options) {
      var existingIndex = this.vectorIndices ? this.vectorIndices[property] : null;

      // Use existing options if not provided
      if (!options && existingIndex) {
        options = {
          M: existingIndex.M,
          efConstruction: existingIndex.efConstruction,
          efSearch: existingIndex.efSearch,
          distanceFunction: existingIndex.distanceFunctionName,
          dimensions: existingIndex.dimensions
        };
      }

      // Remove existing index
      if (this.vectorIndices) {
        delete this.vectorIndices[property];
      }

      // Create new index
      return this.ensureVectorIndex(property, options);
    };
  }

  // Utility functions

  /**
   * Get nested property from object using dot notation
   */
  function getNestedProperty(obj, path) {
    if (!path.includes('.')) {
      return obj[path];
    }

    var parts = path.split('.');
    var current = obj;

    for (var i = 0; i < parts.length; i++) {
      if (current == null) return undefined;
      current = current[parts[i]];
    }

    return current;
  }

  /**
   * Simple clone function
   */
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if document matches query (simplified)
   */
  function matchesQuery(doc, query) {
    for (var key in query) {
      if (!query.hasOwnProperty(key)) continue;

      var queryVal = query[key];
      var docVal = getNestedProperty(doc, key);

      if (typeof queryVal === 'object' && queryVal !== null) {
        // Handle operators
        for (var op in queryVal) {
          if (!queryVal.hasOwnProperty(op)) continue;
          var opVal = queryVal[op];

          switch (op) {
            case '$eq':
              if (docVal !== opVal) return false;
              break;
            case '$ne':
              if (docVal === opVal) return false;
              break;
            case '$gt':
              if ((docVal > opVal) === false) return false;
              break;
            case '$gte':
              if ((docVal >= opVal) === false) return false;
              break;
            case '$lt':
              if ((docVal < opVal) === false) return false;
              break;
            case '$lte':
              if ((docVal <= opVal) === false) return false;
              break;
            case '$in':
              if (!Array.isArray(opVal) || opVal.indexOf(docVal) === -1) return false;
              break;
            case '$nin':
              if (!Array.isArray(opVal) || opVal.indexOf(docVal) !== -1) return false;
              break;
            case '$regex':
              var regex = opVal instanceof RegExp ? opVal : new RegExp(opVal);
              if (!regex.test(docVal)) return false;
              break;
            case '$contains':
              if (typeof docVal !== 'string' || docVal.indexOf(opVal) === -1) return false;
              break;
          }
        }
      } else {
        // Direct equality
        if (docVal !== queryVal) return false;
      }
    }
    return true;
  }

  /**
   * Plugin installation function
   */
  function install(loki) {
    if (!loki) {
      throw new Error('LokiJS instance required');
    }
    if (!HNSWIndex) {
      throw new Error('HNSWIndex required. Include loki-hnsw-index.js');
    }

    extendCollection(loki);

    // Mark as installed
    loki._vectorPluginInstalled = true;

    return loki;
  }

  // Auto-install if both Loki and HNSWIndex are available
  if (Loki && HNSWIndex) {
    install(Loki);
  }

  return {
    install: install,
    HNSWIndex: HNSWIndex
  };
}));
