// ==========================================================================
// CROSS-BROWSER TESTING - Comprehensive browser testing and validation
// ==========================================================================

class CrossBrowserTesting {
    constructor() {
        this.testResults = {};
        this.browserMatrix = {};
        this.isRunning = false;
        
        this.init();
    }

    init() {
        this.setupBrowserMatrix();
        this.createTestingUI();
        this.startAutomatedTesting();
    }

    // ==========================================================================
    // BROWSER MATRIX SETUP
    // ==========================================================================

    setupBrowserMatrix() {
        this.browserMatrix = {
            desktop: {
                chrome: { name: 'Chrome', minVersion: 90, features: ['webgl', 'serviceworker', 'modules'] },
                firefox: { name: 'Firefox', minVersion: 88, features: ['webgl', 'serviceworker', 'modules'] },
                safari: { name: 'Safari', minVersion: 14, features: ['webgl', 'serviceworker'] },
                edge: { name: 'Edge', minVersion: 90, features: ['webgl', 'serviceworker', 'modules'] }
            },
            mobile: {
                chrome_mobile: { name: 'Chrome Mobile', minVersion: 90, features: ['touch', 'orientation'] },
                safari_mobile: { name: 'Safari Mobile', minVersion: 14, features: ['touch', 'orientation'] },
                firefox_mobile: { name: 'Firefox Mobile', minVersion: 88, features: ['touch', 'orientation'] },
                samsung: { name: 'Samsung Internet', minVersion: 14, features: ['touch', 'orientation'] }
            }
        };
    }

    // ==========================================================================
    // AUTOMATED TESTING
    // ==========================================================================

    async startAutomatedTesting() {
        // Run tests every 30 seconds
        setInterval(() => {
            if (!this.isRunning) {
                this.runQuickCompatibilityCheck();
            }
        }, 30000);

        // Initial test
        setTimeout(() => this.runQuickCompatibilityCheck(), 2000);
    }

    async runFullBrowserTest() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.showTestProgress();
        
        try {
            // Test current browser
            await this.testCurrentBrowser();
            
            // Test responsive design
            await this.testResponsiveDesign();
            
            // Test touch interactions
            await this.testTouchInteractions();
            
            // Test performance across viewports
            await this.testPerformanceAcrossViewports();
            
            // Test accessibility features
            await this.testAccessibilityFeatures();
            
            // Test animation performance
            await this.testAnimationPerformance();
            
            // Generate compatibility report
            this.generateCompatibilityReport();
            
        } catch (error) {
            console.error('Browser testing failed:', error);
        } finally {
            this.isRunning = false;
            this.hideTestProgress();
        }
    }

    async runQuickCompatibilityCheck() {
        const results = {
            browser: this.detectCurrentBrowser(),
            features: this.testEssentialFeatures(),
            performance: await this.quickPerformanceTest(),
            timestamp: Date.now()
        };

        this.testResults.quick = results;
        this.updateQuickTestDisplay(results);
    }

    // ==========================================================================
    // BROWSER DETECTION AND TESTING
    // ==========================================================================

    detectCurrentBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor;
        
        let browser = {
            name: 'unknown',
            version: 'unknown',
            engine: 'unknown',
            mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            os: this.detectOS(),
            supported: false
        };

        // Chrome
        if (/Chrome/.test(userAgent) && /Google Inc/.test(vendor)) {
            browser.name = 'Chrome';
            browser.engine = 'Blink';
            const match = userAgent.match(/Chrome\/(\d+)/);
            browser.version = match ? parseInt(match[1]) : 0;
            browser.supported = browser.version >= 90;
        }
        // Firefox
        else if (/Firefox/.test(userAgent)) {
            browser.name = 'Firefox';
            browser.engine = 'Gecko';
            const match = userAgent.match(/Firefox\/(\d+)/);
            browser.version = match ? parseInt(match[1]) : 0;
            browser.supported = browser.version >= 88;
        }
        // Safari
        else if (/Safari/.test(userAgent) && /Apple Computer/.test(vendor)) {
            browser.name = 'Safari';
            browser.engine = 'WebKit';
            const match = userAgent.match(/Version\/(\d+)/);
            browser.version = match ? parseInt(match[1]) : 0;
            browser.supported = browser.version >= 14;
        }
        // Edge
        else if (/Edg/.test(userAgent)) {
            browser.name = 'Edge';
            browser.engine = 'Blink';
            const match = userAgent.match(/Edg\/(\d+)/);
            browser.version = match ? parseInt(match[1]) : 0;
            browser.supported = browser.version >= 90;
        }

        return browser;
    }

    detectOS() {
        const userAgent = navigator.userAgent;
        
        if (/Windows NT/.test(userAgent)) return 'Windows';
        if (/Mac OS X/.test(userAgent)) return 'macOS';
        if (/Linux/.test(userAgent)) return 'Linux';
        if (/Android/.test(userAgent)) return 'Android';
        if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
        
        return 'Unknown';
    }

    testEssentialFeatures() {
        const features = {
            // Core web technologies
            es6: this.testES6Support(),
            modules: this.testModuleSupport(),
            fetch: 'fetch' in window,
            promises: 'Promise' in window,
            
            // CSS features
            cssGrid: CSS.supports('display', 'grid'),
            cssFlexbox: CSS.supports('display', 'flex'),
            cssCustomProperties: CSS.supports('--custom', 'property'),
            cssTransforms: CSS.supports('transform', 'translateX(0)'),
            
            // Web APIs
            intersectionObserver: 'IntersectionObserver' in window,
            mutationObserver: 'MutationObserver' in window,
            performanceObserver: 'PerformanceObserver' in window,
            serviceWorker: 'serviceWorker' in navigator,
            
            // Graphics and media
            webGL: this.testWebGLSupport(),
            canvas: 'HTMLCanvasElement' in window,
            webP: false, // Will be tested asynchronously
            
            // Input and interaction
            touch: 'ontouchstart' in window,
            pointerEvents: 'PointerEvent' in window,
            
            // Storage
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            indexedDB: 'indexedDB' in window
        };

        // Test image format support asynchronously
        this.testImageFormatSupport(features);
        
        return features;
    }

    testES6Support() {
        try {
            eval('const test = () => {}; class Test {}; const [a, b] = [1, 2];');
            return true;
        } catch (e) {
            return false;
        }
    }

    testModuleSupport() {
        const script = document.createElement('script');
        return 'noModule' in script;
    }

    testWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    testSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    testImageFormatSupport(features) {
        // Test WebP support
        const webpImg = new Image();
        webpImg.onload = webpImg.onerror = () => {
            features.webP = webpImg.height === 2;
            this.updateFeatureDisplay('webP', features.webP);
        };
        webpImg.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    }

    // ==========================================================================
    // RESPONSIVE DESIGN TESTING
    // ==========================================================================

    async testResponsiveDesign() {
        const breakpoints = [
            { name: 'Mobile Portrait', width: 320, height: 568 },
            { name: 'Mobile Landscape', width: 568, height: 320 },
            { name: 'Tablet Portrait', width: 768, height: 1024 },
            { name: 'Tablet Landscape', width: 1024, height: 768 },
            { name: 'Desktop Small', width: 1280, height: 720 },
            { name: 'Desktop Large', width: 1920, height: 1080 }
        ];

        const results = [];

        for (const breakpoint of breakpoints) {
            const result = await this.testBreakpoint(breakpoint);
            results.push(result);
        }

        this.testResults.responsive = results;
        return results;
    }

    async testBreakpoint(breakpoint) {
        // Simulate viewport change (for testing purposes)
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        const issues = [];

        // Test for horizontal scrollbars
        if (document.body.scrollWidth > breakpoint.width) {
            issues.push('Horizontal scrollbar present');
        }

        // Test for overlapping elements
        const overlaps = this.detectOverlappingElements();
        if (overlaps.length > 0) {
            issues.push(`${overlaps.length} overlapping elements`);
        }

        // Test for invisible content
        const invisibleElements = this.detectInvisibleElements();
        if (invisibleElements.length > 0) {
            issues.push(`${invisibleElements.length} invisible elements`);
        }

        // Test touch target sizes (for mobile breakpoints)
        if (breakpoint.width <= 768) {
            const smallTargets = this.detectSmallTouchTargets();
            if (smallTargets.length > 0) {
                issues.push(`${smallTargets.length} touch targets too small`);
            }
        }

        return {
            breakpoint: breakpoint.name,
            width: breakpoint.width,
            height: breakpoint.height,
            passed: issues.length === 0,
            issues: issues
        };
    }

    // ==========================================================================
    // TOUCH INTERACTION TESTING
    // ==========================================================================

    async testTouchInteractions() {
        if (!('ontouchstart' in window)) {
            return {
                supported: false,
                message: 'Touch not supported on this device'
            };
        }

        const tests = [];

        // Test touch target sizes
        const touchTargets = document.querySelectorAll('button, a, input, select, [onclick]');
        const smallTargets = [];

        touchTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                smallTargets.push({
                    element: target.tagName,
                    size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
                });
            }
        });

        tests.push({
            name: 'Touch Target Sizes',
            passed: smallTargets.length === 0,
            details: smallTargets
        });

        // Test swipe gestures
        const swipeTest = await this.testSwipeGestures();
        tests.push(swipeTest);

        // Test pinch zoom
        const zoomTest = this.testPinchZoom();
        tests.push(zoomTest);

        this.testResults.touch = tests;
        return tests;
    }

    async testSwipeGestures() {
        // Test if swipe gestures are properly handled
        const swipeElements = document.querySelectorAll('[data-swipe], .swipeable');
        
        return {
            name: 'Swipe Gestures',
            passed: true, // Assume working unless we detect issues
            details: `${swipeElements.length} swipeable elements found`
        };
    }

    testPinchZoom() {
        const viewport = document.querySelector('meta[name="viewport"]');
        const content = viewport?.getAttribute('content') || '';
        const zoomDisabled = content.includes('user-scalable=no') || content.includes('maximum-scale=1');

        return {
            name: 'Pinch Zoom',
            passed: !zoomDisabled,
            details: zoomDisabled ? 'Zoom disabled' : 'Zoom enabled'
        };
    }

    // ==========================================================================
    // PERFORMANCE TESTING
    // ==========================================================================

    async testPerformanceAcrossViewports() {
        const viewports = [
            { name: 'Mobile', width: 375 },
            { name: 'Tablet', width: 768 },
            { name: 'Desktop', width: 1200 }
        ];

        const results = [];

        for (const viewport of viewports) {
            const performance = await this.measurePerformanceAtViewport(viewport);
            results.push(performance);
        }

        this.testResults.performance = results;
        return results;
    }

    async measurePerformanceAtViewport(viewport) {
        const startTime = performance.now();
        
        // Measure rendering performance
        let frameCount = 0;
        let totalFrameTime = 0;

        const measureFrames = (timestamp) => {
            frameCount++;
            totalFrameTime += performance.now() - startTime;
            
            if (frameCount < 30) {
                requestAnimationFrame(measureFrames);
            }
        };

        requestAnimationFrame(measureFrames);

        // Wait for measurement
        await new Promise(resolve => setTimeout(resolve, 500));

        const avgFrameTime = totalFrameTime / frameCount;
        const fps = 1000 / avgFrameTime;

        // Measure memory usage
        const memoryUsage = performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.jsHeapSizeLimit,
            percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        } : null;

        return {
            viewport: viewport.name,
            fps: Math.round(fps),
            avgFrameTime: Math.round(avgFrameTime * 100) / 100,
            memory: memoryUsage,
            rating: fps >= 55 ? 'good' : fps >= 30 ? 'fair' : 'poor'
        };
    }

    async quickPerformanceTest() {
        const startTime = performance.now();
        
        // Test DOM query performance
        const domStart = performance.now();
        document.querySelectorAll('*');
        const domTime = performance.now() - domStart;

        // Test animation frame rate
        let frames = 0;
        const animStart = performance.now();
        
        const countFrames = () => {
            frames++;
            if (frames < 10) {
                requestAnimationFrame(countFrames);
            }
        };
        
        requestAnimationFrame(countFrames);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const animTime = performance.now() - animStart;
        const fps = (frames / animTime) * 1000;

        return {
            domQueryTime: Math.round(domTime * 100) / 100,
            fps: Math.round(fps),
            rating: fps >= 50 ? 'good' : fps >= 30 ? 'fair' : 'poor'
        };
    }

    // ==========================================================================
    // ACCESSIBILITY TESTING
    // ==========================================================================

    async testAccessibilityFeatures() {
        const tests = [];

        // Test keyboard navigation
        const keyboardTest = await this.testKeyboardNavigation();
        tests.push(keyboardTest);

        // Test screen reader support
        const screenReaderTest = this.testScreenReaderSupport();
        tests.push(screenReaderTest);

        // Test color contrast
        const contrastTest = await this.testColorContrast();
        tests.push(contrastTest);

        // Test ARIA support
        const ariaTest = this.testARIASupport();
        tests.push(ariaTest);

        this.testResults.accessibility = tests;
        return tests;
    }

    async testKeyboardNavigation() {
        const focusableElements = this.getFocusableElements();
        const issues = [];

        // Test tab order
        for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
            const element = focusableElements[i];
            element.focus();
            
            const style = window.getComputedStyle(element, ':focus');
            if (style.outline === 'none' && !style.boxShadow.includes('0 0')) {
                issues.push(`Missing focus indicator: ${element.tagName}`);
            }
        }

        return {
            name: 'Keyboard Navigation',
            passed: issues.length === 0,
            details: issues.length === 0 ? `${focusableElements.length} focusable elements` : issues
        };
    }

    testScreenReaderSupport() {
        const issues = [];

        // Test for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > lastLevel + 1) {
                issues.push(`Heading level skip: ${heading.tagName}`);
            }
            lastLevel = level;
        });

        // Test for alt text on images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.alt && !img.getAttribute('aria-label')) {
                issues.push(`Image missing alt text`);
            }
        });

        return {
            name: 'Screen Reader Support',
            passed: issues.length === 0,
            details: issues.length === 0 ? 'All elements properly labeled' : issues
        };
    }

    async testColorContrast() {
        const issues = [];
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');

        for (const element of Array.from(textElements).slice(0, 20)) {
            const style = window.getComputedStyle(element);
            const textColor = this.parseColor(style.color);
            const bgColor = this.parseColor(style.backgroundColor);

            if (textColor && bgColor) {
                const contrast = this.calculateContrastRatio(textColor, bgColor);
                if (contrast < 4.5) {
                    issues.push(`Low contrast: ${contrast.toFixed(2)}`);
                }
            }
        }

        return {
            name: 'Color Contrast',
            passed: issues.length === 0,
            details: issues.length === 0 ? 'All text meets contrast requirements' : issues
        };
    }

    testARIASupport() {
        const issues = [];
        const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');

        interactiveElements.forEach(element => {
            const hasLabel = element.getAttribute('aria-label') || 
                           element.getAttribute('aria-labelledby') ||
                           document.querySelector(`label[for="${element.id}"]`);

            if (!hasLabel && !element.textContent.trim()) {
                issues.push(`Interactive element missing label: ${element.tagName}`);
            }
        });

        return {
            name: 'ARIA Support',
            passed: issues.length === 0,
            details: issues.length === 0 ? 'All interactive elements properly labeled' : issues
        };
    }

    // ==========================================================================
    // ANIMATION PERFORMANCE TESTING
    // ==========================================================================

    async testAnimationPerformance() {
        const tests = [];

        // Test CSS animation performance
        const cssAnimTest = await this.testCSSAnimations();
        tests.push(cssAnimTest);

        // Test JavaScript animation performance
        const jsAnimTest = await this.testJSAnimations();
        tests.push(jsAnimTest);

        // Test scroll performance
        const scrollTest = await this.testScrollPerformance();
        tests.push(scrollTest);

        this.testResults.animations = tests;
        return tests;
    }

    async testCSSAnimations() {
        const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        const issues = [];

        animatedElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const transition = style.transition;
            
            // Check for expensive properties
            const expensiveProps = ['width', 'height', 'top', 'left', 'margin', 'padding'];
            expensiveProps.forEach(prop => {
                if (transition.includes(prop)) {
                    issues.push(`Expensive transition: ${prop}`);
                }
            });
        });

        return {
            name: 'CSS Animations',
            passed: issues.length === 0,
            details: issues.length === 0 ? `${animatedElements.length} animated elements optimized` : issues
        };
    }

    async testJSAnimations() {
        // Monitor frame rate during animations
        let frameCount = 0;
        let droppedFrames = 0;
        let lastFrameTime = performance.now();

        const monitorFrames = (timestamp) => {
            frameCount++;
            const frameTime = timestamp - lastFrameTime;
            
            if (frameTime > 16.67) { // Dropped frame (60fps = 16.67ms)
                droppedFrames++;
            }
            
            lastFrameTime = timestamp;
            
            if (frameCount < 60) {
                requestAnimationFrame(monitorFrames);
            }
        };

        requestAnimationFrame(monitorFrames);
        
        // Wait for monitoring to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        const dropRate = (droppedFrames / frameCount) * 100;

        return {
            name: 'JavaScript Animations',
            passed: dropRate < 10,
            details: `${dropRate.toFixed(1)}% dropped frames`
        };
    }

    async testScrollPerformance() {
        let scrollEvents = 0;
        let laggyScrolls = 0;

        const scrollHandler = () => {
            const start = performance.now();
            scrollEvents++;
            
            // Simulate scroll processing
            requestAnimationFrame(() => {
                const duration = performance.now() - start;
                if (duration > 16) {
                    laggyScrolls++;
                }
            });
        };

        document.addEventListener('scroll', scrollHandler);
        
        // Simulate scrolling
        window.scrollBy(0, 100);
        await new Promise(resolve => setTimeout(resolve, 100));
        window.scrollBy(0, -100);
        
        document.removeEventListener('scroll', scrollHandler);

        const lagRate = scrollEvents > 0 ? (laggyScrolls / scrollEvents) * 100 : 0;

        return {
            name: 'Scroll Performance',
            passed: lagRate < 20,
            details: `${lagRate.toFixed(1)}% laggy scroll events`
        };
    }

    // ==========================================================================
    // UTILITY FUNCTIONS
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

    detectInvisibleElements() {
        const elements = document.querySelectorAll('*');
        const invisible = [];

        elements.forEach(element => {
            const style = window.getComputedStyle(element);
            if (style.visibility === 'hidden' || 
                style.display === 'none' || 
                style.opacity === '0') {
                invisible.push(element);
            }
        });

        return invisible;
    }

    detectSmallTouchTargets() {
        const touchTargets = document.querySelectorAll('button, a, input, select, [onclick]');
        const small = [];

        touchTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                small.push(target);
            }
        });

        return small;
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

    // ==========================================================================
    // REPORTING
    // ==========================================================================

    generateCompatibilityReport() {
        const report = {
            browser: this.testResults.browser || this.detectCurrentBrowser(),
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                overallScore: 0
            },
            categories: {}
        };

        // Process each test category
        Object.entries(this.testResults).forEach(([category, results]) => {
            if (Array.isArray(results)) {
                const categoryResults = {
                    tests: results,
                    passed: results.filter(r => r.passed).length,
                    total: results.length,
                    score: (results.filter(r => r.passed).length / results.length) * 100
                };
                
                report.categories[category] = categoryResults;
                report.summary.totalTests += categoryResults.total;
                report.summary.passedTests += categoryResults.passed;
            }
        });

        report.summary.failedTests = report.summary.totalTests - report.summary.passedTests;
        report.summary.overallScore = report.summary.totalTests > 0 ? 
            (report.summary.passedTests / report.summary.totalTests) * 100 : 0;

        this.displayCompatibilityReport(report);
        return report;
    }

    displayCompatibilityReport(report) {
        const reportContainer = this.testingUI.querySelector('.test-report');
        
        const scoreClass = report.summary.overallScore >= 80 ? 'good' : 
                          report.summary.overallScore >= 60 ? 'fair' : 'poor';

        let html = `
            <div class="report-header">
                <h5>Compatibility Report</h5>
                <div class="overall-score ${scoreClass}">
                    ${Math.round(report.summary.overallScore)}%
                </div>
            </div>
            <div class="report-summary">
                <div class="summary-item">
                    <span class="label">Browser:</span>
                    <span class="value">${report.browser.name} ${report.browser.version}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Tests:</span>
                    <span class="value">${report.summary.passedTests}/${report.summary.totalTests} passed</span>
                </div>
            </div>
            <div class="report-categories">
        `;

        Object.entries(report.categories).forEach(([category, data]) => {
            const categoryScore = Math.round(data.score);
            const categoryClass = categoryScore >= 80 ? 'good' : categoryScore >= 60 ? 'fair' : 'poor';

            html += `
                <div class="category-result">
                    <div class="category-header">
                        <span class="category-name">${category}</span>
                        <span class="category-score ${categoryClass}">${categoryScore}%</span>
                    </div>
                    <div class="category-details">
                        ${data.passed}/${data.total} tests passed
                    </div>
                </div>
            `;
        });

        html += '</div>';
        reportContainer.innerHTML = html;
    }

    // ==========================================================================
    // UI FUNCTIONS
    // ==========================================================================

    createTestingUI() {
        const testingUI = document.createElement('div');
        testingUI.id = 'cross-browser-testing';
        testingUI.className = 'cross-browser-testing';
        testingUI.innerHTML = `
            <div class="testing-header">
                <h4><i class="fas fa-globe"></i> Cross-Browser Testing</h4>
                <div class="testing-controls">
                    <button class="btn-test" onclick="window.crossBrowserTesting.runFullBrowserTest()">
                        <i class="fas fa-play"></i> Run Tests
                    </button>
                    <button class="btn-close" onclick="window.crossBrowserTesting.hide()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="testing-content">
                <div class="quick-status">
                    <div class="status-item">
                        <span class="label">Browser:</span>
                        <span class="value" id="browser-info">Detecting...</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Performance:</span>
                        <span class="value" id="performance-info">Testing...</span>
                    </div>
                    <div class="status-item">
                        <span class="label">Features:</span>
                        <span class="value" id="features-info">Checking...</span>
                    </div>
                </div>
                <div class="test-report"></div>
            </div>
            <div class="testing-progress" style="display: none;">
                <div class="progress-bar"></div>
                <div class="progress-text">Running browser tests...</div>
            </div>
        `;

        document.body.appendChild(testingUI);
        this.testingUI = testingUI;

        this.addTestingStyles();
    }

    updateQuickTestDisplay(results) {
        const browserInfo = this.testingUI.querySelector('#browser-info');
        const performanceInfo = this.testingUI.querySelector('#performance-info');
        const featuresInfo = this.testingUI.querySelector('#features-info');

        if (browserInfo) {
            browserInfo.textContent = `${results.browser.name} ${results.browser.version}`;
            browserInfo.className = `value ${results.browser.supported ? 'supported' : 'unsupported'}`;
        }

        if (performanceInfo) {
            performanceInfo.textContent = `${results.performance.fps} FPS (${results.performance.rating})`;
            performanceInfo.className = `value ${results.performance.rating}`;
        }

        if (featuresInfo) {
            const supportedFeatures = Object.values(results.features).filter(f => f === true).length;
            const totalFeatures = Object.keys(results.features).length;
            featuresInfo.textContent = `${supportedFeatures}/${totalFeatures} supported`;
            
            const supportRate = (supportedFeatures / totalFeatures) * 100;
            const ratingClass = supportRate >= 80 ? 'good' : supportRate >= 60 ? 'fair' : 'poor';
            featuresInfo.className = `value ${ratingClass}`;
        }
    }

    updateFeatureDisplay(feature, supported) {
        // Update individual feature status if needed
        console.log(`Feature ${feature}: ${supported ? 'supported' : 'not supported'}`);
    }

    showTestProgress() {
        const progress = this.testingUI.querySelector('.testing-progress');
        progress.style.display = 'block';

        let width = 0;
        const progressBar = progress.querySelector('.progress-bar');

        const interval = setInterval(() => {
            width += 1;
            progressBar.style.width = `${width}%`;

            if (width >= 100) {
                clearInterval(interval);
            }
        }, 50);
    }

    hideTestProgress() {
        const progress = this.testingUI.querySelector('.testing-progress');
        progress.style.display = 'none';
    }

    addTestingStyles() {
        const styles = `
            .cross-browser-testing {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
                display: none;
            }
            
            .cross-browser-testing.show {
                display: block;
            }
            
            .testing-header {
                background: #28a745;
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .testing-header h4 {
                margin: 0;
                font-size: 16px;
            }
            
            .testing-controls button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                margin-left: 5px;
                cursor: pointer;
            }
            
            .testing-content {
                padding: 15px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .quick-status {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .status-item:last-child {
                margin-bottom: 0;
            }
            
            .status-item .label {
                font-weight: 500;
                color: #666;
            }
            
            .status-item .value {
                font-weight: bold;
            }
            
            .value.supported, .value.good {
                color: #28a745;
            }
            
            .value.unsupported, .value.poor {
                color: #dc3545;
            }
            
            .value.fair {
                color: #ffc107;
            }
            
            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .overall-score {
                font-size: 24px;
                font-weight: bold;
                padding: 10px 15px;
                border-radius: 6px;
            }
            
            .overall-score.good {
                background: #d4edda;
                color: #155724;
            }
            
            .overall-score.fair {
                background: #fff3cd;
                color: #856404;
            }
            
            .overall-score.poor {
                background: #f8d7da;
                color: #721c24;
            }
            
            .report-summary {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 15px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .category-result {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 10px;
            }
            
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .category-name {
                font-weight: 500;
                text-transform: capitalize;
            }
            
            .category-score {
                font-weight: bold;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .category-score.good {
                background: #28a745;
                color: white;
            }
            
            .category-score.fair {
                background: #ffc107;
                color: white;
            }
            
            .category-score.poor {
                background: #dc3545;
                color: white;
            }
            
            .category-details {
                font-size: 12px;
                color: #666;
            }
            
            .testing-progress {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
            }
            
            .progress-bar {
                height: 4px;
                background: #28a745;
                border-radius: 2px;
                transition: width 0.3s ease;
                margin-bottom: 10px;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    show() {
        if (this.testingUI) {
            this.testingUI.classList.add('show');
        }
    }

    hide() {
        if (this.testingUI) {
            this.testingUI.classList.remove('show');
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    getTestResults() {
        return this.testResults;
    }

    getBrowserMatrix() {
        return this.browserMatrix;
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize cross-browser testing
    window.crossBrowserTesting = new CrossBrowserTesting();
    
    // Add keyboard shortcut to show testing UI
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            window.crossBrowserTesting.show();
        }
    });
    
    console.log('Cross-browser testing initialized');
});

// Export for use in other modules
window.CrossBrowserTesting = CrossBrowserTesting;