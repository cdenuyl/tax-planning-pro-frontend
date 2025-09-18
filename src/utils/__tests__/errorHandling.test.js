import { describe, it, expect, vi } from 'vitest';
import {
  LOG_LEVELS,
  setLogLevel,
  getLogLevel,
  log,
  validateNumber,
  validateArray,
  validateString,
  validateObject,
  tryCatch
} from '../errorHandling.js';

describe('Error Handling Utilities', () => {
  describe('Log Level Management', () => {
    it('should set and get log level correctly', () => {
      const originalLevel = getLogLevel();
      
      setLogLevel(LOG_LEVELS.DEBUG);
      expect(getLogLevel()).toBe(LOG_LEVELS.DEBUG);
      
      setLogLevel(LOG_LEVELS.ERROR);
      expect(getLogLevel()).toBe(LOG_LEVELS.ERROR);
      
      // Reset to original level
      setLogLevel(originalLevel);
    });
    
    it('should ignore invalid log levels', () => {
      const originalLevel = getLogLevel();
      
      setLogLevel('INVALID_LEVEL');
      expect(getLogLevel()).toBe(originalLevel);
      
      // Reset to original level
      setLogLevel(originalLevel);
    });
  });
  
  describe('Logging', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
    
    it('should log at the appropriate level', () => {
      setLogLevel(LOG_LEVELS.INFO);
      
      log(LOG_LEVELS.ERROR, 'Error message');
      log(LOG_LEVELS.WARN, 'Warning message');
      log(LOG_LEVELS.INFO, 'Info message');
      log(LOG_LEVELS.DEBUG, 'Debug message');
      
      expect(console.error).toHaveBeenCalledWith('Error message', '');
      expect(console.warn).toHaveBeenCalledWith('Warning message', '');
      expect(console.info).toHaveBeenCalledWith('Info message', '');
      expect(console.debug).not.toHaveBeenCalled();
    });
    
    it('should include additional data when provided', () => {
      setLogLevel(LOG_LEVELS.DEBUG);
      
      const data = { key: 'value' };
      log(LOG_LEVELS.ERROR, 'Error message', data);
      
      expect(console.error).toHaveBeenCalledWith('Error message', data);
    });
  });
  
  describe('Input Validation', () => {
    it('should validate numbers correctly', () => {
      expect(validateNumber(42, 'test')).toBe(42);
      expect(validateNumber('42', 'test')).toBe(0);
      expect(validateNumber(NaN, 'test')).toBe(0);
      expect(validateNumber(null, 'test')).toBe(0);
      expect(validateNumber(undefined, 'test')).toBe(0);
      expect(validateNumber(-42, 'test')).toBe(0);
      expect(validateNumber(-42, 'test', 0, true)).toBe(-42);
      expect(validateNumber(0, 'test')).toBe(0);
    });
    
    it('should validate arrays correctly', () => {
      expect(validateArray([1, 2, 3], 'test')).toEqual([1, 2, 3]);
      expect(validateArray('not an array', 'test')).toEqual([]);
      expect(validateArray(null, 'test')).toEqual([]);
      expect(validateArray(undefined, 'test')).toEqual([]);
      expect(validateArray({}, 'test')).toEqual([]);
    });
    
    it('should validate strings correctly', () => {
      expect(validateString('test', 'test')).toBe('test');
      expect(validateString(42, 'test')).toBe('');
      expect(validateString(null, 'test')).toBe('');
      expect(validateString(undefined, 'test')).toBe('');
      expect(validateString({}, 'test')).toBe('');
    });
    
    it('should validate objects correctly', () => {
      expect(validateObject({ key: 'value' }, 'test')).toEqual({ key: 'value' });
      expect(validateObject('not an object', 'test')).toEqual({});
      expect(validateObject(null, 'test')).toEqual({});
      expect(validateObject(undefined, 'test')).toEqual({});
      expect(validateObject([], 'test')).toEqual({});
    });
  });
  
  describe('Try-Catch Wrapper', () => {
    it('should return function result when successful', () => {
      const fn = (a, b) => a + b;
      expect(tryCatch(fn, [1, 2], 0)).toBe(3);
    });
    
    it('should return default value when function throws', () => {
      const fn = () => { throw new Error('Test error'); };
      expect(tryCatch(fn, [], 'default')).toBe('default');
    });
    
    it('should log error when function throws', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const fn = () => { throw new Error('Test error'); };
      tryCatch(fn, [], 'default', 'Custom error message');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message'),
        expect.any(Error)
      );
    });
  });
});

