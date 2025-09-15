/**
 * Leaderboard Error Handling Verification Script
 * Verifies that task 8 requirements are properly implemented
 */

class LeaderboardErrorHandlingVerification {
    constructor() {
        this.results = [];
        this.requirements = [
            '3.1: Display user names if available',
            '3.2: Use email as fallback if name not available', 
            '3.3: Add data validation for leaderboard entries',
            '3.5: Specific error messages for leaderboard issues',
            '4.4: Fallback content for missing/corrupted data'
        ];
    }

    /**
     * Run all verification tests
     */
    async runVerification() {
        console.log('🔍 Starting Leaderboard Error Handling Verification...');
        
        this.results = [];
        
        // Test 1: Enhanced Error Handler Integration (Requirement 3.5, 4.4)
        await this.testErrorHandlerIntegration();
        
        // Test 2: Data Manager Integration (Requirements 3.1, 3.2, 3.3)
        await this.testDataManagerIntegration();
        
        // Test 3: Error Recovery Mechanisms (Requirement 3.5)
        await this.testErrorRecovery();
        
        // Test 4: Fallback Content (Requirement 4.4)
        await this.testFallbackContent();
        
        // Test 5: Safe Data Handling (Requirements 3.3, 4.4)
        await this.testSafeDataHandling();
        
        this.generateReport();
    }

    /**
     * Test enhanced error handler integration
     */
    async testErrorHandlerIntegration() {
        const testName = 'Enhanced Error Handler Integration';
        console.log(`📋 Testing: ${testName}`);
        
        try {
            // Check if leaderboard manager exists and has error handler
            if (!window.leaderboardManager) {
                throw new Error('LeaderboardManager not found');
            }
            
            const manager = window.leaderboardManager;
            
            // Test error handler initialization
            if (!manager.errorHandler) {
                this.addResult(testName, false, 'Error handler not initialized');
                return;
            }
            
            // Test error handler methods
            const requiredMethods = ['handleApiError', 'handleComponentError', 'showUserError'];
            const missingMethods = requiredMethods.filter(method => 
                typeof manager.errorHandler[method] !== 'function'
            );
            
            if (missingMethods.length > 0) {
                this.addResult(testName, false, `Missing methods: ${missingMethods.join(', ')}`);
                return;
            }
            
            // Test error recovery state
            if (typeof manager.retryCount !== 'number' || 
                typeof manager.maxRetries !== 'number' ||
                typeof manager.hasError !== 'boolean') {
                this.addResult(testName, false, 'Error recovery state not properly initialized');
                return;
            }
            
            this.addResult(testName, true, 'Error handler properly integrated');
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * Test data manager integration for name/email display
     */
    async testDataManagerIntegration() {
        const testName = 'Data Manager Integration';
        console.log(`📋 Testing: ${testName}`);
        
        try {
            const manager = window.leaderboardManager;
            const dataManager = manager.dataManager;
            
            if (!dataManager) {
                this.addResult(testName, false, 'Data manager not found');
                return;
            }
            
            // Test display name resolution (Requirement 3.1)
            const testUser1 = { username: 'TestUser', email: 'test@example.com' };
            const displayName1 = dataManager.resolveDisplayName(testUser1);
            if (displayName1 !== 'TestUser') {
                this.addResult(testName, false, 'Username priority not working');
                return;
            }
            
            // Test email fallback (Requirement 3.2)
            const testUser2 = { email: 'fallback@example.com' };
            const displayName2 = dataManager.resolveDisplayName(testUser2);
            if (displayName2 !== 'fallback') {
                this.addResult(testName, false, 'Email fallback not working');
                return;
            }
            
            // Test data validation (Requirement 3.3)
            const invalidEntry = { email: 'invalid-email', portfolioValue: 'not-a-number' };
            const validation = dataManager.validateLeaderboardEntry(invalidEntry);
            if (validation.isValid) {
                this.addResult(testName, false, 'Data validation not working');
                return;
            }
            
            this.addResult(testName, true, 'Data manager integration working correctly');
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * Test error recovery mechanisms
     */
    async testErrorRecovery() {
        const testName = 'Error Recovery Mechanisms';
        console.log(`📋 Testing: ${testName}`);
        
        try {
            const manager = window.leaderboardManager;
            
            // Test retry methods exist
            const requiredMethods = ['retryLoadData', 'showRetryableError', 'showFatalError'];
            const missingMethods = requiredMethods.filter(method => 
                typeof manager[method] !== 'function'
            );
            
            if (missingMethods.length > 0) {
                this.addResult(testName, false, `Missing methods: ${missingMethods.join(', ')}`);
                return;
            }
            
            // Test error display methods
            const errorMethods = ['hideError', 'showFallbackContent'];
            const missingErrorMethods = errorMethods.filter(method => 
                typeof manager[method] !== 'function'
            );
            
            if (missingErrorMethods.length > 0) {
                this.addResult(testName, false, `Missing error methods: ${missingErrorMethods.join(', ')}`);
                return;
            }
            
            this.addResult(testName, true, 'Error recovery mechanisms properly implemented');
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * Test fallback content for missing data
     */
    async testFallbackContent() {
        const testName = 'Fallback Content';
        console.log(`📋 Testing: ${testName}`);
        
        try {
            const manager = window.leaderboardManager;
            
            // Create test containers
            const podiumContainer = document.createElement('div');
            podiumContainer.id = 'test-podium';
            
            const tableBody = document.createElement('tbody');
            tableBody.id = 'test-table-body';
            
            // Test podium fallback
            manager.showPodiumFallback(podiumContainer);
            if (!podiumContainer.innerHTML.includes('Top Performers') || 
                !podiumContainer.innerHTML.includes('Retry')) {
                this.addResult(testName, false, 'Podium fallback not working');
                return;
            }
            
            // Test table empty state
            manager.showTableEmptyState(tableBody, null, 'Test message');
            if (!tableBody.innerHTML.includes('No participants found') && 
                !tableBody.innerHTML.includes('Test message')) {
                this.addResult(testName, false, 'Table empty state not working');
                return;
            }
            
            this.addResult(testName, true, 'Fallback content properly implemented');
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * Test safe data handling methods
     */
    async testSafeDataHandling() {
        const testName = 'Safe Data Handling';
        console.log(`📋 Testing: ${testName}`);
        
        try {
            const manager = window.leaderboardManager;
            
            // Test safe currency formatting
            const currency1 = manager.safeFormatCurrency(1234567);
            const currency2 = manager.safeFormatCurrency(null);
            const currency3 = manager.safeFormatCurrency('invalid');
            
            if (!currency1.includes('1,234,567') || currency2 !== '0' || currency3 !== '0') {
                this.addResult(testName, false, 'Safe currency formatting not working');
                return;
            }
            
            // Test safe percentage formatting
            const percent1 = manager.safeFormatPercent(25.5);
            const percent2 = manager.safeFormatPercent(null);
            
            if (percent1 !== '+25.50%' || percent2 !== '0.00%') {
                this.addResult(testName, false, 'Safe percentage formatting not working');
                return;
            }
            
            // Test HTML escaping
            const escaped1 = manager.escapeHtml('<script>alert("xss")</script>');
            const escaped2 = manager.escapeHtml(null);
            
            if (!escaped1.includes('&lt;script&gt;') || escaped2 !== '') {
                this.addResult(testName, false, 'HTML escaping not working');
                return;
            }
            
            this.addResult(testName, true, 'Safe data handling properly implemented');
            
        } catch (error) {
            this.addResult(testName, false, error.message);
        }
    }

    /**
     * Add test result
     */
    addResult(testName, passed, message) {
        this.results.push({
            test: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    /**
     * Generate verification report
     */
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n📊 LEADERBOARD ERROR HANDLING VERIFICATION REPORT');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Requirements Coverage:');
        this.requirements.forEach(req => {
            console.log(`   ${req}`);
        });
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.test}: ${result.message}`);
            });
        }
        
        console.log('\n🎯 Task 8 Implementation Status:');
        if (passedTests === totalTests) {
            console.log('✅ COMPLETE - All error handling integration requirements implemented');
        } else {
            console.log('⚠️  INCOMPLETE - Some requirements need attention');
        }
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            results: this.results
        };
    }
}

// Auto-run verification when script loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for leaderboard manager to initialize
    setTimeout(() => {
        const verification = new LeaderboardErrorHandlingVerification();
        verification.runVerification();
    }, 2000);
});

// Export for manual testing
window.LeaderboardErrorHandlingVerification = LeaderboardErrorHandlingVerification;