import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

// jsdom polyfills for Node Web APIs not provided by default
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (!global.crypto || !global.crypto.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

// Mock Web Workers
global.Worker = class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }
  postMessage(msg) {
    setTimeout(() => {
      this.onmessage({ data: { success: true, result: msg } });
    }, 0);
  }
  terminate() {}
};

// Mock Clipboard API
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  readText: jest.fn(() => Promise.resolve('')),
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for tests
global.fetch = jest.fn();

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});
