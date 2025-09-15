// ==========================================================================
// MOBILE LAZY LOADING - Advanced lazy loading and performance optimization
// ==========================================================================

class MobileLazyLoader {
    constructor() {
        this.imageObserver = null;
        this.componentObserver = null;
        this.loadedImages = new Set();
        this.loadedComponents = new Set();
        this.isLowEndDevice = this.detectLowEndDevice();
        
        this.init();
    }

    init() {
        this.setupImageLazyLoading();
        this.setupComponentLazyLoading();
        this.setupIntersectionObservers();
        this.setupPreloadHints();
        this.monitorPerformance();
    }

    detectLowEndDevice() {
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const connection = navigator.connection;
        
        return memory <= 2 || cores <= 2 || 
               (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'));
    }

    setupImageLazyLoading() {
        // Create intersection observer for images
        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, {
            rootMargin: this.isLowEndDevice ? '50px' : '100px',
            threshold: 0.01
        });

        // Observe all lazy images
        this.observeImages();
    }

    setupComponentLazyLoading() {
        // Create intersection observer for components
        this.componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadComponent(entry.target);
                }
            });
        }, {
            rootMargin: this.isLowEndDevice ? '100px' : '200px',
            threshold: 0.1
        });

        // Observe all lazy components
        this.observeComponents();
    }

    observeImages() {
        // Observe images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (!this.loadedImages.has(img)) {
                this.imageObserver.observe(img);
            }
        });

        // Observe background images
        document.querySelectorAll('[data-bg-src]').forEach(element => {
            if (!this.loadedImages.has(element)) {
                this.imageObserver.observe(element);
            }
        });
    }

    observeComponents() {
        // Observe charts
        document.querySelectorAll('.chart-container[data-lazy]').forEach(chart => {
            if (!this.loadedComponents.has(chart)) {
                this.componentObserver.observe(chart);
            }
        });

        // Observe tables
        document.querySelectorAll('.table-container[data-lazy]').forEach(table => {
            if (!this.loadedComponents.has(table)) {
                this.componentObserver.observe(table);
            }
        });

        // Observe Lottie animations
        document.querySelectorAll('.lottie-container[data-lazy]').forEach(lottie => {
            if (!this.loadedComponents.has(lottie)) {
                this.componentObserver.observe(lottie);
            }
        });

        // Observe heavy content sections
        document.querySelectorAll('.heavy-content[data-lazy]').forEach(content => {
            if (!this.loadedComponents.has(content)) {
                this.componentObserver.observe(content);
            }
        });
    }

    loadImage(img) {
        if (this.loadedImages.has(img)) return;

        // Add loading class
        img.classList.add('loading');

        // Create loading placeholder
        this.createImagePlaceholder(img);

        // Load the image
        if (img.dataset.src) {
            this.loadRegularImage(img);
        } else if (img.dataset.bgSrc) {
            this.loadBackgroundImage(img);
        }

        this.loadedImages.add(img);
        this.imageObserver.unobserve(img);
    }

    createImagePlaceholder(img) {
        if (img.classList.contains('has-placeholder')) return;

        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            z-index: 1;
        `;

        // Ensure parent has relative positioning
        if (getComputedStyle(img.parentNode).position === 'static') {
            img.parentNode.style.position = 'relative';
        }

        img.parentNode.appendChild(placeholder);
        img.classList.add('has-placeholder');

        // Add shimmer animation if not exists
        if (!document.querySelector('#shimmer-animation')) {
            const style = document.createElement('style');
            style.id = 'shimmer-animation';
            style.textContent = `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    loadRegularImage(img) {
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.remove('loading');
            img.classList.add('loaded');
            
            // Remove placeholder
            this.removePlaceholder(img);
            
            // Fade in effect
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 10);
        };

        tempImg.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            this.removePlaceholder(img);
        };

        // Load appropriate quality based on device
        const src = this.getOptimalImageSrc(img);
        tempImg.src = src;
    }

    loadBackgroundImage(element) {
        const tempImg = new Image();
        
        tempImg.onload = () => {
            element.style.backgroundImage = `url(${element.dataset.bgSrc})`;
            element.removeAttribute('data-bg-src');
            element.classList.remove('loading');
            element.classList.add('loaded');
            
            this.removePlaceholder(element);
        };

        tempImg.onerror = () => {
            element.classList.remove('loading');
            element.classList.add('error');
            this.removePlaceholder(element);
        };

        const src = this.getOptimalImageSrc(element, 'bgSrc');
        tempImg.src = src;
    }

    getOptimalImageSrc(element, attribute = 'src') {
        const baseAttr = attribute === 'src' ? 'data-src' : 'data-bg-src';
        const baseSrc = element.getAttribute(baseAttr);
        
        // Return low quality version for slow connections
        if (this.isLowEndDevice || this.isSlowConnection()) {
            const lowQualityAttr = attribute === 'src' ? 'data-src-low' : 'data-bg-src-low';
            return element.getAttribute(lowQualityAttr) || baseSrc;
        }
        
        // Return WebP version if supported
        if (this.supportsWebP()) {
            const webpAttr = attribute === 'src' ? 'data-src-webp' : 'data-bg-src-webp';
            return element.getAttribute(webpAttr) || baseSrc;
        }
        
        return baseSrc;
    }

    removePlaceholder(element) {
        const placeholder = element.parentNode.querySelector('.image-placeholder');
        if (placeholder) {
            placeholder.style.opacity = '0';
            setTimeout(() => {
                if (placeholder.parentNode) {
                    placeholder.parentNode.removeChild(placeholder);
                }
            }, 300);
        }
    }

    loadComponent(component) {
        if (this.loadedComponents.has(component)) return;

        component.classList.add('loading');
        
        // Create loading indicator
        this.createComponentLoader(component);

        // Load based on component type
        if (component.classList.contains('chart-container')) {
            this.loadChart(component);
        } else if (component.classList.contains('table-container')) {
            this.loadTable(component);
        } else if (component.classList.contains('lottie-container')) {
            this.loadLottieAnimation(component);
        } else if (component.classList.contains('heavy-content')) {
            this.loadHeavyContent(component);
        }

        this.loadedComponents.add(component);
        this.componentObserver.unobserve(component);
    }

    createComponentLoader(component) {
        if (component.querySelector('.component-loader')) return;

        const loader = document.createElement('div');
        loader.className = 'component-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <div class="loader-text">Loading...</div>
            </div>
        `;
        
        loader.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        `;

        const loaderContent = loader.querySelector('.loader-content');
        loaderContent.style.cssText = `
            text-align: center;
            color: #666;
        `;

        const spinner = loader.querySelector('.loader-spinner');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        `;

        // Ensure parent has relative positioning
        if (getComputedStyle(component).position === 'static') {
            component.style.position = 'relative';
        }

        component.appendChild(loader);

        // Add spin animation if not exists
        if (!document.querySelector('#spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    loadChart(container) {
        // Simulate chart loading delay
        const delay = this.isLowEndDevice ? 1000 : 500;
        
        setTimeout(() => {
            // Initialize chart
            if (window.initializeChart) {
                window.initializeChart(container);
            }
            
            this.removeComponentLoader(container);
            container.classList.remove('loading');
            container.classList.add('loaded');
            container.removeAttribute('data-lazy');
        }, delay);
    }

    loadTable(container) {
        // Load table data progressively
        const rows = container.querySelectorAll('tr[data-lazy]');
        const batchSize = this.isLowEndDevice ? 10 : 20;
        
        this.loadTableBatch(rows, 0, batchSize, () => {
            this.removeComponentLoader(container);
            container.classList.remove('loading');
            container.classList.add('loaded');
            container.removeAttribute('data-lazy');
        });
    }

    loadTableBatch(rows, startIndex, batchSize, callback) {
        const endIndex = Math.min(startIndex + batchSize, rows.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const row = rows[i];
            row.style.display = '';
            row.removeAttribute('data-lazy');
        }

        if (endIndex < rows.length) {
            setTimeout(() => {
                this.loadTableBatch(rows, endIndex, batchSize, callback);
            }, 50);
        } else {
            callback();
        }
    }

    loadLottieAnimation(container) {
        if (!window.lottie) {
            // Load Lottie library first
            this.loadLottieLibrary(() => {
                this.initializeLottieAnimation(container);
            });
        } else {
            this.initializeLottieAnimation(container);
        }
    }

    loadLottieLibrary(callback) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    initializeLottieAnimation(container) {
        const animationPath = container.dataset.animationPath;
        if (!animationPath) return;

        const animation = window.lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: container.dataset.loop === 'true',
            autoplay: container.dataset.autoplay === 'true',
            path: animationPath
        });

        container.lottieAnimation = animation;
        
        animation.addEventListener('DOMLoaded', () => {
            this.removeComponentLoader(container);
            container.classList.remove('loading');
            container.classList.add('loaded');
            container.removeAttribute('data-lazy');
        });
    }

    loadHeavyContent(container) {
        // Load heavy content with delay
        const delay = this.isLowEndDevice ? 1500 : 800;
        
        setTimeout(() => {
            // Show hidden content
            const hiddenContent = container.querySelectorAll('[data-hidden]');
            hiddenContent.forEach(element => {
                element.style.display = '';
                element.removeAttribute('data-hidden');
            });
            
            this.removeComponentLoader(container);
            container.classList.remove('loading');
            container.classList.add('loaded');
            container.removeAttribute('data-lazy');
        }, delay);
    }

    removeComponentLoader(component) {
        const loader = component.querySelector('.component-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }
    }

    setupIntersectionObservers() {
        // Re-observe new elements added to DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for new lazy images
                        if (node.matches && node.matches('img[data-src], [data-bg-src]')) {
                            this.imageObserver.observe(node);
                        }
                        
                        // Check for new lazy components
                        if (node.matches && node.matches('[data-lazy]')) {
                            this.componentObserver.observe(node);
                        }
                        
                        // Check children
                        const lazyImages = node.querySelectorAll && node.querySelectorAll('img[data-src], [data-bg-src]');
                        if (lazyImages) {
                            lazyImages.forEach(img => this.imageObserver.observe(img));
                        }
                        
                        const lazyComponents = node.querySelectorAll && node.querySelectorAll('[data-lazy]');
                        if (lazyComponents) {
                            lazyComponents.forEach(component => this.componentObserver.observe(component));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupPreloadHints() {
        // Preload critical images on hover
        document.addEventListener('mouseenter', (e) => {
            const target = e.target.closest('[data-preload]');
            if (target && !target.dataset.preloaded) {
                this.preloadImage(target.dataset.preload);
                target.dataset.preloaded = 'true';
            }
        }, true);

        // Preload next page resources
        this.preloadNextPageResources();
    }

    preloadImage(src) {
        const img = new Image();
        img.src = src;
    }

    preloadNextPageResources() {
        // Preload likely next pages based on current page
        const currentPath = window.location.pathname;
        let nextPages = [];

        if (currentPath === '/' || currentPath === '/Home') {
            nextPages = ['/Home/Leaderboard', '/api/AllStocks'];
        } else if (currentPath === '/Home/Leaderboard') {
            nextPages = ['/Home', '/api/GetLeaderboard'];
        }

        nextPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });
    }

    monitorPerformance() {
        // Monitor loading performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'measure') {
                        console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
                    }
                });
            });

            observer.observe({ entryTypes: ['measure'] });
        }

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                
                if (usage > 0.8) {
                    console.warn('High memory usage detected:', usage);
                    this.optimizeMemoryUsage();
                }
            }, 30000);
        }
    }

    optimizeMemoryUsage() {
        // Unload non-visible images
        document.querySelectorAll('img.loaded').forEach(img => {
            if (!this.isElementVisible(img)) {
                const placeholder = img.dataset.src || img.src;
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4=';
                img.dataset.src = placeholder;
                img.classList.remove('loaded');
            }
        });

        // Pause non-visible animations
        document.querySelectorAll('.lottie-container').forEach(container => {
            if (!this.isElementVisible(container) && container.lottieAnimation) {
                container.lottieAnimation.pause();
            }
        });
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.bottom >= 0 && rect.top <= window.innerHeight;
    }

    isSlowConnection() {
        const connection = navigator.connection;
        return connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // Public methods
    loadAllVisible() {
        // Force load all visible lazy elements
        document.querySelectorAll('img[data-src], [data-bg-src]').forEach(img => {
            if (this.isElementVisible(img)) {
                this.loadImage(img);
            }
        });

        document.querySelectorAll('[data-lazy]').forEach(component => {
            if (this.isElementVisible(component)) {
                this.loadComponent(component);
            }
        });
    }

    preloadAll() {
        // Preload all lazy elements (use with caution)
        document.querySelectorAll('img[data-src], [data-bg-src]').forEach(img => {
            this.loadImage(img);
        });

        document.querySelectorAll('[data-lazy]').forEach(component => {
            this.loadComponent(component);
        });
    }

    destroy() {
        // Clean up observers
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        
        if (this.componentObserver) {
            this.componentObserver.disconnect();
        }
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile lazy loader
    window.mobileLazyLoader = new MobileLazyLoader();
});

// Export for use in other modules
window.MobileLazyLoader = MobileLazyLoader;