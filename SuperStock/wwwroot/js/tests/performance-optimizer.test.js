/**
 * Unit Tests for Performance Optimizer
 * Tests performance optimizer fixes and animation handling as per requirements 1.1
 */

describe('PerformanceOptimizer', () => {
    let optimizer;
    let mockDocument;
    let mockWindow;
    let mockIntersectionObserver;
    let mockMutationObserver;

    beforeEach(() => {
        // Setup mock IntersectionObserver
        mockIntersectionObserver = {
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn()
        };

        // Setup mock MutationObserver
        mockMutationObserver = {
            observe: jest.fn(),
            disconnect: jest.fn()
        };

        // Setup mock window
        mockWindow = {
            IntersectionObserver: jest.fn(() => mockIntersectionObserver),
            MutationObserver: jest.fn(() => mockMutationObserver),
            requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
            requestIdleCallback: jest.fn(cb => setTimeout(cb, 0)),
            performance: {
                now: jest.fn(() => Date.now())
            }
        };

        // Setup mock document
        mockDocument = {
            readyState: 'complete',
            body: {
                appendChild: jest.fn()
            },
            head: {
                appendChild: jest.fn()
            },
            querySelectorAll: jest.fn(() => []),
            createElement: jest.fn(() => ({
                style: { cssText: '' },
                appendChild: jest.fn(),
                addEventListener: jest.fn()
            })),
            addEventListener: jest.fn()
        };

        // Setup globals
        global.window = mockWindow;
        global.document = mockDocument;
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Mock requestIdleCallback fallback
        if (!mockWindow.requestIdleCallback) {
            mockWindow.requestIdleCallback = jest.fn((cb) => setTimeout(cb, 0));
        }

        optimizer = new PerformanceOptimizer();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(optimizer.lazyLoadObserver).toBeDefined();
            expect(optimizer.intersectionObserver).toBeDefined();
            expect(optimizer.mutationObserver).toBeDefined();
            expect(optimizer.domUpdateQueue).toEqual([]);
            expect(optimizer.isProcessingQueue).toBe(false);
        });

        test('should setup observers', () => {
            expect(mockWindow.IntersectionObserver).toHaveBeenCalledTimes(2);
            expect(mockWindow.MutationObserver).toHaveBeenCalledTimes(1);
        });
    });

    describe('Animation Method Validation', () => {
        test('should validate animation methods exist', () => {
            const mockElement = {
                lottieAnimation: {
                    pause: jest.fn(),
                    play: jest.fn()
                },
                style: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            const validation = optimizer.validateAnimationMethods(mockElement);

            expect(validation.elementValid).toBe(true);
            expect(validation.hasLottieAnimation).toBe(true);
            expect(validation.canPause).toBe(true);
            expect(validation.canResume).toBe(true);
        });

        test('should handle missing animation methods', () => {
            const mockElement = {
                style: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            const validation = optimizer.validateAnimationMethods(mockElement);

            expect(validation.elementValid).toBe(true);
            expect(validation.hasLottieAnimation).toBe(false);
            expect(validation.canPause).toBe(false);
            expect(validation.canResume).toBe(false);
        });

        test('should handle invalid elements', () => {
            const validation1 = optimizer.validateAnimationMethods(null);
            const validation2 = optimizer.validateAnimationMethods(undefined);
            const validation3 = optimizer.validateAnimationMethods({});

            expect(validation1.elementValid).toBe(false);
            expect(validation2.elementValid).toBe(false);
            expect(validation3.elementValid).toBe(false);
        });

        test('should detect CSS animations', () => {
            const mockElement = {
                style: {},
                classList: {
                    contains: jest.fn((className) => className === 'animated')
                }
            };

            const validation = optimizer.validateAnimationMethods(mockElement);

            expect(validation.hasCSSAnimations).toBe(true);
        });

        test('should detect chart animations', () => {
            const mockElement = {
                chart: {
                    update: jest.fn(),
                    destroy: jest.fn()
                },
                style: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            const validation = optimizer.validateAnimationMethods(mockElement);

            expect(validation.hasChartAnimations).toBe(true);
        });
    });

    describe('Safe Method Calling', () => {
        test('should call method safely when it exists', () => {
            const mockObject = {
                testMethod: jest.fn().mockReturnValue('success')
            };

            const result = optimizer.safeMethodCall(
                mockObject,
                'testMethod',
                ['arg1', 'arg2'],
                () => 'fallback'
            );

            expect(mockObject.testMethod).toHaveBeenCalledWith('arg1', 'arg2');
            expect(result).toBe('success');
        });

        test('should use fallback when method does not exist', () => {
            const mockObject = {};
            const fallbackFn = jest.fn().mockReturnValue('fallback');

            const result = optimizer.safeMethodCall(
                mockObject,
                'nonExistentMethod',
                [],
                fallbackFn
            );

            expect(fallbackFn).toHaveBeenCalled();
            expect(result).toBe('fallback');
        });

        test('should handle null/undefined objects', () => {
            const fallbackFn = jest.fn().mockReturnValue('fallback');

            const result1 = optimizer.safeMethodCall(null, 'method', [], fallbackFn);
            const result2 = optimizer.safeMethodCall(undefined, 'method', [], fallbackFn);

            expect(result1).toBe('fallback');
            expect(result2).toBe('fallback');
            expect(fallbackFn).toHaveBeenCalledTimes(2);
        });

        test('should handle method execution errors', () => {
            const mockObject = {
                errorMethod: jest.fn(() => {
                    throw new Error('Method error');
                })
            };
            const fallbackFn = jest.fn().mockReturnValue('fallback');

            const result = optimizer.safeMethodCall(
                mockObject,
                'errorMethod',
                [],
                fallbackFn
            );

            expect(result).toBe('fallback');
            expect(fallbackFn).toHaveBeenCalled();
        });
    });

    describe('Animation Control', () => {
        test('should pause element animations safely', () => {
            const mockElement = {
                nodeType: 1, // ELEMENT_NODE
                lottieAnimation: {
                    pause: jest.fn()
                },
                style: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            optimizer.pauseElementAnimations(mockElement);

            expect(mockElement.lottieAnimation.pause).toHaveBeenCalled();
        });

        test('should resume element animations safely', () => {
            const mockElement = {
                nodeType: 1, // ELEMENT_NODE
                lottieAnimation: {
                    play: jest.fn()
                },
                style: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            optimizer.resumeElementAnimations(mockElement);

            expect(mockElement.lottieAnimation.play).toHaveBeenCalled();
        });

        test('should handle missing resumeElementAnimations method gracefully', () => {
            const mockElement = {
                nodeType: 1,
                style: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            // This should not throw an error
            expect(() => {
                optimizer.resumeElementAnimations(mockElement);
            }).not.toThrow();
        });

        test('should provide fallback behavior for missing methods', () => {
            const mockElement = {
                nodeType: 1,
                style: {},
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn(() => false)
                }
            };

            optimizer.provideFallback(mockElement, 'pause');

            expect(mockElement.classList.add).toHaveBeenCalledWith('animation-paused');
        });

        test('should try alternative animation control methods', () => {
            const mockElement = {
                getAnimations: jest.fn(() => [
                    { pause: jest.fn(), play: jest.fn() }
                ]),
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                }
            };

            optimizer.tryAlternativeAnimationControl(mockElement, 'pause');

            expect(mockElement.getAnimations).toHaveBeenCalled();
        });
    });

    describe('DOM Mutation Handling', () => {
        test('should handle valid mutations safely', () => {
            const validMutations = [
                {
                    type: 'childList',
                    addedNodes: [
                        {
                            nodeType: 1, // ELEMENT_NODE
                            matches: jest.fn(() => true)
                        }
                    ],
                    removedNodes: []
                }
            ];

            expect(() => {
                optimizer.handleDOMMutations(validMutations);
            }).not.toThrow();
        });

        test('should handle invalid mutations gracefully', () => {
            const invalidMutations = [
                null,
                undefined,
                { type: 'invalid' },
                'not an object'
            ];

            expect(() => {
                optimizer.handleDOMMutations(invalidMutations);
            }).not.toThrow();
        });

        test('should handle empty mutations array', () => {
            expect(() => {
                optimizer.handleDOMMutations([]);
            }).not.toThrow();
        });

        test('should handle null mutations parameter', () => {
            expect(() => {
                optimizer.handleDOMMutations(null);
            }).not.toThrow();
        });

        test('should batch mutations correctly', () => {
            const mutations = [
                {
                    type: 'childList',
                    addedNodes: [{ nodeType: 1 }],
                    removedNodes: []
                },
                {
                    type: 'attributes',
                    target: { nodeType: 1 }
                }
            ];

            const batched = optimizer.batchMutations(mutations);

            expect(batched.added).toHaveLength(1);
            expect(batched.modified).toHaveLength(1);
        });

        test('should process mutation batch safely', () => {
            const batch = {
                added: [
                    {
                        nodeType: 1,
                        matches: jest.fn(() => true)
                    }
                ],
                removed: [],
                modified: []
            };

            expect(() => {
                optimizer.processMutationBatch(batch);
            }).not.toThrow();
        });

        test('should use safe processing mode on errors', () => {
            const batch = {
                added: [
                    {
                        nodeType: 1,
                        matches: jest.fn(() => {
                            throw new Error('Test error');
                        })
                    }
                ],
                removed: [],
                modified: []
            };

            expect(() => {
                optimizer.processMutationBatch(batch);
            }).not.toThrow();
        });
    });

    describe('Element Processing', () => {
        test('should process added elements correctly', () => {
            const mockElement = {
                matches: jest.fn(() => true)
            };

            optimizer.lazyLoadObserver = {
                observe: jest.fn()
            };

            optimizer.processAddedElement(mockElement);

            expect(optimizer.lazyLoadObserver.observe).toHaveBeenCalledWith(mockElement);
        });

        test('should process removed elements correctly', () => {
            const mockElement = {
                lottieAnimation: {
                    destroy: jest.fn()
                }
            };

            optimizer.lazyLoadObserver = {
                unobserve: jest.fn()
            };

            optimizer.processRemovedElement(mockElement);

            expect(optimizer.lazyLoadObserver.unobserve).toHaveBeenCalledWith(mockElement);
        });

        test('should process modified elements with visibility changes', () => {
            const mockElement = {
                nodeType: 1,
                style: { display: 'none' },
                dataset: {},
                classList: {
                    contains: jest.fn(() => false)
                }
            };

            // Mock validation method
            optimizer.validateAnimationMethods = jest.fn(() => ({
                elementValid: true,
                hasLottieAnimation: false,
                hasCSSAnimations: false,
                hasChartAnimations: false,
                hasAlternativeMethods: false
            }));

            optimizer.isElementHidden = jest.fn(() => true);
            optimizer.provideFallback = jest.fn();

            optimizer.processModifiedElement(mockElement);

            expect(optimizer.provideFallback).toHaveBeenCalledWith(mockElement, 'pause');
        });
    });

    describe('Element Visibility Detection', () => {
        test('should detect hidden elements correctly', () => {
            const hiddenElements = [
                { style: { display: 'none' } },
                { hidden: true },
                { style: { visibility: 'hidden' } },
                { style: { opacity: '0' } },
                { classList: { contains: jest.fn(() => true) } }, // has 'hidden' class
                { getAttribute: jest.fn(() => 'true') } // aria-hidden="true"
            ];

            hiddenElements.forEach(element => {
                expect(optimizer.isElementHidden(element)).toBe(true);
            });
        });

        test('should detect visible elements correctly', () => {
            const visibleElement = {
                style: { display: 'block', visibility: 'visible', opacity: '1' },
                hidden: false,
                classList: { contains: jest.fn(() => false) },
                getAttribute: jest.fn(() => 'false')
            };

            expect(optimizer.isElementHidden(visibleElement)).toBe(false);
        });

        test('should handle elements without style properties', () => {
            const elementWithoutStyle = {};

            expect(() => {
                optimizer.isElementHidden(elementWithoutStyle);
            }).not.toThrow();

            expect(optimizer.isElementHidden(elementWithoutStyle)).toBe(false);
        });
    });

    describe('Lazy Loading', () => {
        test('should setup lazy loading observers', () => {
            const mockElements = [
                { dataset: { src: 'image.jpg' } },
                { dataset: { bgSrc: 'bg.jpg' } }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockElements);

            optimizer.observeLazyElements();

            expect(mockIntersectionObserver.observe).toHaveBeenCalledTimes(mockElements.length);
        });

        test('should load lazy elements with different priorities', () => {
            const highPriorityElement = { dataset: { priority: 'high' } };
            const normalPriorityElement = { dataset: { priority: 'normal' } };
            const lowPriorityElement = { dataset: { priority: 'low' } };

            optimizer.loadElementImmediate = jest.fn();
            optimizer.scheduleElementLoad = jest.fn();

            optimizer.loadLazyElement(highPriorityElement);
            optimizer.loadLazyElement(normalPriorityElement);
            optimizer.loadLazyElement(lowPriorityElement);

            expect(optimizer.loadElementImmediate).toHaveBeenCalledWith(highPriorityElement);
            expect(optimizer.scheduleElementLoad).toHaveBeenCalledWith(normalPriorityElement, 100);
            expect(optimizer.scheduleElementLoad).toHaveBeenCalledWith(lowPriorityElement, 1000);
        });

        test('should load images correctly', () => {
            const mockImg = {
                tagName: 'IMG',
                dataset: { src: 'test.jpg' },
                classList: { add: jest.fn() },
                removeAttribute: jest.fn()
            };

            // Mock Image constructor
            global.Image = jest.fn(() => ({
                onload: null,
                onerror: null,
                src: ''
            }));

            optimizer.loadImage(mockImg);

            // Simulate successful load
            const imageInstance = global.Image.mock.results[0].value;
            imageInstance.src = 'test.jpg';
            imageInstance.onload();

            expect(mockImg.src).toBe('test.jpg');
            expect(mockImg.classList.add).toHaveBeenCalledWith('loaded');
        });
    });

    describe('DOM Queue Processing', () => {
        test('should queue DOM updates', () => {
            const updateFn = jest.fn();

            optimizer.queueDOMUpdate(updateFn, 'high');

            expect(optimizer.domUpdateQueue).toHaveLength(1);
            expect(optimizer.domUpdateQueue[0].fn).toBe(updateFn);
            expect(optimizer.domUpdateQueue[0].priority).toBe('high');
        });

        test('should process DOM queue in priority order', () => {
            const highPriorityFn = jest.fn();
            const normalPriorityFn = jest.fn();
            const lowPriorityFn = jest.fn();

            optimizer.queueDOMUpdate(lowPriorityFn, 'low');
            optimizer.queueDOMUpdate(highPriorityFn, 'high');
            optimizer.queueDOMUpdate(normalPriorityFn, 'normal');

            optimizer.processDOMQueue();

            // Should process high priority first
            expect(highPriorityFn).toHaveBeenCalled();
        });

        test('should handle DOM update errors gracefully', () => {
            const errorFn = jest.fn(() => {
                throw new Error('DOM update error');
            });

            optimizer.queueDOMUpdate(errorFn);
            optimizer.processDOMQueue();

            expect(console.error).toHaveBeenCalledWith(
                'DOM update error:',
                expect.any(Error)
            );
        });
    });

    describe('Component Loading', () => {
        test('should load chart components', () => {
            const mockContainer = {
                dataset: { loaded: undefined },
                classList: { contains: jest.fn(() => true) }
            };

            optimizer.showComponentLoader = jest.fn();
            optimizer.initializeChart = jest.fn();

            optimizer.loadChartComponent(mockContainer);

            expect(mockContainer.dataset.loaded).toBe('true');
            expect(optimizer.showComponentLoader).toHaveBeenCalled();
        });

        test('should not reload already loaded components', () => {
            const mockContainer = {
                dataset: { loaded: 'true' }
            };

            optimizer.showComponentLoader = jest.fn();

            optimizer.loadChartComponent(mockContainer);

            expect(optimizer.showComponentLoader).not.toHaveBeenCalled();
        });

        test('should load Lottie components', () => {
            const mockContainer = {
                dataset: {
                    loaded: undefined,
                    animationPath: 'animation.json',
                    loop: 'true',
                    autoplay: 'true'
                }
            };

            global.window.lottie = {
                loadAnimation: jest.fn(() => ({ play: jest.fn() }))
            };

            optimizer.loadLottieComponent(mockContainer);

            expect(mockContainer.dataset.loaded).toBe('true');
            expect(window.lottie.loadAnimation).toHaveBeenCalledWith(
                expect.objectContaining({
                    container: mockContainer,
                    path: 'animation.json',
                    loop: true,
                    autoplay: true
                })
            );
        });
    });

    describe('Error Recovery', () => {
        test('should recover from mutation observer errors', () => {
            // Simulate critical error in mutation handling
            optimizer.processMutationBatch = jest.fn(() => {
                throw new Error('Critical mutation error');
            });

            const mutations = [{ type: 'childList', addedNodes: [], removedNodes: [] }];

            expect(() => {
                optimizer.handleDOMMutations(mutations);
            }).not.toThrow();

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('Critical error handling DOM mutations'),
                expect.any(Error)
            );
        });

        test('should temporarily disable mutation observer on repeated errors', () => {
            optimizer.mutationObserver = {
                disconnect: jest.fn(),
                observe: jest.fn()
            };

            // Simulate error that causes observer to be disabled
            optimizer.processMutationBatch = jest.fn(() => {
                throw new Error('Repeated error');
            });

            const mutations = [{ type: 'childList', addedNodes: [], removedNodes: [] }];
            optimizer.handleDOMMutations(mutations);

            expect(optimizer.mutationObserver.disconnect).toHaveBeenCalled();
        });

        test('should re-enable mutation observer after delay', (done) => {
            optimizer.mutationObserver = {
                disconnect: jest.fn(),
                observe: jest.fn()
            };

            optimizer.processMutationBatch = jest.fn(() => {
                throw new Error('Test error');
            });

            const mutations = [{ type: 'childList', addedNodes: [], removedNodes: [] }];
            optimizer.handleDOMMutations(mutations);

            // Check that re-enable is scheduled
            setTimeout(() => {
                expect(optimizer.mutationObserver.observe).toHaveBeenCalled();
                done();
            }, 100);
        });
    });

    describe('Performance Monitoring', () => {
        test('should track performance metrics', () => {
            expect(optimizer.performanceMetrics).toBeDefined();
            expect(optimizer.frameCount).toBe(0);
            expect(optimizer.fps).toBe(0);
        });

        test('should calculate optimal batch sizes', () => {
            const batchSize = optimizer.calculateOptimalBatchSize();
            expect(typeof batchSize).toBe('number');
            expect(batchSize).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing global objects', () => {
            delete global.window.IntersectionObserver;
            delete global.window.MutationObserver;

            expect(() => {
                new PerformanceOptimizer();
            }).not.toThrow();
        });

        test('should handle missing requestIdleCallback', () => {
            delete global.window.requestIdleCallback;

            const mutations = [{ type: 'childList', addedNodes: [], removedNodes: [] }];

            expect(() => {
                optimizer.handleDOMMutations(mutations);
            }).not.toThrow();
        });

        test('should handle elements without required properties', () => {
            const incompleteElement = { nodeType: 1 };

            expect(() => {
                optimizer.processModifiedElement(incompleteElement);
            }).not.toThrow();
        });
    });
});