/**
 * Dashboard Data Manager
 * Handles portfolio, funds, and rank data loading with robust error handling,
 * timeout management, and retry logic with exponential backoff
 */
class DashboardDataManager {
    constructor() {
        this.cache = new Map();
        this.loadingStates = new Map();
        this.retryAttempts = new Map();
        this.abortControllers = new Map();
        
        // Initialize enhanced caching and performance manager
        this.cacheManager = window.cachePerformanceManager || new CachePerformanceManager();
        
        // Configuration
        this.config = {
            defaultTimeout: 10000, // 10 seconds as per requirements
            maxRetries: 3,
            baseRetryDelay: 1000, // 1 second base delay for exponential backoff
            cacheExpiry: 60000, // 1 minute cache expiry
            concurrentRequestLimit: 5
        };
        
        // Data endpoints
        this.endpoints = {
            userStocks: '/api/UserStocks',
            funds: '/api/GetFunds',
            rank: '/api/GetRank',
            watchlist: '/api/UserWatchlist'
        };
        
        // Loading state tracking
        this.activeRequests = new Set();
        
        // Initialize error handler integration
        this.errorHandler = window.errorHandler;
        
        console.log('Dashboard Data Manager initialized');
    }

    /**
     * Load all dashboard data simultaneously with coordinated loading
     * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
     */
    async loadDashboardData(userId, gameType) {
        const loadingId = 'dashboard-full-load';
        
        try {
            this.setLoadingState(loadingId, true);
            
            // Start all data loading operations simultaneously
            const dataPromises = [
                this.loadPortfolioData(userId, gameType),
                this.getAvailableFunds(gameType),
                this.calculateUserRank(gameType)
            ];
            
            // Wait for all data to load with timeout
            const results = await Promise.allSettled(dataPromises);
            
            // Process results and handle any failures
            const dashboardData = {
                portfolio: this.processResult(results[0], 'portfolio'),
                funds: this.processResult(results[1], 'funds'),
                rank: this.processResult(results[2], 'rank'),
                loadedAt: new Date(),
                hasErrors: results.some(result => result.status === 'rejected')
            };
            
            // Cache the combined data with high priority
            this.setCacheData('dashboard-data', dashboardData, {
                tags: ['dashboard', 'combined-data', gameType],
                priority: 3 // Highest priority for combined dashboard data
            });
            
            return dashboardData;
            
        } catch (error) {
            this.handleError('loadDashboardData', error);
            throw error;
        } finally {
            this.setLoadingState(loadingId, false);
        }
    }

    /**
     * Load portfolio data with timeout handling
     * Requirements: 2.1, 2.2, 2.6
     */
    async loadPortfolioData(userId, gameType, timeout = this.config.defaultTimeout) {
        const cacheKey = `portfolio-${userId}-${gameType}`;
        
        // Check cache first
        const cachedData = this.getCacheData(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        const requestId = `portfolio-${Date.now()}`;
        
        try {
            this.setLoadingState('portfolio', true);
            
            const data = await this.makeApiRequest(
                this.endpoints.userStocks,
                { GameType: gameType },
                timeout,
                requestId
            );
            
            // Process and validate portfolio data
            const portfolioData = this.processPortfolioData(data);
            
            // Cache the processed data with performance optimization
            this.setCacheData(cacheKey, portfolioData, {
                tags: ['portfolio', 'user-data', gameType],
                priority: 2 // High priority for portfolio data
            });
            
            return portfolioData;
            
        } catch (error) {
            this.handleError('loadPortfolioData', error);
            throw error;
        } finally {
            this.setLoadingState('portfolio', false);
        }
    }

    /**
     * Get available funds with retry logic
     * Requirements: 2.2, 2.4, 2.6
     */
    async getAvailableFunds(gameType, timeout = this.config.defaultTimeout) {
        const cacheKey = `funds-${gameType}`;
        
        // Check cache first
        const cachedData = this.getCacheData(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        const requestId = `funds-${Date.now()}`;
        
        try {
            this.setLoadingState('funds', true);
            
            const funds = await this.makeApiRequest(
                this.endpoints.funds,
                { GameType: gameType },
                timeout,
                requestId
            );
            
            // Validate and process funds data
            const fundsData = {
                amount: parseFloat(funds) || 0,
                currency: '₹',
                lastUpdated: new Date()
            };
            
            // Cache the processed data with performance optimization
            this.setCacheData(cacheKey, fundsData, {
                tags: ['funds', 'user-data', gameType],
                priority: 2 // High priority for funds data
            });
            
            return fundsData;
            
        } catch (error) {
            this.handleError('getAvailableFunds', error);
            throw error;
        } finally {
            this.setLoadingState('funds', false);
        }
    }

    /**
     * Calculate user rank with proper error handling
     * Requirements: 2.3, 2.4, 2.6
     */
    async calculateUserRank(gameType, timeout = this.config.defaultTimeout) {
        const cacheKey = `rank-${gameType}`;
        
        // Check cache first
        const cachedData = this.getCacheData(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        
        const requestId = `rank-${Date.now()}`;
        
        try {
            this.setLoadingState('rank', true);
            
            const rankData = await this.makeApiRequest(
                this.endpoints.rank,
                { GameType: gameType },
                timeout,
                requestId
            );
            
            // Process rank data (format: "1 / 100")
            const rankParts = rankData.split(' / ');
            const processedRank = {
                userRank: parseInt(rankParts[0]) || 1,
                totalParticipants: parseInt(rankParts[1]) || 1,
                percentile: this.calculatePercentile(parseInt(rankParts[0]), parseInt(rankParts[1])),
                lastUpdated: new Date()
            };
            
            // Cache the processed data with performance optimization
            this.setCacheData(cacheKey, processedRank, {
                tags: ['rank', 'user-data', gameType],
                priority: 1 // Medium priority for rank data
            });
            
            return processedRank;
            
        } catch (error) {
            this.handleError('calculateUserRank', error);
            throw error;
        } finally {
            this.setLoadingState('rank', false);
        }
    }

    /**
     * Make API request with timeout and retry logic
     * Implements exponential backoff for failed API calls
     * Requirements: 2.4, 2.5, 2.6
     */
    async makeApiRequest(url, data, timeout, requestId, retryCount = 0) {
        // Check concurrent request limit
        if (this.activeRequests.size >= this.config.concurrentRequestLimit) {
            throw new Error('Too many concurrent requests');
        }
        
        const abortController = new AbortController();
        this.abortControllers.set(requestId, abortController);
        this.activeRequests.add(requestId);
        
        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    abortController.abort();
                    reject(new Error(`Request timeout after ${timeout}ms`));
                }, timeout);
            });
            
            // Create request promise
            const requestPromise = new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    type: 'GET',
                    data: data,
                    dataType: url.includes('UserStocks') ? 'json' : 'text',
                    contentType: 'application/json',
                    signal: abortController.signal,
                    success: (response) => {
                        resolve(response);
                    },
                    error: (xhr, status, error) => {
                        const apiError = new Error(error || 'API request failed');
                        apiError.status = xhr.status;
                        apiError.statusText = xhr.statusText;
                        apiError.responseText = xhr.responseText;
                        reject(apiError);
                    }
                });
            });
            
            // Race between request and timeout
            const result = await Promise.race([requestPromise, timeoutPromise]);
            
            // Reset retry count on success
            this.retryAttempts.delete(requestId);
            
            return result;
            
        } catch (error) {
            // Handle retry logic with exponential backoff
            if (retryCount < this.config.maxRetries && this.shouldRetry(error)) {
                const retryDelay = this.calculateRetryDelay(retryCount);
                
                console.warn(`API request failed, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`);
                
                // Track retry attempts
                this.retryAttempts.set(requestId, retryCount + 1);
                
                // Wait for retry delay
                await this.delay(retryDelay);
                
                // Retry the request
                return this.makeApiRequest(url, data, timeout, requestId, retryCount + 1);
            }
            
            // Log error through error handler
            if (this.errorHandler) {
                this.errorHandler.handleApiError(url, error, retryCount);
            }
            
            throw error;
            
        } finally {
            // Cleanup
            this.abortControllers.delete(requestId);
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * Process portfolio data and calculate metrics
     */
    processPortfolioData(data) {
        try {
            const listData = typeof data === 'string' ? JSON.parse(data) : data;
            const holdings = listData?.Value?.UserStockList || [];
            
            let totalInvested = 0;
            let currentValue = 0;
            let totalPnL = 0;
            
            // Process each holding
            const processedHoldings = holdings.map(stock => {
                const invested = stock.AveragePrice * stock.Count;
                const current = stock.Price * stock.Count;
                const pnl = current - invested;
                const pnlPercent = invested > 0 ? ((pnl / invested) * 100) : 0;
                
                totalInvested += invested;
                currentValue += current;
                totalPnL += pnl;
                
                return {
                    ...stock,
                    investedValue: invested,
                    currentValue: current,
                    profitLoss: pnl,
                    profitLossPercent: pnlPercent
                };
            });
            
            return {
                holdings: processedHoldings,
                summary: {
                    totalInvested,
                    currentValue,
                    totalPnL,
                    totalPnLPercent: totalInvested > 0 ? ((totalPnL / totalInvested) * 100) : 0,
                    holdingsCount: processedHoldings.length
                },
                lastUpdated: new Date()
            };
            
        } catch (error) {
            console.error('Error processing portfolio data:', error);
            return {
                holdings: [],
                summary: {
                    totalInvested: 0,
                    currentValue: 0,
                    totalPnL: 0,
                    totalPnLPercent: 0,
                    holdingsCount: 0
                },
                lastUpdated: new Date(),
                hasError: true
            };
        }
    }

    /**
     * Calculate percentile ranking
     */
    calculatePercentile(rank, total) {
        if (total <= 1) return 100;
        return Math.round(((total - rank) / (total - 1)) * 100);
    }

    /**
     * Determine if request should be retried
     */
    shouldRetry(error) {
        // Don't retry on client errors (4xx) except timeout
        if (error.status >= 400 && error.status < 500 && error.status !== 408) {
            return false;
        }
        
        // Retry on network errors, timeouts, and server errors
        return !error.status || 
               error.status >= 500 || 
               error.status === 408 || 
               error.message.includes('timeout') ||
               error.message.includes('network') ||
               error.message.includes('abort');
    }

    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(retryCount) {
        const baseDelay = this.config.baseRetryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        
        return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Enhanced cache management with performance optimization
     * Requirements: 5.1, 5.4, 5.5
     */
    setCacheData(key, data, options = {}) {
        // Use enhanced cache manager for intelligent caching
        const success = this.cacheManager.set('dashboard', key, data, {
            ttl: options.ttl || this.config.cacheExpiry,
            tags: options.tags || ['dashboard'],
            priority: options.priority || 1
        });
        
        // Fallback to local cache if enhanced manager fails
        if (!success) {
            this.cache.set(key, {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + this.config.cacheExpiry
            });
        }
        
        return success;
    }

    getCacheData(key) {
        // Try enhanced cache manager first
        let cached = this.cacheManager.get('dashboard', key);
        if (cached) {
            return cached;
        }
        
        // Fallback to local cache
        cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache(pattern = null) {
        // Clear from enhanced cache manager
        if (pattern) {
            this.cacheManager.invalidate('dashboard', {
                keyPattern: new RegExp(pattern)
            });
        } else {
            this.cacheManager.invalidate('dashboard');
        }
        
        // Clear local cache
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    /**
     * Refresh cache data with new fetch
     * Requirements: 5.4
     */
    async refreshCacheData(key, fetchFunction, options = {}) {
        return await this.cacheManager.refresh('dashboard', key, fetchFunction, {
            ttl: options.ttl || this.config.cacheExpiry,
            tags: options.tags || ['dashboard'],
            priority: options.priority || 1
        });
    }

    /**
     * Loading state management
     */
    setLoadingState(component, isLoading) {
        this.loadingStates.set(component, isLoading);
        
        // Emit loading state change event
        window.dispatchEvent(new CustomEvent('dashboardLoadingStateChange', {
            detail: {
                component,
                isLoading,
                allStates: Object.fromEntries(this.loadingStates)
            }
        }));
    }

    getLoadingState(component) {
        return this.loadingStates.get(component) || false;
    }

    isAnyLoading() {
        return Array.from(this.loadingStates.values()).some(state => state);
    }

    /**
     * Error handling
     */
    handleError(operation, error) {
        console.error(`Dashboard Data Manager - ${operation}:`, error);
        
        if (this.errorHandler) {
            this.errorHandler.handleComponentError('DashboardDataManager', error, {
                operation,
                timestamp: new Date()
            });
        }
    }

    /**
     * Process Promise.allSettled results
     */
    processResult(result, type) {
        if (result.status === 'fulfilled') {
            return {
                success: true,
                data: result.value,
                type
            };
        } else {
            return {
                success: false,
                error: result.reason,
                type,
                fallbackData: this.getFallbackData(type)
            };
        }
    }

    /**
     * Get fallback data for failed requests
     */
    getFallbackData(type) {
        switch (type) {
            case 'portfolio':
                return {
                    holdings: [],
                    summary: {
                        totalInvested: 0,
                        currentValue: 0,
                        totalPnL: 0,
                        totalPnLPercent: 0,
                        holdingsCount: 0
                    }
                };
            case 'funds':
                return { amount: 0, currency: '₹' };
            case 'rank':
                return { userRank: 1, totalParticipants: 1, percentile: 100 };
            default:
                return null;
        }
    }

    /**
     * Abort all active requests
     */
    abortAllRequests() {
        for (const controller of this.abortControllers.values()) {
            controller.abort();
        }
        this.abortControllers.clear();
        this.activeRequests.clear();
    }

    /**
     * Get manager statistics
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            activeRequests: this.activeRequests.size,
            loadingStates: Object.fromEntries(this.loadingStates),
            retryAttempts: Object.fromEntries(this.retryAttempts),
            config: this.config
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.abortAllRequests();
        this.cache.clear();
        this.loadingStates.clear();
        this.retryAttempts.clear();
        
        console.log('Dashboard Data Manager destroyed');
    }
}

// Create global instance
window.DashboardDataManager = DashboardDataManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardDataManager;
}