/**
 * Performance Monitoring Integration
 * Integrates cache performance manager with existing data managers
 * and provides comprehensive performance monitoring
 * Requirements: 5.1, 5.4, 5.5
 */

class PerformanceMonitoringIntegration {
    constructor() {
        this.initialized = false;
        this.monitoringActive = false;
        this.performanceObserver = null;
        this.memoryMonitor = null;
        this.networkMonitor = null;
        
        // Performance thresholds
        this.thresholds = {
            cacheHitRate: 0.8, // 80% minimum hit rate
            avgResponseTime: 2000, // 2 seconds max average response
            memoryUsage: 50 * 1024 * 1024, // 50MB max memory
            errorRate: 0.05 // 5% max error rate
        };
        
        // Monitoring intervals
        this.intervals = {
            performance: null,
            memory: null,
            network: null,
            reporting: null
        };
        
        this.init();
    }

    /**
     * Initialize performance monitoring integration
     */
    async init() {
        try {
            // Initialize cache performance manager if not already done
            if (!window.cachePerformanceManager) {
                window.cachePerformanceManager = new CachePerformanceManager();
            }
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupMonitoring());
            } else {
                this.setupMonitoring();
            }
            
            this.initialized = true;
            console.log('Performance Monitoring Integration initialized');
            
        } catch (error) {
            console.error('Failed to initialize Performance Monitoring Integration:', error);
        }
    }

    /**
     * Setup comprehensive performance monitoring
     * Requirements: 5.4
     */
    setupMonitoring() {
        // Setup Web Performance API monitoring
        this.setupWebPerformanceMonitoring();
        
        // Setup memory monitoring
        this.setupMemoryMonitoring();
        
        // Setup network monitoring
        this.setupNetworkMonitoring();
        
        // Setup cache performance monitoring
        this.setupCacheMonitoring();
        
        // Setup error monitoring
        this.setupErrorMonitoring();
        
        // Setup periodic reporting
        this.setupPeriodicReporting();
        
        // Setup page visibility monitoring for cleanup
        this.setupVisibilityMonitoring();
        
        this.monitoringActive = true;
        console.log('Performance monitoring setup completed');
    }

    /**
     * Setup Web Performance API monitoring
     */
    setupWebPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            try {
                // Monitor navigation timing
                this.performanceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordWebPerformanceMetric(entry);
                    }
                });
                
                // Observe different performance entry types
                const entryTypes = ['navigation', 'resource', 'measure', 'mark'];
                entryTypes.forEach(type => {
                    try {
                        this.performanceObserver.observe({ entryTypes: [type] });
                    } catch (e) {
                        // Some entry types might not be supported
                        console.warn(`Performance entry type '${type}' not supported`);
                    }
                });
                
            } catch (error) {
                console.warn('PerformanceObserver not fully supported:', error);
            }
        }
        
        // Fallback: Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => this.recordPageLoadMetrics(), 100);
        });
    }

    /**
     * Setup memory monitoring
     * Requirements: 5.5
     */
    setupMemoryMonitoring() {
        // Monitor memory usage if available
        if ('memory' in performance) {
            this.intervals.memory = setInterval(() => {
                this.recordMemoryMetrics();
            }, 30000); // Every 30 seconds
        }
        
        // Monitor cache memory usage
        this.intervals.cacheMemory = setInterval(() => {
            this.monitorCacheMemoryUsage();
        }, 60000); // Every minute
    }

    /**
     * Setup network monitoring
     */
    setupNetworkMonitoring() {
        // Monitor network connection
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const recordConnectionInfo = () => {
                window.cachePerformanceManager.recordPerformanceMetric('network_info', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                });
            };
            
            // Record initial connection info
            recordConnectionInfo();
            
            // Monitor connection changes
            connection.addEventListener('change', recordConnectionInfo);
        }
        
        // Monitor fetch/XHR performance
        this.monitorNetworkRequests();
    }

    /**
     * Setup cache performance monitoring
     * Requirements: 5.1, 5.4
     */
    setupCacheMonitoring() {
        this.intervals.cache = setInterval(() => {
            const cacheStats = window.cachePerformanceManager.getCacheStats();
            
            // Check cache performance against thresholds
            Object.entries(cacheStats.stores || {}).forEach(([storeName, stats]) => {
                if (stats.hitRate < this.thresholds.cacheHitRate) {
                    console.warn(`Cache hit rate for ${storeName} is below threshold: ${stats.hitRate}`);
                    this.optimizeCacheStore(storeName, stats);
                }
            });
            
            // Record cache metrics
            window.cachePerformanceManager.recordPerformanceMetric('cache_monitoring', {
                totalMemoryUsage: cacheStats.totalMemoryUsage,
                totalEntries: cacheStats.totalEntries,
                stores: cacheStats.stores
            });
            
        }, 120000); // Every 2 minutes
    }

    /**
     * Setup error monitoring
     */
    setupErrorMonitoring() {
        // Monitor JavaScript errors
        window.addEventListener('error', (event) => {
            window.cachePerformanceManager.recordPerformanceMetric('js_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Monitor unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            window.cachePerformanceManager.recordPerformanceMetric('promise_rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
    }

    /**
     * Setup periodic performance reporting
     */
    setupPeriodicReporting() {
        this.intervals.reporting = setInterval(() => {
            this.generatePerformanceReport();
        }, 300000); // Every 5 minutes
    }

    /**
     * Setup page visibility monitoring for cleanup
     * Requirements: 5.5
     */
    setupVisibilityMonitoring() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, perform cleanup
                this.performVisibilityCleanup();
            } else {
                // Page is visible, resume monitoring
                this.resumeMonitoring();
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Record Web Performance API metrics
     */
    recordWebPerformanceMetric(entry) {
        const metric = {
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration
        };
        
        // Add specific properties based on entry type
        if (entry.entryType === 'navigation') {
            metric.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
            metric.loadComplete = entry.loadEventEnd - entry.loadEventStart;
            metric.domInteractive = entry.domInteractive - entry.fetchStart;
        } else if (entry.entryType === 'resource') {
            metric.transferSize = entry.transferSize;
            metric.encodedBodySize = entry.encodedBodySize;
            metric.decodedBodySize = entry.decodedBodySize;
        }
        
        window.cachePerformanceManager.recordPerformanceMetric('web_performance', metric);
    }

    /**
     * Record page load metrics
     */
    recordPageLoadMetrics() {
        if ('performance' in window && 'timing' in performance) {
            const timing = performance.timing;
            const navigation = performance.navigation;
            
            const metrics = {
                navigationStart: timing.navigationStart,
                domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
                connect: timing.connectEnd - timing.connectStart,
                request: timing.responseStart - timing.requestStart,
                response: timing.responseEnd - timing.responseStart,
                domProcessing: timing.domComplete - timing.domLoading,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                loadComplete: timing.loadEventEnd - timing.loadEventStart,
                totalTime: timing.loadEventEnd - timing.navigationStart,
                navigationType: navigation.type,
                redirectCount: navigation.redirectCount
            };
            
            window.cachePerformanceManager.recordPerformanceMetric('page_load', metrics);
        }
    }

    /**
     * Record memory metrics
     * Requirements: 5.5
     */
    recordMemoryMetrics() {
        if ('memory' in performance) {
            const memory = performance.memory;
            
            const metrics = {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit
            };
            
            // Check memory pressure
            if (metrics.memoryPressure > 0.8) {
                console.warn('High memory pressure detected:', metrics.memoryPressure);
                this.performMemoryOptimization();
            }
            
            window.cachePerformanceManager.recordPerformanceMetric('memory_usage', metrics);
        }
    }

    /**
     * Monitor cache memory usage
     */
    monitorCacheMemoryUsage() {
        const cacheStats = window.cachePerformanceManager.getCacheStats();
        
        if (cacheStats.totalMemoryUsage > this.thresholds.memoryUsage) {
            console.warn('Cache memory usage exceeds threshold:', cacheStats.totalMemoryUsage);
            this.performCacheMemoryOptimization();
        }
    }

    /**
     * Monitor network requests
     */
    monitorNetworkRequests() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;
                
                window.cachePerformanceManager.recordPerformanceMetric('network_request', {
                    url,
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration,
                    success: response.ok
                });
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                window.cachePerformanceManager.recordPerformanceMetric('network_request', {
                    url,
                    method: args[1]?.method || 'GET',
                    duration,
                    success: false,
                    error: error.message
                });
                
                throw error;
            }
        };
        
        // Intercept jQuery AJAX if available
        if (window.$ && $.ajaxSetup) {
            $(document).ajaxSend((event, xhr, settings) => {
                xhr.startTime = performance.now();
            });
            
            $(document).ajaxComplete((event, xhr, settings) => {
                if (xhr.startTime) {
                    const duration = performance.now() - xhr.startTime;
                    
                    window.cachePerformanceManager.recordPerformanceMetric('ajax_request', {
                        url: settings.url,
                        method: settings.type || 'GET',
                        status: xhr.status,
                        duration,
                        success: xhr.status >= 200 && xhr.status < 300
                    });
                }
            });
        }
    }

    /**
     * Optimize cache store performance
     */
    optimizeCacheStore(storeName, stats) {
        // Implement cache optimization strategies
        if (stats.hitRate < 0.5) {
            // Very low hit rate - increase TTL
            console.log(`Increasing TTL for cache store: ${storeName}`);
        } else if (stats.size > 80) {
            // Cache too large - perform cleanup
            window.cachePerformanceManager.invalidate(storeName, {
                maxAge: 300000 // Remove entries older than 5 minutes
            });
        }
    }

    /**
     * Perform memory optimization
     * Requirements: 5.5
     */
    performMemoryOptimization() {
        // Clear old performance metrics
        window.cachePerformanceManager.performPerformanceCleanup();
        
        // Perform aggressive cache cleanup
        window.cachePerformanceManager.performMemoryCleanup();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('Memory optimization performed');
    }

    /**
     * Perform cache memory optimization
     */
    performCacheMemoryOptimization() {
        // Clear least important caches first
        window.cachePerformanceManager.invalidate('api', { maxAge: 60000 });
        window.cachePerformanceManager.invalidate('static', { maxAge: 1800000 });
        
        console.log('Cache memory optimization performed');
    }

    /**
     * Generate comprehensive performance report
     * Requirements: 5.4
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            cache: window.cachePerformanceManager.getCacheStats(),
            performance: window.cachePerformanceManager.getPerformanceStats(),
            thresholds: this.thresholds,
            recommendations: this.generateRecommendations()
        };
        
        // Log report to console (in production, this would be sent to analytics)
        console.group('Performance Report');
        console.log('Cache Statistics:', report.cache);
        console.log('Performance Metrics:', report.performance);
        console.log('Recommendations:', report.recommendations);
        console.groupEnd();
        
        // Store report for later analysis
        window.cachePerformanceManager.recordPerformanceMetric('performance_report', report);
        
        return report;
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const cacheStats = window.cachePerformanceManager.getCacheStats();
        
        // Cache recommendations
        Object.entries(cacheStats.stores || {}).forEach(([storeName, stats]) => {
            if (stats.hitRate < this.thresholds.cacheHitRate) {
                recommendations.push({
                    type: 'cache',
                    priority: 'high',
                    message: `Improve cache hit rate for ${storeName} (current: ${(stats.hitRate * 100).toFixed(1)}%)`
                });
            }
            
            if (stats.memoryUsage > (this.thresholds.memoryUsage / 5)) {
                recommendations.push({
                    type: 'memory',
                    priority: 'medium',
                    message: `Consider reducing cache size for ${storeName} (current: ${(stats.memoryUsage / 1024 / 1024).toFixed(1)}MB)`
                });
            }
        });
        
        // Memory recommendations
        if (cacheStats.totalMemoryUsage > this.thresholds.memoryUsage) {
            recommendations.push({
                type: 'memory',
                priority: 'high',
                message: `Total cache memory usage is high (${(cacheStats.totalMemoryUsage / 1024 / 1024).toFixed(1)}MB)`
            });
        }
        
        return recommendations;
    }

    /**
     * Perform cleanup when page becomes hidden
     * Requirements: 5.5
     */
    performVisibilityCleanup() {
        // Pause non-essential monitoring
        if (this.intervals.cache) {
            clearInterval(this.intervals.cache);
            this.intervals.cache = null;
        }
        
        // Perform cache cleanup
        window.cachePerformanceManager.performAggressiveCleanup();
        
        console.log('Visibility cleanup performed');
    }

    /**
     * Resume monitoring when page becomes visible
     */
    resumeMonitoring() {
        if (!this.intervals.cache) {
            this.setupCacheMonitoring();
        }
        
        console.log('Monitoring resumed');
    }

    /**
     * Get current performance status
     */
    getPerformanceStatus() {
        const cacheStats = window.cachePerformanceManager.getCacheStats();
        const performanceStats = window.cachePerformanceManager.getPerformanceStats();
        
        return {
            healthy: this.isPerformanceHealthy(cacheStats),
            cacheStats,
            performanceStats,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Check if performance is healthy
     */
    isPerformanceHealthy(cacheStats) {
        // Check cache hit rates
        const avgHitRate = Object.values(cacheStats.stores || {})
            .reduce((sum, stats) => sum + (stats.hitRate || 0), 0) / 
            Object.keys(cacheStats.stores || {}).length;
        
        // Check memory usage
        const memoryHealthy = cacheStats.totalMemoryUsage < this.thresholds.memoryUsage;
        
        // Check cache hit rate
        const cacheHealthy = avgHitRate >= this.thresholds.cacheHitRate;
        
        return memoryHealthy && cacheHealthy;
    }

    /**
     * Cleanup all monitoring resources
     * Requirements: 5.5
     */
    cleanup() {
        // Clear all intervals
        Object.values(this.intervals).forEach(intervalId => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        });
        
        // Disconnect performance observer
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        // Cleanup cache manager
        if (window.cachePerformanceManager) {
            window.cachePerformanceManager.destroy();
        }
        
        this.monitoringActive = false;
        console.log('Performance monitoring cleanup completed');
    }
}

// Initialize performance monitoring integration
window.performanceMonitoringIntegration = new PerformanceMonitoringIntegration();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitoringIntegration;
}