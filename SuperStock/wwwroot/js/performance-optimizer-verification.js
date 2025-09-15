// Performance Optimizer Fix Verification Script
// This script verifies that the performance optimizer fixes are working correctly

console.log('=== Performance Optimizer Fix Verification ===');

// Test 1: Verify Performance Optimizer is available
function testPerformanceOptimizerAvailability() {
    console.log('\n1. Testing Performance Optimizer Availability...');
    
    if (typeof window !== 'undefined' && window.performanceOptimizer) {
        console.log('✅ Performance Optimizer is available');
        return true;
    } else {
        console.log('❌ Performance Optimizer is not available');
        return false;
    }
}

// Test 2: Verify Safe Method Call functionality
function testSafeMethodCall() {
    console.log('\n2. Testing Safe Method Call...');
    
    if (!window.performanceOptimizer || !window.performanceOptimizer.safeMethodCall) {
        console.log('❌ safeMethodCall method not available');
        return false;
    }
    
    try {
        // Test with valid object and method
        const testObj = { testMethod: () => 'success' };
        const result1 = window.performanceOptimizer.safeMethodCall(testObj, 'testMethod');
        
        if (result1 === 'success') {
            console.log('✅ Safe method call with valid method works');
        } else {
            console.log('❌ Safe method call with valid method failed');
            return false;
        }
        
        // Test with invalid object (should use fallback)
        const result2 = window.performanceOptimizer.safeMethodCall(null, 'testMethod', [], () => 'fallback');
        
        if (result2 === 'fallback') {
            console.log('✅ Safe method call with null object uses fallback correctly');
        } else {
            console.log('❌ Safe method call with null object failed to use fallback');
            return false;
        }
        
        // Test with non-existent method (should use fallback)
        const result3 = window.performanceOptimizer.safeMethodCall({}, 'nonExistentMethod', [], () => 'fallback');
        
        if (result3 === 'fallback') {
            console.log('✅ Safe method call with non-existent method uses fallback correctly');
        } else {
            console.log('❌ Safe method call with non-existent method failed to use fallback');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log('❌ Safe method call test failed with error:', error.message);
        return false;
    }
}

// Test 3: Verify Animation Method Validation
function testAnimationMethodValidation() {
    console.log('\n3. Testing Animation Method Validation...');
    
    if (!window.performanceOptimizer || !window.performanceOptimizer.validateAnimationMethods) {
        console.log('❌ validateAnimationMethods method not available');
        return false;
    }
    
    try {
        // Create a test element
        const testElement = document.createElement('div');
        testElement.style.animation = 'pulse 2s infinite';
        document.body.appendChild(testElement);
        
        const validation = window.performanceOptimizer.validateAnimationMethods(testElement);
        
        if (validation && typeof validation === 'object') {
            console.log('✅ Animation method validation returns object');
            
            if (validation.elementValid === true) {
                console.log('✅ Element validation works correctly');
            } else {
                console.log('❌ Element validation failed');
                return false;
            }
            
            if (typeof validation.hasLottieAnimation === 'boolean' &&
                typeof validation.hasCSSAnimations === 'boolean' &&
                typeof validation.hasChartAnimations === 'boolean') {
                console.log('✅ Animation type detection properties are present');
            } else {
                console.log('❌ Animation type detection properties are missing');
                return false;
            }
        } else {
            console.log('❌ Animation method validation failed to return object');
            return false;
        }
        
        // Test with null element
        const nullValidation = window.performanceOptimizer.validateAnimationMethods(null);
        if (nullValidation && nullValidation.elementValid === false) {
            console.log('✅ Null element validation handled correctly');
        } else {
            console.log('❌ Null element validation not handled correctly');
            return false;
        }
        
        // Cleanup
        document.body.removeChild(testElement);
        return true;
    } catch (error) {
        console.log('❌ Animation method validation test failed with error:', error.message);
        return false;
    }
}

// Test 4: Verify Animation Control Methods
function testAnimationControl() {
    console.log('\n4. Testing Animation Control Methods...');
    
    if (!window.performanceOptimizer || 
        !window.performanceOptimizer.pauseElementAnimations ||
        !window.performanceOptimizer.resumeElementAnimations) {
        console.log('❌ Animation control methods not available');
        return false;
    }
    
    try {
        // Create a test element
        const testElement = document.createElement('div');
        testElement.style.animation = 'pulse 2s infinite';
        document.body.appendChild(testElement);
        
        // Test pause
        window.performanceOptimizer.pauseElementAnimations(testElement);
        
        if (testElement.dataset.animationsPaused === 'true') {
            console.log('✅ Pause element animations works correctly');
        } else {
            console.log('❌ Pause element animations failed to set flag');
            return false;
        }
        
        // Test resume
        window.performanceOptimizer.resumeElementAnimations(testElement);
        
        if (!testElement.dataset.animationsPaused) {
            console.log('✅ Resume element animations works correctly');
        } else {
            console.log('❌ Resume element animations failed to clear flag');
            return false;
        }
        
        // Test with null element (should not throw error)
        window.performanceOptimizer.pauseElementAnimations(null);
        window.performanceOptimizer.resumeElementAnimations(null);
        console.log('✅ Animation control methods handle null elements gracefully');
        
        // Cleanup
        document.body.removeChild(testElement);
        return true;
    } catch (error) {
        console.log('❌ Animation control test failed with error:', error.message);
        return false;
    }
}

// Test 5: Verify Fallback Behavior
function testFallbackBehavior() {
    console.log('\n5. Testing Fallback Behavior...');
    
    if (!window.performanceOptimizer || !window.performanceOptimizer.provideFallback) {
        console.log('❌ provideFallback method not available');
        return false;
    }
    
    try {
        // Create a test element
        const testElement = document.createElement('div');
        document.body.appendChild(testElement);
        
        // Test pause fallback
        window.performanceOptimizer.provideFallback(testElement, 'pause');
        
        const isPaused = testElement.style.visibility === 'hidden' || 
                        testElement.classList.contains('animation-paused') ||
                        testElement.classList.contains('visually-hidden');
        
        if (isPaused) {
            console.log('✅ Pause fallback behavior works correctly');
        } else {
            console.log('❌ Pause fallback behavior failed');
            return false;
        }
        
        // Test resume fallback
        window.performanceOptimizer.provideFallback(testElement, 'resume');
        
        const isResumed = testElement.style.visibility !== 'hidden' && 
                         !testElement.classList.contains('animation-paused') &&
                         !testElement.classList.contains('visually-hidden');
        
        if (isResumed) {
            console.log('✅ Resume fallback behavior works correctly');
        } else {
            console.log('❌ Resume fallback behavior failed');
            return false;
        }
        
        // Test with null element (should not throw error)
        window.performanceOptimizer.provideFallback(null, 'pause');
        console.log('✅ Fallback behavior handles null elements gracefully');
        
        // Cleanup
        document.body.removeChild(testElement);
        return true;
    } catch (error) {
        console.log('❌ Fallback behavior test failed with error:', error.message);
        return false;
    }
}

// Test 6: Verify Error Handling
function testErrorHandling() {
    console.log('\n6. Testing Error Handling...');
    
    try {
        // Test various error scenarios that should be handled gracefully
        
        // Invalid method calls
        window.performanceOptimizer.safeMethodCall(undefined, 'test');
        window.performanceOptimizer.safeMethodCall({}, '');
        window.performanceOptimizer.safeMethodCall({}, 'test', 'invalid-args');
        
        // Invalid animation operations
        window.performanceOptimizer.pauseElementAnimations(undefined);
        window.performanceOptimizer.resumeElementAnimations({});
        window.performanceOptimizer.validateAnimationMethods('invalid');
        
        // Invalid fallback operations
        window.performanceOptimizer.provideFallback(null, 'invalid');
        window.performanceOptimizer.provideFallback({}, 'pause');
        
        console.log('✅ Error handling works correctly - no exceptions thrown');
        return true;
    } catch (error) {
        console.log('❌ Error handling failed - exception thrown:', error.message);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('Starting Performance Optimizer Fix Verification Tests...\n');
    
    const tests = [
        testPerformanceOptimizerAvailability,
        testSafeMethodCall,
        testAnimationMethodValidation,
        testAnimationControl,
        testFallbackBehavior,
        testErrorHandling
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    tests.forEach((test, index) => {
        try {
            if (test()) {
                passedTests++;
            }
        } catch (error) {
            console.log(`❌ Test ${index + 1} failed with exception:`, error.message);
        }
    });
    
    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Performance Optimizer fixes are working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please review the implementation.');
    }
    
    return passedTests === totalTests;
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testPerformanceOptimizerAvailability,
        testSafeMethodCall,
        testAnimationMethodValidation,
        testAnimationControl,
        testFallbackBehavior,
        testErrorHandling
    };
}

// Auto-run tests if in browser environment
if (typeof window !== 'undefined') {
    // Wait for DOM and performance optimizer to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runAllTests, 100); // Small delay to ensure performance optimizer is initialized
        });
    } else {
        setTimeout(runAllTests, 100);
    }
}