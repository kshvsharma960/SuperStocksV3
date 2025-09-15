// ==========================================================================
// MOBILE PERFORMANCE - Performance optimizations for mobile devices
// ==========================================================================

class MobilePerformanceOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isLowEndDevice = this.detectLowEndDevice();
        this.connectionType = this.getConnectionType();
        this.lazyLoadObserver = null;
        this.intersectionObserver = null;
        
        this.init();
    }

    init() {
        if (this.isMobile) {
            this.setupLazyLoading();
            this.optimizeScrolling();
            this.setupImageOptimization();
            this.setupResourceHints();
            this.setupServiceWorker();
            this.handleOrientationChange();
            this.optimizeTouchInteractions();
            this.setupMemoryManagement();
        }
    }

    detectMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    detectLowEndDevice() {
        // Detect low-end devices based on hardware capabilities
        const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
        const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
        const connection = navigator.connection;
        
        return memory <= 2 || cores <= 2 || 
               (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'));
    }

    getConnectionType() {
        const connection = navigator.connection;
        if (connection) {
            return connection.effectiveType;
        }
        return 'unknown';
    }

    setupLazyLoading() {
        // Lazy load images
        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        this.lazyLoadObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observe all images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.lazyLoadObserver.observe(img);
        });

        // Lazy load non-critical components
        this.setupComponentLazyLoading();
    }

    setupComponentLazyLoading() {
        // Lazy load charts
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    if (element.classList.contains('chart-container') && !element.dataset.loaded) {
                        this.loadChart(element);
                    }
                    
                    if (element.classList.contains('table-container') && !element.dataset.loaded) {
                        this.loadTable(element);
                    }
                    
                    if (element.classList.contains('lottie-container') && !element.dataset.loaded) {
                        this.loadLottieAnimation(element);
                    }
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });

        // Observe lazy-loadable components
        document.querySelectorAll('.chart-container, .table-container, .lottie-container').forEach(el => {
            if (!el.dataset.loaded) {
                this.intersectionObserver.observe(el);
            }
        });
    }

    loadChart(container) {
        container.dataset.loaded = 'true';
        
        // Add loading indicator
        const loader = document.createElement('div');
        loader.className = 'chart-loader';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Loading chart...</span>
            </div>
        `;
        container.appendChild(loader);

        // Simulate chart loading (replace with actual chart initialization)
        setTimeout(() => {
            loader.remove();
            // Initialize chart here
            if (window.initializeChart) {
                window.initializeChart(container);
            }
        }, 500);

        this.intersectionObserver.unobserve(container);
    }

    loadTable(container) {
        container.dataset.loaded = 'true';
        
        // Load table data progressively
        const rows = container.querySelectorAll('tr[data-lazy]');
        const batchSize = this.isLowEndDevice ? 10 : 20;
        
        this.loadTableBatch(rows, 0, batchSize);
        this.intersectionObserver.unobserve(container);
    }

    loadTableBatch(rows, startIndex, batchSize) {
        const endIndex = Math.min(startIndex + batchSize, rows.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const row = rows[i];
            row.style.display = '';
            row.removeAttribute('data-lazy');
        }

        if (endIndex < rows.length) {
            // Load next batch after a short delay
            setTimeout(() => {
                this.loadTableBatch(rows, endIndex, batchSize);
            }, 50);
        }
    }

    loadLottieAnimation(container) {
        container.dataset.loaded = 'true';
        
        // Load Lottie animation only when needed
        if (window.lottie && container.dataset.animationPath) {
            const animation = window.lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: container.dataset.loop === 'true',
                autoplay: container.dataset.autoplay === 'true',
                path: container.dataset.animationPath
            });
            
            container.lottieAnimation = animation;
        }

        this.intersectionObserver.unobserve(container);
    }

    optimizeScrolling() {
        // Enable momentum scrolling on iOS
        const scrollableElements = document.querySelectorAll(
            '.modal-body, .table-container, .chart-container, .sidebar-content'
        );
        
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.scrollBehavior = 'smooth';
        });

        // Throttle scroll events
        let scrollTimeout;
        const handleScroll = () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            scrollTimeout = setTimeout(() => {
                // Handle scroll-based optimizations
                this.handleScrollOptimizations();
            }, 16); // ~60fps
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    handleScrollOptimizations() {
        // Hide/show elements based on scroll position to improve performance
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Hide elements that are far off-screen
        document.querySelectorAll('.summary-card, .dashboard-section').forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.bottom >= -windowHeight && rect.top <= windowHeight * 2;
            
            if (!isVisible && !element.dataset.hidden) {
                element.style.visibility = 'hidden';
                element.dataset.hidden = 'true';
            } else if (isVisible && element.dataset.hidden) {
                element.style.visibility = 'visible';
                delete element.dataset.hidden;
            }
        });
    }

    setupImageOptimization() {
        // Convert images to WebP if supported
        const supportsWebP = this.checkWebPSupport();
        
        if (supportsWebP) {
            document.querySelectorAll('img[data-webp]').forEach(img => {
                img.src = img.dataset.webp;
            });
        }

        // Optimize image loading based on connection
        if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
            this.loadLowQualityImages();
        }
    }

    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    loadLowQualityImages() {
        document.querySelectorAll('img[data-low-quality]').forEach(img => {
            img.src = img.dataset.lowQuality;
        });
    }

    setupResourceHints() {
        // Preload critical resources
        const criticalResources = [
            '/css/site.css',
            '/js/site.min.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });

        // Prefetch likely next pages
        const prefetchPages = [
            '/Home/Leaderboard',
            '/Home/Competition'
        ];

        prefetchPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator && !this.isLowEndDevice) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    }

    handleOrientationChange() {
        let orientationTimeout;
        
        window.addEventListener('orientationchange', () => {
            // Clear any existing timeout
            if (orientationTimeout) {
                clearTimeout(orientationTimeout);
            }
            
            // Debounce orientation change handling
            orientationTimeout = setTimeout(() => {
                this.optimizeForOrientation();
            }, 200);
        });
    }

    optimizeForOrientation() {
        const isLandscape = window.orientation === 90 || window.orientation === -90;
        
        // Adjust layouts for orientation
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
        
        // Resize charts and tables
        this.resizeComponents();
        
        // Trigger window resize for other components
        window.dispatchEvent(new Event('resize'));
    }

    resizeComponents() {
        // Resize charts
        document.querySelectorAll('.chart-container canvas').forEach(canvas => {
            if (canvas.chart && canvas.chart.resize) {
                canvas.chart.resize();
            }
        });

        // Recalculate table layouts
        document.querySelectorAll('.table-responsive').forEach(table => {
            // Force reflow
            table.style.display = 'none';
            table.offsetHeight; // Trigger reflow
            table.style.display = '';
        });
    }

    optimizeTouchInteractions() {
        // Reduce touch delay
        document.addEventListener('touchstart', () => {}, { passive: true });
        
        // Optimize touch event handling
        const touchElements = document.querySelectorAll('button, .btn, .nav-link, .card-clickable');
        
        touchElements.forEach(element => {
            // Add touch-action CSS property
            element.style.touchAction = 'manipulation';
            
            // Optimize touch feedback
            element.addEventListener('touchstart', (e) => {
                element.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            element.addEventListener('touchcancel', (e) => {
                element.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    setupMemoryManagement() {
        // Monitor memory usage
        if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
            this.enableLowMemoryMode();
        }

        // Clean up unused resources periodically
        setInterval(() => {
            this.cleanupResources();
        }, 30000); // Every 30 seconds

        // Handle memory pressure
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
                
                if (memoryUsage > 0.8) {
                    this.handleMemoryPressure();
                }
            }, 10000); // Every 10 seconds
        }
    }

    enableLowMemoryMode() {
        // Reduce animation complexity
        document.body.classList.add('low-memory-mode');
        
        // Disable non-essential animations
        document.querySelectorAll('.lottie-container').forEach(container => {
            if (container.lottieAnimation) {
                container.lottieAnimation.destroy();
            }
        });
        
        // Reduce chart update frequency
        if (window.chartUpdateInterval) {
            clearInterval(window.chartUpdateInterval);
            window.chartUpdateInterval = setInterval(window.updateCharts, 10000); // 10s instead of 5s
        }
    }

    handleMemoryPressure() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear caches
        this.clearCaches();
        
        // Reduce active components
        this.reduceActiveComponents();
    }

    clearCaches() {
        // Clear image caches
        document.querySelectorAll('img').forEach(img => {
            if (!this.isElementVisible(img)) {
                img.src = '';
            }
        });
        
        // Clear chart data caches
        if (window.chartDataCache) {
            window.chartDataCache.clear();
        }
    }

    reduceActiveComponents() {
        // Pause non-visible animations
        document.querySelectorAll('.lottie-container').forEach(container => {
            if (!this.isElementVisible(container) && container.lottieAnimation) {
                container.lottieAnimation.pause();
            }
        });
        
        // Reduce table row count
        document.querySelectorAll('.table tbody tr').forEach((row, index) => {
            if (index > 50 && !this.isElementVisible(row)) {
                row.style.display = 'none';
            }
        });
    }

    cleanupResources() {
        // Remove unused event listeners
        this.cleanupEventListeners();
        
        // Clear unused DOM elements
        this.cleanupDOMElements();
        
        // Clear expired data
        this.clearExpiredData();
    }

    cleanupEventListeners() {
        // Remove listeners from elements that are no longer in the DOM
        // This is handled automatically by modern browsers, but we can help
        document.querySelectorAll('[data-cleanup-listeners]').forEach(element => {
            if (!document.contains(element)) {
                element.removeEventListener('click', element._clickHandler);
                element.removeEventListener('touchstart', element._touchHandler);
            }
        });
    }

    cleanupDOMElements() {
        // Remove hidden elements that are no longer needed
        document.querySelectorAll('[data-temporary]').forEach(element => {
            const created = parseInt(element.dataset.created);
            if (Date.now() - created > 300000) { // 5 minutes
                element.remove();
            }
        });
    }

    clearExpiredData() {
        // Clear expired localStorage data
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.expires && Date.now() > data.expires) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        }
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.bottom >= 0 && rect.top <= window.innerHeight;
    }

    // Public methods for external use
    pauseNonCriticalAnimations() {
        document.querySelectorAll('.lottie-container').forEach(container => {
            if (container.lottieAnimation && !this.isElementVisible(container)) {
                container.lottieAnimation.pause();
            }
        });
    }

    resumeAnimations() {
        document.querySelectorAll('.lottie-container').forEach(container => {
            if (container.lottieAnimation && this.isElementVisible(container)) {
                container.lottieAnimation.play();
            }
        });
    }

    optimizeForBattery() {
        // Reduce update frequencies when battery is low
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) { // Less than 20%
                    this.enableBatterySaveMode();
                }
                
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.2) {
                        this.enableBatterySaveMode();
                    } else {
                        this.disableBatterySaveMode();
                    }
                });
            });
        }
    }

    enableBatterySaveMode() {
        document.body.classList.add('battery-save-mode');
        
        // Reduce animation frame rate
        this.pauseNonCriticalAnimations();
        
        // Increase update intervals
        if (window.dataUpdateInterval) {
            clearInterval(window.dataUpdateInterval);
            window.dataUpdateInterval = setInterval(window.updateData, 15000); // 15s instead of 5s
        }
    }

    disableBatterySaveMode() {
        document.body.classList.remove('battery-save-mode');
        
        // Resume normal operation
        this.resumeAnimations();
        
        // Restore normal update intervals
        if (window.dataUpdateInterval) {
            clearInterval(window.dataUpdateInterval);
            window.dataUpdateInterval = setInterval(window.updateData, 5000); // Back to 5s
        }
    }
}

// ==========================================================================
// MOBILE-SPECIFIC LAYOUT OPTIMIZATIONS
// ==========================================================================

class MobileLayoutOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileSpecificLayouts();
        this.optimizeTableLayouts();
        this.setupAdaptiveLayouts();
    }

    setupMobileSpecificLayouts() {
        if (window.innerWidth <= 768) {
            // Convert complex tables to card layouts
            this.convertTablesToCards();
            
            // Optimize modal layouts
            this.optimizeModalLayouts();
            
            // Setup bottom sheet alternatives
            this.setupBottomSheets();
        }
    }

    convertTablesToCards() {
        document.querySelectorAll('.table-mobile').forEach(table => {
            const tbody = table.querySelector('tbody');
            if (!tbody) return;

            const rows = tbody.querySelectorAll('tr');
            const headers = table.querySelectorAll('thead th');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                
                // Create card structure
                const card = document.createElement('div');
                card.className = 'mobile-table-card';
                
                cells.forEach((cell, index) => {
                    const cardRow = document.createElement('div');
                    cardRow.className = 'card-row';
                    
                    const label = document.createElement('span');
                    label.className = 'card-label';
                    label.textContent = headers[index]?.textContent || '';
                    
                    const value = document.createElement('span');
                    value.className = 'card-value';
                    value.innerHTML = cell.innerHTML;
                    
                    cardRow.appendChild(label);
                    cardRow.appendChild(value);
                    card.appendChild(cardRow);
                });
                
                row.parentNode.insertBefore(card, row);
                row.style.display = 'none';
            });
        });
    }

    optimizeModalLayouts() {
        document.querySelectorAll('.modal').forEach(modal => {
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog && !dialog.classList.contains('modal-fullscreen')) {
                dialog.classList.add('modal-fullscreen-sm-down');
            }
        });
    }

    setupBottomSheets() {
        // Convert certain modals to bottom sheets on mobile
        document.querySelectorAll('.modal[data-mobile="bottom-sheet"]').forEach(modal => {
            modal.classList.add('bottom-sheet-modal');
        });
    }

    optimizeTableLayouts() {
        // Add horizontal scrolling for wide tables
        document.querySelectorAll('table').forEach(table => {
            if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    setupAdaptiveLayouts() {
        // Handle dynamic layout changes based on screen size
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleLayoutChange = (e) => {
            if (e.matches) {
                this.enableMobileLayout();
            } else {
                this.enableDesktopLayout();
            }
        };
        
        mediaQuery.addListener(handleLayoutChange);
        handleLayoutChange(mediaQuery);
    }

    enableMobileLayout() {
        document.body.classList.add('mobile-layout');
        document.body.classList.remove('desktop-layout');
        
        // Adjust grid layouts
        document.querySelectorAll('.row').forEach(row => {
            row.classList.add('mobile-stack');
        });
    }

    enableDesktopLayout() {
        document.body.classList.add('desktop-layout');
        document.body.classList.remove('mobile-layout');
        
        // Restore grid layouts
        document.querySelectorAll('.row').forEach(row => {
            row.classList.remove('mobile-stack');
        });
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile performance optimizer
    window.mobilePerformanceOptimizer = new MobilePerformanceOptimizer();
    
    // Initialize mobile layout optimizer
    window.mobileLayoutOptimizer = new MobileLayoutOptimizer();
    
    // Setup battery optimization
    if (window.mobilePerformanceOptimizer.isMobile) {
        window.mobilePerformanceOptimizer.optimizeForBattery();
    }
});

// Export for use in other modules
window.MobilePerformanceOptimizer = MobilePerformanceOptimizer;
window.MobileLayoutOptimizer = MobileLayoutOptimizer;