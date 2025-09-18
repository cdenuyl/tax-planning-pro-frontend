import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Any global setup needed before all tests
});

afterAll(() => {
  // Any global cleanup needed after all tests
});

// Mock global objects if needed
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

