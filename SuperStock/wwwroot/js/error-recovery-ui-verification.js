/**
 * Error Recovery UI Components Verification Script
 * Automated tests to verify all error recovery components meet requirements
 */

class ErrorRecoveryUIVerification {
    constructor() {
        this.testResults = [];
        this.requirements = {
            '4.3': 'Specific error messages with retry options',
            '4.4': 'Fallback content for missing data',
            '5.2': 'Progress indicators during loading',
            '5.3': 'Progress updates for slow operations'
        };
    }

    /**
     * Run all verification tests
     */
    async runAllTests() {
        console.log('🧪 Starting Error Recovery UI Components Verification...');
        
        try {
            // Test basic error recovery UI functionality
            await this.testErrorMessageComponents();
            await this.testLoadingComponents();
            await this.testTimeoutComponents();
            await this.testFallbackComponents();
            
            // Test specialized components
            await this.testDashboardIntegration();
            await this.testLeaderboardIntegration();
            
            // Test requirements compliance
            await this.testRequirementsCompliance();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            this.addTestResult('Overall Test Suite', false, `Test suite failed: ${error.message}`);
        }
    }

    /**
     * Test error message components (Requirements 4.3, 4.4)
     */
    async testErrorMessageComponents() {
        console.log('Testing error message components...');
        
        try {
            // Test basic error message creation
            const errorUI = window.ErrorRecoveryUI;
            if (!errorUI) {
                throw new Error('ErrorRecoveryUI not available');
            }

            // Test error message with retry
            let retryCallbackExecuted = false;
            const errorComponent = errorUI.createErrorMessage({
                title: 'Test Error',
                message: 'Test error message',
                type: 'error',
                onRetry: () => {
                    retryCallbackExecuted = true;
                    return Promise.resolve();
                }
            });

            if (!errorComponent || !errorComponent.querySelector) {
                throw new Error('Error component not created properly');
            }

            // Verify component structure
            const hasTitle = errorComponent.querySelector('.error-message-header');
            const hasMessage = errorComponent.querySelector('.error-message-content');
            const hasActions = errorComponent.querySelector('.error-message-actions');
            const hasRetryButton = errorComponent.querySelector('button');

            if (!hasTitle || !hasMessage || !hasActions) {
                throw new Error('Error component missing required elements');
            }

            // Test retry functionality
            if (hasRetryButton) {
                hasRetryButton.click();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (!retryCallbackExecuted) {
                    throw new Error('Retry callback not executed');
                }
            }

            // Test different error types
            const warningComponent = errorUI.createErrorMessage({
                title: 'Warning',
                message: 'Test warning',
                type: 'warning'
            });

            const infoComponent = errorUI.createErrorMessage({
                title: 'Info',
                message: 'Test info',
                type: 'info'
            });

            if (!warningComponent.className.includes('warning') || 
                !infoComponent.className.includes('info')) {
                throw new Error('Error type styling not applied correctly');
            }

            this.addTestResult('Error Message Components', true, 'All error message tests passed');
            
        } catch (error) {
            this.addTestResult('Error Message Components', false, error.message);
        }
    }

    /**
     * Test loading components (Requirements 5.2, 5.3)
     */
    async testLoadingComponents() {
        console.log('Testing loading components...');
        
        try {
            const errorUI = window.ErrorRecoveryUI;

            // Test loading spinner
            const loadingComponent = errorUI.createLoadingSpinner({
                text: 'Loading test...',
                size: 'medium'
            });

            if (!loadingComponent || !loadingComponent.querySelector('.loading-spinner')) {
                throw new Error('Loading spinner not created properly');
            }

            // Test progress indicator
            const progressComponent = errorUI.createProgressIndicator({
                progress: 50,
                text: 'Processing...',
                showPercentage: true
            });

            if (!progressComponent || !progressComponent.element) {
                throw new Error('Progress indicator not created properly');
            }

            // Test progress update functionality
            progressComponent.updateProgress(75, 'Almost done...');
            
            const progressFill = progressComponent.element.querySelector('.progress-fill');
            const progressText = progressComponent.element.querySelector('.progress-text');
            
            if (!progressFill || !progressText) {
                throw new Error('Progress indicator elements missing');
            }

            // Verify progress update worked
            if (!progressFill.style.width.includes('75')) {
                throw new Error('Progress update not working correctly');
            }

            // Test different loading sizes
            const sizes = ['small', 'medium', 'large'];
            sizes.forEach(size => {
                const sizedComponent = errorUI.createLoadingSpinner({ size });
                if (!sizedComponent) {
                    throw new Error(`Loading spinner size ${size} not working`);
                }
            });

            this.addTestResult('Loading Components', true, 'All loading component tests passed');
            
        } catch (error) {
            this.addTestResult('Loading Components', false, error.message);
        }
    }

    /**
     * Test timeout components (Requirements 4.3, 5.3)
     */
    async testTimeoutComponents() {
        console.log('Testing timeout components...');
        
        try {
            const errorUI = window.ErrorRecoveryUI;

            let retryExecuted = false;
            let cancelExecuted = false;

            // Test timeout notification
            const timeoutComponent = errorUI.createTimeoutNotification({
                message: 'Test timeout message',
                onRetry: () => { retryExecuted = true; },
                onCancel: () => { cancelExecuted = true; },
                timeout: 1000 // Short timeout for testing
            });

            if (!timeoutComponent || !timeoutComponent.querySelector) {
                throw new Error('Timeout component not created properly');
            }

            // Verify component structure
            const hasMessage = timeoutComponent.querySelector('.error-message-content');
            const hasActions = timeoutComponent.querySelector('.error-message-actions');
            
            if (!hasMessage || !hasActions) {
                throw new Error('Timeout component missing required elements');
            }

            // Test retry and cancel buttons
            const retryButton = Array.from(timeoutComponent.querySelectorAll('button'))
                .find(btn => btn.textContent.includes('Retry'));
            const cancelButton = Array.from(timeoutComponent.querySelectorAll('button'))
                .find(btn => btn.textContent.includes('Cancel'));

            if (retryButton) {
                retryButton.click();
                if (!retryExecuted) {
                    throw new Error('Retry callback not executed');
                }
            }

            if (cancelButton) {
                cancelButton.click();
                if (!cancelExecuted) {
                    throw new Error('Cancel callback not executed');
                }
            }

            this.addTestResult('Timeout Components', true, 'All timeout component tests passed');
            
        } catch (error) {
            this.addTestResult('Timeout Components', false, error.message);
        }
    }

    /**
     * Test fallback components (Requirement 4.4)
     */
    async testFallbackComponents() {
        console.log('Testing fallback components...');
        
        try {
            const errorUI = window.ErrorRecoveryUI;

            let actionExecuted = false;

            // Test fallback content
            const fallbackComponent = errorUI.createFallbackContent({
                title: 'Test Fallback',
                message: 'Test fallback message',
                icon: '📄',
                actions: [
                    {
                        text: 'Test Action',
                        onClick: () => { actionExecuted = true; }
                    }
                ]
            });

            if (!fallbackComponent || !fallbackComponent.querySelector) {
                throw new Error('Fallback component not created properly');
            }

            // Verify component structure
            const hasTitle = fallbackComponent.querySelector('h3');
            const hasMessage = fallbackComponent.querySelector('p');
            const hasIcon = fallbackComponent.querySelector('.fallback-icon');
            const hasActions = fallbackComponent.querySelector('.error-message-actions');

            if (!hasTitle || !hasMessage || !hasIcon || !hasActions) {
                throw new Error('Fallback component missing required elements');
            }

            // Test action button
            const actionButton = fallbackComponent.querySelector('button');
            if (actionButton) {
                actionButton.click();
                if (!actionExecuted) {
                    throw new Error('Action callback not executed');
                }
            }

            // Test replace functionality
            const testContainer = document.createElement('div');
            testContainer.id = 'test-container';
            document.body.appendChild(testContainer);

            const replacedComponent = errorUI.replaceWithFallback(testContainer, {
                title: 'Replaced Content',
                message: 'This content was replaced'
            });

            if (!replacedComponent || testContainer.children.length === 0) {
                throw new Error('Replace with fallback not working');
            }

            // Cleanup
            document.body.removeChild(testContainer);

            this.addTestResult('Fallback Components', true, 'All fallback component tests passed');
            
        } catch (error) {
            this.addTestResult('Fallback Components', false, error.message);
        }
    }

    /**
     * Test dashboard integration (Requirements 4.3, 4.4, 5.2)
     */
    async testDashboardIntegration() {
        console.log('Testing dashboard integration...');
        
        try {
            const dashboardRecovery = window.DashboardErrorRecovery;
            if (!dashboardRecovery) {
                throw new Error('DashboardErrorRecovery not available');
            }

            // Create test container
            const testContainer = document.createElement('div');
            testContainer.id = 'dashboard-test-container';
            document.body.appendChild(testContainer);

            let retryExecuted = false;

            // Test portfolio error handling
            const portfolioError = new Error('Portfolio timeout');
            dashboardRecovery.handlePortfolioError(
                testContainer,
                portfolioError,
                () => { retryExecuted = true; return Promise.resolve(); }
            );

            if (testContainer.children.length === 0) {
                throw new Error('Portfolio error handler did not create component');
            }

            // Test retry functionality
            const retryButton = testContainer.querySelector('button');
            if (retryButton && retryButton.textContent.includes('Try Again')) {
                retryButton.click();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (!retryExecuted) {
                    throw new Error('Portfolio retry not executed');
                }
            }

            // Test loading state
            dashboardRecovery.showDashboardLoading(testContainer, 'test data');
            
            const loadingSpinner = testContainer.querySelector('.loading-spinner');
            if (!loadingSpinner) {
                throw new Error('Dashboard loading state not shown');
            }

            // Test fallback content
            dashboardRecovery.showPortfolioFallback(testContainer);
            
            const fallbackContent = testContainer.querySelector('.fallback-content');
            if (!fallbackContent) {
                throw new Error('Portfolio fallback not shown');
            }

            // Cleanup
            document.body.removeChild(testContainer);

            this.addTestResult('Dashboard Integration', true, 'All dashboard integration tests passed');
            
        } catch (error) {
            this.addTestResult('Dashboard Integration', false, error.message);
        }
    }

    /**
     * Test leaderboard integration (Requirements 4.3, 4.4, 5.2)
     */
    async testLeaderboardIntegration() {
        console.log('Testing leaderboard integration...');
        
        try {
            const leaderboardRecovery = window.LeaderboardErrorRecovery;
            if (!leaderboardRecovery) {
                throw new Error('LeaderboardErrorRecovery not available');
            }

            // Create test container
            const testContainer = document.createElement('div');
            testContainer.id = 'leaderboard-test-container';
            document.body.appendChild(testContainer);

            let retryExecuted = false;

            // Test leaderboard error handling
            const leaderboardError = new Error('Leaderboard network error');
            leaderboardRecovery.handleLeaderboardError(
                testContainer,
                leaderboardError,
                () => { retryExecuted = true; return Promise.resolve(); }
            );

            if (testContainer.children.length === 0) {
                throw new Error('Leaderboard error handler did not create component');
            }

            // Test retry functionality
            const retryButton = testContainer.querySelector('button');
            if (retryButton && retryButton.textContent.includes('Try Again')) {
                retryButton.click();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (!retryExecuted) {
                    throw new Error('Leaderboard retry not executed');
                }
            }

            // Test loading state
            leaderboardRecovery.showLeaderboardLoading(testContainer);
            
            const loadingSpinner = testContainer.querySelector('.loading-spinner');
            if (!loadingSpinner) {
                throw new Error('Leaderboard loading state not shown');
            }

            // Test empty leaderboard fallback
            leaderboardRecovery.showEmptyLeaderboard(testContainer);
            
            const fallbackContent = testContainer.querySelector('.fallback-content');
            if (!fallbackContent) {
                throw new Error('Empty leaderboard fallback not shown');
            }

            // Cleanup
            document.body.removeChild(testContainer);

            this.addTestResult('Leaderboard Integration', true, 'All leaderboard integration tests passed');
            
        } catch (error) {
            this.addTestResult('Leaderboard Integration', false, error.message);
        }
    }

    /**
     * Test requirements compliance
     */
    async testRequirementsCompliance() {
        console.log('Testing requirements compliance...');
        
        try {
            const compliance = {
                '4.3': false, // Specific error messages with retry options
                '4.4': false, // Fallback content for missing data
                '5.2': false, // Progress indicators during loading
                '5.3': false  // Progress updates for slow operations
            };

            // Check requirement 4.3 - Specific error messages with retry options
            const errorUI = window.ErrorRecoveryUI;
            const testError = errorUI.createErrorMessage({
                title: 'Test',
                message: 'Specific error message',
                onRetry: () => Promise.resolve()
            });
            
            if (testError && testError.querySelector('button')) {
                compliance['4.3'] = true;
            }

            // Check requirement 4.4 - Fallback content for missing data
            const testFallback = errorUI.createFallbackContent({
                title: 'No Data',
                message: 'Fallback content'
            });
            
            if (testFallback && testFallback.querySelector('.fallback-content')) {
                compliance['4.4'] = true;
            }

            // Check requirement 5.2 - Progress indicators during loading
            const testProgress = errorUI.createProgressIndicator({
                progress: 50,
                showPercentage: true
            });
            
            if (testProgress && testProgress.element && testProgress.element.querySelector('.progress-bar')) {
                compliance['5.2'] = true;
            }

            // Check requirement 5.3 - Progress updates for slow operations
            const testTimeout = errorUI.createTimeoutNotification({
                message: 'Slow operation',
                onRetry: () => {}
            });
            
            if (testTimeout && testTimeout.querySelector('.timeout-notification')) {
                compliance['5.3'] = true;
            }

            // Report compliance
            const passedRequirements = Object.values(compliance).filter(Boolean).length;
            const totalRequirements = Object.keys(compliance).length;
            
            if (passedRequirements === totalRequirements) {
                this.addTestResult('Requirements Compliance', true, 
                    `All ${totalRequirements} requirements met: ${Object.keys(compliance).join(', ')}`);
            } else {
                const failedRequirements = Object.keys(compliance)
                    .filter(req => !compliance[req]);
                this.addTestResult('Requirements Compliance', false, 
                    `Failed requirements: ${failedRequirements.join(', ')}`);
            }
            
        } catch (error) {
            this.addTestResult('Requirements Compliance', false, error.message);
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, passed, details) {
        this.testResults.push({
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName} - ${details}`);
    }

    /**
     * Generate verification report
     */
    generateReport() {
        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;
        const passRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log('\n📊 ERROR RECOVERY UI COMPONENTS VERIFICATION REPORT');
        console.log('='.repeat(60));
        console.log(`Overall Result: ${passedTests}/${totalTests} tests passed (${passRate}%)`);
        console.log('');
        
        console.log('Requirements Coverage:');
        Object.entries(this.requirements).forEach(([req, description]) => {
            const reqTests = this.testResults.filter(result => 
                result.details.includes(req) || result.test.includes('Requirements'));
            const reqPassed = reqTests.some(test => test.passed);
            console.log(`  ${req}: ${reqPassed ? '✅' : '❌'} ${description}`);
        });
        
        console.log('\nDetailed Test Results:');
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${status}: ${result.test}`);
            if (!result.passed) {
                console.log(`    Error: ${result.details}`);
            }
        });
        
        console.log('\n📋 SUMMARY:');
        if (passedTests === totalTests) {
            console.log('🎉 All error recovery UI components are working correctly!');
            console.log('✅ Task 10 implementation is complete and meets all requirements.');
        } else {
            console.log('⚠️  Some tests failed. Please review the implementation.');
        }
        
        return {
            passed: passedTests,
            total: totalTests,
            passRate,
            allPassed: passedTests === totalTests
        };
    }
}

// Auto-run verification if this script is loaded directly
if (typeof window !== 'undefined') {
    window.ErrorRecoveryUIVerification = ErrorRecoveryUIVerification;
    
    // Auto-run after a short delay to ensure all components are loaded
    setTimeout(() => {
        if (window.ErrorRecoveryUI && window.DashboardErrorRecovery && window.LeaderboardErrorRecovery) {
            const verification = new ErrorRecoveryUIVerification();
            verification.runAllTests();
        }
    }, 1000);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRecoveryUIVerification;
}