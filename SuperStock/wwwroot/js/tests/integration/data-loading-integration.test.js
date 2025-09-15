/**
 * Integration Tests for Data Loading and Error Recovery
 * Tests complete workflows with error scenarios as per requirements 2.6, 3.5, 4.5
 */

describe('Data Loading Integration Tests', () => {
    let dashboardManager;
    let leaderboardManager;
    let errorHandler;
    let loadingManager;
    let mockJQuery;

    beforeEach(() => {
        // Setup mock jQuery
        mockJQuery = jest.fn();
        mockJQuery.ajax = jest.fn();
        global.$ = mockJQuery;

        // Setup mock error handler
        errorHandler = {
            handleComponentError: jest.fn(),
            handleApiError: jest.fn().mockReturnValue(true),
            showUserError: jest.fn(),
            addRetryCallback: jest.fn()
        };

        // Setup mock loading manager
        loadingManager = {
            startLoading: jest.fn().mockReturnValue('loading-id'),
            completeLoading: jest.fn(),
            updateProgress: jest.fn(),
            handleTimeout: jest.fn(),
            isAnyLoading: jest.fn().mockReturnValue(false)
        };

        // Setup mock cache manager
        const mockCacheManager = {
            set: jest.fn().mockReturnValue(true),
            get: jest.fn().mockReturnValue(null),
            invalidate: jest.fn(),
            refresh: jest.fn()
        };

        // Setup globals
        global.window = {
            errorHandler: errorHandler,
            loadingStateManager: loadingManager,
            cachePerformanceManager: mockCacheManager,
            dispatchEvent: jest.fn()
        };

        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Import managers
        const DashboardDataManager = require('../../dashboard-data-manager.js');
        const LeaderboardDataManager = require('../../leaderboard-data-manager.js');

        dashboardManager = new DashboardDataManager();
        leaderboardManager = new LeaderboardDataManager();
    });

    afterEach(() => {
        if (dashboardManager) {
            dashboardManager.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Dashboard Data Loading Integration', () => {
        test('should load complete dashboard data successfully', async () => {
            // Mock successful API responses
            mockJQuery.ajax.mockImplementation(({ url, success }) => {
                setTimeout(() => {
                    if (url.includes('UserStocks')) {
                        success({
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
                        });
                    } else if (url.includes('GetFunds')) {
                        success('50000');
                    } else if (url.includes('GetRank')) {
                        success('5 / 100');
                    }
                }, 100);
            });

            const result = await dashboardManager.loadDashboardData('user123', 'demo');

            expect(result.portfolio.success).toBe(true);
            expect(result.funds.success).toBe(true);
            expect(result.rank.success).toBe(true);
            expect(result.hasErrors).toBe(false);

            // Verify portfolio calculations
            expect(result.portfolio.data.summary.totalInvested).toBe(1500);
            expect(result.portfolio.data.summary.currentValue).toBe(1600);
            expect(result.portfolio.data.summary.totalPnL).toBe(100);

            // Verify funds data
            expect(result.funds.data.amount).toBe(50000);
            expect(result.funds.data.currency).toBe('₹');

            // Verify rank data
            expect(result.rank.data.userRank).toBe(5);
            expect(result.rank.data.totalParticipants).toBe(100);
            expect(result.rank.data.percentile).toBe(96);
        });

        test('should handle partial failures gracefully', async () => {
            let callCount = 0;
            mockJQuery.ajax.mockImplementation(({ url, success, error }) => {
                callCount++;
                setTimeout(() => {
                    if (url.includes('UserStocks')) {
                        success({ Value: { UserStockList: [] } });
                    } else if (url.includes('GetFunds')) {
                        error({ status: 500, statusText: 'Server Error' }, 'error', 'Server Error');
                    } else if (url.includes('GetRank')) {
                        success('1 / 50');
                    }
                }, 100);
            });

            const result = await dashboardManager.loadDashboardData('user123', 'demo');

            expect(result.portfolio.success).toBe(true);
            expect(result.funds.success).toBe(false);
            expect(result.rank.success).toBe(true);
            expect(result.hasErrors).toBe(true);

            // Verify fallback data is provided
            expect(result.funds.fallbackData).toBeDefined();
            expect(result.funds.fallbackData.amount).toBe(0);

            // Verify error handling was called
            expect(errorHandler.handleApiError).toHaveBeenCalled();
        });

        test('should retry failed requests with exponential backoff', async () => {
            let attemptCount = 0;
            mockJQuery.ajax.mockImplementation(({ url, success, error }) => {
                attemptCount++;
                setTimeout(() => {
                    if (attemptCount < 3) {
                        error({ status: 500 }, 'error', 'Server Error');
                    } else {
                        success('25000');
                    }
                }, 50);
            });

            // Mock delay function for faster testing
            dashboardManager.delay = jest.fn().mockResolvedValue();

            const result = await dashboardManager.getAvailableFunds('demo');

            expect(attemptCount).toBe(3);
            expect(result.amount).toBe(25000);
            expect(dashboardManager.delay).toHaveBeenCalledTimes(2); // 2 retries
        });

        test('should handle network timeouts correctly', async () => {
            mockJQuery.ajax.mockImplementation(() => {
                // Simulate long-running request that never completes
                return new Promise(() => {});
            });

            const timeoutPromise = dashboardManager.makeApiRequest(
                '/api/test',
                {},
                1000, // 1 second timeout
                'test-request'
            );

            await expect(timeoutPromise).rejects.toThrow('Request timeout');
            expect(errorHandler.handleApiError).toHaveBeenCalled();
        });

        test('should coordinate loading states across components', async () => {
            mockJQuery.ajax.mockImplementation(({ url, success }) => {
                setTimeout(() => {
                    if (url.includes('UserStocks')) {
                        success({ Value: { UserStockList: [] } });
                    } else if (url.includes('GetFunds')) {
                        success('10000');
                    } else if (url.includes('GetRank')) {
                        success('1 / 10');
                    }
                }, 200);
            });

            const loadingPromise = dashboardManager.loadDashboardData('user123', 'demo');

            // Verify loading states are managed
            expect(loadingManager.startLoading).toHaveBeenCalled();

            await loadingPromise;

            expect(loadingManager.completeLoading).toHaveBeenCalled();
        });
    });

    describe('Leaderboard Data Integration', () => {
        test('should process and validate leaderboard data end-to-end', async () => {
            // Mock API response with mixed data quality
            leaderboardManager.fetchLeaderboardFromAPI = jest.fn().mockResolvedValue([
                {
                    email: 'valid@example.com',
                    username: 'ValidUser',
                    portfolioValue: 1500000,
                    pnl: 500000,
                    pnlPercent: 50.0,
                    totalTrades: 25,
                    rank: 1
                },
                {
                    email: 'invalid-email', // Invalid email
                    username: 'InvalidUser',
                    portfolioValue: 1200000,
                    rank: 2
                },
                {
                    email: 'incomplete@example.com',
                    // Missing required fields
                    username: 'IncompleteUser'
                },
                {
                    email: 'xss@example.com',
                    username: '<script>alert("xss")</script>', // XSS attempt
                    portfolioValue: 1100000,
                    rank: 3
                }
            ]);

            const result = await leaderboardManager.getLeaderboardData(true, 'demo');

            // Should have filtered out invalid entries
            expect(result.length).toBeLessThan(4);

            // Valid entry should be processed correctly
            const validEntry = result.find(entry => entry.email === 'valid@example.com');
            expect(validEntry).toBeDefined();
            expect(validEntry.displayName).toBe('ValidUser');
            expect(validEntry.rank).toBeDefined();

            // XSS attempt should be sanitized
            const xssEntry = result.find(entry => entry.email === 'xss@example.com');
            if (xssEntry) {
                expect(xssEntry.username).not.toContain('<script>');
                expect(xssEntry.displayName).not.toContain('<script>');
            }
        });

        test('should handle leaderboard API failures with cache fallback', async () => {
            // Setup cached data
            const cachedData = [
                {
                    email: 'cached@example.com',
                    displayName: 'CachedUser',
                    portfolioValue: 1000000,
                    rank: 1
                }
            ];

            leaderboardManager.leaderboardCache = cachedData;
            leaderboardManager.lastCacheTime = Date.now();

            // Mock API failure
            leaderboardManager.fetchLeaderboardFromAPI = jest.fn().mockRejectedValue(
                new Error('API Error')
            );

            const result = await leaderboardManager.getLeaderboardData(true, 'demo');

            expect(result).toBe(cachedData);
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fetch leaderboard data'),
                expect.any(Error)
            );
        });

        test('should sort and rank leaderboard data correctly', async () => {
            const unsortedData = [
                {
                    email: 'user3@example.com',
                    portfolioValue: 1000000,
                    pnlPercent: 0,
                    totalTrades: 10
                },
                {
                    email: 'user1@example.com',
                    portfolioValue: 1500000,
                    pnlPercent: 50,
                    totalTrades: 20
                },
                {
                    email: 'user2@example.com',
                    portfolioValue: 1200000,
                    pnlPercent: 20,
                    totalTrades: 15
                }
            ];

            leaderboardManager.fetchLeaderboardFromAPI = jest.fn().mockResolvedValue(unsortedData);

            const result = await leaderboardManager.getLeaderboardData(true, 'demo');

            // Should be sorted by portfolio value descending
            expect(result[0].portfolioValue).toBe(1500000);
            expect(result[1].portfolioValue).toBe(1200000);
            expect(result[2].portfolioValue).toBe(1000000);

            // Ranks should be assigned correctly
            expect(result[0].rank).toBe(1);
            expect(result[1].rank).toBe(2);
            expect(result[2].rank).toBe(3);
        });

        test('should handle search and filtering operations', async () => {
            const testData = [
                {
                    email: 'john.doe@example.com',
                    displayName: 'John Doe',
                    portfolioValue: 1500000,
                    pnl: 500000
                },
                {
                    email: 'jane.smith@example.com',
                    displayName: 'Jane Smith',
                    portfolioValue: 1200000,
                    pnl: -100000
                },
                {
                    email: 'bob.johnson@example.com',
                    displayName: 'Bob Johnson',
                    portfolioValue: 1100000,
                    pnl: 50000
                }
            ];

            leaderboardManager.fetchLeaderboardFromAPI = jest.fn().mockResolvedValue(testData);
            await leaderboardManager.getLeaderboardData(true, 'demo');

            // Test search functionality
            const searchResults = leaderboardManager.searchAndFilter(testData, 'john');
            expect(searchResults).toHaveLength(2); // John Doe and Bob Johnson

            // Test filter functionality
            const gainers = leaderboardManager.searchAndFilter(testData, '', 'gainers');
            expect(gainers).toHaveLength(2); // Positive P&L only

            const losers = leaderboardManager.searchAndFilter(testData, '', 'losers');
            expect(losers).toHaveLength(1); // Jane Smith only
        });
    });

    describe('Error Recovery Integration', () => {
        test('should recover from complete API failure', async () => {
            // Mock complete API failure
            mockJQuery.ajax.mockImplementation(({ error }) => {
                setTimeout(() => {
                    error({ status: 0 }, 'error', 'Network Error');
                }, 100);
            });

            const result = await dashboardManager.loadDashboardData('user123', 'demo');

            // All operations should fail but provide fallback data
            expect(result.portfolio.success).toBe(false);
            expect(result.funds.success).toBe(false);
            expect(result.rank.success).toBe(false);
            expect(result.hasErrors).toBe(true);

            // Fallback data should be provided
            expect(result.portfolio.fallbackData).toBeDefined();
            expect(result.funds.fallbackData).toBeDefined();
            expect(result.rank.fallbackData).toBeDefined();

            // Error handler should be called for each failure
            expect(errorHandler.handleApiError).toHaveBeenCalledTimes(3);
        });

        test('should handle intermittent network issues', async () => {
            let callCount = 0;
            mockJQuery.ajax.mockImplementation(({ url, success, error }) => {
                callCount++;
                setTimeout(() => {
                    if (callCount % 2 === 0) {
                        // Even calls succeed
                        if (url.includes('UserStocks')) {
                            success({ Value: { UserStockList: [] } });
                        } else if (url.includes('GetFunds')) {
                            success('10000');
                        } else if (url.includes('GetRank')) {
                            success('1 / 10');
                        }
                    } else {
                        // Odd calls fail
                        error({ status: 500 }, 'error', 'Intermittent Error');
                    }
                }, 50);
            });

            dashboardManager.delay = jest.fn().mockResolvedValue();

            const result = await dashboardManager.loadDashboardData('user123', 'demo');

            // Should eventually succeed after retries
            expect(result.portfolio.success).toBe(true);
            expect(result.funds.success).toBe(true);
            expect(result.rank.success).toBe(true);
        });

        test('should handle malformed API responses', async () => {
            mockJQuery.ajax.mockImplementation(({ url, success }) => {
                setTimeout(() => {
                    if (url.includes('UserStocks')) {
                        success('invalid json response');
                    } else if (url.includes('GetFunds')) {
                        success(null);
                    } else if (url.includes('GetRank')) {
                        success('malformed rank data');
                    }
                }, 100);
            });

            const result = await dashboardManager.loadDashboardData('user123', 'demo');

            // Should handle malformed data gracefully
            expect(result.portfolio.data.hasError).toBe(true);
            expect(result.funds.data.amount).toBe(0);
            expect(result.rank.data.userRank).toBe(1);
        });

        test('should coordinate error recovery across components', async () => {
            // Mock mixed success/failure scenario
            mockJQuery.ajax.mockImplementation(({ url, success, error }) => {
                setTimeout(() => {
                    if (url.includes('UserStocks')) {
                        success({ Value: { UserStockList: [] } });
                    } else {
                        error({ status: 503, statusText: 'Service Unavailable' }, 'error', 'Service Error');
                    }
                }, 100);
            });

            const result = await dashboardManager.loadDashboardData('user123', 'demo');

            // Should show user-friendly error for failed components
            expect(errorHandler.showUserError).toHaveBeenCalled();

            // Should provide retry callbacks
            expect(errorHandler.addRetryCallback).toHaveBeenCalled();

            // Loading states should be properly managed
            expect(loadingManager.completeLoading).toHaveBeenCalled();
        });
    });

    describe('Performance and Caching Integration', () => {
        test('should use cached data to improve performance', async () => {
            // First call - should hit API
            mockJQuery.ajax.mockImplementation(({ success }) => {
                setTimeout(() => success('15000'), 100);
            });

            const result1 = await dashboardManager.getAvailableFunds('demo');
            expect(mockJQuery.ajax).toHaveBeenCalledTimes(1);

            // Second call - should use cache
            const result2 = await dashboardManager.getAvailableFunds('demo');
            expect(mockJQuery.ajax).toHaveBeenCalledTimes(1); // No additional API call

            expect(result1.amount).toBe(result2.amount);
        });

        test('should handle cache invalidation correctly', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                setTimeout(() => success('20000'), 100);
            });

            // First call
            await dashboardManager.getAvailableFunds('demo');
            expect(mockJQuery.ajax).toHaveBeenCalledTimes(1);

            // Clear cache
            dashboardManager.clearCache('funds');

            // Second call should hit API again
            await dashboardManager.getAvailableFunds('demo');
            expect(mockJQuery.ajax).toHaveBeenCalledTimes(2);
        });

        test('should handle concurrent requests efficiently', async () => {
            mockJQuery.ajax.mockImplementation(({ success }) => {
                setTimeout(() => success({ Value: { UserStockList: [] } }), 200);
            });

            // Start multiple concurrent requests
            const promises = [
                dashboardManager.loadPortfolioData('user1', 'demo'),
                dashboardManager.loadPortfolioData('user2', 'demo'),
                dashboardManager.loadPortfolioData('user3', 'demo')
            ];

            const results = await Promise.all(promises);

            // All should complete successfully
            results.forEach(result => {
                expect(result.holdings).toBeDefined();
                expect(result.summary).toBeDefined();
            });

            // Should respect concurrent request limits
            expect(dashboardManager.activeRequests.size).toBe(0);
        });
    });

    describe('End-to-End User Workflows', () => {
        test('should handle complete dashboard loading workflow', async () => {
            // Mock successful responses with realistic delays
            mockJQuery.ajax.mockImplementation(({ url, success }) => {
                const delay = Math.random() * 500 + 100; // 100-600ms delay
                setTimeout(() => {
                    if (url.includes('UserStocks')) {
                        success({
                            Value: {
                                UserStockList: [
                                    { Symbol: 'AAPL', Count: 10, AveragePrice: 150, Price: 155 },
                                    { Symbol: 'GOOGL', Count: 5, AveragePrice: 2000, Price: 2100 }
                                ]
                            }
                        });
                    } else if (url.includes('GetFunds')) {
                        success('75000.50');
                    } else if (url.includes('GetRank')) {
                        success('3 / 150');
                    }
                }, delay);
            });

            const startTime = Date.now();
            const result = await dashboardManager.loadDashboardData('user123', 'demo');
            const endTime = Date.now();

            // Verify complete data loading
            expect(result.hasErrors).toBe(false);
            
            // Portfolio data
            expect(result.portfolio.data.holdings).toHaveLength(2);
            expect(result.portfolio.data.summary.totalInvested).toBe(11500); // (150*10) + (2000*5)
            expect(result.portfolio.data.summary.currentValue).toBe(12050); // (155*10) + (2100*5)
            
            // Funds data
            expect(result.funds.data.amount).toBe(75000.50);
            
            // Rank data
            expect(result.rank.data.userRank).toBe(3);
            expect(result.rank.data.totalParticipants).toBe(150);

            // Performance verification
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

            // Loading states should be managed
            expect(loadingManager.startLoading).toHaveBeenCalled();
            expect(loadingManager.completeLoading).toHaveBeenCalled();
        });

        test('should handle user switching between different game types', async () => {
            mockJQuery.ajax.mockImplementation(({ url, data, success }) => {
                setTimeout(() => {
                    const gameType = data.GameType;
                    if (url.includes('GetFunds')) {
                        success(gameType === 'demo' ? '100000' : '50000');
                    } else if (url.includes('GetRank')) {
                        success(gameType === 'demo' ? '1 / 10' : '5 / 100');
                    }
                }, 100);
            });

            // Load demo data
            const demoFunds = await dashboardManager.getAvailableFunds('demo');
            const demoRank = await dashboardManager.calculateUserRank('demo');

            expect(demoFunds.amount).toBe(100000);
            expect(demoRank.userRank).toBe(1);

            // Switch to live data
            const liveFunds = await dashboardManager.getAvailableFunds('live');
            const liveRank = await dashboardManager.calculateUserRank('live');

            expect(liveFunds.amount).toBe(50000);
            expect(liveRank.userRank).toBe(5);

            // Verify separate caching
            expect(dashboardManager.cache.size).toBeGreaterThan(0);
        });

        test('should handle error recovery with user retry actions', async () => {
            let shouldFail = true;
            mockJQuery.ajax.mockImplementation(({ error, success }) => {
                setTimeout(() => {
                    if (shouldFail) {
                        error({ status: 500 }, 'error', 'Server Error');
                    } else {
                        success('30000');
                    }
                }, 100);
            });

            // First attempt should fail
            await expect(dashboardManager.getAvailableFunds('demo')).rejects.toThrow();
            expect(errorHandler.handleApiError).toHaveBeenCalled();

            // Simulate user retry action
            shouldFail = false;
            const result = await dashboardManager.getAvailableFunds('demo');

            expect(result.amount).toBe(30000);
        });
    });
});