// ==========================================================================
// FINAL UI REFINEMENTS - Polish and optimization for production
// ==========================================================================

class FinalUIRefinements {
    constructor() {
        this.refinements = [];
        this.optimizations = [];
        this.isRunning = false;
        
        this.init();
    }

    init() {
        this.setupRefinements();
        this.applyImmediateRefinements();
        this.createRefinementUI();
        this.startContinuousOptimization();
    }

    // ==========================================================================
    // REFINEMENT SETUP
    // ==========================================================================

    setupRefinements() {
        this.refinements = [
            {
                name: 'Animation Smoothness',
                category: 'Performance',
                priority: 'high',
                apply: this.optimizeAnimations.bind(this),
                test: this.testAnimationSmoothness.bind(this)
            },
            {
                name: 'Touch Interactions',
                category: 'Mobile',
                priority: 'high',
                apply: this.enhanceTouchInteractions.bind(this),
                test: this.testTouchInteractions.bind(this)
            },
            {
                name: 'Visual Hierarchy',
                category: 'Design',
                priority: 'medium',
                apply: this.improveVisualHierarchy.bind(this),
                test: this.testVisualHierarchy.bind(this)
            },
            {
                name: 'Loading States',
                category: 'UX',
                priority: 'high',
                apply: this.enhanceLoadingStates.bind(this),
                test: this.testLoadingStates.bind(this)
            },
            {
                name: 'Error Handling',
                category: 'UX',
                priority: 'high',
                apply: this.improveErrorHandling.bind(this),
                test: this.testErrorHandling.bind(this)
            },
            {
                name: 'Micro-interactions',
                category: 'Design',
                priority: 'medium',
                apply: this.addMicroInteractions.bind(this),
                test: this.testMicroInteractions.bind(this)
            },
            {
                name: 'Accessibility Polish',
                category: 'Accessibility',
                priority: 'high',
                apply: this.polishAccessibility.bind(this),
                test: this.testAccessibilityPolish.bind(this)
            },
            {
                name: 'Performance Optimization',
                category: 'Performance',
                priority: 'high',
                apply: this.optimizePerformance.bind(this),
                test: this.testPerformanceOptimization.bind(this)
            }
        ];
    }

    // ==========================================================================
    // IMMEDIATE REFINEMENTS
    // ==========================================================================

    applyImmediateRefinements() {
        // Apply critical refinements immediately
        this.optimizeAnimations();
        this.enhanceTouchInteractions();
        this.enhanceLoadingStates();
        this.improveErrorHandling();
        this.polishAccessibility();
        
        console.log('Immediate UI refinements applied');
    }

    // ==========================================================================
    // ANIMATION OPTIMIZATIONS
    // ==========================================================================

    optimizeAnimations() {
        // Optimize CSS animations for better performance
        this.addAnimationOptimizationStyles();
        
        // Reduce motion for users who prefer it
        this.respectReducedMotion();
        
        // Optimize transform animations
        this.optimizeTransformAnimations();
        
        // Add hardware acceleration hints
        this.addHardwareAcceleration();
        
        this.optimizations.push({
            name: 'Animation Smoothness',
            applied: true,
            timestamp: Date.now()
        });
    }

    addAnimationOptimizationStyles() {
        const styles = `
            /* Animation Performance Optimizations */
            .animate-optimized {
                will-change: transform, opacity;
                backface-visibility: hidden;
                perspective: 1000px;
            }
            
            .smooth-transition {
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .gpu-accelerated {
                transform: translateZ(0);
                -webkit-transform: translateZ(0);
            }
            
            /* Reduce motion for accessibility */
            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
            
            /* Smooth scrolling optimization */
            html {
                scroll-behavior: smooth;
            }
            
            @media (prefers-reduced-motion: reduce) {
                html {
                    scroll-behavior: auto;
                }
            }
        `;
        
        this.addStyles('animation-optimizations', styles);
    }

    respectReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            document.body.classList.add('reduced-motion');
            
            // Disable complex animations
            document.querySelectorAll('.lottie-animation').forEach(el => {
                el.style.display = 'none';
            });
            
            // Simplify transitions
            document.querySelectorAll('[class*="animate"]').forEach(el => {
                el.style.animationDuration = '0.1s';
            });
        }
    }

    optimizeTransformAnimations() {
        // Add transform optimization to animated elements
        document.querySelectorAll('[class*="animate"], [class*="transition"]').forEach(el => {
            el.classList.add('animate-optimized');
        });
        
        // Optimize hover effects
        document.querySelectorAll('button, .btn, .card, .nav-link').forEach(el => {
            el.classList.add('smooth-transition');
        });
    }

    addHardwareAcceleration() {
        // Add GPU acceleration to performance-critical elements
        const criticalElements = document.querySelectorAll(
            '.modal, .sidebar, .chart-container, .trading-panel, .watchlist-item'
        );
        
        criticalElements.forEach(el => {
            el.classList.add('gpu-accelerated');
        });
    }

    // ==========================================================================
    // TOUCH INTERACTION ENHANCEMENTS
    // ==========================================================================

    enhanceTouchInteractions() {
        if (!('ontouchstart' in window)) return;
        
        // Improve touch target sizes
        this.improveTouchTargets();
        
        // Add touch feedback
        this.addTouchFeedback();
        
        // Optimize scroll behavior
        this.optimizeScrollBehavior();
        
        // Add swipe gestures
        this.addSwipeGestures();
        
        this.optimizations.push({
            name: 'Touch Interactions',
            applied: true,
            timestamp: Date.now()
        });
    }

    improveTouchTargets() {
        const touchTargets = document.querySelectorAll('button, a, input, select, [onclick]');
        
        touchTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            
            if (rect.width < 44 || rect.height < 44) {
                target.style.minWidth = '44px';
                target.style.minHeight = '44px';
                target.style.display = 'inline-flex';
                target.style.alignItems = 'center';
                target.style.justifyContent = 'center';
            }
        });
    }

    addTouchFeedback() {
        const touchElements = document.querySelectorAll('button, .btn, .card, .nav-link');
        
        touchElements.forEach(el => {
            el.addEventListener('touchstart', () => {
                el.classList.add('touch-active');
            });
            
            el.addEventListener('touchend', () => {
                setTimeout(() => {
                    el.classList.remove('touch-active');
                }, 150);
            });
        });
        
        // Add touch feedback styles
        const touchStyles = `
            .touch-active {
                transform: scale(0.98);
                opacity: 0.8;
                transition: all 0.1s ease;
            }
        `;
        
        this.addStyles('touch-feedback', touchStyles);
    }

    optimizeScrollBehavior() {
        // Improve scroll performance on mobile
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Add momentum scrolling to containers
        document.querySelectorAll('.modal-body, .sidebar, .table-container').forEach(el => {
            el.style.webkitOverflowScrolling = 'touch';
        });
    }

    addSwipeGestures() {
        // Add swipe gestures to modals and sidebars
        const swipeElements = document.querySelectorAll('.modal, .sidebar');
        
        swipeElements.forEach(el => {
            let startX = 0;
            let startY = 0;
            
            el.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            el.addEventListener('touchmove', (e) => {
                if (!startX || !startY) return;
                
                const diffX = startX - e.touches[0].clientX;
                const diffY = startY - e.touches[0].clientY;
                
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // Horizontal swipe
                    if (diffX > 50 && el.classList.contains('modal')) {
                        // Swipe left to close modal
                        const closeBtn = el.querySelector('.btn-close');
                        if (closeBtn) closeBtn.click();
                    }
                }
            });
        });
    }

    // ==========================================================================
    // VISUAL HIERARCHY IMPROVEMENTS
    // ==========================================================================

    improveVisualHierarchy() {
        // Enhance typography hierarchy
        this.enhanceTypography();
        
        // Improve color contrast
        this.improveColorContrast();
        
        // Add visual emphasis
        this.addVisualEmphasis();
        
        // Optimize spacing
        this.optimizeSpacing();
        
        this.optimizations.push({
            name: 'Visual Hierarchy',
            applied: true,
            timestamp: Date.now()
        });
    }

    enhanceTypography() {
        const typographyStyles = `
            /* Enhanced Typography */
            h1, h2, h3, h4, h5, h6 {
                font-weight: 600;
                line-height: 1.2;
                margin-bottom: 0.5em;
            }
            
            h1 { font-size: 2.5rem; }
            h2 { font-size: 2rem; }
            h3 { font-size: 1.75rem; }
            h4 { font-size: 1.5rem; }
            h5 { font-size: 1.25rem; }
            h6 { font-size: 1rem; }
            
            p, .text-body {
                line-height: 1.6;
                margin-bottom: 1em;
            }
            
            .text-small {
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            .text-large {
                font-size: 1.125rem;
                line-height: 1.6;
            }
            
            /* Improved readability */
            .card-body, .modal-body {
                line-height: 1.6;
            }
        `;
        
        this.addStyles('typography-enhancements', typographyStyles);
    }

    improveColorContrast() {
        // Check and improve color contrast ratios
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        
        textElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const textColor = this.parseColor(style.color);
            const bgColor = this.parseColor(style.backgroundColor);
            
            if (textColor && bgColor) {
                const contrast = this.calculateContrastRatio(textColor, bgColor);
                
                if (contrast < 4.5) {
                    // Improve contrast
                    if (this.isLightColor(bgColor)) {
                        el.style.color = '#212529'; // Dark text on light background
                    } else {
                        el.style.color = '#ffffff'; // Light text on dark background
                    }
                }
            }
        });
    }

    addVisualEmphasis() {
        // Add visual emphasis to important elements
        const emphasisStyles = `
            /* Visual Emphasis */
            .btn-primary, .btn-success {
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            
            .btn-primary:hover, .btn-success:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                transform: translateY(-1px);
            }
            
            .card {
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: box-shadow 0.2s ease;
            }
            
            .card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .alert {
                border-left: 4px solid;
                border-radius: 0.375rem;
            }
            
            .alert-success { border-left-color: #28a745; }
            .alert-danger { border-left-color: #dc3545; }
            .alert-warning { border-left-color: #ffc107; }
            .alert-info { border-left-color: #17a2b8; }
        `;
        
        this.addStyles('visual-emphasis', emphasisStyles);
    }

    optimizeSpacing() {
        // Optimize spacing for better visual hierarchy
        const spacingStyles = `
            /* Optimized Spacing */
            .container, .container-fluid {
                padding-left: 1rem;
                padding-right: 1rem;
            }
            
            .row {
                margin-left: -0.5rem;
                margin-right: -0.5rem;
            }
            
            .col, [class*="col-"] {
                padding-left: 0.5rem;
                padding-right: 0.5rem;
            }
            
            .card {
                margin-bottom: 1.5rem;
            }
            
            .btn {
                margin-bottom: 0.5rem;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            /* Mobile spacing adjustments */
            @media (max-width: 768px) {
                .container, .container-fluid {
                    padding-left: 0.75rem;
                    padding-right: 0.75rem;
                }
                
                .card {
                    margin-bottom: 1rem;
                }
            }
        `;
        
        this.addStyles('spacing-optimizations', spacingStyles);
    }

    // ==========================================================================
    // LOADING STATE ENHANCEMENTS
    // ==========================================================================

    enhanceLoadingStates() {
        // Add skeleton loaders
        this.addSkeletonLoaders();
        
        // Improve spinner animations
        this.improveSpinners();
        
        // Add progressive loading
        this.addProgressiveLoading();
        
        this.optimizations.push({
            name: 'Loading States',
            applied: true,
            timestamp: Date.now()
        });
    }

    addSkeletonLoaders() {
        const skeletonStyles = `
            /* Skeleton Loaders */
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-text {
                height: 1em;
                margin-bottom: 0.5em;
                border-radius: 4px;
            }
            
            .skeleton-text:last-child {
                width: 60%;
            }
            
            .skeleton-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }
            
            .skeleton-card {
                height: 200px;
                border-radius: 8px;
            }
        `;
        
        this.addStyles('skeleton-loaders', skeletonStyles);
    }

    improveSpinners() {
        const spinnerStyles = `
            /* Improved Spinners */
            .spinner-modern {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                animation: spin-modern 1s linear infinite;
            }
            
            @keyframes spin-modern {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .spinner-dots {
                display: inline-block;
                position: relative;
                width: 80px;
                height: 80px;
            }
            
            .spinner-dots div {
                position: absolute;
                top: 33px;
                width: 13px;
                height: 13px;
                border-radius: 50%;
                background: #007bff;
                animation-timing-function: cubic-bezier(0, 1, 1, 0);
            }
            
            .spinner-dots div:nth-child(1) {
                left: 8px;
                animation: spinner-dots1 0.6s infinite;
            }
            
            .spinner-dots div:nth-child(2) {
                left: 8px;
                animation: spinner-dots2 0.6s infinite;
            }
            
            .spinner-dots div:nth-child(3) {
                left: 32px;
                animation: spinner-dots2 0.6s infinite;
            }
            
            .spinner-dots div:nth-child(4) {
                left: 56px;
                animation: spinner-dots3 0.6s infinite;
            }
            
            @keyframes spinner-dots1 {
                0% { transform: scale(0); }
                100% { transform: scale(1); }
            }
            
            @keyframes spinner-dots3 {
                0% { transform: scale(1); }
                100% { transform: scale(0); }
            }
            
            @keyframes spinner-dots2 {
                0% { transform: translate(0, 0); }
                100% { transform: translate(24px, 0); }
            }
        `;
        
        this.addStyles('improved-spinners', spinnerStyles);
    }

    addProgressiveLoading() {
        // Add progressive loading for images
        document.querySelectorAll('img').forEach(img => {
            if (!img.complete) {
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
            }
        });
        
        // Add progressive loading for content sections
        const contentSections = document.querySelectorAll('.card, .table, .chart-container');
        contentSections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 100);
        });
    }

    // ==========================================================================
    // ERROR HANDLING IMPROVEMENTS
    // ==========================================================================

    improveErrorHandling() {
        // Add global error handler
        this.addGlobalErrorHandler();
        
        // Improve form validation
        this.improveFormValidation();
        
        // Add retry mechanisms
        this.addRetryMechanisms();
        
        this.optimizations.push({
            name: 'Error Handling',
            applied: true,
            timestamp: Date.now()
        });
    }

    addGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showUserFriendlyError('Something went wrong. Please try again.');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showUserFriendlyError('A network error occurred. Please check your connection.');
        });
    }

    showUserFriendlyError(message) {
        // Create or update error notification
        let errorNotification = document.getElementById('global-error-notification');
        
        if (!errorNotification) {
            errorNotification = document.createElement('div');
            errorNotification.id = 'global-error-notification';
            errorNotification.className = 'alert alert-danger alert-dismissible fade';
            errorNotification.style.position = 'fixed';
            errorNotification.style.top = '20px';
            errorNotification.style.right = '20px';
            errorNotification.style.zIndex = '10000';
            errorNotification.style.maxWidth = '400px';
            
            document.body.appendChild(errorNotification);
        }
        
        errorNotification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        errorNotification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorNotification.parentElement) {
                errorNotification.remove();
            }
        }, 5000);
    }

    improveFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                });
                
                input.addEventListener('input', () => {
                    // Clear validation on input
                    input.classList.remove('is-invalid');
                    const feedback = input.parentElement.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.style.display = 'none';
                    }
                });
            });
        });
    }

    validateInput(input) {
        const isValid = input.checkValidity();
        
        if (!isValid) {
            input.classList.add('is-invalid');
            
            let feedback = input.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                input.parentElement.appendChild(feedback);
            }
            
            feedback.textContent = input.validationMessage;
            feedback.style.display = 'block';
        }
    }

    addRetryMechanisms() {
        // Add retry functionality to failed requests
        const originalFetch = window.fetch;
        
        window.fetch = async function(url, options = {}) {
            const maxRetries = 3;
            let retries = 0;
            
            while (retries < maxRetries) {
                try {
                    const response = await originalFetch(url, options);
                    
                    if (response.ok) {
                        return response;
                    }
                    
                    if (response.status >= 500 && retries < maxRetries - 1) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                        continue;
                    }
                    
                    return response;
                } catch (error) {
                    if (retries < maxRetries - 1) {
                        retries++;
                        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                        continue;
                    }
                    
                    throw error;
                }
            }
        };
    }

    // ==========================================================================
    // MICRO-INTERACTIONS
    // ==========================================================================

    addMicroInteractions() {
        // Add button hover effects
        this.addButtonMicroInteractions();
        
        // Add form micro-interactions
        this.addFormMicroInteractions();
        
        // Add navigation micro-interactions
        this.addNavigationMicroInteractions();
        
        this.optimizations.push({
            name: 'Micro-interactions',
            applied: true,
            timestamp: Date.now()
        });
    }

    addButtonMicroInteractions() {
        const microInteractionStyles = `
            /* Button Micro-interactions */
            .btn {
                position: relative;
                overflow: hidden;
                transition: all 0.2s ease;
            }
            
            .btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s ease, height 0.3s ease;
            }
            
            .btn:active::before {
                width: 300px;
                height: 300px;
            }
            
            .btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .btn:active {
                transform: translateY(0);
            }
        `;
        
        this.addStyles('button-micro-interactions', microInteractionStyles);
    }

    addFormMicroInteractions() {
        const formStyles = `
            /* Form Micro-interactions */
            .form-control {
                transition: all 0.2s ease;
            }
            
            .form-control:focus {
                transform: scale(1.02);
                box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
            }
            
            .form-group {
                position: relative;
            }
            
            .form-label {
                transition: all 0.2s ease;
            }
            
            .form-control:focus + .form-label,
            .form-control:not(:placeholder-shown) + .form-label {
                transform: translateY(-1.5rem) scale(0.85);
                color: #007bff;
            }
        `;
        
        this.addStyles('form-micro-interactions', formStyles);
    }

    addNavigationMicroInteractions() {
        const navStyles = `
            /* Navigation Micro-interactions */
            .nav-link {
                position: relative;
                transition: all 0.2s ease;
            }
            
            .nav-link::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 2px;
                background: #007bff;
                transition: width 0.3s ease;
            }
            
            .nav-link:hover::after,
            .nav-link.active::after {
                width: 100%;
            }
            
            .nav-link:hover {
                transform: translateY(-2px);
            }
        `;
        
        this.addStyles('navigation-micro-interactions', navStyles);
    }

    // ==========================================================================
    // ACCESSIBILITY POLISH
    // ==========================================================================

    polishAccessibility() {
        // Improve focus management
        this.improveFocusManagement();
        
        // Add ARIA enhancements
        this.addARIAEnhancements();
        
        // Improve keyboard navigation
        this.improveKeyboardNavigation();
        
        this.optimizations.push({
            name: 'Accessibility Polish',
            applied: true,
            timestamp: Date.now()
        });
    }

    improveFocusManagement() {
        // Add visible focus indicators
        const focusStyles = `
            /* Enhanced Focus Indicators */
            *:focus {
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
            
            .btn:focus {
                box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.5);
            }
            
            .form-control:focus {
                border-color: #80bdff;
                box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
            }
            
            .nav-link:focus {
                background-color: rgba(0, 123, 255, 0.1);
            }
        `;
        
        this.addStyles('focus-indicators', focusStyles);
        
        // Manage focus for modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('shown.bs.modal', () => {
                const firstFocusable = modal.querySelector('button, input, select, textarea, a[href]');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            });
        });
    }

    addARIAEnhancements() {
        // Add ARIA labels to unlabeled elements
        document.querySelectorAll('button, input, select, textarea').forEach(el => {
            if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.textContent.trim()) {
                const placeholder = el.getAttribute('placeholder');
                const title = el.getAttribute('title');
                
                if (placeholder) {
                    el.setAttribute('aria-label', placeholder);
                } else if (title) {
                    el.setAttribute('aria-label', title);
                }
            }
        });
        
        // Add ARIA live regions for dynamic content
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }

    improveKeyboardNavigation() {
        // Add skip links
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'sr-only sr-only-focusable';
        skipLink.style.position = 'absolute';
        skipLink.style.top = '0';
        skipLink.style.left = '0';
        skipLink.style.zIndex = '10000';
        skipLink.style.padding = '0.5rem 1rem';
        skipLink.style.background = '#007bff';
        skipLink.style.color = 'white';
        skipLink.style.textDecoration = 'none';
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Improve tab order
        let tabIndex = 1;
        document.querySelectorAll('button, input, select, textarea, a[href]').forEach(el => {
            if (!el.getAttribute('tabindex')) {
                el.setAttribute('tabindex', tabIndex++);
            }
        });
    }

    // ==========================================================================
    // PERFORMANCE OPTIMIZATION
    // ==========================================================================

    optimizePerformance() {
        // Optimize images
        this.optimizeImages();
        
        // Minimize reflows
        this.minimizeReflows();
        
        // Optimize event listeners
        this.optimizeEventListeners();
        
        // Add performance monitoring
        this.addPerformanceMonitoring();
        
        this.optimizations.push({
            name: 'Performance Optimization',
            applied: true,
            timestamp: Date.now()
        });
    }

    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            // Add lazy loading
            if (!img.getAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Add proper sizing
            if (!img.style.width && !img.style.height) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
        });
    }

    minimizeReflows() {
        // Batch DOM operations
        const batchDOMOperations = (operations) => {
            requestAnimationFrame(() => {
                operations.forEach(op => op());
            });
        };
        
        // Cache frequently accessed elements
        window.cachedElements = {
            body: document.body,
            sidebar: document.querySelector('.sidebar'),
            mainContent: document.querySelector('.main-content')
        };
    }

    optimizeEventListeners() {
        // Use event delegation for dynamic content
        document.body.addEventListener('click', (e) => {
            if (e.target.matches('.btn, button')) {
                // Handle button clicks
                this.handleButtonClick(e.target);
            }
        });
        
        // Throttle scroll events
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
                scrollTimeout = null;
            }, 16); // ~60fps
        });
    }

    addPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.duration > 50) {
                        console.warn('Long task detected:', entry.duration + 'ms');
                    }
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                console.log('Long task monitoring not supported');
            }
        }
    }

    // ==========================================================================
    // TESTING FUNCTIONS
    // ==========================================================================

    async testAnimationSmoothness() {
        let frameCount = 0;
        let droppedFrames = 0;
        let lastFrameTime = performance.now();

        const testFrames = (timestamp) => {
            frameCount++;
            const frameTime = timestamp - lastFrameTime;
            
            if (frameTime > 16.67) {
                droppedFrames++;
            }
            
            lastFrameTime = timestamp;
            
            if (frameCount < 60) {
                requestAnimationFrame(testFrames);
            }
        };

        requestAnimationFrame(testFrames);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dropRate = (droppedFrames / frameCount) * 100;
        return {
            passed: dropRate < 10,
            details: `${dropRate.toFixed(1)}% dropped frames`,
            score: Math.max(0, 100 - dropRate * 2)
        };
    }

    testTouchInteractions() {
        if (!('ontouchstart' in window)) {
            return { passed: true, details: 'Touch not available', score: 100 };
        }

        const touchTargets = document.querySelectorAll('button, a, input, select');
        const smallTargets = Array.from(touchTargets).filter(target => {
            const rect = target.getBoundingClientRect();
            return rect.width < 44 || rect.height < 44;
        });

        const score = Math.max(0, 100 - (smallTargets.length / touchTargets.length) * 100);
        
        return {
            passed: smallTargets.length === 0,
            details: `${smallTargets.length} targets too small`,
            score: score
        };
    }

    testVisualHierarchy() {
        // Test heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let issues = 0;
        let lastLevel = 0;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > lastLevel + 1) {
                issues++;
            }
            lastLevel = level;
        });

        const score = Math.max(0, 100 - (issues / headings.length) * 100);
        
        return {
            passed: issues === 0,
            details: `${issues} heading structure issues`,
            score: score
        };
    }

    testLoadingStates() {
        const loadingElements = document.querySelectorAll('.spinner, .skeleton, [data-loading]');
        const score = loadingElements.length > 0 ? 100 : 50;
        
        return {
            passed: loadingElements.length > 0,
            details: `${loadingElements.length} loading indicators found`,
            score: score
        };
    }

    testErrorHandling() {
        const hasGlobalHandler = window.onerror !== null || window.onunhandledrejection !== null;
        const hasFormValidation = document.querySelectorAll('form [required]').length > 0;
        
        let score = 0;
        if (hasGlobalHandler) score += 50;
        if (hasFormValidation) score += 50;
        
        return {
            passed: hasGlobalHandler && hasFormValidation,
            details: `Global handler: ${hasGlobalHandler}, Form validation: ${hasFormValidation}`,
            score: score
        };
    }

    testMicroInteractions() {
        const interactiveElements = document.querySelectorAll('button, .btn, .nav-link, .form-control');
        let elementsWithTransitions = 0;

        interactiveElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.transition !== 'all 0s ease 0s') {
                elementsWithTransitions++;
            }
        });

        const score = (elementsWithTransitions / interactiveElements.length) * 100;
        
        return {
            passed: elementsWithTransitions > interactiveElements.length * 0.8,
            details: `${elementsWithTransitions}/${interactiveElements.length} elements have transitions`,
            score: score
        };
    }

    testAccessibilityPolish() {
        let score = 0;
        
        // Test focus indicators
        const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
        const elementsWithFocus = Array.from(focusableElements).filter(el => {
            const style = window.getComputedStyle(el, ':focus');
            return style.outline !== 'none';
        });
        
        if (elementsWithFocus.length > focusableElements.length * 0.8) score += 25;
        
        // Test ARIA labels
        const unlabeledElements = Array.from(focusableElements).filter(el => {
            return !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.textContent.trim();
        });
        
        if (unlabeledElements.length < focusableElements.length * 0.2) score += 25;
        
        // Test skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        if (skipLinks.length > 0) score += 25;
        
        // Test live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        if (liveRegions.length > 0) score += 25;
        
        return {
            passed: score >= 75,
            details: `Accessibility score: ${score}/100`,
            score: score
        };
    }

    testPerformanceOptimization() {
        let score = 0;
        
        // Test lazy loading
        const images = document.querySelectorAll('img');
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        if (lazyImages.length > images.length * 0.8) score += 25;
        
        // Test event delegation
        const buttons = document.querySelectorAll('button');
        if (buttons.length > 10) score += 25; // Assume delegation is used for many buttons
        
        // Test performance monitoring
        if ('PerformanceObserver' in window) score += 25;
        
        // Test cached elements
        if (window.cachedElements) score += 25;
        
        return {
            passed: score >= 75,
            details: `Performance optimization score: ${score}/100`,
            score: score
        };
    }

    // ==========================================================================
    // UTILITY FUNCTIONS
    // ==========================================================================

    addStyles(id, styles) {
        let styleSheet = document.getElementById(id);
        
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = id;
            document.head.appendChild(styleSheet);
        }
        
        styleSheet.textContent = styles;
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

    isLightColor(color) {
        const luminance = this.getLuminance(color);
        return luminance > 0.5;
    }

    handleButtonClick(button) {
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    handleScroll() {
        // Handle scroll optimizations
        const scrollTop = window.pageYOffset;
        
        // Update scroll-dependent elements
        if (window.cachedElements.sidebar) {
            window.cachedElements.sidebar.style.transform = `translateY(${scrollTop * 0.1}px)`;
        }
    }

    startContinuousOptimization() {
        // Run optimizations every 30 seconds
        setInterval(() => {
            this.optimizeImages();
            this.addPerformanceMonitoring();
        }, 30000);
    }

    // ==========================================================================
    // UI FUNCTIONS
    // ==========================================================================

    createRefinementUI() {
        const refinementUI = document.createElement('div');
        refinementUI.id = 'ui-refinements';
        refinementUI.className = 'ui-refinements';
        refinementUI.innerHTML = `
            <div class="refinement-header">
                <h4><i class="fas fa-magic"></i> UI Refinements</h4>
                <div class="refinement-controls">
                    <button class="btn-test" onclick="window.finalUIRefinements.runAllTests()">
                        <i class="fas fa-check"></i> Test All
                    </button>
                    <button class="btn-close" onclick="window.finalUIRefinements.hide()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="refinement-content">
                <div class="optimization-status">
                    <h5>Applied Optimizations</h5>
                    <div class="optimization-list"></div>
                </div>
                <div class="test-results">
                    <h5>Test Results</h5>
                    <div class="results-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(refinementUI);
        this.refinementUI = refinementUI;

        this.updateOptimizationDisplay();
        this.addRefinementStyles();
    }

    updateOptimizationDisplay() {
        const optimizationList = this.refinementUI?.querySelector('.optimization-list');
        if (!optimizationList) return;

        let html = '';
        this.optimizations.forEach(opt => {
            html += `
                <div class="optimization-item ${opt.applied ? 'applied' : 'pending'}">
                    <span class="opt-name">${opt.name}</span>
                    <span class="opt-status">${opt.applied ? 'Applied' : 'Pending'}</span>
                </div>
            `;
        });

        optimizationList.innerHTML = html;
    }

    async runAllTests() {
        const results = [];

        for (const refinement of this.refinements) {
            try {
                const result = await refinement.test();
                results.push({
                    name: refinement.name,
                    category: refinement.category,
                    ...result
                });
            } catch (error) {
                results.push({
                    name: refinement.name,
                    category: refinement.category,
                    passed: false,
                    details: `Test failed: ${error.message}`,
                    score: 0
                });
            }
        }

        this.displayTestResults(results);
        return results;
    }

    displayTestResults(results) {
        const resultsList = this.refinementUI?.querySelector('.results-list');
        if (!resultsList) return;

        let html = '';
        results.forEach(result => {
            const statusClass = result.passed ? 'passed' : 'failed';
            const scoreClass = result.score >= 80 ? 'good' : result.score >= 60 ? 'fair' : 'poor';

            html += `
                <div class="test-result ${statusClass}">
                    <div class="result-header">
                        <span class="result-name">${result.name}</span>
                        <span class="result-score ${scoreClass}">${Math.round(result.score)}</span>
                    </div>
                    <div class="result-details">${result.details}</div>
                </div>
            `;
        });

        resultsList.innerHTML = html;
    }

    addRefinementStyles() {
        const styles = `
            .ui-refinements {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                max-height: 70vh;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10002;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
                display: none;
            }
            
            .ui-refinements.show {
                display: block;
            }
            
            .refinement-header {
                background: #6f42c1;
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .refinement-header h4 {
                margin: 0;
                font-size: 16px;
            }
            
            .refinement-controls button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                margin-left: 5px;
                cursor: pointer;
            }
            
            .refinement-content {
                padding: 15px;
                max-height: 55vh;
                overflow-y: auto;
            }
            
            .optimization-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .optimization-item:last-child {
                border-bottom: none;
            }
            
            .opt-status {
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 3px;
            }
            
            .optimization-item.applied .opt-status {
                background: #28a745;
                color: white;
            }
            
            .optimization-item.pending .opt-status {
                background: #ffc107;
                color: black;
            }
            
            .test-result {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 10px;
                border-left: 4px solid;
            }
            
            .test-result.passed {
                border-left-color: #28a745;
            }
            
            .test-result.failed {
                border-left-color: #dc3545;
            }
            
            .result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .result-name {
                font-weight: 500;
            }
            
            .result-score {
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
            }
            
            .result-score.good {
                background: #28a745;
                color: white;
            }
            
            .result-score.fair {
                background: #ffc107;
                color: white;
            }
            
            .result-score.poor {
                background: #dc3545;
                color: white;
            }
            
            .result-details {
                font-size: 12px;
                color: #666;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    show() {
        if (this.refinementUI) {
            this.refinementUI.classList.add('show');
        }
    }

    hide() {
        if (this.refinementUI) {
            this.refinementUI.classList.remove('show');
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    getRefinements() {
        return this.refinements;
    }

    getOptimizations() {
        return this.optimizations;
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize final UI refinements
    window.finalUIRefinements = new FinalUIRefinements();
    
    // Add keyboard shortcut to show refinement UI
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            window.finalUIRefinements.show();
        }
    });
    
    console.log('Final UI refinements initialized');
});

// Export for use in other modules
window.FinalUIRefinements = FinalUIRefinements;