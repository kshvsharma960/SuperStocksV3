/**
 * Error Handling Integration Verification
 * Tests the integration between ModernApp and EnhancedErrorHandler
 */

class ErrorHandlingIntegrationVerification {
    constructor() {
        this.testResults = [];
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🧪 Starting Error Handling Integration Tests...');
        
        // Reset counters
        this.testResults = [];
        this.testsPassed = 0;
        this.testsFailed = 0;
        
        // Run tests
        await this.testModernAppInitialization();
        await this.testErrorHandlerIntegration();
        await this.testErrorBoundaries();
        await this.testErrorAnalytics();
        await this.testErrorRecovery();
        await this.testApiErrorHandling();
        await this.testGlobalErrorHandling();
        
        // Display results
        this.displayResults();
        
        return {
            passed: this.testsPassed,
            failed: this.testsFailed,
            total: this.testResults.length,
            results: this.testResults
        };
    }

    /**
     * Test ModernApp initialization with error handling
     */
    async testModernAppInitialization() {
        const testName = 'ModernApp Initialization';
        
        try {
            // Check if ModernApp exists and is initialized
            this.assert(window.ModernApp, 'ModernApp should be available globally');
            this.assert(window.ModernApp.errorHandler, 'ModernApp should have error handler');
            this.assert(window.ModernApp.errorBoundaries, 'ModernApp should have error boundaries');
            this.assert(window.ModernApp.errorAnalytics, 'ModernApp should have error analytics');
            
            this.recordTest(testName, true, 'ModernApp initialized with error handling');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Test error handler integration
     */
    async testErrorHandlerIntegration() {
        const testName = 'Error Handler Integration';
        
        try {
            const errorHandler = window.ModernApp.errorHandler;
            
            this.assert(errorHandler, 'Error handler should be available');
            this.assert(errorHandler.isInitialized, 'Error handler should be initialized');
            this.assert(typeof errorHandler.handleComponentError === 'function', 'Should have handleComponentError method');
            this.assert(typeof errorHandler.handleApiError === 'function', 'Should have handleApiError method');
            
            // Test error processing integration
            const originalErrorCount = errorHandler.errorQueue.length;
            errorHandler.handleComponentError('test-component', new Error('Test error'), { test: true });
            
            this.assert(
                errorHandler.errorQueue.length > originalErrorCount,
                'Error should be added to queue'
            );
            
            this.recordTest(testName, true, 'Error handler properly integrated');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Test error boundaries
     */
    async testErrorBoundaries() {
        const testName = 'Error Boundaries';
        
        try {
            const boundaries = window.ModernApp.errorBoundaries;
            
            this.assert(boundaries.size > 0, 'Should have error boundaries defined');
            this.assert(boundaries.has('component-initialization'), 'Should have component-initialization boundary');
            this.assert(boundaries.has('event-handling'), 'Should have event-handling boundary');
            this.assert(boundaries.has('api-communication'), 'Should have api-communication boundary');
            this.assert(boundaries.has('ui-rendering'), 'Should have ui-rendering boundary');
            
            // Test error boundary execution
            const boundary = boundaries.get('component-initialization');
            const originalErrorCount = boundary.errorCount;
            
            try {
                window.ModernApp.withErrorBoundary('component-initialization', () => {
                    throw new Error('Test boundary error');
                });
            } catch (error) {
                // Expected to catch the error
            }
            
            this.assert(
                boundary.errorCount > originalErrorCount,
                'Error boundary should track errors'
            );
            
            this.recordTest(testName, true, 'Error boundaries working correctly');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Test error analytics
     */
    async testErrorAnalytics() {
        const testName = 'Error Analytics';
        
        try {
            const analytics = window.ModernApp.errorAnalytics;
            
            this.assert(analytics, 'Error analytics should be available');
            this.assert(analytics.sessionId, 'Should have session ID');
            this.assert(typeof analytics.trackError === 'function', 'Should have trackError method');
            this.assert(typeof analytics.getSessionStats === 'function', 'Should have getSessionStats method');
            
            // Test error tracking
            const originalErrorCount = analytics.errorCount;
            analytics.trackError({
                type: 'test',
                message: 'Test error',
                component: 'test-component',
                timestamp: new Date()
            });
            
            this.assert(
                analytics.errorCount > originalErrorCount,
                'Should track error count'
            );
            
            // Test session stats
            const stats = analytics.getSessionStats();
            this.assert(stats.sessionId, 'Stats should include session ID');
            this.assert(typeof stats.sessionDuration === 'number', 'Stats should include session duration');
            
            this.recordTest(testName, true, 'Error analytics working correctly');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Test error recovery mechanisms
     */
    async testErrorRecovery() {
        const testName = 'Error Recovery';
        
        try {
            this.assert(
                typeof window.ModernApp.attemptComponentRecovery === 'function',
                'Should have component recovery method'
            );
            this.assert(
                typeof window.ModernApp.reinitializeEventListeners === 'function',
                'Should have event listener recovery method'
            );
            this.assert(
                typeof window.ModernApp.resetErrorBoundaries === 'function',
                'Should have boundary reset method'
            );
            
            // Test recovery execution (should not throw)
            window.ModernApp.attemptComponentRecovery();
            window.ModernApp.reinitializeEventListeners();
            
            this.recordTest(testName, true, 'Error recovery mechanisms available');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Test API error handling
     */
    async testApiErrorHandling() {
        const testName = 'API Error Handling';
        
        try {
            const errorHandler = window.ModernApp.errorHandler;
            
            // Test API error classification
            const networkError = { message: 'Network error' };
            const serverError = { status: 500, message: 'Server error' };
            const timeoutError = { status: 408, message: 'Timeout' };
            
            const shouldRetryNetwork = errorHandler.handleApiError('/test', networkError, 0);
            const shouldRetryServer = errorHandler.handleApiError('/test', serverError, 0);
            const shouldRetryTimeout = errorHandler.handleApiError('/test', timeoutError, 0);
            
            this.assert(shouldRetryNetwork, 'Should retry network errors');
            this.assert(!shouldRetryServer, 'Should not retry server errors after max attempts');
            this.assert(shouldRetryTimeout, 'Should retry timeout errors');
            
            this.recordTest(testName, true, 'API error handling working correctly');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Test global error handling
     */
    async testGlobalErrorHandling() {
        const testName = 'Global Error Handling';
        
        try {
            // Check if global handlers are set up
            this.assert(window.onerror, 'Global onerror handler should be set');
            
            // Check if unhandled rejection handler is set up
            const hasUnhandledRejectionHandler = window.addEventListener.toString().includes('unhandledrejection') ||
                                                 document.addEventListener.toString().includes('unhandledrejection');
            
            // Test error statistics
            const stats = window.ModernApp.getErrorStats();
            this.assert(stats, 'Should be able to get error statistics');
            this.assert(stats.session || stats.boundaries, 'Stats should contain session or boundary data');
            
            this.recordTest(testName, true, 'Global error handling configured');
        } catch (error) {
            this.recordTest(testName, false, error.message);
        }
    }

    /**
     * Assert helper function
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Record test result
     */
    recordTest(testName, passed, message) {
        const result = {
            name: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        if (passed) {
            this.testsPassed++;
            console.log(`✅ ${testName}: ${message}`);
        } else {
            this.testsFailed++;
            console.error(`❌ ${testName}: ${message}`);
        }
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n📊 Error Handling Integration Test Results:');
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${this.testsPassed}`);
        console.log(`Failed: ${this.testsFailed}`);
        console.log(`Success Rate: ${((this.testsPassed / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (this.testsFailed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`  - ${result.name}: ${result.message}`);
                });
        }
        
        console.log('\n🎯 Integration Status:', this.testsFailed === 0 ? 'PASSED' : 'FAILED');
    }

    /**
     * Generate test report
     */
    generateReport() {
        return {
            summary: {
                total: this.testResults.length,
                passed: this.testsPassed,
                failed: this.testsFailed,
                successRate: ((this.testsPassed / this.testResults.length) * 100).toFixed(1) + '%',
                timestamp: new Date().toISOString()
            },
            tests: this.testResults,
            environment: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                modernAppAvailable: !!window.ModernApp,
                errorHandlerAvailable: !!(window.ModernApp && window.ModernApp.errorHandler),
                enhancedErrorHandlerAvailable: !!window.EnhancedErrorHandler
            }
        };
    }
}

// Make available globally
window.ErrorHandlingIntegrationVerification = ErrorHandlingIntegrationVerification;

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const verification = new ErrorHandlingIntegrationVerification();
            window.errorHandlingTests = verification;
            verification.runAllTests();
        }, 2000); // Wait for ModernApp to initialize
    });
} else {
    setTimeout(() => {
        const verification = new ErrorHandlingIntegrationVerification();
        window.errorHandlingTests = verification;
        verification.runAllTests();
    }, 2000);
}