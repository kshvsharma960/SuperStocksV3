/**
 * Test Setup Configuration
 * Global setup for all test files
 */

// Mock global objects that are expected in browser environment
global.window = global.window || {};
global.document = global.document || {};
global.navigator = global.navigator || {};

// Mock jQuery
global.$ = jest.fn(() => ({
  ajax: jest.fn(),
  ready: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  trigger: jest.fn()
}));

global.$.ajax = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock requestAnimationFrame and related APIs
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
global.requestIdleCallback = jest.fn(cb => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn(id => clearTimeout(id));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: {
    aborted: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
}));

// Mock Image constructor
global.Image = jest.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  complete: false,
  naturalWidth: 0,
  naturalHeight: 0
}));

// Mock localStorage and sessionStorage
const createMockStorage = () => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn(index => Object.keys(store)[index] || null)
  };
};

global.localStorage = createMockStorage();
global.sessionStorage = createMockStorage();

// Mock URL and URLSearchParams
global.URL = jest.fn((url, base) => ({
  href: url,
  origin: 'http://localhost',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
  toString: () => url
}));

global.URLSearchParams = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  append: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  toString: jest.fn(() => '')
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Map(),
    url: 'http://localhost/api/test'
  })
);

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}));

// Mock Notification API
global.Notification = jest.fn(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

global.Notification.permission = 'default';
global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

// Mock geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Mock clipboard API
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  readText: jest.fn(() => Promise.resolve('')),
  write: jest.fn(() => Promise.resolve()),
  read: jest.fn(() => Promise.resolve([]))
};

// Mock service worker
global.navigator.serviceWorker = {
  register: jest.fn(() => Promise.resolve({
    installing: null,
    waiting: null,
    active: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  getRegistration: jest.fn(() => Promise.resolve(null)),
  getRegistrations: jest.fn(() => Promise.resolve([])),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock media queries
global.matchMedia = jest.fn(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock CSS supports
global.CSS = {
  supports: jest.fn(() => true),
  escape: jest.fn(str => str)
};

// Mock custom elements
global.customElements = {
  define: jest.fn(),
  get: jest.fn(),
  whenDefined: jest.fn(() => Promise.resolve()),
  upgrade: jest.fn()
};

// Setup DOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Add missing DOM methods
if (!global.document.createRange) {
  global.document.createRange = () => ({
    selectNodeContents: jest.fn(),
    setStart: jest.fn(),
    setEnd: jest.fn(),
    collapse: jest.fn(),
    toString: jest.fn(() => ''),
    getBoundingClientRect: jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0
    }))
  });
}

// Mock getComputedStyle
global.window.getComputedStyle = jest.fn(() => ({
  getPropertyValue: jest.fn(() => ''),
  position: 'static',
  display: 'block',
  visibility: 'visible',
  opacity: '1'
}));

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock focus and blur
Element.prototype.focus = jest.fn();
Element.prototype.blur = jest.fn();

// Mock click
Element.prototype.click = jest.fn();

// Setup test utilities
global.testUtils = {
  // Create mock element
  createElement: (tag = 'div', attributes = {}) => {
    const element = document.createElement(tag);
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'innerHTML') {
        element.innerHTML = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    return element;
  },

  // Create mock event
  createEvent: (type, properties = {}) => {
    const event = new Event(type);
    Object.keys(properties).forEach(key => {
      event[key] = properties[key];
    });
    return event;
  },

  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock API response
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  }),

  // Mock jQuery AJAX
  mockJQueryAjax: (response, shouldFail = false) => {
    global.$.ajax.mockImplementation(({ success, error }) => {
      if (shouldFail && error) {
        setTimeout(() => error({ status: 500 }, 'error', 'Server Error'), 0);
      } else if (success) {
        setTimeout(() => success(response), 0);
      }
    });
  }
};

// Setup error boundary for tests
const originalError = console.error;
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset global state
  if (global.window.errorHandler) {
    global.window.errorHandler.clearErrors();
  }
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllTimers();
  
  // Reset console
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(30000);