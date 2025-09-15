/**
 * Cache and Performance Manager
 * Implements intelligent caching, cache invalidation, performance monitoring,
 * and memory leak prevention for the SuperStock application
 * Requirements: 5.1, 5.4, 5.5
 */

class CachePerformanceManager {
    constructor() {
        this.caches = new Map(); // Multiple cache stores
        this.performanceMetrics = new Map();
        this.memoryMonitor = new Map();
        this.cacheStats = new Map();
        this.cleanupIntervals = new Map();
        
        // Configuration
        this.config = {
            // Cache settings
            defaultCacheExpiry: 300000, // 5 minutes
            maxCacheSize: 100, // Maximum entries per cache
            maxMemoryUsage: 50 * 1024 * 1024, // 50MB max memory usage
            
            // Performance monitoring
            performanceBufferSize: 1000,
            metricsRetentionTime: 3600000, // 1 hour
            
            // Cleanup intervals
            cacheCleanupInterval: 60000, // 1 minute
            memoryCheckInterval: 30000, // 30 seconds
            performanceCleanupInterval: 300000, // 5 minutes
            
            // Cache strategies
            strategies: {
                LRU: 'least-recently-used',
                LFU: 'least-frequently-used',
                TTL: 'time-to-live',
                ADAPTIVE: 'adaptive'
            }
        };
        
        // Initialize cache stores
        this.initializeCacheStores();
        
        // Start monitoring and cleanup processes
        this.startMonitoring();
        
        console.log('Cache Performance Manager initialized');
    }

    /**
     * Initialize different cache stores for different data types
     * Requirement 5.1: Intelligent caching for dashboard and leaderboard data
     */
    initializeCacheStores() {
        // Dashboard data cache - short TTL, high frequency access
        this.createCacheStore('dashboard', {
            maxSize: 50,
            ttl: 60000, // 1 minute
            strategy: this.config.strategies.LRU
        });
        
        // Leaderboard data cache - medium TTL, medium frequency
        this.createCacheStore('leaderboard', {
            maxSize: 20,
            ttl: 300000, // 5 minutes
            strategy: this.config.strategies.TTL
        });
        
        // User data cache - long TTL, low frequency changes
        this.createCacheStore('users', {
            maxSize: 200,
            ttl: 900000, // 15 minutes
            strategy: this.config.strategies.LFU
        });
        
        // API response cache - adaptive TTL based on endpoint
        this.createCacheStore('api', {
            maxSize: 100,
            ttl: 180000, // 3 minutes
            strategy: this.config.strategies.ADAPTIVE
        });
        
        // Static data cache - very long TTL
        this.createCacheStore('static', {
            maxSize: 30,
            ttl: 3600000, // 1 hour
            strategy: this.config.strategies.TTL
        });
    }

    /**
     * Create a cache store with specific configuration
     */
    createCacheStore(name, config) {
        const store = {
            data: new Map(),
            config: { ...this.config, ...config },
            accessCount: new Map(),
            accessTime: new Map(),
            createdAt: Date.now(),
            lastCleanup: Date.now()
        };
        
        this.caches.set(name, store);
        this.cacheStats.set(name, {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0,
            memoryUsage: 0
        });
        
        console.log(`Cache store '${name}' created with config:`, config);
    }

    /**
     * Set data in cache with intelligent caching strategy
     * Requirement 5.1: Add intelligent caching
     */
    set(storeName, key, data, options = {}) {
        const startTime = performance.now();
        
        try {
            const store = this.caches.get(storeName);
            if (!store) {
                throw new Error(`Cache store '${storeName}' not found`);
            }
            
            // Calculate data size for memory monitoring
            const dataSize = this.calculateDataSize(data);
            
            // Check memory limits
            if (this.getTotalMemoryUsage() + dataSize > this.config.maxMemoryUsage) {
                this.performMemoryCleanup();
            }
            
            // Apply cache eviction if needed
            this.evictIfNeeded(store, dataSize);
            
            // Create cache entry
            const entry = {
                data,
                size: dataSize,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                accessCount: 1,
                ttl: options.ttl || store.config.ttl,
                expiresAt: Date.now() + (options.ttl || store.config.ttl),
                tags: options.tags || [],
                priority: options.priority || 1
            };
            
            // Store the entry
            store.data.set(key, entry);
            store.accessCount.set(key, 1);
            store.accessTime.set(key, Date.now());
            
            // Update statistics
            const stats = this.cacheStats.get(storeName);
            stats.size = store.data.size;
            stats.memoryUsage += dataSize;
            
            // Record performance metric
            this.recordPerformanceMetric('cache_set', {
                store: storeName,
                key,
                size: dataSize,
                duration: performance.now() - startTime
            });
            
            return true;
            
        } catch (error) {
            console.error(`Cache set error for ${storeName}:${key}:`, error);
            return false;
        }
    }

    /**
     * Get data from cache with performance tracking
     * Requirement 5.1: Intelligent caching retrieval
     */
    get(storeName, key) {
        const startTime = performance.now();
        
        try {
            const store = this.caches.get(storeName);
            if (!store) {
                this.recordCacheMiss(storeName, 'store_not_found');
                return null;
            }
            
            const entry = store.data.get(key);
            if (!entry) {
                this.recordCacheMiss(storeName, 'key_not_found');
                return null;
            }
            
            // Check expiration
            if (Date.now() > entry.expiresAt) {
                store.data.delete(key);
                store.accessCount.delete(key);
                store.accessTime.delete(key);
                this.recordCacheMiss(storeName, 'expired');
                return null;
            }
            
            // Update access statistics
            entry.lastAccessed = Date.now();
            entry.accessCount++;
            store.accessCount.set(key, (store.accessCount.get(key) || 0) + 1);
            store.accessTime.set(key, Date.now());
            
            // Record cache hit
            this.recordCacheHit(storeName);
            
            // Record performance metric
            this.recordPerformanceMetric('cache_get', {
                store: storeName,
                key,
                hit: true,
                duration: performance.now() - startTime
            });
            
            return entry.data;
            
        } catch (error) {
            console.error(`Cache get error for ${storeName}:${key}:`, error);
            this.recordCacheMiss(storeName, 'error');
            return null;
        }
    }

    /**
     * Invalidate cache entries based on tags or patterns
     * Requirement 5.4: Cache invalidation and refresh mechanisms
     */
    invalidate(storeName, criteria = {}) {
        const startTime = performance.now();
        let invalidatedCount = 0;
        
        try {
            const store = this.caches.get(storeName);
            if (!store) {
                return 0;
            }
            
            const keysToDelete = [];
            
            for (const [key, entry] of store.data.entries()) {
                let shouldInvalidate = false;
                
                // Invalidate by key pattern
                if (criteria.keyPattern && key.match(criteria.keyPattern)) {
                    shouldInvalidate = true;
                }
                
                // Invalidate by tags
                if (criteria.tags && criteria.tags.some(tag => entry.tags.includes(tag))) {
                    shouldInvalidate = true;
                }
                
                // Invalidate by age
                if (criteria.maxAge && (Date.now() - entry.createdAt) > criteria.maxAge) {
                    shouldInvalidate = true;
                }
                
                // Invalidate specific keys
                if (criteria.keys && criteria.keys.includes(key)) {
                    shouldInvalidate = true;
                }
                
                // Invalidate all if no criteria specified
                if (Object.keys(criteria).length === 0) {
                    shouldInvalidate = true;
                }
                
                if (shouldInvalidate) {
                    keysToDelete.push(key);
                }
            }
            
            // Delete identified entries
            keysToDelete.forEach(key => {
                const entry = store.data.get(key);
                if (entry) {
                    const stats = this.cacheStats.get(storeName);
                    stats.memoryUsage -= entry.size;
                    stats.evictions++;
                }
                
                store.data.delete(key);
                store.accessCount.delete(key);
                store.accessTime.delete(key);
                invalidatedCount++;
            });
            
            // Update size statistics
            const stats = this.cacheStats.get(storeName);
            stats.size = store.data.size;
            
            // Record performance metric
            this.recordPerformanceMetric('cache_invalidate', {
                store: storeName,
                criteria,
                invalidatedCount,
                duration: performance.now() - startTime
            });
            
            console.log(`Invalidated ${invalidatedCount} entries from ${storeName} cache`);
            return invalidatedCount;
            
        } catch (error) {
            console.error(`Cache invalidation error for ${storeName}:`, error);
            return 0;
        }
    }

    /**
     * Refresh cache entries by re-fetching data
     * Requirement 5.4: Cache refresh mechanisms
     */
    async refresh(storeName, key, fetchFunction, options = {}) {
        const startTime = performance.now();
        
        try {
            // Remove existing entry
            this.invalidate(storeName, { keys: [key] });
            
            // Fetch fresh data
            const freshData = await fetchFunction();
            
            // Store fresh data
            const success = this.set(storeName, key, freshData, options);
            
            // Record performance metric
            this.recordPerformanceMetric('cache_refresh', {
                store: storeName,
                key,
                success,
                duration: performance.now() - startTime
            });
            
            return success ? freshData : null;
            
        } catch (error) {
            console.error(`Cache refresh error for ${storeName}:${key}:`, error);
            return null;
        }
    }

    /**
     * Perform cache eviction based on strategy
     */
    evictIfNeeded(store, newDataSize) {
        const stats = this.cacheStats.get(store);
        
        // Check size limits
        if (store.data.size >= store.config.maxSize) {
            this.performEviction(store, 1);
        }
        
        // Check memory limits
        if (stats && (stats.memoryUsage + newDataSize) > (this.config.maxMemoryUsage / this.caches.size)) {
            this.performEviction(store, Math.ceil(store.data.size * 0.1)); // Evict 10%
        }
    }

    /**
     * Perform cache eviction using configured strategy
     */
    performEviction(store, count) {
        const entries = Array.from(store.data.entries());
        let toEvict = [];
        
        switch (store.config.strategy) {
            case this.config.strategies.LRU:
                // Least Recently Used
                toEvict = entries
                    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
                    .slice(0, count);
                break;
                
            case this.config.strategies.LFU:
                // Least Frequently Used
                toEvict = entries
                    .sort((a, b) => a[1].accessCount - b[1].accessCount)
                    .slice(0, count);
                break;
                
            case this.config.strategies.TTL:
                // Shortest Time To Live remaining
                toEvict = entries
                    .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
                    .slice(0, count);
                break;
                
            case this.config.strategies.ADAPTIVE:
                // Adaptive strategy based on access patterns
                toEvict = entries
                    .map(([key, entry]) => {
                        const age = Date.now() - entry.createdAt;
                        const accessRate = entry.accessCount / (age / 1000); // accesses per second
                        const score = accessRate * entry.priority / entry.size;
                        return { key, entry, score };
                    })
                    .sort((a, b) => a.score - b.score)
                    .slice(0, count)
                    .map(item => [item.key, item.entry]);
                break;
        }
        
        // Remove selected entries
        toEvict.forEach(([key, entry]) => {
            store.data.delete(key);
            store.accessCount.delete(key);
            store.accessTime.delete(key);
            
            // Update statistics
            const storeName = this.getStoreNameByReference(store);
            if (storeName) {
                const stats = this.cacheStats.get(storeName);
                stats.memoryUsage -= entry.size;
                stats.evictions++;
                stats.size = store.data.size;
            }
        });
    }

    /**
     * Start monitoring and cleanup processes
     * Requirement 5.5: Memory leak prevention and cleanup procedures
     */
    startMonitoring() {
        // Cache cleanup interval
        this.cleanupIntervals.set('cache', setInterval(() => {
            this.performCacheCleanup();
        }, this.config.cacheCleanupInterval));
        
        // Memory monitoring interval
        this.cleanupIntervals.set('memory', setInterval(() => {
            this.performMemoryCheck();
        }, this.config.memoryCheckInterval));
        
        // Performance metrics cleanup
        this.cleanupIntervals.set('performance', setInterval(() => {
            this.performPerformanceCleanup();
        }, this.config.performanceCleanupInterval));
        
        // Browser visibility change handler for cleanup
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.performAggressiveCleanup();
                }
            });
        }
        
        // Window beforeunload handler for cleanup
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.destroy();
            });
        }
    }

    /**
     * Perform regular cache cleanup
     * Requirement 5.5: Cleanup procedures
     */
    performCacheCleanup() {
        const startTime = performance.now();
        let totalCleaned = 0;
        
        for (const [storeName, store] of this.caches.entries()) {
            const cleaned = this.cleanExpiredEntries(store);
            totalCleaned += cleaned;
            
            // Update last cleanup time
            store.lastCleanup = Date.now();
        }
        
        // Record performance metric
        this.recordPerformanceMetric('cache_cleanup', {
            totalCleaned,
            duration: performance.now() - startTime
        });
        
        if (totalCleaned > 0) {
            console.log(`Cache cleanup completed: ${totalCleaned} entries removed`);
        }
    }

    /**
     * Clean expired entries from a store
     */
    cleanExpiredEntries(store) {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of store.data.entries()) {
            if (now > entry.expiresAt) {
                store.data.delete(key);
                store.accessCount.delete(key);
                store.accessTime.delete(key);
                cleanedCount++;
            }
        }
        
        return cleanedCount;
    }

    /**
     * Perform memory usage check and cleanup if needed
     * Requirement 5.5: Memory leak prevention
     */
    performMemoryCheck() {
        const totalMemory = this.getTotalMemoryUsage();
        
        if (totalMemory > this.config.maxMemoryUsage) {
            console.warn(`Memory usage (${totalMemory} bytes) exceeds limit, performing cleanup`);
            this.performMemoryCleanup();
        }
        
        // Check for memory leaks in performance metrics
        if (this.performanceMetrics.size > this.config.performanceBufferSize * 2) {
            console.warn('Performance metrics buffer growing too large, cleaning up');
            this.performPerformanceCleanup();
        }
    }

    /**
     * Perform memory cleanup by evicting entries
     */
    performMemoryCleanup() {
        const targetReduction = this.config.maxMemoryUsage * 0.2; // Reduce by 20%
        let totalReduced = 0;
        
        // Sort stores by memory usage (largest first)
        const storesByMemory = Array.from(this.caches.entries())
            .map(([name, store]) => ({
                name,
                store,
                memoryUsage: this.cacheStats.get(name).memoryUsage
            }))
            .sort((a, b) => b.memoryUsage - a.memoryUsage);
        
        // Evict from largest stores first
        for (const { name, store } of storesByMemory) {
            if (totalReduced >= targetReduction) break;
            
            const evictCount = Math.ceil(store.data.size * 0.25); // Evict 25%
            const beforeSize = this.cacheStats.get(name).memoryUsage;
            
            this.performEviction(store, evictCount);
            
            const afterSize = this.cacheStats.get(name).memoryUsage;
            totalReduced += (beforeSize - afterSize);
        }
        
        console.log(`Memory cleanup completed: ${totalReduced} bytes freed`);
    }

    /**
     * Perform aggressive cleanup when page becomes hidden
     */
    performAggressiveCleanup() {
        // Clear all non-essential caches
        this.invalidate('api');
        this.invalidate('dashboard', { maxAge: 30000 }); // Keep only recent dashboard data
        
        // Clean performance metrics
        this.performPerformanceCleanup();
        
        console.log('Aggressive cleanup performed due to page visibility change');
    }

    /**
     * Clean old performance metrics
     */
    performPerformanceCleanup() {
        const cutoffTime = Date.now() - this.config.metricsRetentionTime;
        let cleanedCount = 0;
        
        for (const [key, metrics] of this.performanceMetrics.entries()) {
            const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
            
            if (filteredMetrics.length !== metrics.length) {
                cleanedCount += (metrics.length - filteredMetrics.length);
                
                if (filteredMetrics.length > 0) {
                    this.performanceMetrics.set(key, filteredMetrics);
                } else {
                    this.performanceMetrics.delete(key);
                }
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`Performance metrics cleanup: ${cleanedCount} old metrics removed`);
        }
    }

    /**
     * Record performance metric
     * Requirement 5.4: Performance monitoring and metrics collection
     */
    recordPerformanceMetric(operation, data) {
        const metric = {
            timestamp: Date.now(),
            operation,
            ...data
        };
        
        if (!this.performanceMetrics.has(operation)) {
            this.performanceMetrics.set(operation, []);
        }
        
        const metrics = this.performanceMetrics.get(operation);
        metrics.push(metric);
        
        // Keep only recent metrics to prevent memory leaks
        if (metrics.length > this.config.performanceBufferSize) {
            metrics.splice(0, metrics.length - this.config.performanceBufferSize);
        }
    }

    /**
     * Get performance statistics
     * Requirement 5.4: Performance monitoring
     */
    getPerformanceStats(operation = null, timeRange = 3600000) {
        const cutoffTime = Date.now() - timeRange;
        const stats = {};
        
        const operations = operation ? [operation] : Array.from(this.performanceMetrics.keys());
        
        operations.forEach(op => {
            const metrics = this.performanceMetrics.get(op) || [];
            const recentMetrics = metrics.filter(m => m.timestamp > cutoffTime);
            
            if (recentMetrics.length > 0) {
                const durations = recentMetrics.map(m => m.duration).filter(d => d !== undefined);
                
                stats[op] = {
                    count: recentMetrics.length,
                    avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
                    minDuration: durations.length > 0 ? Math.min(...durations) : 0,
                    maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
                    recentMetrics: recentMetrics.slice(-10) // Last 10 metrics
                };
            }
        });
        
        return stats;
    }

    /**
     * Get cache statistics
     */
    getCacheStats(storeName = null) {
        if (storeName) {
            const stats = this.cacheStats.get(storeName);
            const store = this.caches.get(storeName);
            
            if (stats && store) {
                return {
                    ...stats,
                    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
                    config: store.config,
                    lastCleanup: store.lastCleanup
                };
            }
            return null;
        }
        
        const allStats = {};
        for (const [name, stats] of this.cacheStats.entries()) {
            allStats[name] = {
                ...stats,
                hitRate: stats.hits / (stats.hits + stats.misses) || 0
            };
        }
        
        return {
            stores: allStats,
            totalMemoryUsage: this.getTotalMemoryUsage(),
            totalEntries: Array.from(this.caches.values()).reduce((sum, store) => sum + store.data.size, 0)
        };
    }

    /**
     * Calculate approximate data size in bytes
     */
    calculateDataSize(data) {
        try {
            const jsonString = JSON.stringify(data);
            return new Blob([jsonString]).size;
        } catch (error) {
            // Fallback estimation
            return JSON.stringify(data || {}).length * 2; // Rough estimate
        }
    }

    /**
     * Get total memory usage across all caches
     */
    getTotalMemoryUsage() {
        return Array.from(this.cacheStats.values())
            .reduce((total, stats) => total + stats.memoryUsage, 0);
    }

    /**
     * Record cache hit
     */
    recordCacheHit(storeName) {
        const stats = this.cacheStats.get(storeName);
        if (stats) {
            stats.hits++;
        }
    }

    /**
     * Record cache miss
     */
    recordCacheMiss(storeName, reason) {
        const stats = this.cacheStats.get(storeName);
        if (stats) {
            stats.misses++;
        }
        
        this.recordPerformanceMetric('cache_miss', {
            store: storeName,
            reason,
            timestamp: Date.now()
        });
    }

    /**
     * Get store name by reference (helper method)
     */
    getStoreNameByReference(targetStore) {
        for (const [name, store] of this.caches.entries()) {
            if (store === targetStore) {
                return name;
            }
        }
        return null;
    }

    /**
     * Destroy the cache manager and cleanup all resources
     * Requirement 5.5: Cleanup procedures
     */
    destroy() {
        // Clear all cleanup intervals
        for (const [name, intervalId] of this.cleanupIntervals.entries()) {
            clearInterval(intervalId);
        }
        this.cleanupIntervals.clear();
        
        // Clear all caches
        for (const store of this.caches.values()) {
            store.data.clear();
            store.accessCount.clear();
            store.accessTime.clear();
        }
        this.caches.clear();
        
        // Clear statistics and metrics
        this.cacheStats.clear();
        this.performanceMetrics.clear();
        this.memoryMonitor.clear();
        
        console.log('Cache Performance Manager destroyed and all resources cleaned up');
    }
}

// Create global instance
window.CachePerformanceManager = CachePerformanceManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CachePerformanceManager;
}