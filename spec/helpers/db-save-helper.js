/**
 * Database Save Helper
 * 
 * Ensures database is fully saved to disk before continuing
 * Prevents race conditions in crash recovery tests
 */

const fs = require('fs');

/**
 * Wait for database file to be written to disk
 * @param {string} dbPath - Path to database file
 * @param {number} maxWait - Maximum wait time in ms (default: 2000)
 * @param {number} checkInterval - Check interval in ms (default: 10)
 * @returns {Promise} Resolves when file is ready, rejects on timeout
 */
function waitForDatabaseFile(dbPath, maxWait = 2000, checkInterval = 10) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkFile() {
      try {
        if (fs.existsSync(dbPath)) {
          const stats = fs.statSync(dbPath);
          // File exists and has content
          if (stats.size > 0) {
            // Additional check: try to read a bit to ensure it's not locked
            try {
              const fd = fs.openSync(dbPath, 'r');
              fs.closeSync(fd);
              resolve();
              return;
            } catch (e) {
              // File might be locked, wait a bit more
            }
          }
        }
        
        // Check timeout
        if (Date.now() - startTime >= maxWait) {
          reject(new Error(`Database file ${dbPath} was not written in ${maxWait}ms`));
          return;
        }
        
        // Check again after interval
        setTimeout(checkFile, checkInterval);
      } catch (err) {
        reject(err);
      }
    }
    
    checkFile();
  });
}

/**
 * Save database and wait for it to be fully written
 * @param {Object} db - LokiJS database instance
 * @param {string} dbPath - Path to database file
 * @returns {Promise} Resolves when save is complete
 */
function saveDatabaseAndWait(db, dbPath) {
  return new Promise((resolve, reject) => {
    db.saveDatabase(function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      // Wait for file to be written
      waitForDatabaseFile(dbPath)
        .then(resolve)
        .catch(reject);
    });
  });
}

module.exports = {
  waitForDatabaseFile,
  saveDatabaseAndWait
};

