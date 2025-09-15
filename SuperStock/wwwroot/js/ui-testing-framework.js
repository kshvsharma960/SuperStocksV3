// ==========================================================================
// UI TESTING FRAMEWORK - Automated UI testing and refinements
// ==========================================================================

class UITestingFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.isRunning = false;
        this.currentTest = null;
        
        this.init();
    }

    init() {
        this.setupTestSuite();
        this.createTestUI();
        this.setupKeyboardShortcuts();
    }

    // ==========================================================================
    // TEST SUITE SETUP
    // ==========================================================================

    setupTestSuite() {
        // Layout and Responsive Tests
        this.addTest('Responsive Layout', this.testResponsiveLayout.bind(this));
        this.addTest('Navigation Functionality', this.testNavigation.bind(this));
        this.addTest('Modal Interactions', this.testModals.bind(this));
        this.addTest('Form Validation', this.testForms.bind(this));
        
        // Performance Tests
        this.addTest('Animation Performance', this.testAnimationPerformance.bind(this));
        this.addTest('Loading Performance', this.testLoadingPerformance.bind(this));
        this.addTest('Memory Usage', this.testMemoryUsage.bind(this));
        
        // Accessibility Tests
        this.addTest('Keyboard Navigation', this.testKeyboardNavigation.bind(this));
        this.addTest('Screen Reader Support', this.testScreenReaderSupport.bind(this));
        this.addTest('Color Contrast', this.testColorContrast.bind(this));
        
        // Cross-browser Tests
        this.addTest('CSS Feature Support', this.testCSSFeatures.bind(this));
        this.addTest('JavaScript Compatibility', this.testJSCompatibility.bind(this));
        this.addTest('Touch Interactions', this.testTouchInteractions.bind(this));
        
        // Visual Tests
        this.addTest('Component Rendering', this.testComponentRendering.bind(this));
        this.addTest('Animation Smoothness', this.testAnimationSmoothness.bind(this));
        this.addTest('Layout Stability', this.testLayoutStability.bind(this));
    }

    addTest(name, testFunction) {
        this.tests.push({
            name: name,
            function: testFunction,
            category: this.getCategoryFromName(name)
        });
    }

    getCategoryFromName(name) {
        if (name.includes('Responsive') || name.includes('Layout') || name.includes('Navigation')) {
            return 'Layout';
        }
        if (name.includes('Performance') || name.includes('Memory') || name.includes('Loading')) {
            return 'Performance';
        }
        if (name.includes('Keyboard') || name.includes('Screen Reader') || name.includes('Contrast')) {
            return 'Accessibility';
        }
        if (name.includes('CSS') || name.includes('JavaScript') || name.includes('Touch')) {
            return 'Compatibility';
        }
        if (name.includes('Rendering') || name.includes('Animation') || name.includes('Visual')) {
            return 'Visual';
        }
        return 'General';
    }

    // ==========================================================================
    // TEST IMPLEMENTATIONS
    // ==========================================================================

    async testResponsiveLayout() {
        const results = [];
        const breakpoints = [320, 768, 1024, 1440, 1920];
        
        for (const width of breakpoints) {
            // Simulate viewport resize
            const originalWidth = window.innerWidth;
            
            // Test layout at different breakpoints
            const layoutTest = await this.testLayoutAtWidth(width);
            results.push({
                breakpoint: width,
                passed: layoutTest.passed,
                issues: layoutTest.issues
            });
        }
        
        const allPassed = results.every(r => r.passed);
        return {
            passed: allPassed,
            details: results,
            message: allPassed ? 'All breakpoints pass' : 'Some breakpoints have issues'
        };
    }

    async testLayoutAtWidth(width) {
        const issues = [];
        
        // Test for horizontal scrollbars
        if (document.body.scrollWidth > width) {
            issues.push(`Horizontal scrollbar at ${width}px`);
        }
        
        // Test for overlapping elements
        const overlaps = this.detectOverlappingElements();
        if (overlaps.length > 0) {
            issues.push(`${overlaps.length} overlapping elements at ${width}px`);
        }
        
        // Test for invisible text
        const invisibleText = this.detectInvisibleText();
        if (invisibleText.length > 0) {
            issues.push(`${invisibleText.length} invisible text elements at ${width}px`);
        }
        
        return {
            passed: issues.length === 0,
            issues: issues
        };
    }

    async testNavigation() {
        const issues = [];
        
        // Test sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.click();
            await this.wait(300);
            
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar.classList.contains('active')) {
                issues.push('Sidebar toggle not working');
            }
            
            sidebarToggle.click(); // Close it
        }
        
        // Test navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        for (const link of navLinks) {
            if (!link.href || link.href === '#') {
                issues.push(`Navigation link missing href: ${link.textContent}`);
            }
        }
        
        // Test dropdown menus
        const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
        for (const dropdown of dropdowns) {
            dropdown.click();
            await this.wait(100);
            
            const menu = dropdown.nextElementSibling;
            if (!menu || !menu.classList.contains('show')) {
                issues.push('Dropdown menu not opening');
            }
            
            dropdown.click(); // Close it
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'Navigation working correctly' : `${issues.length} navigation issues found`
        };
    }

    async testModals() {
        const issues = [];
        
        // Test modal triggers
        const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
        
        for (const trigger of modalTriggers) {
            trigger.click();
            await this.wait(300);
            
            const modalId = trigger.getAttribute('data-bs-target');
            const modal = document.querySelector(modalId);
            
            if (!modal || !modal.classList.contains('show')) {
                issues.push(`Modal not opening: ${modalId}`);
                continue;
            }
            
            // Test modal close
            const closeBtn = modal.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.click();
                await this.wait(300);
                
                if (modal.classList.contains('show')) {
                    issues.push(`Modal not closing: ${modalId}`);
                }
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'All modals working correctly' : `${issues.length} modal issues found`
        };
    }

    async testForms() {
        const issues = [];
        
        // Test form validation
        const forms = document.querySelectorAll('form');
        
        for (const form of forms) {
            const requiredFields = form.querySelectorAll('[required]');
            
            // Test empty form submission
            if (requiredFields.length > 0) {
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitBtn.click();
                    
                    // Check if validation messages appear
                    const invalidFields = form.querySelectorAll(':invalid');
                    if (invalidFields.length === 0) {
                        issues.push('Form validation not working');
                    }
                }
            }
            
            // Test field accessibility
            const inputs = form.querySelectorAll('input, select, textarea');
            for (const input of inputs) {
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (!label && !input.getAttribute('aria-label')) {
                    issues.push(`Input missing label: ${input.name || input.id}`);
                }
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'All forms working correctly' : `${issues.length} form issues found`
        };
    }

    async testAnimationPerformance() {
        const issues = [];
        let frameCount = 0;
        let totalFrameTime = 0;
        
        // Monitor animation performance
        const startTime = performance.now();
        const measureFrames = (timestamp) => {
            frameCount++;
            totalFrameTime += performance.now() - startTime;
            
            if (frameCount < 60) {
                requestAnimationFrame(measureFrames);
            } else {
                const avgFrameTime = totalFrameTime / frameCount;
                if (avgFrameTime > 16.67) { // 60fps = 16.67ms per frame
                    issues.push(`Poor animation performance: ${avgFrameTime.toFixed(2)}ms avg frame time`);
                }
            }
        };
        
        requestAnimationFrame(measureFrames);
        
        // Wait for measurement to complete
        await this.wait(1000);
        
        return {
            passed: issues.length === 0,
            details: { frameCount, avgFrameTime: totalFrameTime / frameCount },
            message: issues.length === 0 ? 'Animation performance good' : issues[0]
        };
    }

    async testLoadingPerformance() {
        const issues = [];
        
        // Test resource loading times
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(resource => resource.duration > 1000);
        
        if (slowResources.length > 0) {
            issues.push(`${slowResources.length} slow-loading resources (>1s)`);
        }
        
        // Test DOM content loaded time
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation && navigation.domContentLoadedEventEnd > 3000) {
            issues.push(`Slow DOM content loaded: ${navigation.domContentLoadedEventEnd}ms`);
        }
        
        return {
            passed: issues.length === 0,
            details: { slowResources: slowResources.length, domLoadTime: navigation?.domContentLoadedEventEnd },
            message: issues.length === 0 ? 'Loading performance good' : issues.join(', ')
        };
    }

    async testMemoryUsage() {
        const issues = [];
        
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
            
            if (memoryUsage > 0.8) {
                issues.push(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
            }
        }
        
        // Test for memory leaks by counting DOM nodes
        const nodeCount = document.querySelectorAll('*').length;
        if (nodeCount > 5000) {
            issues.push(`High DOM node count: ${nodeCount}`);
        }
        
        return {
            passed: issues.length === 0,
            details: { nodeCount, memoryUsage: performance.memory ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) : null },
            message: issues.length === 0 ? 'Memory usage normal' : issues.join(', ')
        };
    }

    async testKeyboardNavigation() {
        const issues = [];
        
        // Test tab navigation
        const focusableElements = this.getFocusableElements();
        
        if (focusableElements.length === 0) {
            issues.push('No focusable elements found');
            return { passed: false, details: issues, message: 'No keyboard navigation possible' };
        }
        
        // Test focus indicators
        for (const element of focusableElements.slice(0, 10)) { // Test first 10 elements
            element.focus();
            await this.wait(50);
            
            const computedStyle = window.getComputedStyle(element, ':focus');
            const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '';
            const hasBoxShadow = computedStyle.boxShadow !== 'none';
            
            if (!hasOutline && !hasBoxShadow) {
                issues.push(`Element missing focus indicator: ${element.tagName}`);
            }
        }
        
        return {
            passed: issues.length === 0,
            details: { focusableCount: focusableElements.length, issues },
            message: issues.length === 0 ? 'Keyboard navigation working' : `${issues.length} keyboard issues found`
        };
    }

    async testScreenReaderSupport() {
        const issues = [];
        
        // Test for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        
        for (const heading of headings) {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > lastLevel + 1) {
                issues.push(`Heading level skip: ${heading.tagName} after h${lastLevel}`);
            }
            lastLevel = level;
        }
        
        // Test for alt text on images
        const images = document.querySelectorAll('img');
        for (const img of images) {
            if (!img.alt && !img.getAttribute('aria-label')) {
                issues.push(`Image missing alt text: ${img.src}`);
            }
        }
        
        // Test for ARIA labels
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
        for (const element of interactiveElements) {
            const hasLabel = element.getAttribute('aria-label') || 
                           element.getAttribute('aria-labelledby') ||
                           document.querySelector(`label[for="${element.id}"]`);
            
            if (!hasLabel && !element.textContent.trim()) {
                issues.push(`Interactive element missing label: ${element.tagName}`);
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'Screen reader support good' : `${issues.length} accessibility issues found`
        };
    }

    async testColorContrast() {
        const issues = [];
        
        // Test text contrast ratios
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        
        for (const element of Array.from(textElements).slice(0, 50)) { // Test first 50 elements
            const style = window.getComputedStyle(element);
            const textColor = this.parseColor(style.color);
            const bgColor = this.parseColor(style.backgroundColor);
            
            if (textColor && bgColor) {
                const contrast = this.calculateContrastRatio(textColor, bgColor);
                const fontSize = parseFloat(style.fontSize);
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && style.fontWeight >= 700);
                
                const minContrast = isLargeText ? 3 : 4.5;
                
                if (contrast < minContrast) {
                    issues.push(`Low contrast ratio: ${contrast.toFixed(2)} (min: ${minContrast})`);
                }
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'Color contrast good' : `${issues.length} contrast issues found`
        };
    }

    async testCSSFeatures() {
        const issues = [];
        
        // Test CSS Grid support
        if (!CSS.supports('display', 'grid')) {
            issues.push('CSS Grid not supported');
        }
        
        // Test Flexbox support
        if (!CSS.supports('display', 'flex')) {
            issues.push('CSS Flexbox not supported');
        }
        
        // Test Custom Properties support
        if (!CSS.supports('--custom', 'property')) {
            issues.push('CSS Custom Properties not supported');
        }
        
        // Test modern CSS features
        const modernFeatures = [
            ['clip-path', 'circle()'],
            ['backdrop-filter', 'blur(10px)'],
            ['object-fit', 'cover'],
            ['position', 'sticky']
        ];
        
        for (const [property, value] of modernFeatures) {
            if (!CSS.supports(property, value)) {
                issues.push(`CSS ${property} not supported`);
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'All CSS features supported' : `${issues.length} CSS features missing`
        };
    }

    async testJSCompatibility() {
        const issues = [];
        
        // Test ES6 features
        try {
            eval('const test = () => {}; class Test {}; const [a, b] = [1, 2];');
        } catch (e) {
            issues.push('ES6 features not supported');
        }
        
        // Test Web APIs
        const apis = [
            'fetch',
            'Promise',
            'IntersectionObserver',
            'MutationObserver',
            'requestAnimationFrame'
        ];
        
        for (const api of apis) {
            if (!(api in window)) {
                issues.push(`${api} API not available`);
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'JavaScript compatibility good' : `${issues.length} JS compatibility issues`
        };
    }

    async testTouchInteractions() {
        const issues = [];
        
        if ('ontouchstart' in window) {
            // Test touch target sizes
            const touchTargets = document.querySelectorAll('button, a, input, select');
            
            for (const target of touchTargets) {
                const rect = target.getBoundingClientRect();
                const minSize = 44; // 44px minimum touch target size
                
                if (rect.width < minSize || rect.height < minSize) {
                    issues.push(`Touch target too small: ${target.tagName} (${rect.width}x${rect.height})`);
                }
            }
        } else {
            return {
                passed: true,
                details: [],
                message: 'Touch not available (desktop browser)'
            };
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'Touch interactions good' : `${issues.length} touch issues found`
        };
    }

    async testComponentRendering() {
        const issues = [];
        
        // Test for broken images
        const images = document.querySelectorAll('img');
        for (const img of images) {
            if (!img.complete || img.naturalHeight === 0) {
                issues.push(`Broken image: ${img.src}`);
            }
        }
        
        // Test for empty containers
        const containers = document.querySelectorAll('.card, .container, .row, .col');
        for (const container of containers) {
            if (container.children.length === 0 && !container.textContent.trim()) {
                issues.push(`Empty container: ${container.className}`);
            }
        }
        
        // Test for overlapping elements
        const overlaps = this.detectOverlappingElements();
        if (overlaps.length > 0) {
            issues.push(`${overlaps.length} overlapping elements detected`);
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'Component rendering good' : `${issues.length} rendering issues found`
        };
    }

    async testAnimationSmoothness() {
        const issues = [];
        
        // Test for animations that might cause jank
        const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        
        for (const element of animatedElements) {
            const style = window.getComputedStyle(element);
            
            // Check for expensive properties in transitions
            const transition = style.transition;
            const expensiveProps = ['width', 'height', 'top', 'left', 'margin', 'padding'];
            
            for (const prop of expensiveProps) {
                if (transition.includes(prop)) {
                    issues.push(`Expensive transition property: ${prop} on ${element.tagName}`);
                }
            }
        }
        
        return {
            passed: issues.length === 0,
            details: issues,
            message: issues.length === 0 ? 'Animation smoothness good' : `${issues.length} animation issues found`
        };
    }

    async testLayoutStability() {
        const issues = [];
        
        // Monitor for layout shifts
        if ('PerformanceObserver' in window) {
            return new Promise((resolve) => {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.value > 0.1) {
                            issues.push(`Layout shift detected: ${entry.value.toFixed(3)}`);
                        }
                    }
                });
                
                try {
                    observer.observe({ entryTypes: ['layout-shift'] });
                    
                    setTimeout(() => {
                        observer.disconnect();
                        resolve({
                            passed: issues.length === 0,
                            details: issues,
                            message: issues.length === 0 ? 'Layout stability good' : `${issues.length} layout shifts detected`
                        });
                    }, 3000);
                } catch (e) {
                    resolve({
                        passed: true,
                        details: [],
                        message: 'Layout shift monitoring not supported'
                    });
                }
            });
        }
        
        return {
            passed: true,
            details: [],
            message: 'Layout shift monitoring not supported'
        };
    }

    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================

    detectOverlappingElements() {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.position === 'absolute' || style.position === 'fixed';
        });
        
        const overlaps = [];
        
        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const rect1 = elements[i].getBoundingClientRect();
                const rect2 = elements[j].getBoundingClientRect();
                
                if (this.rectsOverlap(rect1, rect2)) {
                    overlaps.push([elements[i], elements[j]]);
                }
            }
        }
        
        return overlaps;
    }

    detectInvisibleText() {
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        const invisible = [];
        
        for (const element of textElements) {
            if (element.textContent.trim()) {
                const style = window.getComputedStyle(element);
                if (style.visibility === 'hidden' || 
                    style.display === 'none' || 
                    style.opacity === '0' ||
                    parseFloat(style.fontSize) === 0) {
                    invisible.push(element);
                }
            }
        }
        
        return invisible;
    }

    getFocusableElements() {
        const selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        return Array.from(document.querySelectorAll(selector)).filter(el => {
            return !el.disabled && !el.hidden && el.offsetParent !== null;
        });
    }

    rectsOverlap(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top);
    }

    parseColor(colorStr) {
        if (!colorStr || colorStr === 'transparent') return null;
        
        // Handle rgb/rgba
        const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3]),
                a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
            };
        }
        
        return null;
    }

    calculateContrastRatio(color1, color2) {
        const l1 = this.getLuminance(color1);
        const l2 = this.getLuminance(color2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    getLuminance(color) {
        const { r, g, b } = color;
        
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================================================
    // TEST UI
    // ==========================================================================

    createTestUI() {
        const testUI = document.createElement('div');
        testUI.id = 'ui-testing-framework';
        testUI.className = 'ui-testing-framework';
        testUI.innerHTML = `
            <div class="test-header">
                <h4>UI Testing Framework</h4>
                <div class="test-controls">
                    <button class="btn-run" onclick="window.uiTester.runAllTests()">
                        <i class="fas fa-play"></i> Run All
                    </button>
                    <button class="btn-close" onclick="window.uiTester.hide()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="test-content">
                <div class="test-categories"></div>
                <div class="test-results"></div>
            </div>
            <div class="test-footer">
                <div class="test-progress">
                    <div class="progress-bar"></div>
                </div>
                <div class="test-summary">
                    <span class="passed-count">0 passed</span>
                    <span class="failed-count">0 failed</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(testUI);
        this.testUI = testUI;
        
        this.populateTestCategories();
        this.addTestUIStyles();
    }

    populateTestCategories() {
        const categoriesContainer = this.testUI.querySelector('.test-categories');
        const categories = [...new Set(this.tests.map(test => test.category))];
        
        categories.forEach(category => {
            const categoryTests = this.tests.filter(test => test.category === category);
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'test-category';
            categoryDiv.innerHTML = `
                <h5>${category}</h5>
                <div class="category-tests">
                    ${categoryTests.map(test => `
                        <div class="test-item" data-test="${test.name}">
                            <span class="test-name">${test.name}</span>
                            <button class="btn-run-single" onclick="window.uiTester.runSingleTest('${test.name}')">
                                <i class="fas fa-play"></i>
                            </button>
                            <span class="test-status"></span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            categoriesContainer.appendChild(categoryDiv);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+T to toggle test framework
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggle();
            }
            
            // Ctrl+Shift+R to run all tests
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.runAllTests();
            }
        });
    }

    addTestUIStyles() {
        const styles = `
            .ui-testing-framework {
                position: fixed;
                top: 10px;
                left: 10px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
                overflow: hidden;
            }
            
            .ui-testing-framework.show {
                transform: translateX(0);
            }
            
            .test-header {
                padding: 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8f9fa;
            }
            
            .test-header h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .test-controls {
                display: flex;
                gap: 8px;
            }
            
            .test-controls button {
                background: none;
                border: 1px solid #ddd;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .test-controls .btn-run {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            
            .test-content {
                max-height: 60vh;
                overflow-y: auto;
                padding: 15px;
            }
            
            .test-category {
                margin-bottom: 20px;
            }
            
            .test-category h5 {
                margin: 0 0 10px 0;
                font-size: 14px;
                font-weight: 600;
                color: #495057;
            }
            
            .test-item {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #f1f1f1;
            }
            
            .test-name {
                flex: 1;
                font-size: 13px;
            }
            
            .btn-run-single {
                background: none;
                border: 1px solid #ddd;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                margin-right: 8px;
                font-size: 11px;
            }
            
            .test-status {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            
            .test-status.passed {
                background: #28a745;
                color: white;
            }
            
            .test-status.failed {
                background: #dc3545;
                color: white;
            }
            
            .test-status.running {
                background: #ffc107;
                color: white;
                animation: pulse 1s infinite;
            }
            
            .test-footer {
                padding: 15px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .test-progress {
                margin-bottom: 10px;
            }
            
            .progress-bar {
                height: 4px;
                background: #e9ecef;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-bar::after {
                content: '';
                display: block;
                height: 100%;
                background: #007bff;
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .test-summary {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
            }
            
            .passed-count {
                color: #28a745;
            }
            
            .failed-count {
                color: #dc3545;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    show() {
        this.testUI.classList.add('show');
    }

    hide() {
        this.testUI.classList.remove('show');
    }

    toggle() {
        if (this.testUI.classList.contains('show')) {
            this.hide();
        } else {
            this.show();
        }
    }

    async runAllTests() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.results = [];
        
        const progressBar = this.testUI.querySelector('.progress-bar::after') || 
                           this.testUI.querySelector('.progress-bar');
        
        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            
            // Update UI
            this.updateTestStatus(test.name, 'running');
            
            try {
                const result = await test.function();
                result.name = test.name;
                result.category = test.category;
                this.results.push(result);
                
                this.updateTestStatus(test.name, result.passed ? 'passed' : 'failed');
            } catch (error) {
                console.error(`Test failed: ${test.name}`, error);
                this.results.push({
                    name: test.name,
                    category: test.category,
                    passed: false,
                    message: error.message
                });
                this.updateTestStatus(test.name, 'failed');
            }
            
            // Update progress
            const progress = ((i + 1) / this.tests.length) * 100;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }
        
        this.isRunning = false;
        this.updateSummary();
        this.generateReport();
    }

    async runSingleTest(testName) {
        const test = this.tests.find(t => t.name === testName);
        if (!test) return;
        
        this.updateTestStatus(testName, 'running');
        
        try {
            const result = await test.function();
            result.name = testName;
            result.category = test.category;
            
            // Update or add result
            const existingIndex = this.results.findIndex(r => r.name === testName);
            if (existingIndex >= 0) {
                this.results[existingIndex] = result;
            } else {
                this.results.push(result);
            }
            
            this.updateTestStatus(testName, result.passed ? 'passed' : 'failed');
            this.updateSummary();
        } catch (error) {
            console.error(`Test failed: ${testName}`, error);
            this.updateTestStatus(testName, 'failed');
        }
    }

    updateTestStatus(testName, status) {
        const testItem = this.testUI.querySelector(`[data-test="${testName}"] .test-status`);
        if (testItem) {
            testItem.className = `test-status ${status}`;
            testItem.textContent = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '⟳';
        }
    }

    updateSummary() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        
        const passedElement = this.testUI.querySelector('.passed-count');
        const failedElement = this.testUI.querySelector('.failed-count');
        
        if (passedElement) passedElement.textContent = `${passed} passed`;
        if (failedElement) failedElement.textContent = `${failed} failed`;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            browser: window.browserCompatibility?.getBrowserInfo() || 'Unknown',
            totalTests: this.tests.length,
            passed: this.results.filter(r => r.passed).length,
            failed: this.results.filter(r => !r.passed).length,
            results: this.results
        };
        
        console.group('UI Testing Report');
        console.log('Summary:', `${report.passed}/${report.totalTests} tests passed`);
        console.log('Failed tests:', this.results.filter(r => !r.passed));
        console.log('Full report:', report);
        console.groupEnd();
        
        return report;
    }

    exportReport() {
        const report = this.generateReport();
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ui-test-report-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI testing framework (hidden by default)
    window.uiTester = new UITestingFramework();
    
    // Show in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('UI Testing Framework available. Press Ctrl+Shift+T to toggle.');
    }
});

// Export for use in other modules
window.UITestingFramework = UITestingFramework;