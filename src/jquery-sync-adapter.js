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
 * LokiJS JquerySyncAdapter
 * @author Joe Minichino <joe.minichino@gmail.com>
 *
 * A remote sync adapter example for LokiJS
 */

/*jslint browser: true, node: true, plusplus: true, indent: 2 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.lokiJquerySyncAdapter = factory();
  }
}(this, function () {

  return (function (options) {
    'use strict';

    function JquerySyncAdapterError(message) {
      this.name = "JquerySyncAdapterError";
      this.message = (message || "");
    }

    JquerySyncAdapterError.prototype = Error.prototype;

    /**
     * this adapter assumes an object options is passed,
     * containing the following properties:
     * ajaxLib: jquery or compatible ajax library
     * save: { url: the url to save to, dataType [optional]: json|xml|etc., type [optional]: POST|GET|PUT}
     * load: { url: the url to load from, dataType [optional]: json|xml| etc., type [optional]: POST|GET|PUT }
     */

    function JquerySyncAdapter(options) {
      this.options = options;
      
      if (!options) {
        throw new JquerySyncAdapterError('No options configured in JquerySyncAdapter');
      }

      if (!options.ajaxLib) {
        throw new JquerySyncAdapterError('No ajaxLib property specified in options');
      }

      if (!options.save || !options.load) {
        throw new JquerySyncAdapterError('Please specify load and save properties in options');
      }
      if (!options.save.url || !options.load.url) {
        throw new JquerySyncAdapterError('load and save objects must have url property');
      }
    }

    JquerySyncAdapter.prototype.saveDatabase = function (name, data, callback) {
      this.options.ajaxLib.ajax({
        type: this.options.save.type || 'POST',
        url: this.options.save.url,
        data: data,
        success: callback,
        failure: function () {
          throw new JquerySyncAdapterError("Remote sync failed");
        },
        dataType: this.options.save.dataType || 'json'
      });
    };

    JquerySyncAdapter.prototype.loadDatabase = function (name, callback) {
      this.options.ajaxLib.ajax({
        type: this.options.load.type || 'GET',
        url: this.options.load.url,
        data: {
          // or whatever parameter to fetch the db from a server
          name: name
        },
        success: callback,
        failure: function () {
          throw new JquerySyncAdapterError("Remote load failed");
        },
        dataType: this.options.load.dataType || 'json'
      });
    };

    return JquerySyncAdapter;

  }());
}));