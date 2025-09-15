/**
 * Keyboard Navigation Testing Suite
 * Comprehensive keyboard accessibility testing
 */

class KeyboardNavigationTester {
    constructor() {
        this.testResults = [];
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
            'audio[controls]',
            'video[controls]',
            'details summary',
            '[role="button"]',
            '[role="link"]',
            '[role="menuitem"]',
            '[role="tab"]'
        ];
        this.currentFocusIndex = -1;
        this.focusableElements = [];
        this.isTestingActive = false;
    }

    /**
     * Run comprehensive keyboard navigation tests
     */
    async runKeyboardTests() {
        console.log('⌨️ Starting keyboard navigation tests...');
        
        const testResults = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            tests: {}
        };

        // Test 1: Focus order and tab sequence
        testResults.tests.focusOrder = await this.testFocusOrder();
        
        // Test 2: Keyboard traps
        testResults.tests.keyboardTraps = await this.testKeyboardTraps();
        
        // Test 3: Skip links functionality
        testResults.tests.skipLinks = await this.testSkipLinks();
        
        // Test 4: Modal focus management
        testResults.tests.modalFocus = await this.testModalFocus();
        
        // Test 5: Custom interactive elements
        testResults.tests.customElements = await this.testCustomInteractiveElements();
        
        // Test 6: Keyboard shortcuts
        testResults.tests.keyboardShortcuts = await this.testKeyboardShortcuts();
        
        // Test 7: Focus visibility
        testResults.tests.focusVisibility = await this.testFocusVisibility();

        this.testResults.push(testResults);
        this.displayKeyboardTestResults(testResults);
        
        return testResults;
    }

    /**
     * Test focus order and tab sequence
     */
    async testFocusOrder() {
        const test = {
            name: 'Focus Order and Tab Sequence',
            status: 'pass',
            issues: [],
            focusableElements: 0,
            tabIndexIssues: 0
        };

        this.focusableElements = Array.from(document.querySelectorAll(this.focusableSelectors.join(', ')));
        test.focusableElements = this.focusableElements.length;

        // Check for positive tabindex values
        this.focusableElements.forEach((element, index) => {
            const tabIndex = parseInt(element.getAttribute('tabindex')) || 0;
            
            if (tabIndex > 0) {
                test.tabIndexIssues++;
                test.status = 'warning';
                test.issues.push({
                    element: this.getElementDescription(element),
                    issue: `Positive tabindex (${tabIndex}) found`,
                    recommendation: 'Use tabindex="0" or rely on natural document order'
                });
            }
        });

        // Check for logical focus order
        const visualOrder = this.getVisualOrder(this.focusableElements);
        const domOrder = this.focusableElements;
        
        for (let i = 0; i < Math.min(visualOrder.length, domOrder.length); i++) {
            if (visualOrder[i] !== domOrder[i]) {
                test.status = 'warning';
                test.issues.push({
                    element: this.getElementDescription(domOrder[i]),
                    issue: 'Focus order may not match visual order',
                    recommendation: 'Ensure tab order follows logical visual flow'
                });
                break; // Only report first mismatch to avoid spam
            }
        }

        return test;
    }

    /**
     * Test for keyboard traps
     */
    async testKeyboardTraps() {
        const test = {
            name: 'Keyboard Traps',
            status: 'pass',
            issues: [],
            modalsFound: 0,
            trapsDetected: 0
        };

        const modals = document.querySelectorAll('.modal, [role="dialog"], [role="alertdialog"]');
        test.modalsFound = modals.length;

        modals.forEach((modal, index) => {
            const isVisible = this.isElementVisible(modal);
            
            if (isVisible) {
                const focusableInModal = modal.querySelectorAll(this.focusableSelectors.join(', '));
                
                if (focusableInModal.length === 0) {
                    test.trapsDetected++;
                    test.status = 'fail';
                    test.issues.push({
                        element: `Modal ${index + 1}`,
                        issue: 'Modal has no focusable elements - potential keyboard trap',
                        recommendation: 'Ensure modals contain focusable elements and proper focus management'
                    });
                }
                
                // Check if modal has close mechanism
                const closeButton = modal.querySelector('[data-bs-dismiss="modal"], .btn-close, .close');
                if (!closeButton) {
                    test.status = 'warning';
                    test.issues.push({
                        element: `Modal ${index + 1}`,
                        issue: 'Modal may lack keyboard-accessible close mechanism',
                        recommendation: 'Provide keyboard-accessible way to close modal (Escape key or close button)'
                    });
                }
            }
        });

        return test;
    }

    /**
     * Test skip links functionality
     */
    async testSkipLinks() {
        const test = {
            name: 'Skip Links',
            status: 'pass',
            issues: [],
            skipLinksFound: 0,
            workingSkipLinks: 0
        };

        const skipLinks = document.querySelectorAll('a[href^="#"]');
        const potentialSkipLinks = Array.from(skipLinks).filter(link => 
            link.textContent.toLowerCase().includes('skip') ||
            link.textContent.toLowerCase().includes('jump') ||
            link.classList.contains('skip-link')
        );

        test.skipLinksFound = potentialSkipLinks.length;

        if (potentialSkipLinks.length === 0) {
            test.status = 'warning';
            test.issues.push({
                element: 'Page',
                issue: 'No skip links found',
                recommendation: 'Add skip links to help keyboard users bypass repetitive content'
            });
        }

        potentialSkipLinks.forEach((link, index) => {
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            
            if (!target) {
                test.status = 'fail';
                test.issues.push({
                    element: `Skip link ${index + 1}`,
                    issue: `Target element with ID "${targetId}" not found`,
                    recommendation: 'Ensure skip link targets exist and have proper IDs'
                });
            } else {
                test.workingSkipLinks++;
                
                // Check if target is focusable
                const isTargetFocusable = target.getAttribute('tabindex') !== null || 
                                        this.focusableSelectors.some(selector => target.matches(selector));
                
                if (!isTargetFocusable) {
                    test.status = 'warning';
                    test.issues.push({
                        element: `Skip link ${index + 1} target`,
                        issue: 'Skip link target may not be focusable',
                        recommendation: 'Add tabindex="-1" to skip link targets to ensure they can receive focus'
                    });
                }
            }
        });

        return test;
    }

    /**
     * Test modal focus management
     */
    async testModalFocus() {
        const test = {
            name: 'Modal Focus Management',
            status: 'pass',
            issues: [],
            modalsFound: 0
        };

        const modals = document.querySelectorAll('.modal, [role="dialog"], [role="alertdialog"]');
        test.modalsFound = modals.length;

        modals.forEach((modal, index) => {
            // Check for proper ARIA attributes
            if (!modal.getAttribute('aria-labelledby') && !modal.getAttribute('aria-label')) {
                test.status = 'warning';
                test.issues.push({
                    element: `Modal ${index + 1}`,
                    issue: 'Modal missing accessible name (aria-labelledby or aria-label)',
                    recommendation: 'Add aria-labelledby pointing to modal title or aria-label'
                });
            }

            // Check for aria-modal attribute
            if (modal.getAttribute('aria-modal') !== 'true') {
                test.status = 'warning';
                test.issues.push({
                    element: `Modal ${index + 1}`,
                    issue: 'Modal missing aria-modal="true" attribute',
                    recommendation: 'Add aria-modal="true" to indicate modal behavior'
                });
            }

            // Check for proper role
            const role = modal.getAttribute('role');
            if (!role || !['dialog', 'alertdialog'].includes(role)) {
                test.status = 'warning';
                test.issues.push({
                    element: `Modal ${index + 1}`,
                    issue: 'Modal missing proper role attribute',
                    recommendation: 'Add role="dialog" or role="alertdialog" to modal'
                });
            }
        });

        return test;
    }

    /**
     * Test custom interactive elements
     */
    async testCustomInteractiveElements() {
        const test = {
            name: 'Custom Interactive Elements',
            status: 'pass',
            issues: [],
            customElementsFound: 0
        };

        // Find elements with click handlers that aren't naturally focusable
        const clickableElements = document.querySelectorAll('[onclick], [data-toggle], [data-bs-toggle]');
        
        clickableElements.forEach((element, index) => {
            const isNativelyFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
            const hasTabIndex = element.hasAttribute('tabindex');
            const hasRole = element.hasAttribute('role');
            
            if (!isNativelyFocusable) {
                test.customElementsFound++;
                
                if (!hasTabIndex || element.getAttribute('tabindex') === '-1') {
                    test.status = 'fail';
                    test.issues.push({
                        element: this.getElementDescription(element),
                        issue: 'Interactive element not keyboard accessible',
                        recommendation: 'Add tabindex="0" to make element focusable'
                    });
                }
                
                if (!hasRole) {
                    test.status = 'warning';
                    test.issues.push({
                        element: this.getElementDescription(element),
                        issue: 'Interactive element missing role attribute',
                        recommendation: 'Add appropriate role (button, link, etc.)'
                    });
                }
                
                // Check for keyboard event handlers
                const hasKeyHandler = element.hasAttribute('onkeydown') || 
                                    element.hasAttribute('onkeyup') || 
                                    element.hasAttribute('onkeypress');
                
                if (!hasKeyHandler) {
                    test.status = 'warning';
                    test.issues.push({
                        element: this.getElementDescription(element),
                        issue: 'Interactive element may lack keyboard event handling',
                        recommendation: 'Add keyboard event handlers (Enter/Space keys)'
                    });
                }
            }
        });

        return test;
    }

    /**
     * Test keyboard shortcuts
     */
    async testKeyboardShortcuts() {
        const test = {
            name: 'Keyboard Shortcuts',
            status: 'pass',
            issues: [],
            shortcutsFound: 0
        };

        // Look for elements with accesskey attributes
        const elementsWithAccessKey = document.querySelectorAll('[accesskey]');
        test.shortcutsFound = elementsWithAccessKey.length;

        elementsWithAccessKey.forEach((element, index) => {
            const accessKey = element.getAttribute('accesskey');
            
            // Check for conflicts with browser shortcuts
            const conflictingKeys = ['f', 'h', 'r', 't', 'n', 'w', 'l', 'd'];
            if (conflictingKeys.includes(accessKey.toLowerCase())) {
                test.status = 'warning';
                test.issues.push({
                    element: this.getElementDescription(element),
                    issue: `Access key "${accessKey}" may conflict with browser shortcuts`,
                    recommendation: 'Use non-conflicting access keys or avoid accesskey attribute'
                });
            }
        });

        return test;
    }

    /**
     * Test focus visibility
     */
    async testFocusVisibility() {
        const test = {
            name: 'Focus Visibility',
            status: 'pass',
            issues: [],
            elementsChecked: 0,
            elementsWithoutIndicator: 0
        };

        // Test a sample of focusable elements
        const sampleElements = this.focusableElements.slice(0, 20); // Test first 20 elements
        test.elementsChecked = sampleElements.length;

        for (const element of sampleElements) {
            try {
                // Temporarily focus the element to check its focus styles
                const originalFocus = document.activeElement;
                element.focus();
                
                await new Promise(resolve => setTimeout(resolve, 50)); // Allow styles to apply
                
                const computedStyle = window.getComputedStyle(element);
                const hasFocusIndicator = this.checkFocusIndicator(computedStyle);
                
                if (!hasFocusIndicator) {
                    test.elementsWithoutIndicator++;
                    test.status = 'warning';
                    test.issues.push({
                        element: this.getElementDescription(element),
                        issue: 'Element may lack visible focus indicator',
                        recommendation: 'Add visible focus styles (outline, box-shadow, border, etc.)'
                    });
                }
                
                // Restore original focus
                if (originalFocus && originalFocus.focus) {
                    originalFocus.focus();
                }
            } catch (error) {
                // Element might not be focusable in current state
                console.warn('Could not test focus for element:', element);
            }
        }

        return test;
    }

    /**
     * Check if element has visible focus indicator
     */
    checkFocusIndicator(computedStyle) {
        // Check outline
        const outlineStyle = computedStyle.getPropertyValue('outline-style');
        const outlineWidth = computedStyle.getPropertyValue('outline-width');
        const outlineColor = computedStyle.getPropertyValue('outline-color');
        
        if (outlineStyle !== 'none' && outlineWidth !== '0px' && outlineColor !== 'transparent') {
            return true;
        }
        
        // Check box-shadow
        const boxShadow = computedStyle.getPropertyValue('box-shadow');
        if (boxShadow && boxShadow !== 'none') {
            return true;
        }
        
        // Check border changes
        const borderWidth = computedStyle.getPropertyValue('border-width');
        const borderStyle = computedStyle.getPropertyValue('border-style');
        const borderColor = computedStyle.getPropertyValue('border-color');
        
        if (borderWidth !== '0px' && borderStyle !== 'none' && borderColor !== 'transparent') {
            return true;
        }
        
        // Check background color changes
        const backgroundColor = computedStyle.getPropertyValue('background-color');
        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
            return true;
        }
        
        return false;
    }

    /**
     * Get visual order of elements (simplified)
     */
    getVisualOrder(elements) {
        return elements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            
            // Sort by top position first, then left position
            if (Math.abs(rectA.top - rectB.top) > 10) {
                return rectA.top - rectB.top;
            }
            return rectA.left - rectB.left;
        });
    }

    /**
     * Check if element is visible
     */
    isElementVisible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0;
    }

    /**
     * Get element description for reporting
     */
    getElementDescription(element) {
        let description = element.tagName.toLowerCase();
        
        if (element.id) {
            description += `#${element.id}`;
        }
        
        if (element.className) {
            description += `.${element.className.split(' ').join('.')}`;
        }
        
        if (element.textContent && element.textContent.trim()) {
            const text = element.textContent.trim().substring(0, 30);
            description += ` ("${text}${element.textContent.length > 30 ? '...' : ''}")`;
        }
        
        return description;
    }

    /**
     * Display keyboard test results
     */
    displayKeyboardTestResults(results) {
        console.group('⌨️ Keyboard Navigation Test Results');
        console.log('Timestamp:', results.timestamp);
        console.log('URL:', results.url);
        
        Object.entries(results.tests).forEach(([testName, testResult]) => {
            const status = testResult.status === 'pass' ? '✅' : 
                          testResult.status === 'warning' ? '⚠️' : '❌';
            
            console.group(`${status} ${testResult.name}`);
            console.log('Status:', testResult.status);
            
            // Display test-specific metrics
            if (testResult.focusableElements !== undefined) {
                console.log('Focusable elements found:', testResult.focusableElements);
            }
            if (testResult.modalsFound !== undefined) {
                console.log('Modals found:', testResult.modalsFound);
            }
            if (testResult.skipLinksFound !== undefined) {
                console.log('Skip links found:', testResult.skipLinksFound);
            }
            
            if (testResult.issues.length > 0) {
                console.group('Issues Found');
                testResult.issues.forEach(issue => {
                    console.group(issue.element);
                    console.log('Issue:', issue.issue);
                    console.log('Recommendation:', issue.recommendation);
                    console.groupEnd();
                });
                console.groupEnd();
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
        
        // Summary
        const totalTests = Object.keys(results.tests).length;
        const passedTests = Object.values(results.tests).filter(test => test.status === 'pass').length;
        const failedTests = Object.values(results.tests).filter(test => test.status === 'fail').length;
        
        console.log(`📊 Keyboard Navigation Summary: ${passedTests}/${totalTests} tests passed`);
        if (failedTests > 0) {
            console.warn(`⚠️ ${failedTests} critical keyboard navigation issues found`);
        }
    }

    /**
     * Start interactive keyboard testing mode
     */
    startInteractiveTest() {
        if (this.isTestingActive) {
            console.log('Interactive testing already active');
            return;
        }
        
        this.isTestingActive = true;
        this.currentFocusIndex = -1;
        this.focusableElements = Array.from(document.querySelectorAll(this.focusableSelectors.join(', ')));
        
        console.log('🎮 Interactive keyboard testing started');
        console.log('Use Tab/Shift+Tab to navigate, or press Ctrl+Alt+K to stop');
        console.log(`Found ${this.focusableElements.length} focusable elements`);
        
        this.addInteractiveTestListeners();
    }

    /**
     * Stop interactive keyboard testing mode
     */
    stopInteractiveTest() {
        this.isTestingActive = false;
        this.removeInteractiveTestListeners();
        console.log('🛑 Interactive keyboard testing stopped');
    }

    /**
     * Add event listeners for interactive testing
     */
    addInteractiveTestListeners() {
        this.interactiveKeyHandler = (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'k') {
                e.preventDefault();
                this.stopInteractiveTest();
                return;
            }
            
            if (e.key === 'Tab') {
                this.logFocusChange(e);
            }
        };
        
        this.interactiveFocusHandler = (e) => {
            this.logElementFocus(e.target);
        };
        
        document.addEventListener('keydown', this.interactiveKeyHandler);
        document.addEventListener('focus', this.interactiveFocusHandler, true);
    }

    /**
     * Remove event listeners for interactive testing
     */
    removeInteractiveTestListeners() {
        if (this.interactiveKeyHandler) {
            document.removeEventListener('keydown', this.interactiveKeyHandler);
        }
        if (this.interactiveFocusHandler) {
            document.removeEventListener('focus', this.interactiveFocusHandler, true);
        }
    }

    /**
     * Log focus changes during interactive testing
     */
    logFocusChange(event) {
        const direction = event.shiftKey ? 'backward' : 'forward';
        console.log(`🔄 Tab navigation (${direction})`);
    }

    /**
     * Log element focus during interactive testing
     */
    logElementFocus(element) {
        const description = this.getElementDescription(element);
        const rect = element.getBoundingClientRect();
        
        console.log(`🎯 Focus: ${description}`);
        console.log(`   Position: ${Math.round(rect.left)}, ${Math.round(rect.top)}`);
        console.log(`   Size: ${Math.round(rect.width)} x ${Math.round(rect.height)}`);
        
        // Check focus visibility
        const computedStyle = window.getComputedStyle(element);
        const hasFocusIndicator = this.checkFocusIndicator(computedStyle);
        
        if (!hasFocusIndicator) {
            console.warn('   ⚠️ No visible focus indicator detected');
        }
    }

    /**
     * Export keyboard test results
     */
    exportResults() {
        if (this.testResults.length === 0) {
            console.warn('No test results available. Run keyboard tests first.');
            return null;
        }
        
        const latestResults = this.testResults[this.testResults.length - 1];
        const dataStr = JSON.stringify(latestResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `keyboard-navigation-test-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        return latestResults;
    }
}

// Initialize keyboard navigation tester when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.keyboardNavigationTester = new KeyboardNavigationTester();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Alt+K for keyboard testing
        if (e.ctrlKey && e.altKey && e.key === 'k') {
            e.preventDefault();
            if (window.keyboardNavigationTester.isTestingActive) {
                window.keyboardNavigationTester.stopInteractiveTest();
            } else {
                window.keyboardNavigationTester.runKeyboardTests();
            }
        }
        
        // Ctrl+Alt+I for interactive testing
        if (e.ctrlKey && e.altKey && e.key === 'i') {
            e.preventDefault();
            window.keyboardNavigationTester.startInteractiveTest();
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyboardNavigationTester;
}