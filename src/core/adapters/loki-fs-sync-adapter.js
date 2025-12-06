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

/*
  A synchronous version of the Loki Filesystem adapter for node.js

  Intended for diagnostics or environments where synchronous i/o is required.

  This adapter will perform worse than the default LokiFsAdapter but 
  is provided for quick adaptation to synchronous code.
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.LokiFsSyncAdapter = factory();
    }
}(this, function () {
  return (function() {
    'use strict';

    /**
     * A loki persistence adapter which persists using node fs module
     * @constructor LokiFsSyncAdapter
     */
    function LokiFsSyncAdapter() {
      this.fs = require('fs');
    }

    /**
     * loadDatabase() - Load data from file, will throw an error if the file does not exist
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsSyncAdapter
     */
    LokiFsSyncAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
      var self = this;
      var contents;

      try {
        var stats = this.fs.statSync(dbname);
        if (stats.isFile()) {
          contents = self.fs.readFileSync(dbname, {
            encoding: 'utf8'
          });
          
          callback(contents);
        }
        else {
          callback(null);
        }
      }
      catch (err) {
        // first autoload when file doesn't exist yet
        // should not throw error but leave default
        // blank database.
        if (err.code === "ENOENT") {
          callback(null);
        }
        
        callback(err);
      }
    };

    /**
     * saveDatabase() - save data to file, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsSyncAdapter
     */
    LokiFsSyncAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
      try {
        this.fs.writeFileSync(dbname, dbstring);
        callback();
      }
      catch (err) {
        callback(err);
      }
    };

    /**
     * deleteDatabase() - delete the database file, will throw an error if the
     * file can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsSyncAdapter
     */
    LokiFsSyncAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
      try {
        this.fs.unlinkSync(dbname);
        callback();
      }
      catch (err) {
        callback(err);
      }
    };

    return LokiFsSyncAdapter;

  }());
}));
