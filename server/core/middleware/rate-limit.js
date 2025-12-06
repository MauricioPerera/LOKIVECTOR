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
 * Rate Limiting Middleware for LokiVector
 * Implements rate limiting per API key and endpoint
 */

class RateLimiter {
  constructor() {
    // In-memory storage for MVP
    // Future: Use Redis for distributed rate limiting
    this.requests = new Map();
    
    // Cleanup interval (remove old entries every 5 minutes)
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Parse time window string to milliseconds
   * @param {string} window - Time window (e.g., "1h", "1d", "1w")
   * @returns {number} Milliseconds
   */
  parseWindow(window) {
    const match = window.match(/^(\d+)([hdwms])$/);
    if (!match) {
      return 3600000; // Default: 1 hour
    }

    const [, amount, unit] = match;
    const multipliers = {
      s: 1000,           // seconds
      m: 60000,          // minutes
      h: 3600000,        // hours
      d: 86400000,       // days
      w: 604800000       // weeks
    };

    return parseInt(amount) * (multipliers[unit] || 3600000);
  }

  /**
   * Check if request is within rate limit
   * @param {string} apiKeyId - API key ID
   * @param {string} endpoint - Endpoint path
   * @param {number} limit - Request limit
   * @param {string} window - Time window (e.g., "1h")
   * @returns {object} { allowed, remaining, resetAt }
   */
  checkLimit(apiKeyId, endpoint, limit, window) {
    const key = `${apiKeyId}:${endpoint}`;
    const now = Date.now();
    const windowMs = this.parseWindow(window);

    if (!this.requests.has(key)) {
      // First request
      this.requests.set(key, {
        count: 1,
        resetAt: now + windowMs,
        firstRequest: now
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs
      };
    }

    const record = this.requests.get(key);

    // Check if window has expired
    if (now > record.resetAt) {
      // Reset window
      record.count = 1;
      record.resetAt = now + windowMs;
      record.firstRequest = now;
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs
      };
    }

    // Check if limit exceeded
    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt
      };
    }

    // Increment count
    record.count++;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetAt: record.resetAt
    };
  }

  /**
   * Get current rate limit status
   * @param {string} apiKeyId - API key ID
   * @param {string} endpoint - Endpoint path
   * @returns {object|null} Current status or null if no record
   */
  getStatus(apiKeyId, endpoint) {
    const key = `${apiKeyId}:${endpoint}`;
    const record = this.requests.get(key);
    
    if (!record) {
      return null;
    }

    const now = Date.now();
    if (now > record.resetAt) {
      return null; // Expired
    }

    return {
      count: record.count,
      remaining: record.remaining || 0,
      resetAt: record.resetAt
    };
  }

  /**
   * Reset rate limit for a key/endpoint
   * @param {string} apiKeyId - API key ID
   * @param {string} endpoint - Endpoint path (optional, resets all if not provided)
   */
  reset(apiKeyId, endpoint = null) {
    if (endpoint) {
      const key = `${apiKeyId}:${endpoint}`;
      this.requests.delete(key);
    } else {
      // Reset all for this API key
      const prefix = `${apiKeyId}:`;
      for (const [key] of this.requests) {
        if (key.startsWith(prefix)) {
          this.requests.delete(key);
        }
      }
    }
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, record] of this.requests) {
      if (now > record.resetAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.requests.delete(key));
  }

  /**
   * Get statistics
   * @returns {object} Statistics
   */
  getStats() {
    return {
      totalKeys: new Set(
        Array.from(this.requests.keys()).map(k => k.split(':')[0])
      ).size,
      totalEndpoints: this.requests.size,
      memoryUsage: this.requests.size * 100 // Rough estimate in bytes
    };
  }
}

/**
 * Create rate limiting middleware
 * @param {RateLimiter} rateLimiter - Rate limiter instance
 * @returns {Function} Express middleware
 */
function createRateLimitMiddleware(rateLimiter) {
  return function rateLimit(req, res, next) {
    // Skip rate limiting if no API key (shouldn't happen if auth middleware is before)
    if (!req.apiKey) {
      return next();
    }

    const apiKey = req.apiKey;
    const endpoint = req.path;
    const { requests, window } = apiKey.permissions.rateLimit || {
      requests: 1000,
      window: '1h'
    };

    // Check rate limit
    const result = rateLimiter.checkLimit(
      apiKey.id,
      endpoint,
      requests,
      window
    );

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': requests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString()
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${requests} per ${window}`,
        resetAt: new Date(result.resetAt).toISOString()
      });
    }

    next();
  };
}

module.exports = {
  RateLimiter,
  createRateLimitMiddleware
};

