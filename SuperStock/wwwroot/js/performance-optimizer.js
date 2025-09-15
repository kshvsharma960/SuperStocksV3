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
        try {
            // Enhanced validation of mutations array
            if (!Array.isArray(mutations) || mutations.length === 0) {
                return;
            }

            // Filter out invalid mutations
            const validMutations = mutations.filter(mutation => {
                return mutation && 
                       typeof mutation === 'object' && 
                       mutation.type && 
                       (mutation.type === 'childList' || mutation.type === 'attributes');
            });

            if (validMutations.length === 0) {
                return;
            }

            const batchedMutations = this.batchMutations(validMutations);
            
            // Use requestIdleCallback with fallback for better performance
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    try {
                        this.processMutationBatch(batchedMutations);
                    } catch (error) {
                        console.warn('Error processing mutation batch in idle callback:', error);
                        // Fallback: try processing with reduced functionality
                        this.processMutationBatchSafe(batchedMutations);
                    }
                }, { timeout: 1000 });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(() => {
                    try {
                        this.processMutationBatch(batchedMutations);
                    } catch (error) {
                        console.warn('Error processing mutation batch in timeout:', error);
                        this.processMutationBatchSafe(batchedMutations);
                    }
                }, 16); // ~1 frame delay
            }
        } catch (error) {
            console.warn('Critical error handling DOM mutations:', error);
            // Graceful degradation - disable mutation observer temporarily
            if (this.mutationObserver) {
                console.log('Temporarily disabling mutation observer due to errors');
                this.mutationObserver.disconnect();
                
                // Re-enable after a delay
                setTimeout(() => {
                    try {
                        if (this.mutationObserver) {
                            this.mutationObserver.observe(document.body, {
                                childList: true,
                                subtree: true,
                                attributes: true,
                                attributeFilter: ['class', 'style', 'data-*']
                            });
                            console.log('Mutation observer re-enabled');
                        }
                    } catch (reconnectError) {
                        console.warn('Failed to re-enable mutation observer:', reconnectError);
                    }
                }, 5000);
            }
        }
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
        try {
            // Enhanced validation of batch object
            if (!batch || typeof batch !== 'object') {
                console.warn('Invalid batch object provided to processMutationBatch');
                return;
            }

            // Process added nodes with enhanced error handling
            if (Array.isArray(batch.added)) {
                batch.added.forEach((node, index) => {
                    try {
                        if (node && node.nodeType === Node.ELEMENT_NODE) {
                            this.processAddedElement(node);
                        }
                    } catch (error) {
                        console.warn(`Error processing added element at index ${index}:`, error);
                        // Continue processing other elements
                    }
                });
            }
            
            // Process removed nodes with enhanced error handling
            if (Array.isArray(batch.removed)) {
                batch.removed.forEach((node, index) => {
                    try {
                        if (node && node.nodeType === Node.ELEMENT_NODE) {
                            this.processRemovedElement(node);
                        }
                    } catch (error) {
                        console.warn(`Error processing removed element at index ${index}:`, error);
                        // Continue processing other elements
                    }
                });
            }
            
            // Process modified nodes with enhanced error handling
            if (Array.isArray(batch.modified)) {
                batch.modified.forEach((node, index) => {
                    try {
                        if (node && node.nodeType === Node.ELEMENT_NODE) {
                            this.processModifiedElement(node);
                        }
                    } catch (error) {
                        console.warn(`Error processing modified element at index ${index}:`, error);
                        // Continue processing other elements
                    }
                });
            }
        } catch (error) {
            console.warn('Critical error in processMutationBatch:', error);
            // Fallback to safe processing
            this.processMutationBatchSafe(batch);
        }
    }

    // Safe fallback method for processing mutations with minimal functionality
    processMutationBatchSafe(batch) {
        try {
            console.log('Using safe mutation batch processing mode');
            
            // Only process the most critical operations safely
            if (batch && batch.added && Array.isArray(batch.added)) {
                batch.added.forEach(node => {
                    try {
                        if (node && node.nodeType === Node.ELEMENT_NODE && node.matches) {
                            // Only handle lazy loading setup - most critical for performance
                            if (node.matches('img[data-src], [data-bg-src]')) {
                                if (this.lazyLoadObserver && typeof this.lazyLoadObserver.observe === 'function') {
                                    this.lazyLoadObserver.observe(node);
                                }
                            }
                        }
                    } catch (error) {
                        // Silently continue - this is the safe mode
                    }
                });
            }
            
            // Minimal cleanup for removed nodes
            if (batch && batch.removed && Array.isArray(batch.removed)) {
                batch.removed.forEach(node => {
                    try {
                        if (node && this.lazyLoadObserver && typeof this.lazyLoadObserver.unobserve === 'function') {
                            this.lazyLoadObserver.unobserve(node);
                        }
                    } catch (error) {
                        // Silently continue - this is the safe mode
                    }
                });
            }
            
        } catch (error) {
            console.warn('Even safe mutation processing failed:', error);
            // At this point, just log and continue
        }
    }

    processAddedElement(element) {
        try {
            // Setup lazy loading for new elements
            if (element.matches && element.matches('img[data-src], [data-bg-src], [data-lazy-component]')) {
                if (this.lazyLoadObserver) {
                    this.lazyLoadObserver.observe(element);
                }
            }
            
            // Setup component loading for new components
            if (element.matches && element.matches('.chart-container, .data-table, .lottie-animation')) {
                if (!element.dataset.loaded && this.intersectionObserver) {
                    this.intersectionObserver.observe(element);
                }
            }
        } catch (error) {
            console.warn('Error processing added element:', error);
        }
    }

    processRemovedElement(element) {
        try {
            // Cleanup observers
            if (this.lazyLoadObserver) {
                this.lazyLoadObserver.unobserve(element);
            }
            if (this.intersectionObserver) {
                this.intersectionObserver.unobserve(element);
            }
            
            // Cleanup component resources safely
            if (element.lottieAnimation) {
                this.safeMethodCall(
                    element.lottieAnimation, 
                    'destroy', 
                    [], 
                    () => console.log('Lottie animation cleanup fallback')
                );
            }
            
            if (element.chart) {
                this.safeMethodCall(
                    element.chart, 
                    'destroy', 
                    [], 
                    () => console.log('Chart cleanup fallback')
                );
            }
        } catch (error) {
            console.warn('Error processing removed element:', error);
        }
    }

    processModifiedElement(element) {
        try {
            // Enhanced element validation
            if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            // Validate animation methods exist before calling
            const validation = this.validateAnimationMethods(element);
            
            // Only proceed if element is valid
            if (!validation.elementValid) {
                return;
            }

            // Handle visibility changes with comprehensive validation
            const isHidden = this.isElementHidden(element);
            const wasHidden = element.dataset && element.dataset.wasHidden === 'true';

            if (isHidden && !wasHidden) {
                // Element became hidden - pause animations
                if (validation.hasLottieAnimation || validation.hasCSSAnimations || validation.hasChartAnimations) {
                    this.pauseElementAnimations(element);
                } else if (validation.hasAlternativeMethods) {
                    // Try alternative methods before fallback
                    this.tryAlternativeAnimationControl(element, 'pause');
                } else {
                    // Use fallback behavior
                    this.provideFallback(element, 'pause');
                }
                
                // Mark as hidden
                if (element.dataset) {
                    element.dataset.wasHidden = 'true';
                }
            } else if (!isHidden && wasHidden) {
                // Element became visible - resume animations
                if (validation.hasLottieAnimation || validation.hasCSSAnimations || validation.hasChartAnimations) {
                    this.resumeElementAnimations(element);
                } else if (validation.hasAlternativeMethods) {
                    // Try alternative methods before fallback
                    this.tryAlternativeAnimationControl(element, 'resume');
                } else {
                    // Use fallback behavior
                    this.provideFallback(element, 'resume');
                }
                
                // Clear hidden flag
                if (element.dataset) {
                    delete element.dataset.wasHidden;
                }
            }
        } catch (error) {
            console.warn('Error in processModifiedElement:', error);
            // Graceful degradation - continue without animation handling
            try {
                // Minimal fallback - just ensure element state is consistent
                if (element && element.dataset) {
                    const isHidden = this.isElementHidden(element);
                    element.dataset.wasHidden = isHidden ? 'true' : 'false';
                }
            } catch (fallbackError) {
                console.warn('Even minimal fallback failed:', fallbackError);
            }
        }
    }

    // Helper method to determine if element is hidden
    isElementHidden(element) {
        try {
            if (!element || !element.style) {
                return false;
            }

            // Check multiple ways an element can be hidden
            return element.style.display === 'none' || 
                   element.hidden === true ||
                   element.style.visibility === 'hidden' ||
                   element.style.opacity === '0' ||
                   (element.classList && element.classList.contains('hidden')) ||
                   (element.getAttribute && element.getAttribute('aria-hidden') === 'true');
        } catch (error) {
            console.warn('Error checking if element is hidden:', error);
            return false;
        }
    }

    // Try alternative animation control methods
    tryAlternativeAnimationControl(element, operation) {
        try {
            let success = false;

            // Try Web Animations API
            if (element.getAnimations && typeof element.getAnimations === 'function') {
                try {
                    const animations = element.getAnimations();
                    animations.forEach(animation => {
                        if (operation === 'pause' && typeof animation.pause === 'function') {
                            animation.pause();
                            success = true;
                        } else if (operation === 'resume' && typeof animation.play === 'function') {
                            animation.play();
                            success = true;
                        }
                    });
                } catch (webAnimError) {
                    console.warn('Web Animations API failed:', webAnimError);
                }
            }

            // Try CSS animation control via classes
            if (!success && element.classList) {
                try {
                    if (operation === 'pause') {
                        element.classList.add('animation-paused');
                        element.classList.remove('animation-playing');
                    } else if (operation === 'resume') {
                        element.classList.remove('animation-paused');
                        element.classList.add('animation-playing');
                    }
                    success = true;
                } catch (classError) {
                    console.warn('CSS class animation control failed:', classError);
                }
            }

            // If all alternatives fail, use fallback
            if (!success) {
                this.provideFallback(element, operation);
            }

        } catch (error) {
            console.warn('Error trying alternative animation control:', error);
            this.provideFallback(element, operation);
        }
    }

    // ==========================================================================
    // ANIMATION CONTROL METHODS
    // ==========================================================================

    pauseElementAnimations(element) {
        try {
            // Validate element exists and has required properties
            if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
                console.warn('Invalid element provided to pauseElementAnimations');
                return;
            }

            // Validate animation methods before attempting to pause
            const validation = this.validateAnimationMethods(element);

            // Pause Lottie animations with enhanced safety checks
            if (validation.hasLottieAnimation && validation.canPause) {
                this.safeMethodCall(
                    element.lottieAnimation, 
                    'pause', 
                    [], 
                    () => {
                        console.log('Lottie animation pause fallback executed for element:', element);
                        this.provideFallback(element, 'pause');
                    }
                );
            } else if (element.lottieAnimation && !validation.canPause) {
                // Graceful degradation - try alternative pause methods
                this.safeMethodCall(
                    element.lottieAnimation, 
                    'stop', 
                    [], 
                    () => this.provideFallback(element, 'pause')
                ) || this.safeMethodCall(
                    element.lottieAnimation, 
                    'setDirection', 
                    [0], 
                    () => this.provideFallback(element, 'pause')
                );
            }

            // Pause CSS animations with enhanced validation
            if (validation.hasCSSAnimations) {
                try {
                    const animatedElements = element.querySelectorAll('[style*="animation"], .animate, [class*="animate"]');
                    animatedElements.forEach(el => {
                        if (el && el.style) {
                            // Validate element can accept style changes
                            if (typeof el.style.setProperty === 'function') {
                                if (el.style.animationPlayState !== 'paused') {
                                    el.style.animationPlayState = 'paused';
                                    if (el.dataset) {
                                        el.dataset.wasAnimating = 'true';
                                    }
                                }
                            } else {
                                // Fallback: add paused class if style manipulation fails
                                if (el.classList && typeof el.classList.add === 'function') {
                                    el.classList.add('animation-paused');
                                }
                            }
                        }
                    });
                } catch (cssError) {
                    console.warn('Error pausing CSS animations:', cssError);
                    this.provideFallback(element, 'pause');
                }
            }

            // Pause chart animations with multiple fallback attempts
            if (validation.hasChartAnimations) {
                const chartPaused = this.safeMethodCall(
                    element.chart, 
                    'pause', 
                    [], 
                    null
                ) || this.safeMethodCall(
                    element.chart, 
                    'stop', 
                    [], 
                    null
                ) || this.safeMethodCall(
                    element.chart, 
                    'freeze', 
                    [], 
                    null
                );

                if (!chartPaused) {
                    console.log('Chart pause methods unavailable, using fallback for element:', element);
                    this.provideFallback(element, 'pause');
                }
            }

            // Mark element as having paused animations
            if (element.dataset && typeof element.dataset === 'object') {
                element.dataset.animationsPaused = 'true';
            } else if (element.setAttribute && typeof element.setAttribute === 'function') {
                element.setAttribute('data-animations-paused', 'true');
            }

        } catch (error) {
            console.warn('Error pausing element animations:', error);
            // Ensure we always attempt graceful degradation
            this.provideFallback(element, 'pause');
        }
    }

    resumeElementAnimations(element) {
        try {
            // Validate element exists and has required properties
            if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
                console.warn('Invalid element provided to resumeElementAnimations');
                return;
            }

            // Only resume if animations were previously paused
            if (element.dataset.animationsPaused !== 'true') {
                return;
            }

            // Validate animation methods before attempting to resume
            const validation = this.validateAnimationMethods(element);
            
            // Resume Lottie animations with enhanced safety checks
            if (validation.hasLottieAnimation && validation.canResume) {
                this.safeMethodCall(
                    element.lottieAnimation, 
                    'play', 
                    [], 
                    () => {
                        console.log('Lottie animation resume fallback executed for element:', element);
                        this.provideFallback(element, 'resume');
                    }
                );
            } else if (element.lottieAnimation && !validation.canResume) {
                // Graceful degradation - try alternative resume methods
                this.safeMethodCall(
                    element.lottieAnimation, 
                    'goToAndPlay', 
                    [0], 
                    () => this.provideFallback(element, 'resume')
                ) || this.safeMethodCall(
                    element.lottieAnimation, 
                    'setDirection', 
                    [1], 
                    () => this.provideFallback(element, 'resume')
                );
            }

            // Resume CSS animations with enhanced validation
            if (validation.hasCSSAnimations) {
                try {
                    const pausedElements = element.querySelectorAll('[data-was-animating="true"]');
                    pausedElements.forEach(el => {
                        if (el && el.dataset && el.dataset.wasAnimating === 'true') {
                            // Validate element can accept style changes
                            if (el.style && typeof el.style.setProperty === 'function') {
                                el.style.animationPlayState = 'running';
                                el.removeAttribute('data-was-animating');
                            } else {
                                // Fallback: remove paused class if style manipulation fails
                                el.classList.remove('animation-paused');
                            }
                        }
                    });
                } catch (cssError) {
                    console.warn('Error resuming CSS animations:', cssError);
                    this.provideFallback(element, 'resume');
                }
            }

            // Resume chart animations with multiple fallback attempts
            if (validation.hasChartAnimations) {
                const chartResumed = this.safeMethodCall(
                    element.chart, 
                    'resume', 
                    [], 
                    null
                ) || this.safeMethodCall(
                    element.chart, 
                    'play', 
                    [], 
                    null
                ) || this.safeMethodCall(
                    element.chart, 
                    'start', 
                    [], 
                    null
                ) || this.safeMethodCall(
                    element.chart, 
                    'update', 
                    [], 
                    null
                );

                if (!chartResumed) {
                    console.log('Chart resume methods unavailable, using fallback for element:', element);
                    this.provideFallback(element, 'resume');
                }
            }

            // Clear the paused flag only if we successfully processed the element
            if (element.removeAttribute && typeof element.removeAttribute === 'function') {
                element.removeAttribute('data-animations-paused');
            } else {
                // Fallback: use dataset deletion
                delete element.dataset.animationsPaused;
            }

        } catch (error) {
            console.warn('Error resuming element animations:', error);
            // Ensure we always attempt graceful degradation
            this.provideFallback(element, 'resume');
        }
    }

    // Enhanced safe method calling with comprehensive validation
    safeMethodCall(object, methodName, args = [], fallback = null) {
        try {
            // Validate object exists and is not null/undefined
            if (!object || (typeof object !== 'object' && typeof object !== 'function')) {
                console.warn(`Invalid object provided for method ${methodName}`);
                if (fallback && typeof fallback === 'function') {
                    return fallback();
                }
                return null;
            }

            // Validate method name is a string
            if (typeof methodName !== 'string' || methodName.length === 0) {
                console.warn('Invalid method name provided');
                if (fallback && typeof fallback === 'function') {
                    return fallback();
                }
                return null;
            }

            // Validate method exists and is callable
            if (typeof object[methodName] === 'function') {
                // Validate arguments array
                if (!Array.isArray(args)) {
                    console.warn(`Invalid arguments provided for method ${methodName}, using empty array`);
                    args = [];
                }

                // Attempt method call with timeout protection
                const timeoutId = setTimeout(() => {
                    console.warn(`Method ${methodName} is taking too long, may be hanging`);
                }, 5000);

                try {
                    const result = object[methodName].apply(object, args);
                    clearTimeout(timeoutId);
                    return result;
                } catch (methodError) {
                    clearTimeout(timeoutId);
                    console.warn(`Error executing method ${methodName}:`, methodError);
                    if (fallback && typeof fallback === 'function') {
                        return fallback();
                    }
                    throw methodError;
                }
            } else {
                console.warn(`Method ${methodName} does not exist or is not a function on object:`, object);
                if (fallback && typeof fallback === 'function') {
                    return fallback();
                }
                return null;
            }
        } catch (error) {
            console.warn(`Critical error in safeMethodCall for method ${methodName}:`, error);
            if (fallback && typeof fallback === 'function') {
                try {
                    return fallback();
                } catch (fallbackError) {
                    console.warn(`Fallback function also failed for method ${methodName}:`, fallbackError);
                }
            }
            return null;
        }
    }

    // Enhanced validation of animation methods before calling
    validateAnimationMethods(element) {
        const validationResults = {
            hasLottieAnimation: false,
            hasCSSAnimations: false,
            hasChartAnimations: false,
            canPause: false,
            canResume: false,
            hasAlternativeMethods: false,
            elementValid: false
        };

        try {
            // Validate element first
            if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
                return validationResults;
            }
            validationResults.elementValid = true;

            // Enhanced Lottie animation validation
            if (element.lottieAnimation && typeof element.lottieAnimation === 'object') {
                validationResults.hasLottieAnimation = true;
                
                // Check primary methods
                validationResults.canPause = typeof element.lottieAnimation.pause === 'function';
                validationResults.canResume = typeof element.lottieAnimation.play === 'function';
                
                // Check alternative methods for graceful degradation
                const alternativeMethods = [
                    'stop', 'goToAndPlay', 'goToAndStop', 'setDirection', 
                    'setSpeed', 'playSegments', 'resetSegments'
                ];
                
                validationResults.hasAlternativeMethods = alternativeMethods.some(method => 
                    typeof element.lottieAnimation[method] === 'function'
                );
            }

            // Enhanced CSS animation validation
            try {
                if (window.getComputedStyle && typeof window.getComputedStyle === 'function') {
                    const computedStyle = window.getComputedStyle(element);
                    if (computedStyle && computedStyle.animationName && computedStyle.animationName !== 'none') {
                        validationResults.hasCSSAnimations = true;
                    }
                    
                    // Also check for transition animations
                    if (computedStyle && computedStyle.transitionProperty && computedStyle.transitionProperty !== 'none') {
                        validationResults.hasCSSAnimations = true;
                    }
                }
                
                // Check for animation classes
                if (element.classList && typeof element.classList.contains === 'function') {
                    const animationClasses = ['animate', 'animated', 'animation', 'transition'];
                    const hasAnimationClass = animationClasses.some(cls => 
                        element.classList.contains(cls) || 
                        Array.from(element.classList).some(className => className.includes(cls))
                    );
                    if (hasAnimationClass) {
                        validationResults.hasCSSAnimations = true;
                    }
                }
            } catch (styleError) {
                console.warn('Error checking CSS animations:', styleError);
            }

            // Enhanced chart animation validation
            if (element.chart && typeof element.chart === 'object') {
                validationResults.hasChartAnimations = true;
                
                // Check for various chart library methods
                const chartMethods = [
                    'pause', 'play', 'stop', 'resume', 'start', 'update', 
                    'animate', 'render', 'redraw', 'freeze', 'unfreeze'
                ];
                
                validationResults.hasAlternativeMethods = chartMethods.some(method => 
                    typeof element.chart[method] === 'function'
                );
            }

            // Check for Web Animations API
            if (element.getAnimations && typeof element.getAnimations === 'function') {
                try {
                    const animations = element.getAnimations();
                    if (animations && animations.length > 0) {
                        validationResults.hasCSSAnimations = true;
                        validationResults.hasAlternativeMethods = true;
                    }
                } catch (webAnimError) {
                    console.warn('Error checking Web Animations API:', webAnimError);
                }
            }

        } catch (error) {
            console.warn('Error validating animation methods:', error);
        }

        return validationResults;
    }

    // Enhanced fallback behavior for missing animation capabilities
    provideFallback(element, operation) {
        try {
            // Validate element first
            if (!element || !element.nodeType || element.nodeType !== Node.ELEMENT_NODE) {
                console.warn('Invalid element provided to provideFallback');
                return;
            }

            switch (operation) {
                case 'pause':
                    this.executePauseFallback(element);
                    break;
                
                case 'resume':
                    this.executeResumeFallback(element);
                    break;
                
                default:
                    console.warn('Unknown fallback operation:', operation);
            }
        } catch (error) {
            console.warn('Error in animation fallback:', error);
            // Ultimate fallback - just log the attempt
            console.log(`Attempted ${operation} fallback for element:`, element);
        }
    }

    executePauseFallback(element) {
        try {
            // Multiple fallback strategies for pausing
            
            // Strategy 1: Use visibility (least intrusive)
            if (element.style && typeof element.style.setProperty === 'function') {
                if (element.style.visibility !== 'hidden') {
                    // Store original visibility
                    if (element.dataset) {
                        element.dataset.originalVisibility = element.style.visibility || 'visible';
                    }
                    element.style.visibility = 'hidden';
                    return;
                }
            }
            
            // Strategy 2: Use opacity if visibility fails
            if (element.style && typeof element.style.setProperty === 'function') {
                if (element.dataset) {
                    element.dataset.originalOpacity = element.style.opacity || '1';
                }
                element.style.opacity = '0';
                element.style.pointerEvents = 'none';
                return;
            }
            
            // Strategy 3: Use CSS classes if direct style manipulation fails
            if (element.classList && typeof element.classList.add === 'function') {
                element.classList.add('animation-paused', 'visually-hidden');
                return;
            }
            
            // Strategy 4: Use attributes as last resort
            if (element.setAttribute && typeof element.setAttribute === 'function') {
                element.setAttribute('data-animation-state', 'paused');
                element.setAttribute('aria-hidden', 'true');
            }
            
        } catch (error) {
            console.warn('All pause fallback strategies failed:', error);
        }
    }

    executeResumeFallback(element) {
        try {
            // Multiple fallback strategies for resuming
            
            // Strategy 1: Restore visibility
            if (element.style && element.dataset && element.dataset.originalVisibility) {
                element.style.visibility = element.dataset.originalVisibility;
                element.removeAttribute('data-original-visibility');
                return;
            }
            
            // Strategy 2: Restore opacity
            if (element.style && element.dataset && element.dataset.originalOpacity) {
                element.style.opacity = element.dataset.originalOpacity;
                element.style.pointerEvents = '';
                element.removeAttribute('data-original-opacity');
                return;
            }
            
            // Strategy 3: Remove CSS classes
            if (element.classList && typeof element.classList.remove === 'function') {
                element.classList.remove('animation-paused', 'visually-hidden');
                // Ensure element is visible
                if (element.style) {
                    element.style.visibility = 'visible';
                    element.style.opacity = '';
                    element.style.pointerEvents = '';
                }
                return;
            }
            
            // Strategy 4: Use attributes as last resort
            if (element.removeAttribute && typeof element.removeAttribute === 'function') {
                element.removeAttribute('data-animation-state');
                element.removeAttribute('aria-hidden');
            }
            
            // Final fallback: ensure basic visibility
            if (element.style) {
                element.style.visibility = 'visible';
                element.style.display = '';
            }
            
        } catch (error) {
            console.warn('All resume fallback strategies failed:', error);
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
                // Use safe method calling
                this.safeMethodCall(
                    container.lottieAnimation, 
                    'pause', 
                    [], 
                    () => this.provideFallback(container, 'pause')
                );
            }
        });

        // Also pause CSS animations on non-visible elements
        document.querySelectorAll('[style*="animation"], .animate').forEach(element => {
            if (!this.isElementVisible(element)) {
                this.pauseElementAnimations(element);
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
        
        // Resume animations safely
        document.querySelectorAll('.lottie-animation').forEach(container => {
            if (container.lottieAnimation) {
                this.safeMethodCall(
                    container.lottieAnimation, 
                    'play', 
                    [], 
                    () => this.provideFallback(container, 'resume')
                );
            }
        });

        // Resume all paused animations
        document.querySelectorAll('[data-animations-paused="true"]').forEach(element => {
            this.resumeElementAnimations(element);
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
    try {
        // Initialize performance optimizer with comprehensive error handling
        window.performanceOptimizer = new PerformanceOptimizer();
        console.log('Performance optimizer initialized successfully');
        
        // Initialize resource optimizer with error handling
        window.resourceOptimizer = new ResourceOptimizer();
        console.log('Resource optimizer initialized successfully');
        
        // Validate critical methods are available
        if (!window.performanceOptimizer.resumeElementAnimations || 
            !window.performanceOptimizer.pauseElementAnimations ||
            !window.performanceOptimizer.safeMethodCall) {
            throw new Error('Critical performance optimizer methods are missing');
        }
        
    } catch (error) {
        console.error('Error initializing performance optimizers:', error);
        
        // Provide comprehensive fallback functionality
        window.performanceOptimizer = {
            // Safe method calling fallback
            safeMethodCall: (obj, method, args = [], fallback = null) => {
                try {
                    if (obj && typeof obj === 'object' && typeof obj[method] === 'function') {
                        return obj[method].apply(obj, args);
                    } else if (fallback && typeof fallback === 'function') {
                        return fallback();
                    }
                } catch (e) {
                    console.warn(`Fallback method call failed for ${method}:`, e);
                    if (fallback && typeof fallback === 'function') {
                        try {
                            return fallback();
                        } catch (fallbackError) {
                            console.warn('Fallback function also failed:', fallbackError);
                        }
                    }
                }
                return null;
            },
            
            // Animation control fallbacks
            pauseElementAnimations: (element) => {
                try {
                    if (element && element.style) {
                        element.dataset = element.dataset || {};
                        element.dataset.originalVisibility = element.style.visibility || 'visible';
                        element.style.visibility = 'hidden';
                    }
                } catch (e) {
                    console.warn('Fallback pause animation failed:', e);
                }
            },
            
            resumeElementAnimations: (element) => {
                try {
                    if (element && element.style && element.dataset && element.dataset.originalVisibility) {
                        element.style.visibility = element.dataset.originalVisibility;
                        delete element.dataset.originalVisibility;
                    } else if (element && element.style) {
                        element.style.visibility = 'visible';
                    }
                } catch (e) {
                    console.warn('Fallback resume animation failed:', e);
                }
            },
            
            // Validation fallbacks
            validateAnimationMethods: (element) => {
                return {
                    hasLottieAnimation: false,
                    hasCSSAnimations: false,
                    hasChartAnimations: false,
                    canPause: false,
                    canResume: false,
                    hasAlternativeMethods: false,
                    elementValid: element && element.nodeType === Node.ELEMENT_NODE
                };
            },
            
            // Fallback behavior
            provideFallback: (element, operation) => {
                try {
                    if (!element || !element.style) return;
                    
                    if (operation === 'pause') {
                        element.style.visibility = 'hidden';
                    } else if (operation === 'resume') {
                        element.style.visibility = 'visible';
                    }
                } catch (e) {
                    console.warn('Provide fallback failed:', e);
                }
            },
            
            // Minimal performance metrics
            getPerformanceMetrics: () => ({
                fps: 0,
                frameCount: 0,
                queueSize: 0,
                dataQueueSize: 0,
                memory: null,
                fallbackMode: true
            }),
            
            // No-op methods for compatibility
            updateDOM: () => {},
            updateData: () => {},
            optimize: () => {},
            reset: () => {},
            checkLazyElements: () => {}
        };
        
        console.log('Comprehensive fallback performance optimizer initialized');
        
        // Also provide minimal resource optimizer fallback
        if (!window.resourceOptimizer) {
            window.resourceOptimizer = {
                preloadResource: () => {},
                optimizeImage: () => {},
                optimizeImages: () => {}
            };
            console.log('Fallback resource optimizer initialized');
        }
    }
});

// Export for use in other modules
window.PerformanceOptimizer = PerformanceOptimizer;
window.ResourceOptimizer = ResourceOptimizer;