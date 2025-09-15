// Test script to verify performance optimizer fixes
console.log('Testing Performance Optimizer fixes...');

// Create a test element
const testElement = document.createElement('div');
testElement.className = 'test-element';
testElement.style.display = 'block';
document.body.appendChild(testElement);

// Create a mock Lottie animation
testElement.lottieAnimation = {
    pause: function() { console.log('Mock Lottie pause called'); },
    play: function() { console.log('Mock Lottie play called'); },
    destroy: function() { console.log('Mock Lottie destroy called'); }
};

// Test the performance optimizer
if (window.PerformanceOptimizer) {
    const optimizer = new PerformanceOptimizer();
    
    console.log('✓ PerformanceOptimizer class exists');
    
    // Test method existence
    if (typeof optimizer.pauseElementAnimations === 'function') {
        console.log('✓ pauseElementAnimations method exists');
    } else {
        console.error('✗ pauseElementAnimations method missing');
    }
    
    if (typeof optimizer.resumeElementAnimations === 'function') {
        console.log('✓ resumeElementAnimations method exists');
    } else {
        console.error('✗ resumeElementAnimations method missing');
    }
    
    if (typeof optimizer.safeMethodCall === 'function') {
        console.log('✓ safeMethodCall method exists');
    } else {
        console.error('✗ safeMethodCall method missing');
    }
    
    if (typeof optimizer.validateAnimationMethods === 'function') {
        console.log('✓ validateAnimationMethods method exists');
    } else {
        console.error('✗ validateAnimationMethods method missing');
    }
    
    // Test the methods
    try {
        console.log('Testing pauseElementAnimations...');
        optimizer.pauseElementAnimations(testElement);
        console.log('✓ pauseElementAnimations executed without error');
        
        console.log('Testing resumeElementAnimations...');
        optimizer.resumeElementAnimations(testElement);
        console.log('✓ resumeElementAnimations executed without error');
        
        console.log('Testing safeMethodCall...');
        const result = optimizer.safeMethodCall(testElement.lottieAnimation, 'pause');
        console.log('✓ safeMethodCall executed without error');
        
        console.log('Testing validateAnimationMethods...');
        const validation = optimizer.validateAnimationMethods(testElement);
        console.log('✓ validateAnimationMethods executed without error');
        console.log('Validation result:', validation);
        
        console.log('Testing processModifiedElement...');
        testElement.style.display = 'none';
        optimizer.processModifiedElement(testElement);
        testElement.style.display = 'block';
        optimizer.processModifiedElement(testElement);
        console.log('✓ processModifiedElement executed without error');
        
    } catch (error) {
        console.error('✗ Error during method testing:', error);
    }
    
} else {
    console.error('✗ PerformanceOptimizer class not found');
}

// Cleanup
document.body.removeChild(testElement);
console.log('Performance Optimizer test completed');