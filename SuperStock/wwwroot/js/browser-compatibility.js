// ==========================================================================
// BROWSER COMPATIBILITY - Cross-browser support and testing
// ==========================================================================

class BrowserCompatibility {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.features = this.detectFeatures();
        this.polyfills = [];
        this.compatibilityIssues = [];
        
        this.init();
    }

    init() {
        this.loadPolyfills();
        this.applyBrowserSpecificFixes();
        this.setupCompatibilityTesting();
        this.optimizeForBrowser();
        this.reportCompatibility();
    }

    // ==========================================================================
    // BROWSER DETECTION
    // ==========================================================================

    detectBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor;
        
        let browser = {
            name: 'unknown',
            version: 'unknown',
            engine: 'unknown',
            mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            os: this.detectOS()
        };

        // Chrome
        if (/Chrome/.test(userAgent) && /Google Inc/.test(vendor)) {
            browser.name = 'Chrome';
            browser.engine = 'Blink';
            const match = userAgent.match(/Chrome\/(\d+)/);
            browser.version = match ? match[1] : 'unknown';
        }
        // Firefox
        else if (/Firefox/.test(userAgent)) {
            browser.name = 'Firefox';
            browser.engine = 'Gecko';
            const match = userAgent.match(/Firefox\/(\d+)/);
            browser.version = match ? match[1] : 'unknown';
        }
        // Safari
        else if (/Safari/.test(userAgent) && /Apple Computer/.test(vendor)) {
            browser.name = 'Safari';
            browser.engine = 'WebKit';
            const match = userAgent.match(/Version\/(\d+)/);
            browser.version = match ? match[1] : 'unknown';
        }
        // Edge
        else if (/Edg/.test(userAgent)) {
            browser.name = 'Edge';
            browser.engine = 'Blink';
            const match = userAgent.match(/Edg\/(\d+)/);
            browser.version = match ? match[1] : 'unknown';
        }
        // Internet Explorer
        else if (/Trident/.test(userAgent) || /MSIE/.test(userAgent)) {
            browser.name = 'Internet Explorer';
            browser.engine = 'Trident';
            const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
            browser.version = match ? match[1] : 'unknown';
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

    // ==========================================================================
    // FEATURE DETECTION
    // ==========================================================================

    detectFeatures() {
        const features = {
            // CSS Features
            cssGrid: this.supportsCSSGrid(),
            cssFlexbox: this.supportsCSSFlexbox(),
            cssCustomProperties: this.supportsCSSCustomProperties(),
            cssClipPath: this.supportsCSSClipPath(),
            cssBackdropFilter: this.supportsCSSBackdropFilter(),
            
            // JavaScript Features
            es6: this.supportsES6(),
            modules: this.supportsModules(),
            asyncAwait: this.supportsAsyncAwait(),
            intersectionObserver: 'IntersectionObserver' in window,
            mutationObserver: 'MutationObserver' in window,
            
            // Web APIs
            serviceWorker: 'serviceWorker' in navigator,
            webWorker: 'Worker' in window,
            localStorage: this.supportsLocalStorage(),
            sessionStorage: this.supportsSessionStorage(),
            indexedDB: 'indexedDB' in window,
            webGL: this.supportsWebGL(),
            webGL2: this.supportsWebGL2(),
            
            // Media Features
            webP: false, // Will be detected asynchronously
            avif: false, // Will be detected asynchronously
            webm: this.supportsWebM(),
            
            // Touch and Input
            touch: 'ontouchstart' in window,
            pointerEvents: 'PointerEvent' in window,
            
            // Network
            onLine: 'onLine' in navigator,
            connection: 'connection' in navigator,
            
            // Performance
            performanceObserver: 'PerformanceObserver' in window,
            performanceMemory: 'memory' in performance
        };

        // Detect image format support asynchronously
        this.detectImageFormats(features);
        
        return features;
    }

    supportsCSSGrid() {
        return CSS.supports('display', 'grid');
    }

    supportsCSSFlexbox() {
        return CSS.supports('display', 'flex');
    }

    supportsCSSCustomProperties() {
        return CSS.supports('--custom', 'property');
    }

    supportsCSSClipPath() {
        return CSS.supports('clip-path', 'circle()');
    }

    supportsCSSBackdropFilter() {
        return CSS.supports('backdrop-filter', 'blur(10px)');
    }

    supportsES6() {
        try {
            return typeof Symbol !== 'undefined' && 
                   typeof Promise !== 'undefined' &&
                   typeof Map !== 'undefined' &&
                   typeof Set !== 'undefined';
        } catch (e) {
            return false;
        }
    }

    supportsModules() {
        const script = document.createElement('script');
        return 'noModule' in script;
    }

    supportsAsyncAwait() {
        try {
            return (async () => {})().constructor === Promise;
        } catch (e) {
            return false;
        }
    }

    supportsLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    supportsSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    supportsWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    supportsWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }

    supportsWebM() {
        const video = document.createElement('video');
        return video.canPlayType('video/webm') !== '';
    }

    detectImageFormats(features) {
        // Detect WebP support
        const webpImg = new Image();
        webpImg.onload = webpImg.onerror = () => {
            features.webP = webpImg.height === 2;
        };
        webpImg.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

        // Detect AVIF support
        const avifImg = new Image();
        avifImg.onload = avifImg.onerror = () => {
            features.avif = avifImg.height === 2;
        };
        avifImg.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    }

    // ==========================================================================
    // POLYFILLS
    // ==========================================================================

    loadPolyfills() {
        // IntersectionObserver polyfill
        if (!this.features.intersectionObserver) {
            this.loadPolyfill('IntersectionObserver', 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver');
        }

        // CSS Custom Properties polyfill for IE
        if (!this.features.cssCustomProperties && this.browserInfo.name === 'Internet Explorer') {
            this.loadPolyfill('CSS Custom Properties', 'https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2');
        }

        // Flexbox polyfill for older browsers
        if (!this.features.cssFlexbox) {
            this.loadPolyfill('Flexbox', 'https://cdn.jsdelivr.net/npm/flexibility@2.0.1/flexibility.js');
        }

        // Promise polyfill for IE
        if (typeof Promise === 'undefined') {
            this.loadPolyfill('Promise', 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js');
        }

        // Fetch polyfill for older browsers
        if (typeof fetch === 'undefined') {
            this.loadPolyfill('Fetch', 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js');
        }
    }

    loadPolyfill(name, url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                console.log(`Polyfill loaded: ${name}`);
                this.polyfills.push(name);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load polyfill: ${name}`);
                reject(new Error(`Failed to load ${name} polyfill`));
            };
            document.head.appendChild(script);
        });
    }

    // ==========================================================================
    // BROWSER-SPECIFIC FIXES
    // ==========================================================================

    applyBrowserSpecificFixes() {
        // Safari-specific fixes
        if (this.browserInfo.name === 'Safari') {
            this.applySafariFixes();
        }

        // Firefox-specific fixes
        if (this.browserInfo.name === 'Firefox') {
            this.applyFirefoxFixes();
        }

        // Chrome-specific fixes
        if (this.browserInfo.name === 'Chrome') {
            this.applyChromeFixes();
        }

        // Edge-specific fixes
        if (this.browserInfo.name === 'Edge') {
            this.applyEdgeFixes();
        }

        // Internet Explorer fixes
        if (this.browserInfo.name === 'Internet Explorer') {
            this.applyIEFixes();
        }

        // Mobile-specific fixes
        if (this.browserInfo.mobile) {
            this.applyMobileFixes();
        }
    }

    applySafariFixes() {
        document.body.classList.add('browser-safari');

        // Fix for Safari's aggressive back/forward cache
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                window.location.reload();
            }
        });

        // Fix for Safari's viewport height issue
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVH();
        window.addEventListener('resize', setVH);

        // Fix for Safari's date input issues
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.addEventListener('focus', () => {
                input.type = 'text';
                input.placeholder = 'YYYY-MM-DD';
            });
            input.addEventListener('blur', () => {
                input.type = 'date';
            });
        });
    }

    applyFirefoxFixes() {
        document.body.classList.add('browser-firefox');

        // Fix for Firefox's flexbox min-height issue
        const style = document.createElement('style');
        style.textContent = `
            @-moz-document url-prefix() {
                .flex-container {
                    min-height: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Fix for Firefox's smooth scrolling
        if (CSS.supports('scroll-behavior', 'smooth')) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }
    }

    applyChromeFixes() {
        document.body.classList.add('browser-chrome');

        // Fix for Chrome's autofill styling
        const style = document.createElement('style');
        style.textContent = `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus {
                -webkit-box-shadow: 0 0 0 1000px white inset !important;
                -webkit-text-fill-color: #333 !important;
            }
        `;
        document.head.appendChild(style);
    }

    applyEdgeFixes() {
        document.body.classList.add('browser-edge');

        // Edge-specific CSS fixes
        const style = document.createElement('style');
        style.textContent = `
            @supports (-ms-ime-align: auto) {
                .grid-container {
                    display: -ms-grid;
                }
            }
        `;
        document.head.appendChild(style);
    }

    applyIEFixes() {
        document.body.classList.add('browser-ie');

        // IE compatibility mode detection
        if (document.documentMode) {
            document.body.classList.add(`ie-${document.documentMode}`);
        }

        // IE-specific polyfills and fixes
        if (!Array.prototype.includes) {
            Array.prototype.includes = function(searchElement) {
                return this.indexOf(searchElement) !== -1;
            };
        }

        if (!String.prototype.includes) {
            String.prototype.includes = function(search, start) {
                if (typeof start !== 'number') {
                    start = 0;
                }
                return this.indexOf(search, start) !== -1;
            };
        }

        // Fix for IE's lack of CSS Grid support
        if (!this.features.cssGrid) {
            this.loadPolyfill('CSS Grid', 'https://cdn.jsdelivr.net/npm/css-grid-polyfill@1.0.0/css-grid-polyfill.min.js');
        }
    }

    applyMobileFixes() {
        document.body.classList.add('mobile-browser');

        // Fix for mobile viewport issues
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }

        // Fix for iOS Safari's 100vh issue
        if (this.browserInfo.os === 'iOS') {
            const setIOSVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            setIOSVH();
            window.addEventListener('resize', setIOSVH);
            window.addEventListener('orientationchange', () => {
                setTimeout(setIOSVH, 100);
            });
        }

        // Prevent zoom on input focus
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('focus', () => {
                if (parseFloat(getComputedStyle(element).fontSize) < 16) {
                    element.style.fontSize = '16px';
                }
            });
        });
    }

    // ==========================================================================
    // COMPATIBILITY TESTING
    // ==========================================================================

    setupCompatibilityTesting() {
        this.testCSSFeatures();
        this.testJavaScriptFeatures();
        this.testPerformanceFeatures();
        this.testAccessibilityFeatures();
    }

    testCSSFeatures() {
        const tests = [
            { name: 'CSS Grid', test: () => this.features.cssGrid },
            { name: 'CSS Flexbox', test: () => this.features.cssFlexbox },
            { name: 'CSS Custom Properties', test: () => this.features.cssCustomProperties },
            { name: 'CSS Clip Path', test: () => this.features.cssClipPath },
            { name: 'CSS Backdrop Filter', test: () => this.features.cssBackdropFilter }
        ];

        tests.forEach(({ name, test }) => {
            if (!test()) {
                this.compatibilityIssues.push({
                    category: 'CSS',
                    feature: name,
                    severity: 'medium',
                    fallback: this.getCSSFallback(name)
                });
            }
        });
    }

    testJavaScriptFeatures() {
        const tests = [
            { name: 'ES6 Support', test: () => this.features.es6 },
            { name: 'Modules', test: () => this.features.modules },
            { name: 'Async/Await', test: () => this.features.asyncAwait },
            { name: 'IntersectionObserver', test: () => this.features.intersectionObserver },
            { name: 'Service Worker', test: () => this.features.serviceWorker }
        ];

        tests.forEach(({ name, test }) => {
            if (!test()) {
                this.compatibilityIssues.push({
                    category: 'JavaScript',
                    feature: name,
                    severity: name === 'ES6 Support' ? 'high' : 'medium',
                    fallback: this.getJSFallback(name)
                });
            }
        });
    }

    testPerformanceFeatures() {
        const tests = [
            { name: 'Performance Observer', test: () => this.features.performanceObserver },
            { name: 'Performance Memory', test: () => this.features.performanceMemory },
            { name: 'WebGL', test: () => this.features.webGL },
            { name: 'WebGL2', test: () => this.features.webGL2 }
        ];

        tests.forEach(({ name, test }) => {
            if (!test()) {
                this.compatibilityIssues.push({
                    category: 'Performance',
                    feature: name,
                    severity: 'low',
                    fallback: this.getPerformanceFallback(name)
                });
            }
        });
    }

    testAccessibilityFeatures() {
        const tests = [
            { name: 'ARIA Support', test: () => 'setAttribute' in document.createElement('div') },
            { name: 'Focus Management', test: () => 'focus' in document.createElement('div') },
            { name: 'Screen Reader Support', test: () => window.speechSynthesis !== undefined }
        ];

        tests.forEach(({ name, test }) => {
            if (!test()) {
                this.compatibilityIssues.push({
                    category: 'Accessibility',
                    feature: name,
                    severity: 'high',
                    fallback: this.getAccessibilityFallback(name)
                });
            }
        });
    }

    // ==========================================================================
    // FALLBACK STRATEGIES
    // ==========================================================================

    getCSSFallback(feature) {
        const fallbacks = {
            'CSS Grid': 'Use Flexbox layout with float fallbacks',
            'CSS Flexbox': 'Use float-based layouts with clearfix',
            'CSS Custom Properties': 'Use Sass variables with PostCSS processing',
            'CSS Clip Path': 'Use border-radius and overflow hidden',
            'CSS Backdrop Filter': 'Use semi-transparent overlays'
        };
        return fallbacks[feature] || 'No fallback available';
    }

    getJSFallback(feature) {
        const fallbacks = {
            'ES6 Support': 'Transpile with Babel to ES5',
            'Modules': 'Use bundler like Webpack or Rollup',
            'Async/Await': 'Use Promises with .then() chains',
            'IntersectionObserver': 'Use scroll event listeners with throttling',
            'Service Worker': 'Use AppCache or manual caching strategies'
        };
        return fallbacks[feature] || 'No fallback available';
    }

    getPerformanceFallback(feature) {
        const fallbacks = {
            'Performance Observer': 'Use manual performance.now() measurements',
            'Performance Memory': 'Estimate memory usage based on DOM size',
            'WebGL': 'Use Canvas 2D for simpler graphics',
            'WebGL2': 'Fall back to WebGL 1.0'
        };
        return fallbacks[feature] || 'No fallback available';
    }

    getAccessibilityFallback(feature) {
        const fallbacks = {
            'ARIA Support': 'Use semantic HTML elements',
            'Focus Management': 'Use tabindex and keyboard event handlers',
            'Screen Reader Support': 'Provide text alternatives for all content'
        };
        return fallbacks[feature] || 'No fallback available';
    }

    // ==========================================================================
    // BROWSER OPTIMIZATION
    // ==========================================================================

    optimizeForBrowser() {
        // Optimize based on browser capabilities
        if (this.browserInfo.name === 'Internet Explorer') {
            this.optimizeForIE();
        }

        if (this.browserInfo.mobile) {
            this.optimizeForMobile();
        }

        if (!this.features.webGL) {
            this.disableWebGLFeatures();
        }

        if (!this.features.serviceWorker) {
            this.disableOfflineFeatures();
        }
    }

    optimizeForIE() {
        // Disable heavy animations
        document.body.classList.add('reduced-animations');

        // Use simpler layouts
        document.body.classList.add('simple-layout');

        // Disable non-essential features
        if (window.lottie) {
            window.lottie = null;
        }
    }

    optimizeForMobile() {
        // Enable touch optimizations
        document.body.classList.add('touch-optimized');

        // Reduce animation complexity
        if (window.matchMedia('(max-width: 768px)').matches) {
            document.body.classList.add('mobile-optimized');
        }
    }

    disableWebGLFeatures() {
        // Disable WebGL-based charts
        if (window.Chart) {
            window.Chart.defaults.plugins.legend.display = false;
        }
    }

    disableOfflineFeatures() {
        // Hide offline indicators
        document.querySelectorAll('.offline-indicator').forEach(el => {
            el.style.display = 'none';
        });
    }

    // ==========================================================================
    // REPORTING
    // ==========================================================================

    reportCompatibility() {
        const report = {
            browser: this.browserInfo,
            features: this.features,
            polyfills: this.polyfills,
            issues: this.compatibilityIssues,
            timestamp: new Date().toISOString()
        };

        console.group('Browser Compatibility Report');
        console.log('Browser:', this.browserInfo);
        console.log('Features:', this.features);
        console.log('Polyfills loaded:', this.polyfills);
        console.log('Compatibility issues:', this.compatibilityIssues);
        console.groupEnd();

        // Send to analytics if available
        if (window.analytics) {
            window.analytics.track('Browser Compatibility', report);
        }

        return report;
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    getBrowserInfo() {
        return this.browserInfo;
    }

    getFeatures() {
        return this.features;
    }

    getCompatibilityIssues() {
        return this.compatibilityIssues;
    }

    isFeatureSupported(feature) {
        return this.features[feature] === true;
    }

    addCustomTest(name, testFunction) {
        this.features[name] = testFunction();
        
        if (!this.features[name]) {
            this.compatibilityIssues.push({
                category: 'Custom',
                feature: name,
                severity: 'medium',
                fallback: 'Custom fallback required'
            });
        }
    }

    // Method to test specific functionality
    testFeature(feature, testFunction) {
        try {
            const result = testFunction();
            console.log(`Feature test '${feature}':`, result ? 'PASS' : 'FAIL');
            return result;
        } catch (error) {
            console.error(`Feature test '${feature}' error:`, error);
            return false;
        }
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize browser compatibility
    window.browserCompatibility = new BrowserCompatibility();
    
    console.log('Browser compatibility initialized');
});

// Export for use in other modules
window.BrowserCompatibility = BrowserCompatibility;