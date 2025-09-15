/**
 * Unit Tests for Leaderboard Data Manager
 * Tests data validation, display logic, and error recovery as per requirements 3.5
 */

describe('LeaderboardDataManager', () => {
    let dataManager;
    let mockCacheManager;

    beforeEach(() => {
        // Setup mock cache manager
        mockCacheManager = {
            set: jest.fn().mockReturnValue(true),
            get: jest.fn().mockReturnValue(null),
            invalidate: jest.fn(),
            refresh: jest.fn()
        };

        // Setup global mocks
        global.window = {
            cachePerformanceManager: mockCacheManager
        };

        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        dataManager = new LeaderboardDataManager();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(dataManager.userCache).toBeInstanceOf(Map);
            expect(dataManager.cacheExpiry).toBe(300000);
            expect(dataManager.validationRules).toBeDefined();
        });

        test('should setup validation rules correctly', () => {
            const rules = dataManager.validationRules;
            
            expect(rules.email.required).toBe(true);
            expect(rules.email.pattern).toBeInstanceOf(RegExp);
            expect(rules.portfolioValue.type).toBe('number');
            expect(rules.rank.min).toBe(1);
        });
    });

    describe('Display Name Resolution', () => {
        test('should prioritize username over other fields', () => {
            const user = {
                username: 'testuser',
                name: 'Test Name',
                email: 'test@example.com'
            };

            const displayName = dataManager.resolveDisplayName(user);
            expect(displayName).toBe('testuser');
        });

        test('should fallback to name when username is empty', () => {
            const user = {
                username: '',
                name: 'Test Name',
                email: 'test@example.com'
            };

            const displayName = dataManager.resolveDisplayName(user);
            expect(displayName).toBe('Test Name');
        });

        test('should fallback to email local part when name is empty', () => {
            const user = {
                username: '',
                name: '',
                email: 'testuser@example.com'
            };

            const displayName = dataManager.resolveDisplayName(user);
            expect(displayName).toBe('testuser');
        });

        test('should fallback to full email when local part extraction fails', () => {
            const user = {
                username: '',
                name: '',
                email: '@example.com'
            };

            const displayName = dataManager.resolveDisplayName(user);
            expect(displayName).toBe('@example.com');
        });

        test('should return default for null user', () => {
            const displayName = dataManager.resolveDisplayName(null);
            expect(displayName).toBe('Unknown User');
        });

        test('should return default for user with no identifying fields', () => {
            const user = {};

            const displayName = dataManager.resolveDisplayName(user);
            expect(displayName).toBe('Anonymous User');
        });
    });

    describe('Data Sanitization', () => {
        test('should sanitize XSS attempts in strings', () => {
            const maliciousUser = {
                username: '<script>alert("xss")</script>',
                name: 'Test<img src=x onerror=alert(1)>',
                email: 'test@example.com'
            };

            const sanitized = dataManager.sanitizeUserData(maliciousUser);

            expect(sanitized.username).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
            expect(sanitized.name).toBe('Test&lt;img src=x onerror=alert(1)&gt;');
        });

        test('should preserve numeric fields', () => {
            const user = {
                portfolioValue: 1500000,
                pnl: 250000,
                pnlPercent: 25.5,
                rank: 5
            };

            const sanitized = dataManager.sanitizeUserData(user);

            expect(sanitized.portfolioValue).toBe(1500000);
            expect(sanitized.pnl).toBe(250000);
            expect(sanitized.pnlPercent).toBe(25.5);
            expect(sanitized.rank).toBe(5);
        });

        test('should handle non-string inputs gracefully', () => {
            const user = {
                username: 123,
                name: null,
                email: undefined
            };

            const sanitized = dataManager.sanitizeUserData(user);

            expect(sanitized.username).toBe('');
            expect(sanitized.name).toBeUndefined();
            expect(sanitized.email).toBeUndefined();
        });
    });

    describe('Data Validation', () => {
        test('should validate correct leaderboard entry', () => {
            const validEntry = {
                email: 'test@example.com',
                username: 'testuser',
                portfolioValue: 1250000,
                pnl: 250000,
                pnlPercent: 25.0,
                rank: 1,
                totalTrades: 45
            };

            const validation = dataManager.validateLeaderboardEntry(validEntry);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
            expect(validation.sanitizedEntry).toBeDefined();
        });

        test('should reject entry with invalid email', () => {
            const invalidEntry = {
                email: 'invalid-email',
                portfolioValue: 1000000,
                rank: 1
            };

            const validation = dataManager.validateLeaderboardEntry(invalidEntry);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(expect.stringContaining('valid email address'));
        });

        test('should reject entry with missing required fields', () => {
            const incompleteEntry = {
                username: 'testuser'
                // Missing email, portfolioValue, rank
            };

            const validation = dataManager.validateLeaderboardEntry(incompleteEntry);

            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });

        test('should validate numeric ranges', () => {
            const invalidEntry = {
                email: 'test@example.com',
                portfolioValue: -1000, // Invalid negative value
                rank: 0, // Invalid rank (must be >= 1)
                pnlPercent: -150 // Invalid percentage (< -100)
            };

            const validation = dataManager.validateLeaderboardEntry(invalidEntry);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(expect.stringContaining('must be at least 0'));
            expect(validation.errors).toContain(expect.stringContaining('must be at least 1'));
            expect(validation.errors).toContain(expect.stringContaining('must be at least -100'));
        });

        test('should warn about string length violations', () => {
            const longStringEntry = {
                email: 'test@example.com',
                username: 'a'.repeat(100), // Exceeds maxLength
                portfolioValue: 1000000,
                rank: 1
            };

            const validation = dataManager.validateLeaderboardEntry(longStringEntry);

            expect(validation.isValid).toBe(true); // Still valid, just warnings
            expect(validation.warnings.length).toBeGreaterThan(0);
            expect(validation.sanitizedEntry.username).toHaveLength(50); // Truncated
        });

        test('should validate business logic consistency', () => {
            const inconsistentEntry = {
                email: 'test@example.com',
                portfolioValue: 1500000,
                pnl: 100000, // Inconsistent with portfolio value
                pnlPercent: 50.0, // Inconsistent with P&L
                rank: 1
            };

            const validation = dataManager.validateLeaderboardEntry(inconsistentEntry);

            expect(validation.warnings.length).toBeGreaterThan(0);
        });

        test('should handle null/undefined entry', () => {
            const validation1 = dataManager.validateLeaderboardEntry(null);
            const validation2 = dataManager.validateLeaderboardEntry(undefined);

            expect(validation1.isValid).toBe(false);
            expect(validation2.isValid).toBe(false);
        });
    });

    describe('Data Processing', () => {
        test('should process valid leaderboard data', () => {
            const rawData = [
                {
                    email: 'user1@example.com',
                    username: 'user1',
                    portfolioValue: 1500000,
                    pnl: 500000,
                    rank: 1
                },
                {
                    email: 'user2@example.com',
                    username: 'user2',
                    portfolioValue: 1200000,
                    pnl: 200000,
                    rank: 2
                }
            ];

            const result = dataManager.processLeaderboardData(rawData);

            expect(result.data).toHaveLength(2);
            expect(result.totalProcessed).toBe(2);
            expect(result.totalErrors).toBe(0);
        });

        test('should filter out invalid entries', () => {
            const rawData = [
                {
                    email: 'valid@example.com',
                    portfolioValue: 1000000,
                    rank: 1
                },
                {
                    email: 'invalid-email', // Invalid
                    portfolioValue: 1000000,
                    rank: 2
                },
                {
                    // Missing required fields
                    username: 'incomplete'
                }
            ];

            const result = dataManager.processLeaderboardData(rawData);

            expect(result.data).toHaveLength(1);
            expect(result.totalProcessed).toBe(1);
            expect(result.totalErrors).toBe(2);
        });

        test('should handle non-array input', () => {
            expect(() => {
                dataManager.processLeaderboardData('not an array');
            }).toThrow('Leaderboard data must be an array');
        });

        test('should enhance entries with computed fields', () => {
            const entry = {
                email: 'test@example.com',
                portfolioValue: 1250000,
                rank: 1
            };

            const enhanced = dataManager.enhanceLeaderboardEntry(entry);

            expect(enhanced.displayName).toBe('test');
            expect(enhanced.pnl).toBe(250000); // portfolioValue - 1000000
            expect(enhanced.pnlPercent).toBe(25); // (pnl / 1000000) * 100
            expect(enhanced.totalTrades).toBe(0); // Default value
        });
    });

    describe('Sorting and Ranking', () => {
        test('should sort by portfolio value descending', () => {
            const data = [
                { email: 'user1@example.com', portfolioValue: 1000000, pnlPercent: 0, totalTrades: 10 },
                { email: 'user2@example.com', portfolioValue: 1500000, pnlPercent: 50, totalTrades: 20 },
                { email: 'user3@example.com', portfolioValue: 1200000, pnlPercent: 20, totalTrades: 15 }
            ];

            const sorted = dataManager.sortAndRankData(data);

            expect(sorted[0].portfolioValue).toBe(1500000);
            expect(sorted[1].portfolioValue).toBe(1200000);
            expect(sorted[2].portfolioValue).toBe(1000000);
        });

        test('should assign correct ranks', () => {
            const data = [
                { email: 'user1@example.com', portfolioValue: 1500000, pnlPercent: 50, totalTrades: 20 },
                { email: 'user2@example.com', portfolioValue: 1200000, pnlPercent: 20, totalTrades: 15 },
                { email: 'user3@example.com', portfolioValue: 1000000, pnlPercent: 0, totalTrades: 10 }
            ];

            const sorted = dataManager.sortAndRankData(data);

            expect(sorted[0].rank).toBe(1);
            expect(sorted[1].rank).toBe(2);
            expect(sorted[2].rank).toBe(3);
        });

        test('should handle ties correctly', () => {
            const data = [
                { email: 'user1@example.com', portfolioValue: 1500000, pnlPercent: 50, totalTrades: 20 },
                { email: 'user2@example.com', portfolioValue: 1500000, pnlPercent: 50, totalTrades: 15 }, // Tie
                { email: 'user3@example.com', portfolioValue: 1000000, pnlPercent: 0, totalTrades: 10 }
            ];

            const sorted = dataManager.sortAndRankData(data);

            expect(sorted[0].rank).toBe(1);
            expect(sorted[1].rank).toBe(1); // Same rank due to tie
            expect(sorted[2].rank).toBe(3); // Skips rank 2
        });

        test('should use secondary sort criteria', () => {
            const data = [
                { email: 'user1@example.com', portfolioValue: 1500000, pnlPercent: 40, totalTrades: 20 },
                { email: 'user2@example.com', portfolioValue: 1500000, pnlPercent: 50, totalTrades: 15 } // Higher P&L%
            ];

            const sorted = dataManager.sortAndRankData(data);

            expect(sorted[0].pnlPercent).toBe(50); // Higher P&L% should be first
            expect(sorted[1].pnlPercent).toBe(40);
        });

        test('should handle empty array', () => {
            const sorted = dataManager.sortAndRankData([]);
            expect(sorted).toEqual([]);
        });
    });

    describe('Cache Management', () => {
        test('should cache leaderboard data', async () => {
            // Mock the API call
            dataManager.fetchLeaderboardFromAPI = jest.fn().mockResolvedValue([
                {
                    email: 'test@example.com',
                    portfolioValue: 1000000,
                    rank: 1
                }
            ]);

            await dataManager.getLeaderboardData(false, 'demo');

            expect(mockCacheManager.set).toHaveBeenCalledWith(
                'leaderboard',
                'leaderboard-demo',
                expect.any(Array),
                expect.objectContaining({ priority: 2 })
            );
        });

        test('should return cached data when available', async () => {
            const cachedData = [{ email: 'cached@example.com' }];
            mockCacheManager.get.mockReturnValue(cachedData);

            const result = await dataManager.getLeaderboardData(false, 'demo');

            expect(result).toBe(cachedData);
            expect(dataManager.fetchLeaderboardFromAPI).not.toHaveBeenCalled();
        });

        test('should force refresh when requested', async () => {
            const cachedData = [{ email: 'cached@example.com' }];
            mockCacheManager.get.mockReturnValue(cachedData);

            dataManager.fetchLeaderboardFromAPI = jest.fn().mockResolvedValue([
                { email: 'fresh@example.com', portfolioValue: 1000000, rank: 1 }
            ]);

            const result = await dataManager.getLeaderboardData(true, 'demo');

            expect(dataManager.fetchLeaderboardFromAPI).toHaveBeenCalled();
            expect(result).not.toBe(cachedData);
        });

        test('should fallback to cache on API error', async () => {
            const cachedData = [{ email: 'cached@example.com' }];
            mockCacheManager.get.mockReturnValue(cachedData);

            dataManager.fetchLeaderboardFromAPI = jest.fn().mockRejectedValue(new Error('API Error'));

            const result = await dataManager.getLeaderboardData(true, 'demo');

            expect(result).toBe(cachedData);
        });

        test('should return empty array when no cache and API fails', async () => {
            mockCacheManager.get.mockReturnValue(null);
            dataManager.leaderboardCache = null;

            dataManager.fetchLeaderboardFromAPI = jest.fn().mockRejectedValue(new Error('API Error'));

            const result = await dataManager.getLeaderboardData(false, 'demo');

            expect(result).toEqual([]);
        });
    });

    describe('User Display Information', () => {
        test('should generate user display info', () => {
            const user = {
                email: 'test@example.com',
                username: 'testuser'
            };

            const displayInfo = dataManager.getUserDisplayInfo(user);

            expect(displayInfo.displayName).toBe('testuser');
            expect(displayInfo.email).toBe('test@example.com');
            expect(displayInfo.avatar).toBe('T');
        });

        test('should cache user display info', () => {
            const user = { email: 'test@example.com', username: 'testuser' };

            dataManager.getUserDisplayInfo(user);

            expect(mockCacheManager.set).toHaveBeenCalledWith(
                'users',
                'test@example.com',
                expect.any(Object),
                expect.objectContaining({ tags: ['users', 'display-info', 'leaderboard'] })
            );
        });

        test('should generate avatar from display name', () => {
            const user1 = { username: 'TestUser' };
            const user2 = { email: 'unknown@example.com' };
            const user3 = {};

            expect(dataManager.generateAvatar(user1)).toBe('T');
            expect(dataManager.generateAvatar(user2)).toBe('U');
            expect(dataManager.generateAvatar(user3)).toBe('?');
        });
    });

    describe('Search and Filtering', () => {
        const sampleData = [
            { displayName: 'John Doe', email: 'john@example.com', pnl: 100000 },
            { displayName: 'Jane Smith', email: 'jane@example.com', pnl: -50000 },
            { displayName: 'Bob Johnson', email: 'bob@example.com', pnl: 25000 }
        ];

        test('should filter by search term', () => {
            const filtered = dataManager.searchAndFilter(sampleData, 'john');

            expect(filtered).toHaveLength(2); // John Doe and Bob Johnson
        });

        test('should filter by email', () => {
            const filtered = dataManager.searchAndFilter(sampleData, 'jane@');

            expect(filtered).toHaveLength(1);
            expect(filtered[0].displayName).toBe('Jane Smith');
        });

        test('should filter gainers', () => {
            const filtered = dataManager.searchAndFilter(sampleData, '', 'gainers');

            expect(filtered).toHaveLength(2); // Positive P&L only
            expect(filtered.every(item => item.pnl > 0)).toBe(true);
        });

        test('should filter losers', () => {
            const filtered = dataManager.searchAndFilter(sampleData, '', 'losers');

            expect(filtered).toHaveLength(1); // Negative P&L only
            expect(filtered[0].displayName).toBe('Jane Smith');
        });

        test('should limit top results', () => {
            const largeData = Array.from({ length: 20 }, (_, i) => ({
                displayName: `User ${i}`,
                email: `user${i}@example.com`,
                pnl: i * 1000
            }));

            const top10 = dataManager.searchAndFilter(largeData, '', 'top10');
            expect(top10).toHaveLength(10);
        });

        test('should handle non-array input', () => {
            const filtered = dataManager.searchAndFilter(null, 'test');
            expect(filtered).toEqual([]);
        });
    });

    describe('Performance History Generation', () => {
        test('should generate default performance history', () => {
            const history = dataManager.generateDefaultPerformanceHistory(1250000);

            expect(history).toHaveLength(30);
            expect(history[0].date).toBeInstanceOf(Date);
            expect(history[0].value).toBeGreaterThanOrEqual(0);
            expect(history[29].value).toBeCloseTo(1250000, -3); // Close to current value
        });

        test('should ensure non-negative values in history', () => {
            const history = dataManager.generateDefaultPerformanceHistory(500000);

            history.forEach(point => {
                expect(point.value).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle API fetch errors gracefully', async () => {
            dataManager.fetchLeaderboardFromAPI = jest.fn().mockRejectedValue(new Error('Network error'));

            const result = await dataManager.getLeaderboardData();

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to fetch leaderboard data'),
                expect.any(Error)
            );
        });

        test('should log processing warnings', () => {
            const rawData = [
                { email: 'invalid-email', portfolioValue: 1000000, rank: 1 }
            ];

            dataManager.processLeaderboardData(rawData);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('validation failed'),
                expect.any(Array)
            );
        });
    });

    describe('Edge Cases', () => {
        test('should handle malformed mock API data', async () => {
            // Test the mock API data with XSS attempts
            const result = await dataManager.fetchLeaderboardFromAPI();

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
            
            // Find the XSS attempt entry
            const xssEntry = result.find(entry => entry.username && entry.username.includes('script'));
            expect(xssEntry).toBeDefined();
        });

        test('should handle zero portfolio values', () => {
            const entry = {
                email: 'test@example.com',
                portfolioValue: 0,
                rank: 1
            };

            const enhanced = dataManager.enhanceLeaderboardEntry(entry);
            expect(enhanced.pnl).toBe(-1000000); // 0 - 1000000
            expect(enhanced.pnlPercent).toBe(-100);
        });

        test('should handle missing cache manager', () => {
            dataManager.cacheManager = null;

            expect(() => {
                dataManager.setCacheData('test', {});
            }).not.toThrow();
        });
    });
});