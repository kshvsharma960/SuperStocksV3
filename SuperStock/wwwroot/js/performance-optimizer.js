// ==========================================================================
// PERFORMANCE OPTIMIZER - Advanced performance optimizations
// ==========================================================================

class PerformanceOptimizer {
    constructor() {
        this.lazyLoadObserver = null;
        this.intersectionObserver = null;
        this.mutationObserver = null;
        this.performanceMetrics = {};
        this.domUpdateQueue = [];
        this.isProcessingQueue = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupDOMOptimization();
        this.setupPerformanceMonitoring();
        this.setupResourceOptimization();
        this.setupMemoryManagement();
        this.setupRealTimeOptimization();
        this.setupImageOptimization();
        this.setupCriticalResourcePreloading();
    }

    // ==========================================================================
    // LAZY LOADING IMPLEMENTATION
    // ==========================================================================

    setupLazyLoading() {
        // Enhanced lazy loading with priority levels
        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: [0, 0.1, 0.5, 1.0]
        });

        // Observe all lazy-loadable elements
        this.observeLazyElements();
        
        // Setup component lazy loading
        this.setupComponentLazyLoading();
    }

    observeLazyElements() {
        // Images
        document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => {
            this.lazyLoadObserver.observe(img);
        });

        // Background images
        document.querySelectorAll('[data-bg-src]').forEach(el => {
            this.lazyLoadObserver.observe(el);
        });

        // Iframes
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            this.lazyLoadObserver.observe(iframe);
        });

        // Components
        document.querySelectorAll('[data-lazy-component]').forEach(component => {
            this.lazyLoadObserver.observe(component);
        });
    }

    loadLazyElement(element) {
        const priority = element.dataset.priority || 'normal';
        
        switch (priority) {
            case 'high':
                this.loadElementImmediate(element);
                break;
            case 'low':
                this.scheduleElementLoad(element, 1000);
                break;
            default:
                this.scheduleElementLoad(element, 100);
        }
        
        this.lazyLoadObserver.unobserve(element);
    }

    loadElementImmediate(element) {
        if (element.tagName === 'IMG' && element.dataset.src) {
            this.loadImage(element);
        } else if (element.dataset.bgSrc) {
            this.loadBackgroundImage(element);
        } else if (element.tagName === 'IFRAME' && element.dataset.src) {
            this.loadIframe(element);
        } else if (element.dataset.lazyComponent) {
            this.loadComponent(element);
        }
    }

    scheduleElementLoad(element, delay) {
        setTimeout(() => {
            this.loadElementImmediate(element);
        }, delay);
    }

    loadImage(img) {
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = tempImg.src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        };
        tempImg.onerror = () => {
            img.classList.add('error');
            img.alt = 'Failed to load image';
        };
        tempImg.src = img.dataset.src;
    }

    loadBackgroundImage(element) {
        const tempImg = new Image();
        tempImg.onload = () => {
            element.style.backgroundImage = `url(${tempImg.src})`;
            element.classList.add('bg-loaded');
            element.removeAttribute('data-bg-src');
        };
        tempImg.src = element.dataset.bgSrc;
    }

    loadIframe(iframe) {
        iframe.src = iframe.dataset.src;
        iframe.removeAttribute('data-src');
    }

    loadComponent(element) {
        const componentType = element.dataset.lazyComponent;
        
        switch (componentType) {
            case 'chart':
                this.loadChartComponent(element);
                break;
            case 'table':
                this.loadTableComponent(element);
                break;
            case 'lottie':
                this.loadLottieComponent(element);
                break;
            default:
                console.warn('Unknown lazy component type:', componentType);
        }
    }

    // ==========================================================================
    // COMPONENT LAZY LOADING
    // ==========================================================================

    setupComponentLazyLoading() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadVisibleComponent(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });

        // Observe components that should load when visible
        document.querySelectorAll('.chart-container, .data-table, .lottie-animation').forEach(el => {
            if (!el.dataset.loaded) {
                this.intersectionObserver.observe(el);
            }
        });
    }

    loadVisibleComponent(element) {
        if (element.classList.contains('chart-container')) {
            this.loadChartComponent(element);
        } else if (element.classList.contains('data-table')) {
            this.loadTableComponent(element);
        } else if (element.classList.contains('lottie-animation')) {
            this.loadLottieComponent(element);
        }
        
        this.intersectionObserver.unobserve(element);
    }

    loadChartComponent(container) {
        if (container.dataset.loaded) return;
        
        container.dataset.loaded = 'true';
        
        // Show loading state
        this.showComponentLoader(container, 'Loading chart...');
        
        // Load chart with delay to prevent blocking
        requestIdleCallback(() => {
            this.initializeChart(container);
        });
    }

    loadTableComponent(container) {
        if (container.dataset.loaded) return;
        
        container.dataset.loaded = 'true';
        
        // Progressive table loading
        const rows = container.querySelectorAll('tbody tr');
        const batchSize = this.calculateOptimalBatchSize();
        
        this.loadTableInBatches(rows, batchSize);
    }

    loadLottieComponent(container) {
        if (container.dataset.loaded) return;
        
        container.dataset.loaded = 'true';
        
        // Load Lottie animation
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
    }

    // ==========================================================================
    // DOM OPTIMIZATION
    // ==========================================================================

    setupDOMOptimization() {
        // Batch DOM updates
        this.setupDOMBatching();
        
        // Virtual scrolling for large lists
        this.setupVirtualScrolling();
        
        // Efficient event delegation
        this.setupEventDelegation();
        
        // DOM mutation optimization
        this.setupMutationOptimization();
    }

    setupDOMBatching() {
        // Queue DOM updates and process them in batches
        this.domUpdateQueue = [];
        this.isProcessingQueue = false;
        
        // Process queue on next animation frame
        this.processDOMQueue = this.processDOMQueue.bind(this);
    }

    queueDOMUpdate(updateFunction, priority = 'normal') {
        this.domUpdateQueue.push({
            fn: updateFunction,
            priority: priority,
            timestamp: performance.now()
        });
        
        if (!this.isProcessingQueue) {
            this.scheduleQueueProcessing();
        }
    }

    scheduleQueueProcessing() {
        this.isProcessingQueue = true;
        requestAnimationFrame(this.processDOMQueue);
    }

    processDOMQueue() {
        const startTime = performance.now();
        const maxProcessingTime = 16; // 16ms budget per frame
        
        // Sort by priority
        this.domUpdateQueue.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        while (this.domUpdateQueue.length > 0 && (performance.now() - startTime) < maxProcessingTime) {
            const update = this.domUpdateQueue.shift();
            try {
                update.fn();
            } catch (error) {
                console.error('DOM update error:', error);
            }
        }
        
        if (this.domUpdateQueue.length > 0) {
            // More updates to process, schedule next frame
            requestAnimationFrame(this.processDOMQueue);
        } else {
            this.isProcessingQueue = false;
        }
    }

    setupVirtualScrolling() {
        document.querySelectorAll('[data-virtual-scroll]').forEach(container => {
            this.initializeVirtualScrolling(container);
        });
    }

    initializeVirtualScrolling(container) {
        const itemHeight = parseInt(container.dataset.itemHeight) || 50;
        const items = Array.from(container.children);
        const visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        
        let scrollTop = 0;
        let startIndex = 0;
        
        const updateVisibleItems = () => {
            const newStartIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(newStartIndex + visibleCount, items.length);
            
            if (newStartIndex !== startIndex) {
                startIndex = newStartIndex;
                
                // Hide all items
                items.forEach(item => item.style.display = 'none');
                
                // Show visible items
                for (let i = startIndex; i < endIndex; i++) {
                    if (items[i]) {
                        items[i].style.display = '';
                        items[i].style.transform = `translateY(${i * itemHeight}px)`;
                    }
                }
            }
        };
        
        container.addEventListener('scroll', (e) => {
            scrollTop = e.target.scrollTop;
            requestAnimationFrame(updateVisibleItems);
        });
        
        // Initial render
        updateVisibleItems();
    }

    setupEventDelegation() {
        // Efficient event delegation for dynamic content
        const delegatedEvents = ['click', 'touchstart', 'touchend', 'mouseover', 'mouseout'];
        
        delegatedEvents.forEach(eventType => {
            document.addEventListener(eventType, (e) => {
                this.handleDelegatedEvent(e);
            }, { passive: true });
        });
    }

    handleDelegatedEvent(event) {
        const target = event.target;
        
        // Handle button clicks
        if (target.matches('button, .btn')) {
            this.handleButtonEvent(event, target);
        }
        
        // Handle card interactions
        if (target.matches('.card, .card *')) {
            this.handleCardEvent(event, target.closest('.card'));
        }
        
        // Handle table row interactions
        if (target.matches('tr, tr *')) {
            this.handleTableRowEvent(event, target.closest('tr'));
        }
    }

    setupMutationOptimization() {
        this.mutationObserver = new MutationObserver((mutations) => {
            this.handleDOMMutations(mutations);
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'data-*']
        });
    }

    handleDOMMutations(mutations) {
        const batchedMutations = this.batchMutations(mutations);
        
        requestIdleCallback(() => {
            this.processMutationBatch(batchedMutations);
        });
    }

    batchMutations(mutations) {
        const batched = {
            added: [],
            removed: [],
            modified: []
        };
        
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                batched.added.push(...mutation.addedNodes);
                batched.removed.push(...mutation.removedNodes);
            } else if (mutation.type === 'attributes') {
                batched.modified.push(mutation.target);
            }
        });
        
        return batched;
    }

    processMutationBatch(batch) {
        // Process added nodes
        batch.added.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                this.processAddedElement(node);
            }
        });
        
        // Process removed nodes
        batch.removed.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                this.processRemovedElement(node);
            }
        });
        
        // Process modified nodes
        batch.modified.forEach(node => {
            this.processModifiedElement(node);
        });
    }

    processAddedElement(element) {
        // Setup lazy loading for new elements
        if (element.matches('img[data-src], [data-bg-src], [data-lazy-component]')) {
            this.lazyLoadObserver.observe(element);
        }
        
        // Setup component loading for new components
        if (element.matches('.chart-container, .data-table, .lottie-animation')) {
            if (!element.dataset.loaded) {
                this.intersectionObserver.observe(element);
            }
        }
    }

    processRemovedElement(element) {
        // Cleanup observers
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.unobserve(element);
        }
        if (this.intersectionObserver) {
            this.intersectionObserver.unobserve(element);
        }
        
        // Cleanup component resources
        if (element.lottieAnimation) {
            element.lottieAnimation.destroy();
        }
        
        if (element.chart) {
            element.chart.destroy();
        }
    }

    processModifiedElement(element) {
        // Handle visibility changes
        if (element.style.display === 'none' || element.hidden) {
            this.pauseElementAnimations(element);
        } else {
            this.resumeElementAnimations(element);
        }
    }

    // ==========================================================================
    // REAL-TIME DATA OPTIMIZATION
    // ==========================================================================

    setupRealTimeOptimization() {
        this.dataUpdateQueue = new Map();
        this.isProcessingDataUpdates = false;
        this.lastDataUpdate = 0;
        this.dataUpdateThrottle = 100; // 100ms throttle
        
        // Optimize WebSocket/SignalR updates
        this.setupDataUpdateBatching();
    }

    setupDataUpdateBatching() {
        // Batch real-time data updates
        this.processDataUpdates = this.processDataUpdates.bind(this);
    }

    queueDataUpdate(elementId, data, updateType = 'text') {
        const now = performance.now();
        
        // Throttle updates per element
        if (this.dataUpdateQueue.has(elementId)) {
            const existing = this.dataUpdateQueue.get(elementId);
            if (now - existing.timestamp < this.dataUpdateThrottle) {
                // Update existing queued data
                existing.data = data;
                existing.timestamp = now;
                return;
            }
        }
        
        this.dataUpdateQueue.set(elementId, {
            data: data,
            updateType: updateType,
            timestamp: now
        });
        
        if (!this.isProcessingDataUpdates) {
            this.scheduleDataProcessing();
        }
    }

    scheduleDataProcessing() {
        this.isProcessingDataUpdates = true;
        requestAnimationFrame(this.processDataUpdates);
    }

    processDataUpdates() {
        const startTime = performance.now();
        const maxProcessingTime = 8; // 8ms budget for data updates
        
        const updates = Array.from(this.dataUpdateQueue.entries());
        this.dataUpdateQueue.clear();
        
        for (const [elementId, updateInfo] of updates) {
            if ((performance.now() - startTime) >= maxProcessingTime) {
                // Re-queue remaining updates
                this.dataUpdateQueue.set(elementId, updateInfo);
                continue;
            }
            
            this.applyDataUpdate(elementId, updateInfo);
        }
        
        if (this.dataUpdateQueue.size > 0) {
            // More updates to process
            requestAnimationFrame(this.processDataUpdates);
        } else {
            this.isProcessingDataUpdates = false;
        }
    }

    applyDataUpdate(elementId, updateInfo) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const { data, updateType } = updateInfo;
        
        switch (updateType) {
            case 'text':
                if (element.textContent !== data) {
                    element.textContent = data;
                }
                break;
            case 'html':
                if (element.innerHTML !== data) {
                    element.innerHTML = data;
                }
                break;
            case 'class':
                element.className = data;
                break;
            case 'attribute':
                Object.entries(data).forEach(([attr, value]) => {
                    element.setAttribute(attr, value);
                });
                break;
            case 'style':
                Object.entries(data).forEach(([prop, value]) => {
                    element.style[prop] = value;
                });
                break;
        }
        
        // Add update animation
        this.addUpdateAnimation(element);
    }

    addUpdateAnimation(element) {
        element.classList.add('data-updated');
        setTimeout(() => {
            element.classList.remove('data-updated');
        }, 300);
    }

    // ==========================================================================
    // PERFORMANCE MONITORING
    // ==========================================================================

    setupPerformanceMonitoring() {
        this.startFPSMonitoring();
        this.setupPerformanceObserver();
        this.monitorMemoryUsage();
        this.trackUserInteractions();
    }

    startFPSMonitoring() {
        const measureFPS = (timestamp) => {
            if (this.lastFrameTime) {
                const delta = timestamp - this.lastFrameTime;
                this.fps = Math.round(1000 / delta);
                this.frameCount++;
                
                // Log performance issues
                if (this.fps < 30 && this.frameCount % 60 === 0) {
                    console.warn('Low FPS detected:', this.fps);
                    this.handleLowPerformance();
                }
            }
            
            this.lastFrameTime = timestamp;
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.duration > 50) {
                        console.warn('Long task detected:', entry.duration + 'ms');
                        this.handleLongTask(entry);
                    }
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task observer not supported');
            }
            
            // Monitor layout shifts
            const layoutShiftObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.value > 0.1) {
                        console.warn('Layout shift detected:', entry.value);
                    }
                });
            });
            
            try {
                layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.log('Layout shift observer not supported');
            }
        }
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
                
                if (memoryUsage > 0.8) {
                    console.warn('High memory usage:', Math.round(memoryUsage * 100) + '%');
                    this.handleHighMemoryUsage();
                }
            }, 10000); // Check every 10 seconds
        }
    }

    trackUserInteractions() {
        const interactionTypes = ['click', 'scroll', 'keydown', 'touchstart'];
        
        interactionTypes.forEach(type => {
            document.addEventListener(type, (e) => {
                this.recordInteraction(type, e);
            }, { passive: true });
        });
    }

    recordInteraction(type, event) {
        const timestamp = performance.now();
        
        // Track interaction to next paint
        requestAnimationFrame(() => {
            const responseTime = performance.now() - timestamp;
            
            if (responseTime > 100) {
                console.warn(`Slow ${type} response:`, responseTime + 'ms');
            }
        });
    }

    // ==========================================================================
    // PERFORMANCE ISSUE HANDLERS
    // ==========================================================================

    handleLowPerformance() {
        // Reduce animation complexity
        document.body.classList.add('reduced-motion');
        
        // Pause non-essential animations
        this.pauseNonEssentialAnimations();
        
        // Reduce update frequency
        this.reduceUpdateFrequency();
    }

    handleLongTask(entry) {
        // Break up long tasks
        if (entry.name === 'self' && entry.duration > 100) {
            // Defer non-critical work
            this.deferNonCriticalWork();
        }
    }

    handleHighMemoryUsage() {
        // Clear caches
        this.clearPerformanceCaches();
        
        // Reduce active components
        this.reduceActiveComponents();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    pauseNonEssentialAnimations() {
        document.querySelectorAll('.lottie-animation').forEach(container => {
            if (container.lottieAnimation && !this.isElementVisible(container)) {
                container.lottieAnimation.pause();
            }
        });
    }

    reduceUpdateFrequency() {
        // Increase throttle for data updates
        this.dataUpdateThrottle = 200;
        
        // Reduce chart update frequency
        if (window.chartUpdateInterval) {
            clearInterval(window.chartUpdateInterval);
            window.chartUpdateInterval = setInterval(window.updateCharts, 10000);
        }
    }

    deferNonCriticalWork() {
        // Use requestIdleCallback for non-critical tasks
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.processNonCriticalTasks();
            });
        }
    }

    clearPerformanceCaches() {
        // Clear image caches
        document.querySelectorAll('img').forEach(img => {
            if (!this.isElementVisible(img) && img.src) {
                img.removeAttribute('src');
            }
        });
        
        // Clear data caches
        if (window.dataCache) {
            window.dataCache.clear();
        }
    }

    reduceActiveComponents() {
        // Hide off-screen components
        document.querySelectorAll('.chart-container, .data-table').forEach(component => {
            if (!this.isElementVisible(component)) {
                component.style.visibility = 'hidden';
            }
        });
    }

    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.bottom >= 0 && rect.top <= window.innerHeight;
    }

    calculateOptimalBatchSize() {
        const deviceMemory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        if (deviceMemory <= 2 || cores <= 2) {
            return 10; // Small batches for low-end devices
        } else if (deviceMemory >= 8 && cores >= 8) {
            return 50; // Larger batches for high-end devices
        } else {
            return 25; // Medium batches for mid-range devices
        }
    }

    showComponentLoader(container, message) {
        const loader = document.createElement('div');
        loader.className = 'component-loader';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>${message}</span>
            </div>
        `;
        container.appendChild(loader);
        
        return loader;
    }

    loadTableInBatches(rows, batchSize) {
        let currentBatch = 0;
        const totalBatches = Math.ceil(rows.length / batchSize);
        
        const loadBatch = () => {
            const start = currentBatch * batchSize;
            const end = Math.min(start + batchSize, rows.length);
            
            for (let i = start; i < end; i++) {
                if (rows[i]) {
                    rows[i].style.display = '';
                    rows[i].classList.add('loaded');
                }
            }
            
            currentBatch++;
            
            if (currentBatch < totalBatches) {
                requestIdleCallback(loadBatch);
            }
        };
        
        loadBatch();
    }

    initializeChart(container) {
        // Remove loader
        const loader = container.querySelector('.component-loader');
        if (loader) {
            loader.remove();
        }
        
        // Initialize chart (placeholder - replace with actual chart initialization)
        if (window.initializeChart) {
            window.initializeChart(container);
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    // Method to manually trigger lazy loading check
    checkLazyElements() {
        this.observeLazyElements();
    }

    // Method to queue a DOM update
    updateDOM(updateFunction, priority = 'normal') {
        this.queueDOMUpdate(updateFunction, priority);
    }

    // Method to queue a data update
    updateData(elementId, data, updateType = 'text') {
        this.queueDataUpdate(elementId, data, updateType);
    }

    // Method to get current performance metrics
    getPerformanceMetrics() {
        return {
            fps: this.fps,
            frameCount: this.frameCount,
            queueSize: this.domUpdateQueue.length,
            dataQueueSize: this.dataUpdateQueue.size,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    // Method to manually trigger performance optimization
    optimize() {
        this.handleLowPerformance();
    }

    // Method to reset performance optimizations
    reset() {
        document.body.classList.remove('reduced-motion');
        this.dataUpdateThrottle = 100;
        
        // Resume animations
        document.querySelectorAll('.lottie-animation').forEach(container => {
            if (container.lottieAnimation) {
                container.lottieAnimation.play();
            }
        });
    }
}

// ==========================================================================
// RESOURCE OPTIMIZATION
// ==========================================================================

class ResourceOptimizer {
    constructor() {
        this.preloadedResources = new Set();
        this.criticalResources = new Set();
        this.init();
    }

    init() {
        this.setupCriticalResourcePreloading();
        this.setupImageOptimization();
        this.setupFontOptimization();
        this.setupScriptOptimization();
    }

    setupCriticalResourcePreloading() {
        const criticalResources = [
            { href: '/css/site.min.css', as: 'style' },
            { href: '/js/site.min.js', as: 'script' },
            { href: '/js/dashboard.min.js', as: 'script' },
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            this.preloadResource(resource.href, resource.as);
        });
    }

    preloadResource(href, as, crossorigin = null) {
        if (this.preloadedResources.has(href)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        
        if (crossorigin) {
            link.crossOrigin = crossorigin;
        }

        document.head.appendChild(link);
        this.preloadedResources.add(href);
    }

    setupImageOptimization() {
        // Setup WebP support detection
        this.supportsWebP = this.checkWebPSupport();
        
        // Setup AVIF support detection
        this.supportsAVIF = this.checkAVIFSupport();
        
        // Optimize existing images
        this.optimizeImages();
    }

    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    checkAVIFSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        try {
            return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
        } catch (e) {
            return false;
        }
    }

    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            this.optimizeImage(img);
        });
    }

    optimizeImage(img) {
        // Use modern formats if supported
        if (img.dataset.avif && this.supportsAVIF) {
            img.src = img.dataset.avif;
        } else if (img.dataset.webp && this.supportsWebP) {
            img.src = img.dataset.webp;
        }

        // Add loading attribute for native lazy loading
        if (!img.hasAttribute('loading')) {
            img.loading = 'lazy';
        }

        // Add decode attribute for better performance
        img.decoding = 'async';
    }

    setupFontOptimization() {
        // Preload critical fonts
        const criticalFonts = [
            'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
        ];

        criticalFonts.forEach(font => {
            this.preloadResource(font, 'font', 'anonymous');
        });

        // Setup font display optimization
        this.optimizeFontDisplay();
    }

    optimizeFontDisplay() {
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Inter';
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
    }

    setupScriptOptimization() {
        // Defer non-critical scripts
        document.querySelectorAll('script[data-defer]').forEach(script => {
            script.defer = true;
        });

        // Setup module preloading
        this.setupModulePreloading();
    }

    setupModulePreloading() {
        const modules = [
            '/js/dashboard.min.js',
            '/js/accessibility.min.js',
            '/js/mobile.min.js'
        ];

        modules.forEach(module => {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = module;
            document.head.appendChild(link);
        });
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize performance optimizer
    window.performanceOptimizer = new PerformanceOptimizer();
    
    // Initialize resource optimizer
    window.resourceOptimizer = new ResourceOptimizer();
    
    console.log('Performance optimization initialized');
});

// Export for use in other modules
window.PerformanceOptimizer = PerformanceOptimizer;
window.ResourceOptimizer = ResourceOptimizer;