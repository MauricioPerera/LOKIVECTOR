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
 * HNSW (Hierarchical Navigable Small World) Index for LokiJS
 *
 * An efficient approximate nearest neighbor search index based on the HNSW algorithm.
 * Paper: "Efficient and robust approximate nearest neighbor search using
 *         Hierarchical Navigable Small World graphs" by Malkov & Yashunin
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
    root.LokiHNSWIndex = factory();
  }
}(this, function () {
  'use strict';

  /**
   * Distance functions for vector comparison
   */
  var DistanceFunctions = {
    /**
     * Euclidean distance (L2)
     */
    euclidean: function (a, b) {
      var sum = 0;
      for (var i = 0; i < a.length; i++) {
        var diff = a[i] - b[i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    },

    /**
     * Squared Euclidean distance (faster, no sqrt)
     */
    euclideanSquared: function (a, b) {
      var sum = 0;
      for (var i = 0; i < a.length; i++) {
        var diff = a[i] - b[i];
        sum += diff * diff;
      }
      return sum;
    },

    /**
     * Cosine distance (1 - cosine similarity)
     */
    cosine: function (a, b) {
      var dotProduct = 0;
      var normA = 0;
      var normB = 0;
      for (var i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      var similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      return 1 - similarity;
    },

    /**
     * Inner product (negative for max similarity search)
     */
    innerProduct: function (a, b) {
      var sum = 0;
      for (var i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
      }
      return -sum; // negative because we want max similarity
    }
  };

  /**
   * Priority Queue (Min-Heap) implementation for efficient neighbor selection
   */
  function PriorityQueue(comparator) {
    this.data = [];
    this.comparator = comparator || function (a, b) { return a.distance - b.distance; };
  }

  PriorityQueue.prototype.push = function (item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  };

  PriorityQueue.prototype.pop = function () {
    if (this.data.length === 0) return null;
    var result = this.data[0];
    var last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._bubbleDown(0);
    }
    return result;
  };

  PriorityQueue.prototype.peek = function () {
    return this.data[0] || null;
  };

  PriorityQueue.prototype.size = function () {
    return this.data.length;
  };

  PriorityQueue.prototype._bubbleUp = function (index) {
    while (index > 0) {
      var parentIndex = Math.floor((index - 1) / 2);
      if (this.comparator(this.data[index], this.data[parentIndex]) >= 0) break;
      this._swap(index, parentIndex);
      index = parentIndex;
    }
  };

  PriorityQueue.prototype._bubbleDown = function (index) {
    var length = this.data.length;
    while (true) {
      var leftChild = 2 * index + 1;
      var rightChild = 2 * index + 2;
      var smallest = index;

      if (leftChild < length && this.comparator(this.data[leftChild], this.data[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < length && this.comparator(this.data[rightChild], this.data[smallest]) < 0) {
        smallest = rightChild;
      }
      if (smallest === index) break;
      this._swap(index, smallest);
      index = smallest;
    }
  };

  PriorityQueue.prototype._swap = function (i, j) {
    var temp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = temp;
  };

  PriorityQueue.prototype.toArray = function () {
    // Always return sorted by distance ascending (nearest first)
    return this.data.slice().sort(function (a, b) { return a.distance - b.distance; });
  };

  /**
   * HNSW Index Constructor
   *
   * @param {Object} options - Configuration options
   * @param {number} [options.M=16] - Maximum number of connections per node per layer
   * @param {number} [options.efConstruction=200] - Size of dynamic candidate list during construction
   * @param {number} [options.efSearch=50] - Size of dynamic candidate list during search
   * @param {string} [options.distanceFunction='euclidean'] - Distance function: 'euclidean', 'cosine', 'innerProduct'
   * @param {number} [options.dimensions=null] - Vector dimensions (auto-detected if null)
   * @param {string} [options.vectorProperty='vector'] - Property name containing the vector in documents
   */
  function HNSWIndex(options) {
    options = options || {};

    // HNSW parameters
    this.M = options.M || 16;                          // Max connections per layer
    this.M0 = this.M * 2;                              // Max connections for layer 0
    this.efConstruction = options.efConstruction || 200;
    this.efSearch = options.efSearch || 50;
    this.mL = 1 / Math.log(this.M);                   // Level generation factor

    // Distance function
    this.distanceFunctionName = options.distanceFunction || 'euclidean';
    this.distanceFunction = DistanceFunctions[this.distanceFunctionName] || DistanceFunctions.euclidean;

    // Vector configuration
    this.dimensions = options.dimensions || null;
    this.vectorProperty = options.vectorProperty || 'vector';

    // Graph structure
    this.layers = [];                                  // Array of layers, each is a Map<id, Set<id>>
    this.nodeLevel = new Map();                        // Map<id, maxLevel>
    this.vectors = new Map();                          // Map<id, vector>
    this.entryPoint = null;                           // Entry point node id
    this.maxLevel = -1;                               // Current maximum level

    // Statistics
    this.nodeCount = 0;
    this.dirty = false;
  }

  /**
   * Generate random level for new node using exponential distribution
   */
  HNSWIndex.prototype._getRandomLevel = function () {
    var level = 0;
    while (Math.random() < (1 / this.M) && level < 32) {
      level++;
    }
    return level;
  };

  /**
   * Get distance between a vector and a node
   */
  HNSWIndex.prototype._getDistance = function (vector, nodeId) {
    var nodeVector = this.vectors.get(nodeId);
    if (!nodeVector) return Infinity;
    return this.distanceFunction(vector, nodeVector);
  };

  /**
   * Search layer for nearest neighbors (greedy search)
   *
   * @param {Array} queryVector - Query vector
   * @param {*} entryPointId - Entry point node id
   * @param {number} ef - Size of dynamic candidate list
   * @param {number} layer - Layer to search
   * @returns {Array} - Array of {id, distance} sorted by distance
   */
  HNSWIndex.prototype._searchLayer = function (queryVector, entryPointId, ef, layer) {
    var visited = new Set();
    visited.add(entryPointId);

    var entryDist = this._getDistance(queryVector, entryPointId);

    // Candidates (min-heap by distance)
    var candidates = new PriorityQueue(function (a, b) { return a.distance - b.distance; });
    candidates.push({ id: entryPointId, distance: entryDist });

    // Results (max-heap by distance - we want to keep the smallest)
    var results = new PriorityQueue(function (a, b) { return b.distance - a.distance; });
    results.push({ id: entryPointId, distance: entryDist });

    while (candidates.size() > 0) {
      var current = candidates.pop();
      var furthestResult = results.peek();

      // If current candidate is further than the furthest result, stop
      if (current.distance > furthestResult.distance) {
        break;
      }

      // Get neighbors at this layer
      var neighbors = this._getNeighbors(current.id, layer);

      for (var i = 0; i < neighbors.length; i++) {
        var neighborId = neighbors[i];

        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        var neighborDist = this._getDistance(queryVector, neighborId);
        furthestResult = results.peek();

        if (neighborDist < furthestResult.distance || results.size() < ef) {
          candidates.push({ id: neighborId, distance: neighborDist });
          results.push({ id: neighborId, distance: neighborDist });

          if (results.size() > ef) {
            results.pop();
          }
        }
      }
    }

    return results.toArray();
  };

  /**
   * Get neighbors of a node at a specific layer
   */
  HNSWIndex.prototype._getNeighbors = function (nodeId, layer) {
    if (layer >= this.layers.length) return [];
    var layerGraph = this.layers[layer];
    if (!layerGraph) return [];
    var neighbors = layerGraph.get(nodeId);
    return neighbors ? Array.from(neighbors) : [];
  };

  /**
   * Add connection between two nodes at a layer
   */
  HNSWIndex.prototype._addConnection = function (fromId, toId, layer) {
    // Ensure layer exists
    while (this.layers.length <= layer) {
      this.layers.push(new Map());
    }

    var layerGraph = this.layers[layer];

    if (!layerGraph.has(fromId)) {
      layerGraph.set(fromId, new Set());
    }
    layerGraph.get(fromId).add(toId);
  };

  /**
   * Select best neighbors using simple heuristic
   */
  HNSWIndex.prototype._selectNeighbors = function (queryVector, candidates, M) {
    // Sort by distance and take M nearest
    candidates.sort(function (a, b) { return a.distance - b.distance; });
    return candidates.slice(0, M);
  };

  /**
   * Shrink connections to maintain M limit (prune)
   */
  HNSWIndex.prototype._shrinkConnections = function (nodeId, layer, maxConnections) {
    var neighbors = this._getNeighbors(nodeId, layer);
    if (neighbors.length <= maxConnections) return;

    var nodeVector = this.vectors.get(nodeId);
    var self = this;

    // Calculate distances and sort
    var neighborsWithDist = neighbors.map(function (nId) {
      return { id: nId, distance: self._getDistance(nodeVector, nId) };
    });

    var selected = this._selectNeighbors(nodeVector, neighborsWithDist, maxConnections);

    // Replace neighbor set
    var newNeighbors = new Set(selected.map(function (n) { return n.id; }));
    this.layers[layer].set(nodeId, newNeighbors);
  };

  /**
   * Insert a vector into the index
   *
   * @param {*} id - Unique identifier for the vector (typically $loki)
   * @param {Array} vector - The vector to insert
   */
  HNSWIndex.prototype.insert = function (id, vector) {
    // Validate vector
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('Vector must be a non-empty array');
    }

    // Auto-detect dimensions
    if (this.dimensions === null) {
      this.dimensions = vector.length;
    } else if (vector.length !== this.dimensions) {
      throw new Error('Vector dimension mismatch. Expected ' + this.dimensions + ', got ' + vector.length);
    }

    // Store vector
    this.vectors.set(id, vector);

    // Generate level for this node
    var nodeLevel = this._getRandomLevel();
    this.nodeLevel.set(id, nodeLevel);

    // First node becomes entry point
    if (this.entryPoint === null) {
      this.entryPoint = id;
      this.maxLevel = nodeLevel;

      // Initialize layers
      for (var l = 0; l <= nodeLevel; l++) {
        this.layers.push(new Map());
        this.layers[l].set(id, new Set());
      }

      this.nodeCount++;
      this.dirty = true;
      return;
    }

    var currentNode = this.entryPoint;

    // Phase 1: Find entry point for insertion (traverse from top to nodeLevel+1)
    for (var level = this.maxLevel; level > nodeLevel; level--) {
      var nearest = this._searchLayer(vector, currentNode, 1, level);
      if (nearest.length > 0) {
        currentNode = nearest[0].id;
      }
    }

    // Phase 2: Insert and connect at each layer from nodeLevel down to 0
    for (var lc = Math.min(nodeLevel, this.maxLevel); lc >= 0; lc--) {
      var neighbors = this._searchLayer(vector, currentNode, this.efConstruction, lc);
      var maxM = (lc === 0) ? this.M0 : this.M;
      var selectedNeighbors = this._selectNeighbors(vector, neighbors, maxM);

      // Ensure layer exists for this node
      while (this.layers.length <= lc) {
        this.layers.push(new Map());
      }
      if (!this.layers[lc].has(id)) {
        this.layers[lc].set(id, new Set());
      }

      // Add bidirectional connections
      for (var i = 0; i < selectedNeighbors.length; i++) {
        var neighbor = selectedNeighbors[i];
        this._addConnection(id, neighbor.id, lc);
        this._addConnection(neighbor.id, id, lc);

        // Prune neighbor connections if needed
        this._shrinkConnections(neighbor.id, lc, maxM);
      }

      if (neighbors.length > 0) {
        currentNode = neighbors[0].id;
      }
    }

    // Update entry point if this node has higher level
    if (nodeLevel > this.maxLevel) {
      // Add this node to new upper layers
      for (var layerLevel = this.maxLevel + 1; layerLevel <= nodeLevel; layerLevel++) {
        while (this.layers.length <= layerLevel) {
          this.layers.push(new Map());
        }
        this.layers[layerLevel].set(id, new Set());
      }
      this.entryPoint = id;
      this.maxLevel = nodeLevel;
    }

    this.nodeCount++;
    this.dirty = true;
  };

  /**
   * Search for k nearest neighbors
   *
   * @param {Array} queryVector - Query vector
   * @param {number} k - Number of nearest neighbors to return
   * @param {number} [ef] - Size of dynamic candidate list (defaults to efSearch)
   * @returns {Array} - Array of {id, distance} sorted by distance (nearest first)
   */
  HNSWIndex.prototype.search = function (queryVector, k, ef) {
    if (this.entryPoint === null) {
      return [];
    }

    ef = ef || Math.max(this.efSearch, k);

    var currentNode = this.entryPoint;

    // Phase 1: Greedy search from top layer to layer 1
    for (var level = this.maxLevel; level > 0; level--) {
      var nearest = this._searchLayer(queryVector, currentNode, 1, level);
      if (nearest.length > 0) {
        currentNode = nearest[0].id;
      }
    }

    // Phase 2: Search layer 0 with ef candidates
    var results = this._searchLayer(queryVector, currentNode, ef, 0);

    // Return top k results
    return results.slice(0, k);
  };

  /**
   * Remove a vector from the index
   *
   * @param {*} id - Identifier of the vector to remove
   */
  HNSWIndex.prototype.remove = function (id) {
    if (!this.vectors.has(id)) return;

    var nodeLevel = this.nodeLevel.get(id);

    // Remove from all layers
    for (var level = 0; level <= nodeLevel; level++) {
      if (level >= this.layers.length) continue;

      var layerGraph = this.layers[level];
      var neighbors = layerGraph.get(id);

      // Remove references from neighbors
      if (neighbors) {
        var nodeIdToRemove = id;
        var graphToUpdate = layerGraph;
        /* jshint -W083 */
        neighbors.forEach(function (neighborId) {
          var neighborConnections = graphToUpdate.get(neighborId);
          if (neighborConnections) {
            neighborConnections.delete(nodeIdToRemove);
          }
        });
      }

      // Remove node from layer
      layerGraph.delete(id);
    }

    // Remove from vectors and nodeLevel
    this.vectors.delete(id);
    this.nodeLevel.delete(id);
    this.nodeCount--;

    // Update entry point if necessary
    if (this.entryPoint === id) {
      if (this.nodeCount === 0) {
        this.entryPoint = null;
        this.maxLevel = -1;
        this.layers = [];
      } else {
        // Find new entry point (node with highest level)
        var maxL = -1;
        var newEntry = null;
        var self = this;
        this.nodeLevel.forEach(function (level, nodeId) {
          if (level > maxL) {
            maxL = level;
            newEntry = nodeId;
          }
        });
        this.entryPoint = newEntry;
        this.maxLevel = maxL;

        // Trim empty upper layers
        while (this.layers.length > this.maxLevel + 1) {
          this.layers.pop();
        }
      }
    }

    this.dirty = true;
  };

  /**
   * Update a vector in the index
   *
   * @param {*} id - Identifier of the vector
   * @param {Array} newVector - New vector value
   */
  HNSWIndex.prototype.update = function (id, newVector) {
    this.remove(id);
    this.insert(id, newVector);
  };

  /**
   * Clear the entire index
   */
  HNSWIndex.prototype.clear = function () {
    this.layers = [];
    this.nodeLevel = new Map();
    this.vectors = new Map();
    this.entryPoint = null;
    this.maxLevel = -1;
    this.nodeCount = 0;
    this.dirty = true;
  };

  /**
   * Check if index contains a specific id
   */
  HNSWIndex.prototype.has = function (id) {
    return this.vectors.has(id);
  };

  /**
   * Get vector by id
   */
  HNSWIndex.prototype.get = function (id) {
    return this.vectors.get(id);
  };

  /**
   * Get statistics about the index
   */
  HNSWIndex.prototype.getStats = function () {
    var layerStats = [];
    for (var i = 0; i < this.layers.length; i++) {
      var layer = this.layers[i];
      var totalConnections = 0;
      var currentLayerForStats = layer;
      /* jshint -W083 */
      layer.forEach(function (neighbors) {
        totalConnections += neighbors.size;
      });
      layerStats.push({
        level: i,
        nodes: currentLayerForStats.size,
        connections: totalConnections,
        avgConnections: layer.size > 0 ? (totalConnections / layer.size).toFixed(2) : 0
      });
    }

    return {
      nodeCount: this.nodeCount,
      dimensions: this.dimensions,
      maxLevel: this.maxLevel,
      M: this.M,
      efConstruction: this.efConstruction,
      efSearch: this.efSearch,
      distanceFunction: this.distanceFunctionName,
      layers: layerStats
    };
  };

  /**
   * Serialize index for persistence
   */
  HNSWIndex.prototype.serialize = function () {
    var layersData = [];

    for (var i = 0; i < this.layers.length; i++) {
      var layerObj = {};
      var currentLayerForSerialize = this.layers[i];
      /* jshint -W083 */
      currentLayerForSerialize.forEach(function (neighbors, nodeId) {
        layerObj[nodeId] = Array.from(neighbors);
      });
      layersData.push(layerObj);
    }

    var vectorsData = {};
    this.vectors.forEach(function (vector, id) {
      vectorsData[id] = vector;
    });

    var nodeLevelData = {};
    this.nodeLevel.forEach(function (level, id) {
      nodeLevelData[id] = level;
    });

    return {
      M: this.M,
      efConstruction: this.efConstruction,
      efSearch: this.efSearch,
      distanceFunction: this.distanceFunctionName,
      dimensions: this.dimensions,
      vectorProperty: this.vectorProperty,
      layers: layersData,
      vectors: vectorsData,
      nodeLevel: nodeLevelData,
      entryPoint: this.entryPoint,
      maxLevel: this.maxLevel,
      nodeCount: this.nodeCount
    };
  };

  /**
   * Deserialize and restore index from persisted data
   */
  HNSWIndex.prototype.deserialize = function (data) {
    this.M = data.M;
    this.M0 = this.M * 2;
    this.efConstruction = data.efConstruction;
    this.efSearch = data.efSearch;
    this.mL = 1 / Math.log(this.M);
    this.distanceFunctionName = data.distanceFunction;
    this.distanceFunction = DistanceFunctions[this.distanceFunctionName] || DistanceFunctions.euclidean;
    this.dimensions = data.dimensions;
    this.vectorProperty = data.vectorProperty;
    this.entryPoint = data.entryPoint;
    this.maxLevel = data.maxLevel;
    this.nodeCount = data.nodeCount;

    // Restore layers
    this.layers = [];
    for (var i = 0; i < data.layers.length; i++) {
      var layerMap = new Map();
      var layerObj = data.layers[i];
      for (var nodeId in layerObj) {
        if (layerObj.hasOwnProperty(nodeId)) {
          // Convert nodeId back to number if it was numeric
          var id = isNaN(nodeId) ? nodeId : parseInt(nodeId, 10);
          layerMap.set(id, new Set(layerObj[nodeId]));
        }
      }
      this.layers.push(layerMap);
    }

    // Restore vectors
    this.vectors = new Map();
    for (var vectorId in data.vectors) {
      if (data.vectors.hasOwnProperty(vectorId)) {
        var vectorNumId = isNaN(vectorId) ? vectorId : parseInt(vectorId, 10);
        this.vectors.set(vectorNumId, data.vectors[vectorId]);
      }
    }

    // Restore nodeLevel
    this.nodeLevel = new Map();
    for (var levelId in data.nodeLevel) {
      if (data.nodeLevel.hasOwnProperty(levelId)) {
        var levelNumId = isNaN(levelId) ? levelId : parseInt(levelId, 10);
        this.nodeLevel.set(levelNumId, data.nodeLevel[levelId]);
      }
    }

    this.dirty = false;
  };

  /**
   * Create index from serialized data (static factory)
   */
  HNSWIndex.fromSerialized = function (data) {
    var index = new HNSWIndex();
    index.deserialize(data);
    return index;
  };

  // Expose distance functions
  HNSWIndex.DistanceFunctions = DistanceFunctions;
  HNSWIndex.PriorityQueue = PriorityQueue;

  return HNSWIndex;
}));