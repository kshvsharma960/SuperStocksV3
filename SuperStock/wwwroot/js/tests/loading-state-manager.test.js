/**
 * Unit Tests for Loading State Manager
 * Tests loading state coordination and timeout handling as per requirements 5.1, 5.2, 5.3
 */

describe('LoadingStateManager', () => {
    let loadingManager;
    let mockDocument;
    let mockWindow;

    beforeEach(() => {
        // Setup mock document
        mockDocument = {
            readyState: 'complete',
            body: {
                appendChild: jest.fn()
            },
            head: {
                appendChild: jest.fn()
            },
            getElementById: jest.fn(),
            createElement: jest.fn(() => ({
                id: '',
                className: '',
                style: { cssText: '' },
                innerHTML: '',
                textContent: '',
                appendChild: jest.fn(),
                remove: jest.fn(),
                querySelector: jest.fn(),
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            })),
            querySelector: jest.fn(),
            dispatchEvent: jest.fn()
        };

        // Setup mock window
        mockWindow = {
            getComputedStyle: jest.fn(() => ({ position: 'static' }))
        };

        // Setup globals
        global.document = mockDocument;
        global.window = mockWindow;
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Clear any existing timers
        jest.clearAllTimers();
        jest.useFakeTimers();

        loadingManager = new LoadingStateManager();
    });

    afterEach(() => {
        if (loadingManager) {
            loadingManager.forceCleanup();
        }
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(loadingManager.activeLoaders).toBeInstanceOf(Set);
            expect(loadingManager.timeouts).toBeInstanceOf(Map);
            expect(loadingManager.progressStates).toBeInstanceOf(Map);
            expect(loadingManager.maxLoadTime).toBe(30000);
        });

        test('should create global loading container', () => {
            expect(mockDocument.createElement).toHaveBeenCalled();
            expect(mockDocument.body.appendChild).toHaveBeenCalled();
        });

        test('should not create duplicate global container', () => {
            mockDocument.getElementById.mockReturnValue({ id: 'global-loading-container' });
            
            const manager2 = new LoadingStateManager();
            
            // Should not create another container
            expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
        });
    });

    describe('Loading State Management', () => {
        test('should start loading state correctly', () => {
            const component = 'test-component';
            const options = {
                message: 'Loading test...',
                timeout: 5000,
                showGlobal: true
            };

            const result = loadingManager.startLoading(component, options);

            expect(result).toBe(component);
            expect(loadingManager.activeLoaders.has(component)).toBe(true);
            expect(loadingManager.progressStates.has(component)).toBe(true);
            expect(loadingManager.timeouts.has(component)).toBe(true);
        });

        test('should complete loading state correctly', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component);
            loadingManager.completeLoading(component, true);

            expect(loadingManager.activeLoaders.has(component)).toBe(false);
            expect(loadingManager.progressStates.has(component)).toBe(false);
            expect(loadingManager.timeouts.has(component)).toBe(false);
        });

        test('should handle completion of non-active component', () => {
            const component = 'non-active-component';

            expect(() => {
                loadingManager.completeLoading(component);
            }).not.toThrow();
        });

        test('should clear existing timeout when starting new loading', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component, { timeout: 1000 });
            const firstTimeoutId = loadingManager.timeouts.get(component);
            
            loadingManager.startLoading(component, { timeout: 2000 });
            const secondTimeoutId = loadingManager.timeouts.get(component);

            expect(firstTimeoutId).not.toBe(secondTimeoutId);
        });
    });

    describe('Progress Updates', () => {
        test('should update progress correctly', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component);
            loadingManager.updateProgress(component, 50, 'Half way there...');

            const progressState = loadingManager.progressStates.get(component);
            expect(progressState.percentage).toBe(50);
            expect(progressState.message).toBe('Half way there...');
        });

        test('should clamp progress percentage to valid range', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component);
            loadingManager.updateProgress(component, -10);
            
            let progressState = loadingManager.progressStates.get(component);
            expect(progressState.percentage).toBe(0);

            loadingManager.updateProgress(component, 150);
            progressState = loadingManager.progressStates.get(component);
            expect(progressState.percentage).toBe(100);
        });

        test('should ignore progress updates for inactive components', () => {
            const component = 'inactive-component';

            expect(() => {
                loadingManager.updateProgress(component, 50);
            }).not.toThrow();
        });

        test('should preserve existing message when not provided', () => {
            const component = 'test-component';
            const originalMessage = 'Original message';
            
            loadingManager.startLoading(component, { message: originalMessage });
            loadingManager.updateProgress(component, 50);

            const progressState = loadingManager.progressStates.get(component);
            expect(progressState.message).toBe(originalMessage);
        });
    });

    describe('Timeout Handling', () => {
        test('should handle timeout correctly', () => {
            const component = 'test-component';
            const onTimeout = jest.fn();
            
            loadingManager.startLoading(component, { 
                timeout: 1000,
                onTimeout: onTimeout
            });

            // Fast-forward time to trigger timeout
            jest.advanceTimersByTime(1000);

            expect(onTimeout).toHaveBeenCalled();
            expect(loadingManager.activeLoaders.has(component)).toBe(false);
        });

        test('should show timeout message', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component, { 
                timeout: 1000,
                showGlobal: true
            });

            loadingManager.showTimeoutMessage = jest.fn();
            
            jest.advanceTimersByTime(1000);

            expect(loadingManager.showTimeoutMessage).toHaveBeenCalledWith(component);
        });

        test('should not timeout if loading completes first', () => {
            const component = 'test-component';
            const onTimeout = jest.fn();
            
            loadingManager.startLoading(component, { 
                timeout: 1000,
                onTimeout: onTimeout
            });

            // Complete loading before timeout
            jest.advanceTimersByTime(500);
            loadingManager.completeLoading(component);
            
            // Advance past timeout
            jest.advanceTimersByTime(600);

            expect(onTimeout).not.toHaveBeenCalled();
        });

        test('should clear timeout on completion', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component, { timeout: 5000 });
            
            expect(loadingManager.timeouts.has(component)).toBe(true);
            
            loadingManager.completeLoading(component);
            
            expect(loadingManager.timeouts.has(component)).toBe(false);
        });
    });

    describe('UI Display', () => {
        test('should show global loading overlay', () => {
            const mockContainer = {
                innerHTML: '',
                style: { display: '' }
            };
            
            mockDocument.getElementById.mockReturnValue(mockContainer);
            
            loadingManager.showGlobalLoading('Test message');

            expect(mockContainer.innerHTML).toContain('Test message');
            expect(mockContainer.style.display).toBe('flex');
        });

        test('should show component-specific loading', () => {
            const mockElement = {
                style: { position: 'static' },
                appendChild: jest.fn()
            };
            
            mockDocument.getElementById.mockReturnValue(mockElement);
            
            loadingManager.showComponentLoading(mockElement, 'test-component', 'Loading...');

            expect(mockElement.appendChild).toHaveBeenCalled();
            expect(mockElement.style.position).toBe('relative');
        });

        test('should handle missing target element gracefully', () => {
            mockDocument.getElementById.mockReturnValue(null);
            mockDocument.querySelector.mockReturnValue(null);

            expect(() => {
                loadingManager.showLoadingUI('non-existent-component', 'Loading...', false);
            }).not.toThrow();
        });

        test('should update progress UI elements', () => {
            const component = 'test-component';
            const mockProgressFill = { style: { width: '' } };
            const mockMessage = { textContent: '' };
            const mockOverlay = {
                querySelector: jest.fn((selector) => {
                    if (selector === '.progress-fill') return mockProgressFill;
                    if (selector === '.loading-message') return mockMessage;
                    return null;
                })
            };

            loadingManager.loadingElements.set(component, mockOverlay);
            
            const progressState = { percentage: 75, message: 'Almost done...' };
            loadingManager.updateProgressUI(component, progressState);

            expect(mockProgressFill.style.width).toBe('75%');
            expect(mockMessage.textContent).toBe('Almost done...');
        });
    });

    describe('Loading State Queries', () => {
        test('should return loading state for active component', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component, { message: 'Loading...' });
            
            const state = loadingManager.getLoadingState(component);

            expect(state).toBeDefined();
            expect(state.isLoading).toBe(true);
            expect(state.message).toBe('Loading...');
            expect(state.percentage).toBe(0);
        });

        test('should return null for inactive component', () => {
            const state = loadingManager.getLoadingState('inactive-component');
            expect(state).toBeNull();
        });

        test('should detect if any component is loading', () => {
            expect(loadingManager.isAnyLoading()).toBe(false);
            
            loadingManager.startLoading('component1');
            expect(loadingManager.isAnyLoading()).toBe(true);
            
            loadingManager.startLoading('component2');
            expect(loadingManager.isAnyLoading()).toBe(true);
            
            loadingManager.completeLoading('component1');
            expect(loadingManager.isAnyLoading()).toBe(true);
            
            loadingManager.completeLoading('component2');
            expect(loadingManager.isAnyLoading()).toBe(false);
        });

        test('should return list of active loaders', () => {
            loadingManager.startLoading('component1');
            loadingManager.startLoading('component2');
            
            const activeLoaders = loadingManager.getActiveLoaders();
            
            expect(activeLoaders).toContain('component1');
            expect(activeLoaders).toContain('component2');
            expect(activeLoaders).toHaveLength(2);
        });
    });

    describe('Callback Handling', () => {
        test('should execute completion callback on success', () => {
            const component = 'test-component';
            const onComplete = jest.fn();
            
            loadingManager.startLoading(component, { onComplete });
            loadingManager.completeLoading(component, true);

            expect(onComplete).toHaveBeenCalledWith(true, expect.any(Object));
        });

        test('should execute completion callback on failure', () => {
            const component = 'test-component';
            const onComplete = jest.fn();
            
            loadingManager.startLoading(component, { onComplete });
            loadingManager.completeLoading(component, false);

            expect(onComplete).toHaveBeenCalledWith(false, expect.any(Object));
        });

        test('should execute timeout callback', () => {
            const component = 'test-component';
            const onTimeout = jest.fn();
            
            loadingManager.startLoading(component, { 
                timeout: 1000,
                onTimeout 
            });

            jest.advanceTimersByTime(1000);

            expect(onTimeout).toHaveBeenCalled();
        });
    });

    describe('Retry Operations', () => {
        test('should emit retry event', () => {
            const component = 'test-component';
            
            loadingManager.retryOperation(component);

            expect(mockDocument.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'loadingRetry',
                    detail: { component }
                })
            );
        });

        test('should hide UI on retry', () => {
            const component = 'test-component';
            
            loadingManager.hideLoadingUI = jest.fn();
            loadingManager.retryOperation(component);

            expect(loadingManager.hideLoadingUI).toHaveBeenCalledWith(component);
        });
    });

    describe('Cleanup and Force Cleanup', () => {
        test('should force cleanup all loading states', () => {
            loadingManager.startLoading('component1');
            loadingManager.startLoading('component2');
            
            expect(loadingManager.activeLoaders.size).toBe(2);
            
            loadingManager.forceCleanup();

            expect(loadingManager.activeLoaders.size).toBe(0);
            expect(loadingManager.timeouts.size).toBe(0);
            expect(loadingManager.progressStates.size).toBe(0);
        });

        test('should clear all timeouts on force cleanup', () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
            
            loadingManager.startLoading('component1', { timeout: 5000 });
            loadingManager.startLoading('component2', { timeout: 5000 });
            
            loadingManager.forceCleanup();

            expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
        });

        test('should hide global loading on force cleanup', () => {
            const mockContainer = {
                style: { display: 'flex' }
            };
            
            mockDocument.getElementById.mockReturnValue(mockContainer);
            
            loadingManager.forceCleanup();

            expect(mockContainer.style.display).toBe('none');
        });
    });

    describe('CSS Styles', () => {
        test('should add CSS styles only once', () => {
            mockDocument.getElementById.mockReturnValue(null); // No existing styles
            
            loadingManager.addStyles();
            
            expect(mockDocument.createElement).toHaveBeenCalledWith('style');
            expect(mockDocument.head.appendChild).toHaveBeenCalled();
        });

        test('should not add styles if already present', () => {
            mockDocument.getElementById.mockReturnValue({ id: 'loading-state-manager-styles' });
            
            const createElementSpy = jest.spyOn(mockDocument, 'createElement');
            
            loadingManager.addStyles();
            
            expect(createElementSpy).not.toHaveBeenCalledWith('style');
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined component names', () => {
            expect(() => {
                loadingManager.startLoading(null);
            }).not.toThrow();

            expect(() => {
                loadingManager.startLoading(undefined);
            }).not.toThrow();
        });

        test('should handle missing DOM elements gracefully', () => {
            mockDocument.getElementById.mockReturnValue(null);
            mockDocument.querySelector.mockReturnValue(null);

            expect(() => {
                loadingManager.startLoading('test-component', { showGlobal: true });
            }).not.toThrow();
        });

        test('should handle elements without required properties', () => {
            const incompleteElement = {};
            
            expect(() => {
                loadingManager.showComponentLoading(incompleteElement, 'test', 'Loading...');
            }).not.toThrow();
        });

        test('should handle timeout for already completed loading', () => {
            const component = 'test-component';
            
            loadingManager.startLoading(component, { timeout: 1000 });
            loadingManager.completeLoading(component);
            
            // Timeout should not affect completed loading
            jest.advanceTimersByTime(1000);
            
            expect(loadingManager.activeLoaders.has(component)).toBe(false);
        });

        test('should handle multiple rapid start/complete cycles', () => {
            const component = 'test-component';
            
            for (let i = 0; i < 10; i++) {
                loadingManager.startLoading(component);
                loadingManager.completeLoading(component);
            }

            expect(loadingManager.activeLoaders.size).toBe(0);
            expect(loadingManager.timeouts.size).toBe(0);
        });

        test('should handle missing window.getComputedStyle', () => {
            delete global.window.getComputedStyle;
            
            const mockElement = { style: {}, appendChild: jest.fn() };
            
            expect(() => {
                loadingManager.showComponentLoading(mockElement, 'test', 'Loading...');
            }).not.toThrow();
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle concurrent loading operations', () => {
            const components = ['comp1', 'comp2', 'comp3'];
            
            components.forEach(comp => {
                loadingManager.startLoading(comp, { timeout: 2000 });
            });

            expect(loadingManager.activeLoaders.size).toBe(3);
            expect(loadingManager.isAnyLoading()).toBe(true);

            // Complete some operations
            loadingManager.completeLoading('comp1');
            loadingManager.completeLoading('comp2');

            expect(loadingManager.activeLoaders.size).toBe(1);
            expect(loadingManager.isAnyLoading()).toBe(true);

            // Complete last operation
            loadingManager.completeLoading('comp3');

            expect(loadingManager.activeLoaders.size).toBe(0);
            expect(loadingManager.isAnyLoading()).toBe(false);
        });

        test('should handle mixed success and timeout scenarios', () => {
            const onTimeout1 = jest.fn();
            const onTimeout2 = jest.fn();
            const onComplete1 = jest.fn();
            
            loadingManager.startLoading('fast-component', { 
                timeout: 2000,
                onComplete: onComplete1
            });
            
            loadingManager.startLoading('slow-component1', { 
                timeout: 1000,
                onTimeout: onTimeout1
            });
            
            loadingManager.startLoading('slow-component2', { 
                timeout: 1000,
                onTimeout: onTimeout2
            });

            // Complete fast component
            loadingManager.completeLoading('fast-component', true);
            
            // Let slow components timeout
            jest.advanceTimersByTime(1000);

            expect(onComplete1).toHaveBeenCalledWith(true, expect.any(Object));
            expect(onTimeout1).toHaveBeenCalled();
            expect(onTimeout2).toHaveBeenCalled();
            expect(loadingManager.activeLoaders.size).toBe(0);
        });
    });
});