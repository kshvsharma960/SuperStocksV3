/**
 * Accessibility Testing Suite
 * Automated accessibility testing with axe-core and manual testing helpers
 */

class AccessibilityTesting {
    constructor() {
        this.testResults = [];
        this.isAxeLoaded = false;
        this.loadAxeCore();
    }

    /**
     * Load axe-core library for automated testing
     */
    async loadAxeCore() {
        try {
            // Check if axe is already loaded
            if (typeof axe !== 'undefined') {
                this.isAxeLoaded = true;
                return;
            }

            // Load axe-core from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.8.2/axe.min.js';
            script.onload = () => {
                this.isAxeLoaded = true;
                console.log('axe-core loaded successfully');
            };
            script.onerror = () => {
                console.warn('Failed to load axe-core from CDN');
                this.isAxeLoaded = false;
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error loading axe-core:', error);
            this.isAxeLoaded = false;
        }
    }

    /**
     * Run comprehensive accessibility audit
     */
    async runFullAudit() {
        console.log('🔍 Starting comprehensive accessibility audit...');
        
        const results = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            tests: {}
        };

        // Run automated tests with axe-core
        if (this.isAxeLoaded && typeof axe !== 'undefined') {
            results.tests.automated = await this.runAxeTests();
        } else {
            results.tests.automated = { error: 'axe-core not available' };
        }

        // Run manual validation tests
        results.tests.manual = this.runManualTests();
        
        // Run keyboard navigation tests
        results.tests.keyboard = this.testKeyboardNavigation();
        
        // Run color contrast tests
        results.tests.colorContrast = this.testColorContrast();
        
        // Run screen reader compatibility tests
        results.tests.screenReader = this.testScreenReaderCompatibility();

        this.testResults.push(results);
        this.displayResults(results);
        
        return results;
    }

    /**
     * Run automated accessibility tests using axe-core
     */
    async runAxeTests() {
        if (!this.isAxeLoaded || typeof axe === 'undefined') {
            return { error: 'axe-core not loaded' };
        }

        try {
            const results = await axe.run(document, {
                rules: {
                    // Enable all rules
                    'color-contrast': { enabled: true },
                    'keyboard-navigation': { enabled: true },
                    'focus-order-semantics': { enabled: true },
                    'aria-valid-attr': { enabled: true },
                    'aria-valid-attr-value': { enabled: true },
                    'aria-labelledby': { enabled: true },
                    'aria-describedby': { enabled: true },
                    'button-name': { enabled: true },
                    'form-field-multiple-labels': { enabled: true },
                    'heading-order': { enabled: true },
                    'image-alt': { enabled: true },
                    'input-image-alt': { enabled: true },
                    'label': { enabled: true },
                    'link-name': { enabled: true },
                    'list': { enabled: true },
                    'listitem': { enabled: true },
                    'meta-viewport': { enabled: true },
                    'region': { enabled: true },
                    'skip-link': { enabled: true },
                    'tabindex': { enabled: true }
                }
            });

            return {
                violations: results.violations.map(violation => ({
                    id: violation.id,
                    impact: violation.impact,
                    description: violation.description,
                    help: violation.help,
                    helpUrl: violation.helpUrl,
                    nodes: violation.nodes.length,
                    elements: violation.nodes.map(node => ({
                        target: node.target,
                        html: node.html.substring(0, 200) + (node.html.length > 200 ? '...' : ''),
                        failureSummary: node.failureSummary
                    }))
                })),
                passes: results.passes.length,
                incomplete: results.incomplete.length,
                inapplicable: results.inapplicable.length
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Run manual accessibility validation tests
     */
    runManualTests() {
        const tests = [];

        // Test 1: Check for missing alt text on images
        tests.push(this.testImageAltText());
        
        // Test 2: Check form labels
        tests.push(this.testFormLabels());
        
        // Test 3: Check heading structure
        tests.push(this.testHeadingStructure());
        
        // Test 4: Check ARIA attributes
        tests.push(this.testAriaAttributes());
        
        // Test 5: Check semantic HTML
        tests.push(this.testSemanticHTML());
        
        // Test 6: Check focus indicators
        tests.push(this.testFocusIndicators());

        return tests;
    }

    /**
     * Test image alt text
     */
    testImageAltText() {
        const images = document.querySelectorAll('img');
        const issues = [];
        
        images.forEach((img, index) => {
            if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
                // Check if image is decorative
                if (!img.getAttribute('role') || img.getAttribute('role') !== 'presentation') {
                    issues.push({
                        element: img,
                        message: `Image ${index + 1} missing alt text`,
                        severity: 'error'
                    });
                }
            }
        });

        return {
            name: 'Image Alt Text',
            passed: issues.length === 0,
            issues: issues,
            total: images.length
        };
    }

    /**
     * Test form labels
     */
    testFormLabels() {
        const inputs = document.querySelectorAll('input, select, textarea');
        const issues = [];
        
        inputs.forEach((input, index) => {
            const hasLabel = input.getAttribute('aria-label') || 
                           input.getAttribute('aria-labelledby') || 
                           document.querySelector(`label[for="${input.id}"]`);
            
            if (!hasLabel && input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
                issues.push({
                    element: input,
                    message: `Form input ${index + 1} missing label`,
                    severity: 'error'
                });
            }
        });

        return {
            name: 'Form Labels',
            passed: issues.length === 0,
            issues: issues,
            total: inputs.length
        };
    }

    /**
     * Test heading structure
     */
    testHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const issues = [];
        let previousLevel = 0;
        
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            
            if (level > previousLevel + 1) {
                issues.push({
                    element: heading,
                    message: `Heading level skipped at heading ${index + 1} (${heading.tagName})`,
                    severity: 'warning'
                });
            }
            
            previousLevel = level;
        });

        return {
            name: 'Heading Structure',
            passed: issues.length === 0,
            issues: issues,
            total: headings.length
        };
    }

    /**
     * Test ARIA attributes
     */
    testAriaAttributes() {
        const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
        const issues = [];
        
        elementsWithAria.forEach((element, index) => {
            const labelledBy = element.getAttribute('aria-labelledby');
            const describedBy = element.getAttribute('aria-describedby');
            
            if (labelledBy && !document.getElementById(labelledBy)) {
                issues.push({
                    element: element,
                    message: `Element ${index + 1} references non-existent aria-labelledby ID: ${labelledBy}`,
                    severity: 'error'
                });
            }
            
            if (describedBy && !document.getElementById(describedBy)) {
                issues.push({
                    element: element,
                    message: `Element ${index + 1} references non-existent aria-describedby ID: ${describedBy}`,
                    severity: 'error'
                });
            }
        });

        return {
            name: 'ARIA Attributes',
            passed: issues.length === 0,
            issues: issues,
            total: elementsWithAria.length
        };
    }

    /**
     * Test semantic HTML
     */
    testSemanticHTML() {
        const issues = [];
        
        // Check for main landmark
        const main = document.querySelector('main, [role="main"]');
        if (!main) {
            issues.push({
                element: document.body,
                message: 'Page missing main landmark',
                severity: 'error'
            });
        }
        
        // Check for navigation landmarks
        const nav = document.querySelector('nav, [role="navigation"]');
        if (!nav) {
            issues.push({
                element: document.body,
                message: 'Page missing navigation landmark',
                severity: 'warning'
            });
        }
        
        // Check for proper button usage
        const divButtons = document.querySelectorAll('div[onclick], span[onclick]');
        divButtons.forEach((element, index) => {
            if (!element.getAttribute('role') || element.getAttribute('role') !== 'button') {
                issues.push({
                    element: element,
                    message: `Element ${index + 1} acts as button but lacks proper semantics`,
                    severity: 'warning'
                });
            }
        });

        return {
            name: 'Semantic HTML',
            passed: issues.length === 0,
            issues: issues,
            total: divButtons.length + 2 // +2 for main and nav checks
        };
    }

    /**
     * Test focus indicators
     */
    testFocusIndicators() {
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const issues = [];
        
        // This is a simplified test - in practice, you'd need to actually focus elements and check computed styles
        focusableElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element, ':focus');
            const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px';
            const hasBoxShadow = computedStyle.boxShadow !== 'none';
            
            if (!hasOutline && !hasBoxShadow) {
                // This is a basic check - more sophisticated testing would be needed
                issues.push({
                    element: element,
                    message: `Element ${index + 1} may lack visible focus indicator`,
                    severity: 'warning'
                });
            }
        });

        return {
            name: 'Focus Indicators',
            passed: issues.length === 0,
            issues: issues,
            total: focusableElements.length
        };
    }

    /**
     * Test keyboard navigation
     */
    testKeyboardNavigation() {
        const tests = [];
        
        // Test tab order
        tests.push(this.testTabOrder());
        
        // Test keyboard traps
        tests.push(this.testKeyboardTraps());
        
        // Test skip links
        tests.push(this.testSkipLinks());

        return tests;
    }

    /**
     * Test tab order
     */
    testTabOrder() {
        const focusableElements = Array.from(document.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        
        const issues = [];
        let previousTabIndex = -1;
        
        focusableElements.forEach((element, index) => {
            const tabIndex = parseInt(element.getAttribute('tabindex')) || 0;
            
            if (tabIndex > 0 && tabIndex < previousTabIndex) {
                issues.push({
                    element: element,
                    message: `Element ${index + 1} has out-of-order tabindex: ${tabIndex}`,
                    severity: 'warning'
                });
            }
            
            if (tabIndex > 0) {
                previousTabIndex = tabIndex;
            }
        });

        return {
            name: 'Tab Order',
            passed: issues.length === 0,
            issues: issues,
            total: focusableElements.length
        };
    }

    /**
     * Test keyboard traps
     */
    testKeyboardTraps() {
        const modals = document.querySelectorAll('.modal, [role="dialog"]');
        const issues = [];
        
        modals.forEach((modal, index) => {
            const focusableElements = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            
            if (focusableElements.length === 0) {
                issues.push({
                    element: modal,
                    message: `Modal ${index + 1} has no focusable elements`,
                    severity: 'error'
                });
            }
        });

        return {
            name: 'Keyboard Traps',
            passed: issues.length === 0,
            issues: issues,
            total: modals.length
        };
    }

    /**
     * Test skip links
     */
    testSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-link, a[href^="#"]:first-child');
        const issues = [];
        
        if (skipLinks.length === 0) {
            issues.push({
                element: document.body,
                message: 'Page missing skip links for keyboard navigation',
                severity: 'warning'
            });
        }

        return {
            name: 'Skip Links',
            passed: issues.length === 0,
            issues: issues,
            total: skipLinks.length
        };
    }

    /**
     * Test color contrast
     */
    testColorContrast() {
        const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, label, li');
        const issues = [];
        
        textElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;
            
            // This is a simplified check - proper contrast testing requires more sophisticated color analysis
            if (color === backgroundColor) {
                issues.push({
                    element: element,
                    message: `Element ${index + 1} may have insufficient color contrast`,
                    severity: 'warning'
                });
            }
        });

        return [{
            name: 'Color Contrast',
            passed: issues.length === 0,
            issues: issues,
            total: textElements.length
        }];
    }

    /**
     * Test screen reader compatibility
     */
    testScreenReaderCompatibility() {
        const tests = [];
        
        // Test ARIA live regions
        tests.push(this.testAriaLiveRegions());
        
        // Test landmark regions
        tests.push(this.testLandmarkRegions());
        
        // Test table accessibility
        tests.push(this.testTableAccessibility());

        return tests;
    }

    /**
     * Test ARIA live regions
     */
    testAriaLiveRegions() {
        const liveRegions = document.querySelectorAll('[aria-live]');
        const issues = [];
        
        // Check if essential live regions exist
        const politeRegion = document.getElementById('aria-live-polite');
        const assertiveRegion = document.getElementById('aria-live-assertive');
        
        if (!politeRegion) {
            issues.push({
                element: document.body,
                message: 'Missing polite ARIA live region for announcements',
                severity: 'warning'
            });
        }
        
        if (!assertiveRegion) {
            issues.push({
                element: document.body,
                message: 'Missing assertive ARIA live region for urgent announcements',
                severity: 'warning'
            });
        }

        return {
            name: 'ARIA Live Regions',
            passed: issues.length === 0,
            issues: issues,
            total: liveRegions.length + 2
        };
    }

    /**
     * Test landmark regions
     */
    testLandmarkRegions() {
        const landmarks = {
            main: document.querySelector('main, [role="main"]'),
            navigation: document.querySelector('nav, [role="navigation"]'),
            banner: document.querySelector('header, [role="banner"]'),
            contentinfo: document.querySelector('footer, [role="contentinfo"]')
        };
        
        const issues = [];
        
        Object.entries(landmarks).forEach(([landmark, element]) => {
            if (!element) {
                issues.push({
                    element: document.body,
                    message: `Missing ${landmark} landmark`,
                    severity: landmark === 'main' ? 'error' : 'warning'
                });
            }
        });

        return {
            name: 'Landmark Regions',
            passed: issues.length === 0,
            issues: issues,
            total: Object.keys(landmarks).length
        };
    }

    /**
     * Test table accessibility
     */
    testTableAccessibility() {
        const tables = document.querySelectorAll('table');
        const issues = [];
        
        tables.forEach((table, index) => {
            // Check for caption or aria-label
            const hasCaption = table.querySelector('caption') || table.getAttribute('aria-label');
            if (!hasCaption) {
                issues.push({
                    element: table,
                    message: `Table ${index + 1} missing caption or aria-label`,
                    severity: 'warning'
                });
            }
            
            // Check for proper header structure
            const headers = table.querySelectorAll('th');
            headers.forEach((header, headerIndex) => {
                if (!header.getAttribute('scope')) {
                    issues.push({
                        element: header,
                        message: `Table ${index + 1} header ${headerIndex + 1} missing scope attribute`,
                        severity: 'warning'
                    });
                }
            });
        });

        return {
            name: 'Table Accessibility',
            passed: issues.length === 0,
            issues: issues,
            total: tables.length
        };
    }

    /**
     * Display test results in console and optionally in UI
     */
    displayResults(results) {
        console.group('🔍 Accessibility Audit Results');
        console.log('Timestamp:', results.timestamp);
        console.log('URL:', results.url);
        
        // Display automated test results
        if (results.tests.automated && !results.tests.automated.error) {
            console.group('🤖 Automated Tests (axe-core)');
            console.log('Violations:', results.tests.automated.violations.length);
            console.log('Passes:', results.tests.automated.passes);
            console.log('Incomplete:', results.tests.automated.incomplete);
            
            if (results.tests.automated.violations.length > 0) {
                console.group('❌ Violations');
                results.tests.automated.violations.forEach(violation => {
                    console.group(`${violation.impact?.toUpperCase() || 'UNKNOWN'}: ${violation.id}`);
                    console.log('Description:', violation.description);
                    console.log('Help:', violation.help);
                    console.log('Elements affected:', violation.nodes);
                    console.log('More info:', violation.helpUrl);
                    console.groupEnd();
                });
                console.groupEnd();
            }
            console.groupEnd();
        }
        
        // Display manual test results
        console.group('👤 Manual Tests');
        results.tests.manual.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.group(`${status} ${test.name}`);
            console.log('Passed:', test.passed);
            console.log('Total elements checked:', test.total);
            if (test.issues.length > 0) {
                console.log('Issues found:', test.issues.length);
                test.issues.forEach(issue => {
                    console.log(`${issue.severity?.toUpperCase()}: ${issue.message}`);
                });
            }
            console.groupEnd();
        });
        console.groupEnd();
        
        // Display keyboard navigation results
        console.group('⌨️ Keyboard Navigation Tests');
        results.tests.keyboard.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.group(`${status} ${test.name}`);
            console.log('Passed:', test.passed);
            if (test.issues.length > 0) {
                test.issues.forEach(issue => {
                    console.log(`${issue.severity?.toUpperCase()}: ${issue.message}`);
                });
            }
            console.groupEnd();
        });
        console.groupEnd();
        
        console.groupEnd();
        
        // Create summary
        const totalViolations = (results.tests.automated?.violations?.length || 0) +
                              results.tests.manual.reduce((sum, test) => sum + test.issues.length, 0) +
                              results.tests.keyboard.reduce((sum, test) => sum + test.issues.length, 0);
        
        if (totalViolations === 0) {
            console.log('🎉 No accessibility issues found!');
        } else {
            console.warn(`⚠️ Found ${totalViolations} accessibility issues that need attention.`);
        }
    }

    /**
     * Generate accessibility report
     */
    generateReport() {
        if (this.testResults.length === 0) {
            console.warn('No test results available. Run an audit first.');
            return null;
        }
        
        const latestResults = this.testResults[this.testResults.length - 1];
        
        const report = {
            summary: {
                timestamp: latestResults.timestamp,
                url: latestResults.url,
                totalIssues: 0,
                criticalIssues: 0,
                warningIssues: 0
            },
            details: latestResults.tests
        };
        
        // Calculate issue counts
        if (latestResults.tests.automated && latestResults.tests.automated.violations) {
            latestResults.tests.automated.violations.forEach(violation => {
                report.summary.totalIssues++;
                if (violation.impact === 'critical' || violation.impact === 'serious') {
                    report.summary.criticalIssues++;
                } else {
                    report.summary.warningIssues++;
                }
            });
        }
        
        latestResults.tests.manual.forEach(test => {
            test.issues.forEach(issue => {
                report.summary.totalIssues++;
                if (issue.severity === 'error') {
                    report.summary.criticalIssues++;
                } else {
                    report.summary.warningIssues++;
                }
            });
        });
        
        return report;
    }

    /**
     * Export results as JSON
     */
    exportResults() {
        const report = this.generateReport();
        if (!report) return;
        
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize accessibility testing when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityTesting = new AccessibilityTesting();
    
    // Add keyboard shortcut for quick testing (Ctrl+Alt+A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            window.accessibilityTesting.runFullAudit();
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityTesting;
}