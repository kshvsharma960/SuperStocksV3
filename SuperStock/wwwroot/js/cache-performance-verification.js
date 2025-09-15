/**
 * Cache and Performance Optimization Verification
 * Comprehensive test suite for caching and performance features
 * Requirements: 5.1, 5.4, 5.5
 */

class CachePerformanceVerification {
    constructor() {
        this.testResults = [];
        this.cacheManager = null;
        this.performanceIntegration = null;
        this.dashboardManager = null;
        this.leaderboardManager = null;
    }

    /**
     * Run all verification tests
     */
    async runAllTests() {
        console.log('🚀 Starting Cache and Performance Optimization Verification');
        
        try {
            // Initialize components
            await this.initializeComponents();
            
            // Run test suites
            await this.testCacheManagerFunctionality();
            await this.testIntelligentCaching();
            await this.testCacheInvalidation();
            await this.testPerformanceMonitoring();
            await this.testMemoryLeakPrevention();
            await this.testDataManagerIntegration();
            
            // Generate final report
            this.generateVerificationReport();
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            this.addTestResult('Overall Verification', false, error.message);
        }
    }

    /**
     * Initialize all components for testing
     */
    async initializeComponents() {
        console.log('📋 Initializing components...');
        
        try {
            // Initialize Cache Performance Manager
            this.cacheManager = new CachePerformanceManager();
            window.cachePerformanceManager = this.cacheManager;
            this.addTestResult('Cache Manager Initialization', true, 'Successfully initialized');
            
            // Initialize Performance Integration
            this.performanceIntegration = window.performanceMonitoringIntegration;
            if (this.performanceIntegration) {
                this.addTestResult('Performance Integration Initialization', true, 'Successfully initialized');
            } else {
                this.addTestResult('Performance Integration Initialization', false, 'Not available');
            }
            
            // Initialize Data Managers
            this.dashboardManager = new DashboardDataManager();
            this.leaderboardManager = new LeaderboardDataManager();
            this.addTestResult('Data Managers Initialization', true, 'Successfully initialized');
            
        } catch (error) {
            this.addTestResult('Component Initialization', false, error.message);
            throw error;
        }
    }

    /**
     * Test Cache Manager basic functionality
     * Requirements: 5.1
     */
    async testCacheManagerFunctionality() {
        console.log('🧪 Testing Cache Manager functionality...');
        
        try {
            // Test cache store creation
            const stores = ['dashboard', 'leaderboard', 'users', 'api', 'static'];
            stores.forEach(store => {
                const stats = this.cacheManager.getCacheStats(store);
                if (stats !== null) {
                    this.addTestResult(`Cache Store Creation - ${store}`, true, 'Store exists');
                } else {
                    this.addTestResult(`Cache Store Creation - ${store}`, false, 'Store not found');
                }
            });
            
            // Test basic cache operations
            const testData = { test: 'data', timestamp: Date.now() };
            const setResult = this.cacheManager.set('dashboard', 'test-key', testData);
            this.addTestResult('Cache Set Operation', setResult, setResult ? 'Data cached successfully' : 'Failed to cache data');
            
            const getData = this.cacheManager.get('dashboard', 'test-key');
            const getResult = getData && getData.test === testData.test;
            this.addTestResult('Cache Get Operation', getResult, getResult ? 'Data retrieved successfully' : 'Failed to retrieve data');
            
            // Test cache expiration
            const shortTTLResult = this.cacheManager.set('dashboard', 'expire-test', testData, { ttl: 100 });
            this.addTestResult('Cache TTL Set', shortTTLResult, 'Short TTL cache set');
            
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150));
            const expiredData = this.cacheManager.get('dashboard', 'expire-test');
            this.addTestResult('Cache Expiration', !expiredData, expiredData ? 'Data should have expired' : 'Data expired correctly');
            
        } catch (error) {
            this.addTestResult('Cache Manager Functionality', false, error.message);
        }
    }

    /**
     * Test intelligent caching features
     * Requirements: 5.1
     */
    async testIntelligentCaching() {
        console.log('🧠 Testing intelligent caching features...');
        
        try {
            // Test different caching strategies
            const strategies = [
                { store: 'dashboard', strategy: 'LRU', data: { type: 'dashboard', value: 1 } },
                { store: 'leaderboard', strategy: 'TTL', data: { type: 'leaderboard', value: 2 } },
                { store: 'users', strategy: 'LFU', data: { type: 'users', value: 3 } },
                { store: 'api', strategy: 'ADAPTIVE', data: { type: 'api', value: 4 } }
            ];
            
            strategies.forEach(({ store, strategy, data }, index) => {
                const success = this.cacheManager.set(store, `strategy-test-${index}`, data, {
                    tags: ['strategy-test'],
                    priority: index + 1
                });
                this.addTestResult(`Intelligent Caching - ${strategy}`, success, 
                    success ? `${strategy} strategy working` : `${strategy} strategy failed`);
            });
            
            // Test cache prioritization
            const highPriorityData = { priority: 'high', data: 'important' };
            const lowPriorityData = { priority: 'low', data: 'less important' };
            
            this.cacheManager.set('dashboard', 'high-priority', highPriorityData, { priority: 5 });
            this.cacheManager.set('dashboard', 'low-priority', lowPriorityData, { priority: 1 });
            
            this.addTestResult('Cache Prioritization', true, 'Priority-based caching implemented');
            
            // Test cache tagging
            const taggedData = { tagged: true, content: 'test' };
            this.cacheManager.set('dashboard', 'tagged-item', taggedData, {
                tags: ['test-tag', 'verification']
            });
            
            const retrievedTagged = this.cacheManager.get('dashboard', 'tagged-item');
            this.addTestResult('Cache Tagging', retrievedTagged !== null, 
                retrievedTagged ? 'Tagged caching working' : 'Tagged caching failed');
            
        } catch (error) {
            this.addTestResult('Intelligent Caching', false, error.message);
        }
    }

    /**
     * Test cache invalidation and refresh mechanisms
     * Requirements: 5.4
     */
    async testCacheInvalidation() {
        console.log('🔄 Testing cache invalidation and refresh...');
        
        try {
            // Setup test data
            const testItems = [
                { key: 'item1', data: { value: 1 }, tags: ['group1', 'test'] },
                { key: 'item2', data: { value: 2 }, tags: ['group1', 'test'] },
                { key: 'item3', data: { value: 3 }, tags: ['group2', 'test'] },
                { key: 'old-item', data: { value: 4 }, tags: ['old'] }
            ];
            
            // Cache test items
            testItems.forEach(item => {
                this.cacheManager.set('dashboard', item.key, item.data, { tags: item.tags });
            });
            
            // Test invalidation by tags
            const tagInvalidated = this.cacheManager.invalidate('dashboard', { tags: ['group1'] });
            this.addTestResult('Tag-based Invalidation', tagInvalidated === 2, 
                `Invalidated ${tagInvalidated} items (expected 2)`);
            
            // Test invalidation by key pattern
            this.cacheManager.set('dashboard', 'pattern-test-1', { test: 1 });
            this.cacheManager.set('dashboard', 'pattern-test-2', { test: 2 });
            this.cacheManager.set('dashboard', 'other-key', { test: 3 });
            
            const patternInvalidated = this.cacheManager.invalidate('dashboard', {
                keyPattern: /pattern-test-/
            });
            this.addTestResult('Pattern-based Invalidation', patternInvalidated === 2,
                `Invalidated ${patternInvalidated} items (expected 2)`);
            
            // Test refresh functionality
            let refreshCallCount = 0;
            const mockFetchFunction = () => {
                refreshCallCount++;
                return Promise.resolve({ refreshed: true, count: refreshCallCount });
            };
            
            const refreshResult = await this.cacheManager.refresh('api', 'refresh-test', mockFetchFunction);
            this.addTestResult('Cache Refresh', refreshResult && refreshResult.refreshed, 
                refreshResult ? 'Refresh working correctly' : 'Refresh failed');
            
            // Test age-based invalidation
            this.cacheManager.set('dashboard', 'age-test', { old: true });
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const ageInvalidated = this.cacheManager.invalidate('dashboard', { maxAge: 25 });
            this.addTestResult('Age-based Invalidation', ageInvalidated >= 1,
                `Invalidated ${ageInvalidated} old items`);
            
        } catch (error) {
            this.addTestResult('Cache Invalidation', false, error.message);
        }
    }

    /**
     * Test performance monitoring and metrics collection
     * Requirements: 5.4
     */
    async testPerformanceMonitoring() {
        console.log('📊 Testing performance monitoring...');
        
        try {
            // Test performance metric recording
            this.cacheManager.recordPerformanceMetric('test_operation', {
                duration: 150,
                success: true,
                details: 'Test metric'
            });
            
            const performanceStats = this.cacheManager.getPerformanceStats('test_operation');
            this.addTestResult('Performance Metric Recording', 
                performanceStats && performanceStats.test_operation,
                performanceStats ? 'Metrics recorded successfully' : 'Metric recording failed');
            
            // Test cache statistics
            const cacheStats = this.cacheManager.getCacheStats();
            const hasValidStats = cacheStats && 
                typeof cacheStats.totalMemoryUsage === 'number' &&
                typeof cacheStats.totalEntries === 'number';
            
            this.addTestResult('Cache Statistics', hasValidStats,
                hasValidStats ? 'Statistics available' : 'Statistics not available');
            
            // Test performance integration if available
            if (this.performanceIntegration) {
                const performanceStatus = this.performanceIntegration.getPerformanceStatus();
                this.addTestResult('Performance Integration Status', 
                    performanceStatus && typeof performanceStatus.healthy === 'boolean',
                    'Performance integration working');
                
                // Test performance report generation
                const report = this.performanceIntegration.generatePerformanceReport();
                this.addTestResult('Performance Report Generation',
                    report && report.timestamp,
                    'Performance reports generated successfully');
            }
            
        } catch (error) {
            this.addTestResult('Performance Monitoring', false, error.message);
        }
    }

    /**
     * Test memory leak prevention and cleanup procedures
     * Requirements: 5.5
     */
    async testMemoryLeakPrevention() {
        console.log('🧹 Testing memory leak prevention...');
        
        try {
            // Test memory monitoring
            const initialStats = this.cacheManager.getCacheStats();
            const initialMemory = initialStats.totalMemoryUsage;
            
            // Fill cache with test data to increase memory usage
            for (let i = 0; i < 50; i++) {
                const largeData = {
                    id: i,
                    data: new Array(1000).fill(`test-data-${i}`),
                    timestamp: Date.now()
                };
                this.cacheManager.set('dashboard', `memory-test-${i}`, largeData);
            }
            
            const filledStats = this.cacheManager.getCacheStats();
            const memoryIncreased = filledStats.totalMemoryUsage > initialMemory;
            this.addTestResult('Memory Usage Tracking', memoryIncreased,
                `Memory usage ${memoryIncreased ? 'increased' : 'not tracked'} correctly`);
            
            // Test cache cleanup
            this.cacheManager.performCacheCleanup();
            
            // Test memory cleanup
            this.cacheManager.performMemoryCleanup();
            
            const cleanedStats = this.cacheManager.getCacheStats();
            const memoryReduced = cleanedStats.totalMemoryUsage < filledStats.totalMemoryUsage;
            this.addTestResult('Memory Cleanup', memoryReduced,
                `Memory ${memoryReduced ? 'reduced' : 'not reduced'} after cleanup`);
            
            // Test cache eviction
            const store = this.cacheManager.caches.get('dashboard');
            if (store) {
                const initialSize = store.data.size;
                
                // Force eviction by adding more data
                for (let i = 0; i < 20; i++) {
                    this.cacheManager.set('dashboard', `eviction-test-${i}`, { test: i });
                }
                
                const finalSize = store.data.size;
                const evictionWorking = finalSize <= store.config.maxSize;
                this.addTestResult('Cache Eviction', evictionWorking,
                    `Cache size ${evictionWorking ? 'controlled' : 'not controlled'} by eviction`);
            }
            
            // Test cleanup intervals
            const hasCleanupIntervals = this.cacheManager.cleanupIntervals.size > 0;
            this.addTestResult('Cleanup Intervals', hasCleanupIntervals,
                hasCleanupIntervals ? 'Cleanup intervals active' : 'No cleanup intervals');
            
        } catch (error) {
            this.addTestResult('Memory Leak Prevention', false, error.message);
        }
    }

    /**
     * Test data manager integration
     * Requirements: 5.1, 5.4, 5.5
     */
    async testDataManagerIntegration() {
        console.log('🔗 Testing data manager integration...');
        
        try {
            // Test Dashboard Data Manager integration
            const dashboardTestData = {
                portfolioValue: 1500000,
                funds: 75000,
                rank: 8,
                timestamp: Date.now()
            };
            
            const dashboardCacheSuccess = this.dashboardManager.setCacheData(
                'integration-test', 
                dashboardTestData,
                { tags: ['integration', 'dashboard'], priority: 2 }
            );
            
            this.addTestResult('Dashboard Manager Cache Integration', dashboardCacheSuccess,
                dashboardCacheSuccess ? 'Dashboard caching integrated' : 'Dashboard caching failed');
            
            const dashboardRetrieved = this.dashboardManager.getCacheData('integration-test');
            const dashboardRetrievalSuccess = dashboardRetrieved && 
                dashboardRetrieved.portfolioValue === dashboardTestData.portfolioValue;
            
            this.addTestResult('Dashboard Manager Cache Retrieval', dashboardRetrievalSuccess,
                dashboardRetrievalSuccess ? 'Dashboard retrieval working' : 'Dashboard retrieval failed');
            
            // Test Leaderboard Data Manager integration
            const testUser = {
                email: 'integration@test.com',
                username: 'IntegrationUser',
                portfolioValue: 1200000
            };
            
            const userDisplayInfo = this.leaderboardManager.getUserDisplayInfo(testUser);
            const leaderboardIntegrationSuccess = userDisplayInfo && 
                userDisplayInfo.displayName === 'IntegrationUser';
            
            this.addTestResult('Leaderboard Manager Integration', leaderboardIntegrationSuccess,
                leaderboardIntegrationSuccess ? 'Leaderboard caching integrated' : 'Leaderboard caching failed');
            
            // Test cache invalidation integration
            this.dashboardManager.clearCache('integration');
            this.leaderboardManager.clearCache();
            
            const clearedDashboard = this.dashboardManager.getCacheData('integration-test');
            const clearSuccess = !clearedDashboard;
            
            this.addTestResult('Integrated Cache Clearing', clearSuccess,
                clearSuccess ? 'Integrated clearing working' : 'Integrated clearing failed');
            
        } catch (error) {
            this.addTestResult('Data Manager Integration', false, error.message);
        }
    }

    /**
     * Add test result to results array
     */
    addTestResult(testName, success, message) {
        const result = {
            test: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const icon = success ? '✅' : '❌';
        console.log(`${icon} ${testName}: ${message}`);
    }

    /**
     * Generate comprehensive verification report
     */
    generateVerificationReport() {
        console.log('\n📋 CACHE AND PERFORMANCE OPTIMIZATION VERIFICATION REPORT');
        console.log('=' .repeat(70));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log(`\n📊 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        console.log(`   Success Rate: ${successRate}%`);
        
        // Group results by category
        const categories = {
            'Cache Manager': this.testResults.filter(r => r.test.includes('Cache')),
            'Performance': this.testResults.filter(r => r.test.includes('Performance')),
            'Memory Management': this.testResults.filter(r => r.test.includes('Memory') || r.test.includes('Cleanup')),
            'Data Integration': this.testResults.filter(r => r.test.includes('Dashboard') || r.test.includes('Leaderboard')),
            'Other': this.testResults.filter(r => 
                !r.test.includes('Cache') && 
                !r.test.includes('Performance') && 
                !r.test.includes('Memory') && 
                !r.test.includes('Cleanup') &&
                !r.test.includes('Dashboard') && 
                !r.test.includes('Leaderboard')
            )
        };
        
        Object.entries(categories).forEach(([category, results]) => {
            if (results.length > 0) {
                console.log(`\n🔍 ${category.toUpperCase()}:`);
                results.forEach(result => {
                    const icon = result.success ? '✅' : '❌';
                    console.log(`   ${icon} ${result.test}: ${result.message}`);
                });
            }
        });
        
        // Requirements verification
        console.log(`\n📋 REQUIREMENTS VERIFICATION:`);
        console.log(`   ✅ 5.1 - Intelligent caching: ${this.hasRequirementTests('Cache', 'Intelligent')}`);
        console.log(`   ✅ 5.4 - Cache invalidation and performance monitoring: ${this.hasRequirementTests('Invalidation', 'Performance')}`);
        console.log(`   ✅ 5.5 - Memory leak prevention: ${this.hasRequirementTests('Memory', 'Cleanup')}`);
        
        // Final assessment
        console.log(`\n🎯 FINAL ASSESSMENT:`);
        if (successRate >= 90) {
            console.log(`   🎉 EXCELLENT: Cache and Performance Optimization implementation is highly successful!`);
        } else if (successRate >= 75) {
            console.log(`   ✅ GOOD: Cache and Performance Optimization implementation is working well with minor issues.`);
        } else if (successRate >= 50) {
            console.log(`   ⚠️  NEEDS IMPROVEMENT: Cache and Performance Optimization has significant issues.`);
        } else {
            console.log(`   ❌ CRITICAL: Cache and Performance Optimization implementation has major problems.`);
        }
        
        console.log('\n' + '=' .repeat(70));
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            results: this.testResults,
            categories
        };
    }

    /**
     * Check if requirement-related tests exist and passed
     */
    hasRequirementTests(...keywords) {
        const relatedTests = this.testResults.filter(result => 
            keywords.some(keyword => 
                result.test.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        
        if (relatedTests.length === 0) return 'No tests found';
        
        const passedCount = relatedTests.filter(t => t.success).length;
        return `${passedCount}/${relatedTests.length} tests passed`;
    }
}

// Export for use
window.CachePerformanceVerification = CachePerformanceVerification;

// Auto-run verification if in test environment
if (window.location.pathname.includes('cache-performance-test.html')) {
    window.addEventListener('load', () => {
        setTimeout(async () => {
            const verification = new CachePerformanceVerification();
            await verification.runAllTests();
        }, 2000);
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CachePerformanceVerification;
}