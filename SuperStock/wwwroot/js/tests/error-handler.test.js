/**
 * Unit Tests for Enhanced Error Handler
 * Tests all error handling scenarios as per requirements 1.1, 4.5, 6.5
 */

describe('EnhancedErrorHandler', () => {
    let errorHandler;
    let mockConsole;
    let mockWindow;

    beforeEach(() => {
        // Setup mock console
        mockConsole = {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn()
        };
        global.console = mockConsole;

        // Setup mock window
        mockWindow = {
            onerror: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            location: { href: 'http://test.com' },
            navigator: { userAgent: 'test-agent' },
            analytics: { track: jest.fn() }
        };
        global.window = mockWindow;

        // Setup mock document
        global.document = {
            readyState: 'complete',
            createElement: jest.fn(() => ({
                id: '',
                className: '',
                style: { cssText: '' },
                appendChild: jest.fn(),
                remove: jest.fn(),
                addEventListener: jest.fn(),
                textContent: '',
                innerHTML: ''
            })),
            body: {
                appendChild: jest.fn()
            },
            head: {
                appendChild: jest.fn()
            },
            getElementById: jest.fn(),
            addEventListener: jest.fn()
        };

        errorHandler = new EnhancedErrorHandler();
    });

    afterEach(() => {
        if (errorHandler) {
            errorHandler.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(errorHandler.errorQueue).toEqual([]);
            expect(errorHandler.maxErrors).toBe(50);
            expect(errorHandler.errorCooldown).toBe(5000);
            expect(errorHandler.isInitialized).toBe(false);
        });

        test('should setup global handlers on initialize', () => {
            errorHandler.initialize();
            
            expect(errorHandler.isInitialized).toBe(true);
            expect(mockWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
            expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function), true);
        });

        test('should not initialize twice', () => {
            errorHandler.initialize();
            const firstInitState = errorHandler.isInitialized;
            
            errorHandler.initialize();
            
            expect(firstInitState).toBe(true);
            expect(errorHandler.isInitialized).toBe(true);
        });
    });

    describe('JavaScript Error Handling', () => {
        test('should handle JavaScript errors correctly', () => {
            const errorInfo = {
                message: 'Test error',
                source: 'test.js',
                lineno: 10,
                colno: 5,
                error: new Error('Test error'),
                type: errorHandler.errorTypes.JAVASCRIPT
            };

            errorHandler.handleJavaScriptError(errorInfo);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].message).toBe('Test error');
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.JAVASCRIPT);
        });

        test('should extract component from error stack', () => {
            const error = new Error('Test error');
            error.stack = 'Error: Test error\n    at test.js:10:5\n    at dashboard.js:20:10';

            const component = errorHandler.extractComponentFromStack(error);
            expect(component).toBe('test');
        });

        test('should handle errors without stack trace', () => {
            const errorInfo = {
                message: 'Test error',
                source: 'test.js',
                lineno: 10,
                colno: 5,
                error: null,
                type: errorHandler.errorTypes.JAVASCRIPT
            };

            errorHandler.handleJavaScriptError(errorInfo);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].stack).toBeNull();
        });
    });

    describe('Promise Rejection Handling', () => {
        test('should handle promise rejections', () => {
            const mockEvent = {
                reason: new Error('Promise rejection'),
                preventDefault: jest.fn()
            };

            errorHandler.handlePromiseRejection(mockEvent);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.API);
            expect(errorHandler.errorQueue[0].message).toBe('Promise rejection');
        });

        test('should handle promise rejections without reason', () => {
            const mockEvent = {
                reason: null,
                preventDefault: jest.fn()
            };

            errorHandler.handlePromiseRejection(mockEvent);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].message).toBe('Promise rejection');
        });

        test('should handle string promise rejections', () => {
            const mockEvent = {
                reason: 'String rejection',
                preventDefault: jest.fn()
            };

            errorHandler.handlePromiseRejection(mockEvent);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].message).toBe('String rejection');
        });
    });

    describe('Resource Error Handling', () => {
        test('should handle resource loading errors', () => {
            const mockEvent = {
                target: {
                    src: 'http://example.com/image.jpg'
                }
            };

            errorHandler.handleResourceError(mockEvent);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.NETWORK);
            expect(errorHandler.errorQueue[0].message).toContain('Failed to load resource');
        });

        test('should handle resource errors with href', () => {
            const mockEvent = {
                target: {
                    href: 'http://example.com/style.css'
                }
            };

            errorHandler.handleResourceError(mockEvent);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].source).toBe('http://example.com/style.css');
        });
    });

    describe('Component Error Handling', () => {
        test('should handle component errors with context', () => {
            const error = new Error('Component error');
            const context = { userId: '123', action: 'load' };

            errorHandler.handleComponentError('TestComponent', error, context);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].component).toBe('TestComponent');
            expect(errorHandler.errorQueue[0].context).toEqual(context);
        });

        test('should handle component errors without context', () => {
            const error = new Error('Component error');

            errorHandler.handleComponentError('TestComponent', error);

            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].component).toBe('TestComponent');
            expect(errorHandler.errorQueue[0].context).toEqual({});
        });
    });

    describe('API Error Handling', () => {
        test('should classify server errors correctly', () => {
            const error = { status: 500, message: 'Internal server error' };
            
            const shouldRetry = errorHandler.handleApiError('/api/test', error, 0);
            
            expect(errorHandler.errorQueue).toHaveLength(1);
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.CRITICAL);
            expect(shouldRetry).toBe(true);
        });

        test('should classify timeout errors correctly', () => {
            const error = { status: 408, message: 'Request timeout' };
            
            const shouldRetry = errorHandler.handleApiError('/api/test', error, 0);
            
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.TIMEOUT);
            expect(shouldRetry).toBe(true);
        });

        test('should classify validation errors correctly', () => {
            const error = { status: 400, message: 'Bad request' };
            
            const shouldRetry = errorHandler.handleApiError('/api/test', error, 0);
            
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.VALIDATION);
            expect(shouldRetry).toBe(false);
        });

        test('should classify network errors correctly', () => {
            const error = { message: 'Network error' };
            
            const shouldRetry = errorHandler.handleApiError('/api/test', error, 0);
            
            expect(errorHandler.errorQueue[0].type).toBe(errorHandler.errorTypes.NETWORK);
            expect(shouldRetry).toBe(true);
        });

        test('should not retry after max attempts', () => {
            const error = { status: 500, message: 'Server error' };
            
            const shouldRetry = errorHandler.handleApiError('/api/test', error, 3);
            
            expect(shouldRetry).toBe(false);
        });
    });

    describe('Error Loop Prevention', () => {
        test('should detect error loops', () => {
            const errorContext = {
                timestamp: new Date(),
                type: errorHandler.errorTypes.JAVASCRIPT,
                message: 'Repeated error',
                component: 'TestComponent'
            };

            // Add same error multiple times
            for (let i = 0; i < 5; i++) {
                errorHandler.processError({ ...errorContext });
            }

            // Should have limited the errors due to loop detection
            expect(errorHandler.errorQueue.length).toBeLessThan(5);
        });

        test('should respect error cooldown', () => {
            const errorContext = {
                timestamp: new Date(),
                type: errorHandler.errorTypes.JAVASCRIPT,
                message: 'Test error',
                component: 'TestComponent'
            };

            errorHandler.processError(errorContext);
            errorHandler.processError(errorContext);

            // Second error should be suppressed due to cooldown
            expect(mockConsole.warn).toHaveBeenCalledWith(
                expect.stringContaining('Error loop detected')
            );
        });

        test('should generate unique error keys', () => {
            const error1 = {
                type: 'javascript',
                message: 'Error 1',
                component: 'Component1'
            };

            const error2 = {
                type: 'javascript',
                message: 'Error 2',
                component: 'Component1'
            };

            const key1 = errorHandler.generateErrorKey(error1);
            const key2 = errorHandler.generateErrorKey(error2);

            expect(key1).not.toBe(key2);
        });
    });

    describe('Error Queue Management', () => {
        test('should limit error queue size', () => {
            // Fill queue beyond max size
            for (let i = 0; i < 60; i++) {
                errorHandler.processError({
                    timestamp: new Date(),
                    type: errorHandler.errorTypes.JAVASCRIPT,
                    message: `Error ${i}`,
                    component: 'TestComponent'
                });
            }

            expect(errorHandler.errorQueue.length).toBeLessThanOrEqual(errorHandler.maxErrors);
        });

        test('should clear error queue', () => {
            errorHandler.processError({
                timestamp: new Date(),
                type: errorHandler.errorTypes.JAVASCRIPT,
                message: 'Test error',
                component: 'TestComponent'
            });

            errorHandler.clearErrors();

            expect(errorHandler.errorQueue).toHaveLength(0);
            expect(errorHandler.errorCounts.size).toBe(0);
        });
    });

    describe('Error Statistics', () => {
        test('should provide error statistics', () => {
            errorHandler.processError({
                timestamp: new Date(),
                type: errorHandler.errorTypes.JAVASCRIPT,
                message: 'JS Error',
                component: 'TestComponent'
            });

            errorHandler.processError({
                timestamp: new Date(),
                type: errorHandler.errorTypes.API,
                message: 'API Error',
                component: 'TestComponent'
            });

            const stats = errorHandler.getErrorStats();

            expect(stats.totalErrors).toBe(2);
            expect(stats.errorsByType.javascript).toBe(1);
            expect(stats.errorsByType.api).toBe(1);
        });

        test('should filter recent errors', () => {
            const oldError = {
                timestamp: new Date(Date.now() - 400000), // 6+ minutes ago
                type: errorHandler.errorTypes.JAVASCRIPT,
                message: 'Old error',
                component: 'TestComponent'
            };

            const recentError = {
                timestamp: new Date(),
                type: errorHandler.errorTypes.JAVASCRIPT,
                message: 'Recent error',
                component: 'TestComponent'
            };

            errorHandler.errorQueue.push(oldError, recentError);

            const stats = errorHandler.getErrorStats();
            expect(stats.recentErrors).toHaveLength(1);
            expect(stats.recentErrors[0].message).toBe('Recent error');
        });
    });

    describe('User Error Display', () => {
        test('should show user-friendly error messages', () => {
            const mockElement = {
                appendChild: jest.fn(),
                style: { cssText: '' },
                className: ''
            };

            document.createElement.mockReturnValue(mockElement);
            document.getElementById.mockReturnValue(null);

            errorHandler.initialize();

            const errorContext = {
                timestamp: new Date(),
                type: errorHandler.errorTypes.NETWORK,
                message: 'Network error',
                component: 'TestComponent'
            };

            errorHandler.showUserError(errorContext);

            expect(mockElement.appendChild).toHaveBeenCalled();
        });

        test('should create error element with actions', () => {
            const actions = [
                {
                    text: 'Retry',
                    callback: jest.fn()
                }
            ];

            const errorContext = {
                type: errorHandler.errorTypes.API,
                message: 'API error'
            };

            const element = errorHandler.createErrorElement('Test message', 'api', actions, errorContext);

            expect(element).toBeDefined();
            expect(element.className).toContain('error-notification');
        });
    });

    describe('Retry Callbacks', () => {
        test('should add and execute retry callbacks', () => {
            const mockCallback = jest.fn();
            
            errorHandler.addRetryCallback('testOperation', mockCallback);
            
            expect(errorHandler.retryCallbacks.get('testOperation')).toBe(mockCallback);
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should cleanup properly on destroy', () => {
            errorHandler.initialize();
            
            const mockContainer = {
                remove: jest.fn(),
                parentNode: true
            };
            
            errorHandler.errorContainer = mockContainer;
            
            errorHandler.destroy();

            expect(errorHandler.isInitialized).toBe(false);
            expect(mockWindow.onerror).toBeNull();
            expect(mockContainer.remove).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle null error objects', () => {
            expect(() => {
                errorHandler.handleJavaScriptError({
                    message: 'Test',
                    source: 'test.js',
                    lineno: 1,
                    colno: 1,
                    error: null,
                    type: errorHandler.errorTypes.JAVASCRIPT
                });
            }).not.toThrow();
        });

        test('should handle undefined error properties', () => {
            expect(() => {
                errorHandler.handleComponentError('Test', {});
            }).not.toThrow();
        });

        test('should handle missing analytics', () => {
            delete mockWindow.analytics;
            
            expect(() => {
                errorHandler.logError({
                    timestamp: new Date(),
                    type: 'test',
                    message: 'test'
                });
            }).not.toThrow();
        });
    });
});