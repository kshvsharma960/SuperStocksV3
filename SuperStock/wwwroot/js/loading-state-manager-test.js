/**
 * Loading State Manager Test Suite
 * Tests for loading state coordination, timeout handling, and progress indication
 */

class LoadingStateManagerTest {
    constructor() {
        this.testResults = [];
        this.manager = window.loadingStateManager;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Loading State Manager Tests...');
        
        const tests = [
            'testBasicLoadingState',
            'testProgressUpdates',
            'testTimeoutHandling',
            'testMultipleComponents',
            'testGlobalLoading',
            'testLoadingCleanup',
            'testRetryFunctionality',
            'testForceCleanup'
        ];

        for (const testName of tests) {
            try {
                await this[testName]();
                this.logResult(testName, 'PASS', 'Test completed successfully');
            } catch (error) {
                this.logResult(testName, 'FAIL', error.message);
                console.error(`❌ ${testName} failed:`, error);
            }
        }

        this.printSummary();
        return this.testResults;
    }

    /**
     * Test basic loading state functionality
     */
    async testBasicLoadingState() {
        console.log('Testing basic loading state...');

        // Create test element
        const testElement = document.createElement('div');
        testElement.id = 'test-component';
        testElement.style.cssText = 'width: 200px; height: 100px; background: #f0f0f0; position: relative;';
        document.body.appendChild(testElement);

        // Start loading
        this.manager.startLoading('test-component', {
            message: 'Testing loading...',
            timeout: 5000
        });

        // Verify loading state
        const loadingState = this.manager.getLoadingState('test-component');
        if (!loadingState || !loadingState.isLoading) {
            throw new Error('Loading state not properly initialized');
        }

        // Verify UI elements
        const overlay = document.querySelector('[data-loading-component="test-component"]');
        if (!overlay) {
            throw new Error('Loading overlay not created');
        }

        // Complete loading
        this.manager.completeLoading('test-component', true);

        // Verify cleanup
        const finalState = this.manager.getLoadingState('test-component');
        if (finalState !== null) {
            throw new Error('Loading state not properly cleaned up');
        }

        // Cleanup test element
        document.body.removeChild(testElement);
    }

    /**
     * Test progress updates
     */
    async testProgressUpdates() {
        console.log('Testing progress updates...');

        // Create test element
        const testElement = document.createElement('div');
        testElement.id = 'progress-test';
        testElement.style.cssText = 'width: 200px; height: 100px; background: #f0f0f0; position: relative;';
        document.body.appendChild(testElement);

        // Start loading
        this.manager.startLoading('progress-test', {
            message: 'Testing progress...'
        });

        // Update progress
        this.manager.updateProgress('progress-test', 25, 'Loading data...');
        await this.sleep(100);

        this.manager.updateProgress('progress-test', 50, 'Processing...');
        await this.sleep(100);

        this.manager.updateProgress('progress-test', 75, 'Almost done...');
        await this.sleep(100);

        this.manager.updateProgress('progress-test', 100, 'Complete!');
        await this.sleep(100);

        // Verify progress state
        const state = this.manager.getLoadingState('progress-test');
        if (state.percentage !== 100) {
            throw new Error(`Expected progress 100%, got ${state.percentage}%`);
        }

        // Complete loading
        this.manager.completeLoading('progress-test', true);

        // Cleanup
        document.body.removeChild(testElement);
    }

    /**
     * Test timeout handling
     */
    async testTimeoutHandling() {
        console.log('Testing timeout handling...');

        let timeoutCalled = false;
        
        // Create test element
        const testElement = document.createElement('div');
        testElement.id = 'timeout-test';
        testElement.style.cssText = 'width: 200px; height: 100px; background: #f0f0f0; position: relative;';
        document.body.appendChild(testElement);

        // Start loading with short timeout
        this.manager.startLoading('timeout-test', {
            message: 'Testing timeout...',
            timeout: 500, // 500ms timeout
            onTimeout: () => {
                timeoutCalled = true;
            }
        });

        // Wait for timeout
        await this.sleep(600);

        // Verify timeout was called
        if (!timeoutCalled) {
            throw new Error('Timeout callback was not called');
        }

        // Verify component is no longer loading
        const state = this.manager.getLoadingState('timeout-test');
        if (state !== null) {
            throw new Error('Component should not be loading after timeout');
        }

        // Cleanup
        document.body.removeChild(testElement);
    }

    /**
     * Test multiple components loading simultaneously
     */
    async testMultipleComponents() {
        console.log('Testing multiple components...');

        // Create test elements
        const elements = [];
        for (let i = 1; i <= 3; i++) {
            const element = document.createElement('div');
            element.id = `multi-test-${i}`;
            element.style.cssText = 'width: 100px; height: 50px; background: #f0f0f0; position: relative; margin: 5px;';
            document.body.appendChild(element);
            elements.push(element);
        }

        // Start loading for all components
        this.manager.startLoading('multi-test-1', { message: 'Loading 1...' });
        this.manager.startLoading('multi-test-2', { message: 'Loading 2...' });
        this.manager.startLoading('multi-test-3', { message: 'Loading 3...' });

        // Verify all are loading
        const activeLoaders = this.manager.getActiveLoaders();
        if (activeLoaders.length !== 3) {
            throw new Error(`Expected 3 active loaders, got ${activeLoaders.length}`);
        }

        // Complete loading for components in different order
        this.manager.completeLoading('multi-test-2', true);
        this.manager.completeLoading('multi-test-1', true);
        this.manager.completeLoading('multi-test-3', true);

        // Verify all completed
        if (this.manager.isAnyLoading()) {
            throw new Error('Components should not be loading after completion');
        }

        // Cleanup
        elements.forEach(element => document.body.removeChild(element));
    }

    /**
     * Test global loading functionality
     */
    async testGlobalLoading() {
        console.log('Testing global loading...');

        // Start global loading
        this.manager.startLoading('global-test', {
            message: 'Global loading test...',
            showGlobal: true
        });

        // Verify global container is visible
        const globalContainer = document.getElementById('global-loading-container');
        if (!globalContainer || globalContainer.style.display === 'none') {
            throw new Error('Global loading container should be visible');
        }

        // Update progress
        this.manager.updateProgress('global-test', 50, 'Global progress...');
        await this.sleep(100);

        // Complete loading
        this.manager.completeLoading('global-test', true);

        // Verify global container is hidden
        if (globalContainer.style.display !== 'none') {
            throw new Error('Global loading container should be hidden after completion');
        }
    }

    /**
     * Test loading cleanup mechanisms
     */
    async testLoadingCleanup() {
        console.log('Testing loading cleanup...');

        // Create test element
        const testElement = document.createElement('div');
        testElement.id = 'cleanup-test';
        testElement.style.cssText = 'width: 200px; height: 100px; background: #f0f0f0; position: relative;';
        document.body.appendChild(testElement);

        // Start multiple loading operations
        this.manager.startLoading('cleanup-test', { message: 'First load...' });
        this.manager.startLoading('cleanup-test', { message: 'Second load...' }); // Should replace first

        // Verify only one loading state exists
        const activeLoaders = this.manager.getActiveLoaders();
        const cleanupTestCount = activeLoaders.filter(loader => loader === 'cleanup-test').length;
        if (cleanupTestCount !== 1) {
            throw new Error(`Expected 1 cleanup-test loader, got ${cleanupTestCount}`);
        }

        // Complete loading
        this.manager.completeLoading('cleanup-test', true);

        // Verify cleanup
        const overlays = document.querySelectorAll('[data-loading-component="cleanup-test"]');
        if (overlays.length > 0) {
            throw new Error('Loading overlays should be cleaned up');
        }

        // Cleanup
        document.body.removeChild(testElement);
    }

    /**
     * Test retry functionality
     */
    async testRetryFunctionality() {
        console.log('Testing retry functionality...');

        let retryEventFired = false;

        // Listen for retry event
        const retryHandler = (event) => {
            if (event.detail.component === 'retry-test') {
                retryEventFired = true;
            }
        };
        document.addEventListener('loadingRetry', retryHandler);

        // Create test element
        const testElement = document.createElement('div');
        testElement.id = 'retry-test';
        testElement.style.cssText = 'width: 200px; height: 100px; background: #f0f0f0; position: relative;';
        document.body.appendChild(testElement);

        // Start loading with timeout
        this.manager.startLoading('retry-test', {
            message: 'Testing retry...',
            timeout: 300
        });

        // Wait for timeout
        await this.sleep(400);

        // Simulate retry click
        this.manager.retryOperation('retry-test');

        // Verify retry event was fired
        if (!retryEventFired) {
            throw new Error('Retry event was not fired');
        }

        // Cleanup
        document.removeEventListener('loadingRetry', retryHandler);
        document.body.removeChild(testElement);
    }

    /**
     * Test force cleanup functionality
     */
    async testForceCleanup() {
        console.log('Testing force cleanup...');

        // Create test elements
        const elements = [];
        for (let i = 1; i <= 2; i++) {
            const element = document.createElement('div');
            element.id = `force-cleanup-${i}`;
            element.style.cssText = 'width: 100px; height: 50px; background: #f0f0f0; position: relative; margin: 5px;';
            document.body.appendChild(element);
            elements.push(element);
        }

        // Start loading for multiple components
        this.manager.startLoading('force-cleanup-1', { message: 'Loading 1...', showGlobal: true });
        this.manager.startLoading('force-cleanup-2', { message: 'Loading 2...' });

        // Verify loading states
        if (!this.manager.isAnyLoading()) {
            throw new Error('Components should be loading before force cleanup');
        }

        // Force cleanup
        this.manager.forceCleanup();

        // Verify all loading states are cleared
        if (this.manager.isAnyLoading()) {
            throw new Error('No components should be loading after force cleanup');
        }

        // Verify global container is hidden
        const globalContainer = document.getElementById('global-loading-container');
        if (globalContainer.style.display !== 'none') {
            throw new Error('Global container should be hidden after force cleanup');
        }

        // Cleanup
        elements.forEach(element => document.body.removeChild(element));
    }

    /**
     * Helper method to sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log test result
     */
    logResult(testName, status, message) {
        const result = {
            test: testName,
            status: status,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const emoji = status === 'PASS' ? '✅' : '❌';
        console.log(`${emoji} ${testName}: ${message}`);
    }

    /**
     * Print test summary
     */
    printSummary() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log('\n📊 Test Summary:');
        console.log(`Total: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️ Some tests failed. Check the results above.');
        }
    }
}

// Export for use in other modules
window.LoadingStateManagerTest = LoadingStateManagerTest;