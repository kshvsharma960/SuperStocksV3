/**
 * Unit Tests for Dashboard Data Manager
 * Tests data loading and error recovery scenarios as per requirements 2.6
 */

describe('DashboardDataManager', () => {
    let dataManager;
    let mockJQuery;
    let mockErrorHandler;
    let mockCacheManager;

    beforeEach(() => {
        // Setup mock jQuery
        mockJQuery = jest.fn();
        mockJQuery.ajax = jest.fn();
        global.$ = mockJQuery;

        // Setup mock error handler
        mockErrorHandler = {
            handleComponentError: jest.fn(),
            handleApiError: jest.fn()
        };

        // Setup mock cache manager
        mockCacheManager = {
            set: jest.fn().mockReturnValue(true),
            get: jest.fn().mockReturnValue(null),
            invalidate: jest.fn(),
            refresh: jest.fn()
        };

        // Setup global mocks
        global.window = {
            errorHandler: mockErrorHandler,
            cachePerformanceManager: mockCacheManager,
            dispatchEvent: jest.fn()
        };

        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        dataManager = new DashboardDataManager();
    });

    afterEach(() => {
        if (dataManager) {
            dataManager.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(dataManager.config.defaultTimeout).toBe(10000);
            expect(dataManager.config.maxRetries).toBe(3);
            expect(dataManager.config.cacheExpiry).toBe(60000);
            expect(dataManager.cache).toBeInstanceOf(Map);
            expect(dataManager.loadingStates).toBeInstanceOf(Map);
        });

        test('should setup endpoints correctly', () => {
            expect(dataManager.endpoints.userStocks).toBe('/api/UserStocks');
            expect(dataManager.endpoints.funds).toBe('/api/GetFunds');
            expect(dataManager.endpoints.rank).toBe('/api/GetRank');
        });
    });

    describe('Portfolio Data Loading', () => {
        test('should load portfolio data successfully', async () => {
            const mockResponse = {
                Value: {
                    UserStockList: [
                        {
                            Symbol: 'AAPL',
                            Count: 10,
                            AveragePrice: 150,
                            Price: 160
                        }
                    ]
                }
            };

            mockJQuery.ajax.mockImplementation(({ success }) => {
                success(mockResponse);
            });

            const result = await dataManager.loadPortfolioData('user123', 'demo');

            expect(result.holdings).toHaveLength(1);
            expect(result.holdings[0].Symbol).toBe('AAPL');
            expect(result.summary.totalInvested).toBe(1500);
            expect(result.summary.currentValue).toBe(1600);
            expect(result.summary.totalPnL).toBe(100);
        });

        test('should handle portfolio data loading errors', async () => {
            mockJQuery.ajax.mockImplementation(({ error }) => {
                error({ status: 500, statusText: 'Server Error' }, 'error', 'Server Error');
            });

            await expect(dataManager.loadPortfolioData('user123', 'demo')).rejects.toThrow();
            expect(mockErrorHandler.handleApiError).toHaveBeenCalled();
        });

        test('should return cached portfolio data when available', async () => {
            const cachedData = { holdings: [], summary: {} };
            mockCacheManager.get.mockReturnValue(cachedData);

            const result = await dataManager.loadPortfolioData('user123', 'demo');

            expect(result).toBe(cachedData);
            expect(mockJQuery.ajax).not.toHaveBeenCalled();
        });

        test('should handle malformed portfolio data', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                success('invalid json');
            });

            const result = await dataManager.loadPortfolioData('user123', 'demo');

            expect(result.holdings).toEqual([]);
            expect(result.hasError).toBe(true);
        });
    });

    describe('Funds Data Loading', () => {
        test('should load funds data successfully', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                success('50000.50');
            });

            const result = await dataManager.getAvailableFunds('demo');

            expect(result.amount).toBe(50000.50);
            expect(result.currency).toBe('₹');
        });

        test('should handle funds loading errors with retry', async () => {
            let callCount = 0;
            mockJQuery.ajax.mockImplementation(({ error }) => {
                callCount++;
                if (callCount < 3) {
                    error({ status: 500 }, 'error', 'Server Error');
                } else {
                    // Simulate success on retry
                    mockJQuery.ajax.mockImplementation(({ success }) => {
                        success('25000');
                    });
                }
            });

            // Mock delay function
            dataManager.delay = jest.fn().mockResolvedValue();

            await expect(dataManager.getAvailableFunds('demo')).rejects.toThrow();
            expect(callCount).toBeGreaterThan(1);
        });

        test('should handle invalid funds data', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                success('invalid');
            });

            const result = await dataManager.getAvailableFunds('demo');

            expect(result.amount).toBe(0);
        });
    });

    describe('Rank Calculation', () => {
        test('should calculate user rank successfully', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                success('5 / 100');
            });

            const result = await dataManager.calculateUserRank('demo');

            expect(result.userRank).toBe(5);
            expect(result.totalParticipants).toBe(100);
            expect(result.percentile).toBe(96); // (100-5)/(100-1) * 100
        });

        test('should handle rank calculation errors', async () => {
            mockJQuery.ajax.mockImplementation(({ error }) => {
                error({ status: 404 }, 'error', 'Not Found');
            });

            await expect(dataManager.calculateUserRank('demo')).rejects.toThrow();
        });

        test('should handle malformed rank data', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                success('invalid rank format');
            });

            const result = await dataManager.calculateUserRank('demo');

            expect(result.userRank).toBe(1);
            expect(result.totalParticipants).toBe(1);
        });
    });

    describe('Coordinated Data Loading', () => {
        test('should load all dashboard data simultaneously', async () => {
            // Mock all API calls to succeed
            mockJQuery.ajax.mockImplementation(({ url, success }) => {
                if (url.includes('UserStocks')) {
                    success({ Value: { UserStockList: [] } });
                } else if (url.includes('GetFunds')) {
                    success('10000');
                } else if (url.includes('GetRank')) {
                    success('1 / 50');
                }
            });

            const result = await dataManager.loadDashboardData('user123', 'demo');

            expect(result.portfolio.success).toBe(true);
            expect(result.funds.success).toBe(true);
            expect(result.rank.success).toBe(true);
            expect(result.hasErrors).toBe(false);
        });

        test('should handle partial failures in coordinated loading', async () => {
            mockJQuery.ajax.mockImplementation(({ url, success, error }) => {
                if (url.includes('UserStocks')) {
                    success({ Value: { UserStockList: [] } });
                } else if (url.includes('GetFunds')) {
                    error({ status: 500 }, 'error', 'Server Error');
                } else if (url.includes('GetRank')) {
                    success('1 / 50');
                }
            });

            const result = await dataManager.loadDashboardData('user123', 'demo');

            expect(result.portfolio.success).toBe(true);
            expect(result.funds.success).toBe(false);
            expect(result.rank.success).toBe(true);
            expect(result.hasErrors).toBe(true);
        });
    });

    describe('Request Management', () => {
        test('should handle concurrent request limits', async () => {
            // Fill up concurrent requests
            for (let i = 0; i < 5; i++) {
                dataManager.activeRequests.add(`request-${i}`);
            }

            await expect(
                dataManager.makeApiRequest('/api/test', {}, 5000, 'test-request')
            ).rejects.toThrow('Too many concurrent requests');
        });

        test('should abort requests on timeout', async () => {
            const mockAbortController = {
                abort: jest.fn(),
                signal: {}
            };

            global.AbortController = jest.fn(() => mockAbortController);

            mockJQuery.ajax.mockImplementation(() => {
                // Simulate long-running request
                return new Promise(() => {}); // Never resolves
            });

            const timeoutPromise = dataManager.makeApiRequest('/api/test', {}, 100, 'test-request');

            await expect(timeoutPromise).rejects.toThrow('Request timeout');
            expect(mockAbortController.abort).toHaveBeenCalled();
        });

        test('should cleanup aborted requests', async () => {
            const requestId = 'test-request';
            
            dataManager.abortControllers.set(requestId, { abort: jest.fn() });
            dataManager.activeRequests.add(requestId);

            try {
                await dataManager.makeApiRequest('/api/test', {}, 100, requestId);
            } catch (error) {
                // Expected to fail
            }

            expect(dataManager.abortControllers.has(requestId)).toBe(false);
            expect(dataManager.activeRequests.has(requestId)).toBe(false);
        });
    });

    describe('Retry Logic', () => {
        test('should retry failed requests with exponential backoff', async () => {
            let callCount = 0;
            mockJQuery.ajax.mockImplementation(({ error }) => {
                callCount++;
                error({ status: 500 }, 'error', 'Server Error');
            });

            dataManager.delay = jest.fn().mockResolvedValue();

            await expect(
                dataManager.makeApiRequest('/api/test', {}, 5000, 'test-request')
            ).rejects.toThrow();

            expect(callCount).toBe(4); // Initial + 3 retries
            expect(dataManager.delay).toHaveBeenCalledTimes(3);
        });

        test('should not retry client errors', async () => {
            let callCount = 0;
            mockJQuery.ajax.mockImplementation(({ error }) => {
                callCount++;
                error({ status: 400 }, 'error', 'Bad Request');
            });

            await expect(
                dataManager.makeApiRequest('/api/test', {}, 5000, 'test-request')
            ).rejects.toThrow();

            expect(callCount).toBe(1); // No retries for 400 errors
        });

        test('should calculate retry delay correctly', () => {
            const delay0 = dataManager.calculateRetryDelay(0);
            const delay1 = dataManager.calculateRetryDelay(1);
            const delay2 = dataManager.calculateRetryDelay(2);

            expect(delay1).toBeGreaterThan(delay0);
            expect(delay2).toBeGreaterThan(delay1);
            expect(delay2).toBeLessThanOrEqual(10000); // Capped at 10 seconds
        });
    });

    describe('Loading State Management', () => {
        test('should track loading states', () => {
            dataManager.setLoadingState('portfolio', true);

            expect(dataManager.getLoadingState('portfolio')).toBe(true);
            expect(dataManager.isAnyLoading()).toBe(true);
        });

        test('should emit loading state change events', () => {
            const mockDispatchEvent = jest.fn();
            global.window.dispatchEvent = mockDispatchEvent;

            dataManager.setLoadingState('funds', true);

            expect(mockDispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'dashboardLoadingStateChange'
                })
            );
        });

        test('should clear loading states', () => {
            dataManager.setLoadingState('portfolio', true);
            dataManager.setLoadingState('funds', true);

            expect(dataManager.isAnyLoading()).toBe(true);

            dataManager.setLoadingState('portfolio', false);
            dataManager.setLoadingState('funds', false);

            expect(dataManager.isAnyLoading()).toBe(false);
        });
    });

    describe('Cache Management', () => {
        test('should cache data with enhanced cache manager', () => {
            const testData = { test: 'data' };
            
            dataManager.setCacheData('test-key', testData, { priority: 2 });

            expect(mockCacheManager.set).toHaveBeenCalledWith(
                'dashboard',
                'test-key',
                testData,
                expect.objectContaining({ priority: 2 })
            );
        });

        test('should fallback to local cache when enhanced cache fails', () => {
            mockCacheManager.set.mockReturnValue(false);
            
            const testData = { test: 'data' };
            dataManager.setCacheData('test-key', testData);

            expect(dataManager.cache.has('test-key')).toBe(true);
        });

        test('should retrieve cached data', () => {
            const testData = { test: 'data' };
            mockCacheManager.get.mockReturnValue(testData);

            const result = dataManager.getCacheData('test-key');

            expect(result).toBe(testData);
        });

        test('should clear expired local cache', () => {
            const expiredData = {
                data: { test: 'data' },
                timestamp: Date.now(),
                expiry: Date.now() - 1000 // Expired
            };

            dataManager.cache.set('expired-key', expiredData);

            const result = dataManager.getCacheData('expired-key');

            expect(result).toBeNull();
            expect(dataManager.cache.has('expired-key')).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle component errors', () => {
            const error = new Error('Test error');
            
            dataManager.handleError('testOperation', error);

            expect(mockErrorHandler.handleComponentError).toHaveBeenCalledWith(
                'DashboardDataManager',
                error,
                expect.objectContaining({ operation: 'testOperation' })
            );
        });

        test('should provide fallback data for failed requests', () => {
            const portfolioFallback = dataManager.getFallbackData('portfolio');
            const fundsFallback = dataManager.getFallbackData('funds');
            const rankFallback = dataManager.getFallbackData('rank');

            expect(portfolioFallback.holdings).toEqual([]);
            expect(fundsFallback.amount).toBe(0);
            expect(rankFallback.userRank).toBe(1);
        });
    });

    describe('Statistics and Monitoring', () => {
        test('should provide manager statistics', () => {
            dataManager.activeRequests.add('request-1');
            dataManager.loadingStates.set('portfolio', true);

            const stats = dataManager.getStats();

            expect(stats.activeRequests).toBe(1);
            expect(stats.loadingStates.portfolio).toBe(true);
            expect(stats.config).toBeDefined();
        });
    });

    describe('Cleanup and Destruction', () => {
        test('should cleanup properly on destroy', () => {
            dataManager.activeRequests.add('request-1');
            dataManager.cache.set('key', 'value');
            dataManager.loadingStates.set('portfolio', true);

            dataManager.destroy();

            expect(dataManager.activeRequests.size).toBe(0);
            expect(dataManager.cache.size).toBe(0);
            expect(dataManager.loadingStates.size).toBe(0);
        });

        test('should abort all active requests on destroy', () => {
            const mockController = { abort: jest.fn() };
            dataManager.abortControllers.set('request-1', mockController);

            dataManager.destroy();

            expect(mockController.abort).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle null/undefined responses', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                success(null);
            });

            const result = await dataManager.getAvailableFunds('demo');
            expect(result.amount).toBe(0);
        });

        test('should handle network disconnection', async () => {
            mockJQuery.ajax.mockImplementation(({ error }) => {
                error({ status: 0 }, 'error', 'Network Error');
            });

            await expect(dataManager.loadPortfolioData('user123', 'demo')).rejects.toThrow();
            expect(mockErrorHandler.handleApiError).toHaveBeenCalled();
        });

        test('should handle missing error handler gracefully', () => {
            dataManager.errorHandler = null;

            expect(() => {
                dataManager.handleError('test', new Error('test'));
            }).not.toThrow();
        });
    });
});