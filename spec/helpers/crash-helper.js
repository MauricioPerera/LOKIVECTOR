/**
 * LokiVector Commercial Module - Proprietary License
 * 
 * Copyright (c) 2025 LokiVector Contributors
 * 
 * This file is part of LokiVector Commercial Edition.
 * Unauthorized copying, hosting, or redistribution is prohibited.
 * 
 * This software is licensed under the LokiVector Commercial License.
 * See LICENSE-COMMERCIAL.md for terms.
 * 
 * For licensing inquiries: commercial@lokivector.io
 * 
 * All rights reserved.
 */

/**
 * Crash Recovery Helpers
 * 
 * Utilities for simulating crashes and validating database integrity
 */

const fs = require('fs');
const path = require('path');

/**
 * Simula un crash forzando la terminación del proceso
 * @param {ChildProcess} process - Proceso a terminar
 */
function forceCrash(process) {
  if (!process || !process.pid) {
    throw new Error('Invalid process provided');
  }
  
  try {
    // SIGKILL es equivalente a kill -9 (terminación inmediata)
    process.kill('SIGKILL');
  } catch (err) {
    // Si el proceso ya terminó, está bien
    if (err.code !== 'ESRCH') {
      throw err;
    }
  }
}

/**
 * Espera a que un proceso termine (con timeout)
 * @param {ChildProcess} process - Proceso a esperar
 * @param {number} timeout - Timeout en ms (default: 5000)
 */
function waitForProcessExit(process, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!process || process.killed) {
      return resolve();
    }
    
    const timer = setTimeout(() => {
      reject(new Error('Process did not exit within timeout'));
    }, timeout);
    
    process.on('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    
    // Si ya terminó
    if (process.killed) {
      clearTimeout(timer);
      resolve();
    }
  });
}

/**
 * Valida integridad básica de la base de datos
 * @param {Object} db - Instancia de LokiJS
 * @returns {Object} - Resultado de validación
 */
function validateDatabaseIntegrity(db) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  if (!db) {
    result.valid = false;
    result.errors.push('Database instance is null or undefined');
    return result;
  }
  
  // Validar que todas las colecciones están accesibles
  try {
    const collections = db.listCollections();
    if (!Array.isArray(collections)) {
      result.valid = false;
      result.errors.push('Collections list is not an array');
    }
    
    // Validar cada colección
    collections.forEach(coll => {
      try {
        // Verificar que la colección tiene métodos básicos
        if (typeof coll.find !== 'function') {
          result.errors.push(`Collection ${coll.name} missing find method`);
          result.valid = false;
        }
        
        if (typeof coll.count !== 'function') {
          result.warnings.push(`Collection ${coll.name} missing count method`);
        }
        
        // Intentar una query básica
        try {
          coll.find({});
        } catch (e) {
          result.errors.push(`Collection ${coll.name} query failed: ${e.message}`);
          result.valid = false;
        }
      } catch (e) {
        result.errors.push(`Error validating collection ${coll.name}: ${e.message}`);
        result.valid = false;
      }
    });
  } catch (e) {
    result.valid = false;
    result.errors.push(`Error listing collections: ${e.message}`);
  }
  
  return result;
}

/**
 * Valida integridad de índices vectoriales
 * @param {Object} collection - Colección de LokiJS
 * @returns {Object} - Resultado de validación
 */
function validateVectorIndexIntegrity(collection) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  if (!collection) {
    result.valid = false;
    result.errors.push('Collection is null or undefined');
    return result;
  }
  
  // Verificar si tiene índice vectorial
  const hasVectorIndex = !!(collection.vectorIndex || collection.getVectorIndex);
  
  if (!hasVectorIndex) {
    result.warnings.push('Collection does not have a vector index');
    return result;
  }
  
  // Validar estructura del índice
  try {
    const vectorIndex = collection.vectorIndex || collection.getVectorIndex();
    
    if (!vectorIndex) {
      result.valid = false;
      result.errors.push('Vector index is null or undefined');
      return result;
    }
    
    // Verificar que el índice tiene métodos necesarios
    if (typeof vectorIndex.search !== 'function' && typeof vectorIndex.findNearest !== 'function') {
      result.valid = false;
      result.errors.push('Vector index missing search/findNearest method');
    }
    
    // Intentar una búsqueda de prueba (si hay documentos)
    const docCount = collection.count ? collection.count() : 0;
    if (docCount > 0) {
      try {
        // Crear un vector de prueba (mismo tamaño que los documentos)
        const sampleDoc = collection.findOne({});
        if (sampleDoc) {
          // Buscar campo con vector (asumimos que existe)
          const vectorFields = Object.keys(sampleDoc).filter(key => 
            Array.isArray(sampleDoc[key]) && sampleDoc[key].length > 0 && typeof sampleDoc[key][0] === 'number'
          );
          
          if (vectorFields.length > 0) {
            const testVector = new Array(sampleDoc[vectorFields[0]].length).fill(0.1);
            if (collection.findNearest) {
              collection.findNearest(vectorFields[0], testVector, 1);
            }
          }
        }
      } catch (e) {
        result.errors.push(`Vector search test failed: ${e.message}`);
        result.valid = false;
      }
    }
  } catch (e) {
    result.valid = false;
    result.errors.push(`Error validating vector index: ${e.message}`);
  }
  
  return result;
}

/**
 * Valida integridad de replicación
 * @param {Object} leaderDb - Base de datos del leader
 * @param {Object} followerDb - Base de datos del follower (opcional)
 * @returns {Object} - Resultado de validación
 */
function validateReplicationIntegrity(leaderDb, followerDb = null) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Validar leader
  const leaderValidation = validateDatabaseIntegrity(leaderDb);
  if (!leaderValidation.valid) {
    result.valid = false;
    result.errors.push('Leader database integrity failed');
    result.errors.push(...leaderValidation.errors);
  }
  
  // Validar follower si existe
  if (followerDb) {
    const followerValidation = validateDatabaseIntegrity(followerDb);
    if (!followerValidation.valid) {
      result.valid = false;
      result.errors.push('Follower database integrity failed');
      result.errors.push(...followerValidation.errors);
    }
    
    // Comparar colecciones entre leader y follower
    try {
      const leaderCollections = leaderDb.listCollections().map(c => c.name).sort();
      const followerCollections = followerDb.listCollections().map(c => c.name).sort();
      
      if (JSON.stringify(leaderCollections) !== JSON.stringify(followerCollections)) {
        result.warnings.push('Leader and follower have different collections');
      }
      
      // Comparar conteos de documentos (pueden diferir durante sync)
      leaderCollections.forEach(collName => {
        const leaderColl = leaderDb.getCollection(collName);
        const followerColl = followerDb.getCollection(collName);
        
        if (leaderColl && followerColl) {
          const leaderCount = leaderColl.count ? leaderColl.count() : 0;
          const followerCount = followerColl.count ? followerColl.count() : 0;
          
          // Permitir pequeñas diferencias durante sync
          const diff = Math.abs(leaderCount - followerCount);
          if (diff > 10) {
            result.warnings.push(`Collection ${collName}: count mismatch (leader: ${leaderCount}, follower: ${followerCount})`);
          }
        }
      });
    } catch (e) {
      result.errors.push(`Error comparing leader and follower: ${e.message}`);
      result.valid = false;
    }
  }
  
  return result;
}

/**
 * Valida integridad del oplog
 * @param {Object} oplog - Instancia de LokiOplog
 * @returns {Object} - Resultado de validación
 */
function validateOplogIntegrity(oplog) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  if (!oplog) {
    result.warnings.push('Oplog is not initialized');
    return result;
  }
  
  try {
    // Verificar que el oplog tiene una colección
    if (!oplog.collection) {
      result.valid = false;
      result.errors.push('Oplog collection is null');
      return result;
    }
    
    // Verificar secuencia
    const latestSequence = oplog.getLatestSequence();
    if (typeof latestSequence !== 'number' || latestSequence < 0) {
      result.valid = false;
      result.errors.push(`Invalid latest sequence: ${latestSequence}`);
    }
    
    // Verificar que no hay gaps grandes (indicaría corrupción)
    if (latestSequence > 0) {
      const entries = oplog.getSince(0, latestSequence + 1);
      const sequences = entries.map(e => e.sequence).sort((a, b) => a - b);
      
      // Verificar continuidad (permitir algunos gaps menores)
      for (let i = 1; i < sequences.length; i++) {
        const gap = sequences[i] - sequences[i - 1];
        if (gap > 10) {
          result.warnings.push(`Large gap in oplog sequences: ${gap} (from ${sequences[i - 1]} to ${sequences[i]})`);
        }
      }
    }
  } catch (e) {
    result.valid = false;
    result.errors.push(`Error validating oplog: ${e.message}`);
  }
  
  return result;
}

/**
 * Crea un path temporal para tests
 * @param {string} prefix - Prefijo para el archivo
 * @returns {string} - Path completo
 */
function createTempDbPath(prefix = 'crash-test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return path.join(__dirname, '../../data', `${prefix}-${timestamp}-${random}.db`);
}

/**
 * Limpia archivos temporales de test
 * @param {string} dbPath - Path del archivo a eliminar
 */
function cleanupTempDb(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  } catch (e) {
    // Ignorar errores de cleanup
    console.warn(`Warning: Could not cleanup temp DB ${dbPath}: ${e.message}`);
  }
}

/**
 * Limpia múltiples archivos temporales
 * @param {Array<string>} dbPaths - Array de paths
 */
function cleanupTempDbs(dbPaths) {
  dbPaths.forEach(path => cleanupTempDb(path));
}

module.exports = {
  forceCrash,
  waitForProcessExit,
  validateDatabaseIntegrity,
  validateVectorIndexIntegrity,
  validateReplicationIntegrity,
  validateOplogIntegrity,
  createTempDbPath,
  cleanupTempDb,
  cleanupTempDbs
};

