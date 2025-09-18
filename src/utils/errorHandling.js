/**
 * Error handling utilities for tax calculation modules
 */

/**
 * Log levels for error handling
 * @type {Object}
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Current log level setting
 * @type {string}
 */
let currentLogLevel = LOG_LEVELS.WARN;

/**
 * Set the current log level
 * 
 * @param {string} level - Log level to set
 */
export function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
  }
}

/**
 * Get the current log level
 * 
 * @returns {string} Current log level
 */
export function getLogLevel() {
  return currentLogLevel;
}

/**
 * Log a message at the specified level
 * 
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @param {*} [data] - Additional data to log
 */
export function log(level, message, data) {
  const levels = Object.values(LOG_LEVELS);
  const currentLevelIndex = levels.indexOf(currentLogLevel);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex <= currentLevelIndex) {
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(message, data || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(message, data || '');
        break;
      case LOG_LEVELS.INFO:
        console.info(message, data || '');
        break;
      case LOG_LEVELS.DEBUG:
        console.debug(message, data || '');
        break;
      default:
        console.log(message, data || '');
    }
  }
}

/**
 * Validate a number input
 * 
 * @param {*} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @param {number} [defaultValue=0] - Default value to return if invalid
 * @param {boolean} [allowNegative=false] - Whether to allow negative values
 * @returns {number} Validated number or default value
 */
export function validateNumber(value, name, defaultValue = 0, allowNegative = false) {
  if (typeof value !== 'number' || isNaN(value)) {
    log(LOG_LEVELS.WARN, `Invalid ${name} provided: ${value}`);
    return defaultValue;
  }
  
  if (!allowNegative && value < 0) {
    log(LOG_LEVELS.WARN, `Negative ${name} provided: ${value}`);
    return defaultValue;
  }
  
  return value;
}

/**
 * Validate an array input
 * 
 * @param {*} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @param {Array} [defaultValue=[]] - Default value to return if invalid
 * @returns {Array} Validated array or default value
 */
export function validateArray(value, name, defaultValue = []) {
  if (!Array.isArray(value)) {
    log(LOG_LEVELS.WARN, `Invalid ${name} provided: ${value}`);
    return defaultValue;
  }
  
  return value;
}

/**
 * Validate a string input
 * 
 * @param {*} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @param {string} [defaultValue=''] - Default value to return if invalid
 * @returns {string} Validated string or default value
 */
export function validateString(value, name, defaultValue = '') {
  if (typeof value !== 'string') {
    log(LOG_LEVELS.WARN, `Invalid ${name} provided: ${value}`);
    return defaultValue;
  }
  
  return value;
}

/**
 * Validate an object input
 * 
 * @param {*} value - Value to validate
 * @param {string} name - Name of the parameter for error messages
 * @param {Object} [defaultValue={}] - Default value to return if invalid
 * @returns {Object} Validated object or default value
 */
export function validateObject(value, name, defaultValue = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    log(LOG_LEVELS.WARN, `Invalid ${name} provided: ${value}`);
    return defaultValue;
  }
  
  return value;
}

/**
 * Try to execute a function and handle any errors
 * 
 * @param {Function} fn - Function to execute
 * @param {Array} args - Arguments to pass to the function
 * @param {*} defaultValue - Default value to return if function throws
 * @param {string} [errorMessage='Error executing function'] - Error message to log
 * @returns {*} Function result or default value
 */
export function tryCatch(fn, args, defaultValue, errorMessage = 'Error executing function') {
  try {
    return fn(...args);
  } catch (error) {
    log(LOG_LEVELS.ERROR, `${errorMessage}: ${error.message}`, error);
    return defaultValue;
  }
}

