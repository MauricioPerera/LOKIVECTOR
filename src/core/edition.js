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
 * Edition Detection and Enforcement
 * 
 * Detects the current LokiVector edition and provides enforcement functions
 * to prevent unauthorized use of Commercial/Enterprise features.
 */

'use strict';

/* jshint node: true */
var EDITION = (typeof process !== 'undefined' && process.env && process.env.LOKIVECTOR_EDITION) || 
              (typeof process !== 'undefined' && process.env && process.env.EDITION) || 
              'MIT';

/**
 * Get current edition
 * @returns {string} Edition name (MIT, PRO, COMMERCIAL, ENTERPRISE)
 */
function getEdition() {
  return EDITION.toUpperCase();
}

/**
 * Check if running MIT edition
 * @returns {boolean}
 */
function isMIT() {
  return getEdition() === 'MIT';
}

/**
 * Check if running Pro or Commercial edition
 * @returns {boolean}
 */
function isPro() {
  const edition = getEdition();
  return edition === 'PRO' || edition === 'COMMERCIAL';
}

/**
 * Check if running Enterprise edition
 * @returns {boolean}
 */
function isEnterprise() {
  return getEdition() === 'ENTERPRISE';
}

/**
 * Require Commercial license for a feature
 * @param {string} featureName - Name of the feature
 * @throws {Error} If edition is MIT
 */
function requireCommercial(featureName) {
  if (isMIT()) {
    const error = new Error(
      `Feature "${featureName}" requires LokiVector Pro or Enterprise License.\n\n` +
      `This feature is not available in the MIT-licensed Community Edition.\n` +
      `Contact commercial@lokivector.io for licensing information.\n\n` +
      `See LICENSE_FEATURES.md for feature comparison.\n` +
      `See EDITIONS.md for edition details.`
    );
    error.code = 'COMMERCIAL_LICENSE_REQUIRED';
    error.feature = featureName;
    throw error;
  }
}

/**
 * Require Enterprise license for a feature
 * @param {string} featureName - Name of the feature
 * @throws {Error} If edition is not Enterprise
 */
function requireEnterprise(featureName) {
  if (!isEnterprise()) {
    const error = new Error(
      `Feature "${featureName}" requires LokiVector Enterprise License.\n\n` +
      `This feature is only available in Enterprise Edition.\n` +
      `Contact commercial@lokivector.io for licensing information.\n\n` +
      `See LICENSE_FEATURES.md for feature comparison.\n` +
      `See EDITIONS.md for edition details.`
    );
    error.code = 'ENTERPRISE_LICENSE_REQUIRED';
    error.feature = featureName;
    throw error;
  }
}

/**
 * Log current edition (for debugging)
 */
function logEdition() {
  console.log(`LokiVector Edition: ${getEdition()}`);
  if (isMIT()) {
    console.log('Running in Community Edition (MIT License)');
    console.log('Commercial features are not available.');
  } else if (isPro()) {
    console.log('Running in Pro/Commercial Edition');
  } else if (isEnterprise()) {
    console.log('Running in Enterprise Edition');
  }
}

/* jshint node: true */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EDITION: getEdition(),
    getEdition: getEdition,
    isMIT: isMIT,
    isPro: isPro,
    isEnterprise: isEnterprise,
    requireCommercial: requireCommercial,
    requireEnterprise: requireEnterprise,
    logEdition: logEdition
  };
}

