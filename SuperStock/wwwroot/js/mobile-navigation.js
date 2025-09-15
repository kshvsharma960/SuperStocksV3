// ==========================================================================
// MOBILE NAVIGATION - Mobile-optimized navigation and menu interactions
// ==========================================================================

class MobileNavigation {
    constructor() {
        this.init();
        this.bindEvents();
    }

    init() {
        this.createMobileElements();
        this.setupResponsiveNavigation();
    }

    createMobileElements() {
        // Create mobile menu toggle if it doesn't exist
        if (!document.querySelector('.mobile-menu-toggle')) {
            const toggle = document.createElement('button');
            toggle.className = 'mobile-menu-toggle';
            toggle.innerHTML = `
                <div class="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            
            // Insert toggle into header
            const header = document.querySelector('.top-bar') || document.querySelector('header');
            if (header) {
                header.insertBefore(toggle, header.firstChild);
            }
        }

        // Add mobile classes to existing navigation
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('mobile-nav');
        }
    }

    setupResponsiveNavigation() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            // Add overlay for mobile
            const overlay = document.createElement('div');
            overlay.className = 'mobile-nav-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1040;
                opacity: 0;
                visibility: hidden;
                transition: all 0.25s ease-in-out;
            `;
            document.body.appendChild(overlay);
        }
    }

    bindEvents() {
        // Mobile menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mobile-menu-toggle')) {
                this.toggleMobileMenu();
            }
        });

        // Close mobile menu when clicking overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mobile-nav-overlay')) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu when clicking nav link
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mobile-nav .nav-link')) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });

        // Prevent body scroll when mobile menu is open
        document.addEventListener('touchmove', (e) => {
            if (document.body.classList.contains('mobile-nav-open')) {
                if (!e.target.closest('.mobile-nav')) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
    }

    toggleMobileMenu() {
        const isOpen = document.body.classList.contains('mobile-nav-open');
        if (isOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-nav-overlay');
        const hamburger = document.querySelector('.hamburger');

        if (sidebar) {
            sidebar.classList.add('active');
        }

        if (overlay) {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
        }

        if (hamburger) {
            hamburger.classList.add('active');
        }

        document.body.classList.add('mobile-nav-open');
        document.body.style.overflow = 'hidden';

        // Focus management for accessibility
        const firstNavLink = sidebar?.querySelector('.nav-link');
        if (firstNavLink) {
            firstNavLink.focus();
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-nav-overlay');
        const hamburger = document.querySelector('.hamburger');

        if (sidebar) {
            sidebar.classList.remove('active');
        }

        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
        }

        if (hamburger) {
            hamburger.classList.remove('active');
        }

        document.body.classList.remove('mobile-nav-open');
        document.body.style.overflow = '';
    }
}

// ==========================================================================
// TOUCH GESTURES - Touch gesture handling for mobile interactions
// ==========================================================================

class TouchGestureHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.threshold = 50; // Minimum distance for swipe
        this.restraint = 100; // Maximum perpendicular distance
        this.allowedTime = 300; // Maximum time for swipe
        this.startTime = 0;

        this.init();
    }

    init() {
        this.bindSwipeEvents();
        this.bindPullToRefresh();
        this.bindLongPress();
    }

    bindSwipeEvents() {
        // Swipe gestures for tables and charts
        const swipeableElements = document.querySelectorAll('.table-mobile, .chart-container, .swipeable');
        
        swipeableElements.forEach(element => {
            this.addSwipeListeners(element);
        });
    }

    addSwipeListeners(element) {
        element.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e, element);
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e, element);
        }, { passive: false });

        element.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e, element);
        }, { passive: true });
    }

    handleTouchStart(e, element) {
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.startTime = new Date().getTime();
        this.isDragging = false;

        element.classList.add('touch-active');
    }

    handleTouchMove(e, element) {
        if (!e.touches[0]) return;

        const touch = e.touches[0];
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;

        // Check if this is a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.isDragging = true;
            element.classList.add('swiping');

            // For horizontal scrollable elements, allow native scrolling
            if (element.scrollWidth > element.clientWidth) {
                return;
            }

            // Prevent vertical scrolling during horizontal swipe
            e.preventDefault();
        }
    }

    handleTouchEnd(e, element) {
        if (!this.isDragging) {
            element.classList.remove('touch-active');
            return;
        }

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const elapsedTime = new Date().getTime() - this.startTime;

        element.classList.remove('touch-active', 'swiping');

        // Check if swipe meets criteria
        if (elapsedTime <= this.allowedTime && 
            Math.abs(deltaX) >= this.threshold && 
            Math.abs(deltaY) <= this.restraint) {
            
            if (deltaX > 0) {
                this.handleSwipeRight(element);
            } else {
                this.handleSwipeLeft(element);
            }
        }

        this.isDragging = false;
    }

    handleSwipeLeft(element) {
        // Emit custom event
        element.dispatchEvent(new CustomEvent('swipeleft', {
            detail: { element }
        }));

        // Handle specific swipe actions
        if (element.classList.contains('watchlist-item')) {
            this.showSwipeActions(element);
        }
    }

    handleSwipeRight(element) {
        // Emit custom event
        element.dispatchEvent(new CustomEvent('swiperight', {
            detail: { element }
        }));

        // Handle specific swipe actions
        if (element.classList.contains('watchlist-item')) {
            this.hideSwipeActions(element);
        }
    }

    showSwipeActions(element) {
        const actions = element.querySelector('.swipe-actions');
        if (actions) {
            actions.classList.add('visible');
            element.style.transform = 'translateX(-80px)';
        }
    }

    hideSwipeActions(element) {
        const actions = element.querySelector('.swipe-actions');
        if (actions) {
            actions.classList.remove('visible');
            element.style.transform = '';
        }
    }

    bindPullToRefresh() {
        const refreshableElements = document.querySelectorAll('.pull-to-refresh');
        
        refreshableElements.forEach(element => {
            let startY = 0;
            let currentY = 0;
            let isPulling = false;

            element.addEventListener('touchstart', (e) => {
                if (element.scrollTop === 0) {
                    startY = e.touches[0].clientY;
                }
            }, { passive: true });

            element.addEventListener('touchmove', (e) => {
                if (element.scrollTop === 0 && startY) {
                    currentY = e.touches[0].clientY;
                    const pullDistance = currentY - startY;

                    if (pullDistance > 0) {
                        isPulling = true;
                        element.classList.add('pulling');
                        
                        if (pullDistance > 80) {
                            element.classList.add('ready-to-refresh');
                        } else {
                            element.classList.remove('ready-to-refresh');
                        }

                        // Prevent default scrolling
                        e.preventDefault();
                    }
                }
            }, { passive: false });

            element.addEventListener('touchend', () => {
                if (isPulling && element.classList.contains('ready-to-refresh')) {
                    this.triggerRefresh(element);
                }

                element.classList.remove('pulling', 'ready-to-refresh');
                isPulling = false;
                startY = 0;
            }, { passive: true });
        });
    }

    triggerRefresh(element) {
        element.classList.add('refreshing');
        
        // Emit refresh event
        element.dispatchEvent(new CustomEvent('pullrefresh', {
            detail: { element }
        }));

        // Auto-hide after 2 seconds if not manually hidden
        setTimeout(() => {
            element.classList.remove('refreshing');
        }, 2000);
    }

    bindLongPress() {
        const longPressElements = document.querySelectorAll('.long-pressable');
        
        longPressElements.forEach(element => {
            let pressTimer;
            let startX, startY;

            element.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                
                element.classList.add('long-pressing');
                
                pressTimer = setTimeout(() => {
                    element.dispatchEvent(new CustomEvent('longpress', {
                        detail: { element }
                    }));
                    element.classList.remove('long-pressing');
                }, 800);
            }, { passive: true });

            element.addEventListener('touchmove', (e) => {
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = Math.abs(currentX - startX);
                const deltaY = Math.abs(currentY - startY);

                // Cancel long press if finger moves too much
                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(pressTimer);
                    element.classList.remove('long-pressing');
                }
            }, { passive: true });

            element.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
                element.classList.remove('long-pressing');
            }, { passive: true });
        });
    }
}

// ==========================================================================
// MOBILE OPTIMIZATIONS - Performance and UX optimizations for mobile
// ==========================================================================

class MobileOptimizations {
    constructor() {
        this.init();
    }

    init() {
        this.setupViewportMeta();
        this.optimizeScrolling();
        this.handleOrientationChange();
        this.setupTouchFeedback();
        this.optimizeInputs();
        this.setupEnhancedTouchTargets();
        this.setupAccessibilityEnhancements();
        this.setupPerformanceOptimizations();
    }

    setupViewportMeta() {
        // Ensure proper viewport meta tag
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    optimizeScrolling() {
        // Add momentum scrolling for iOS
        const scrollableElements = document.querySelectorAll('.modal-body, .table-container, .chart-container');
        
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
        });
    }

    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Force repaint after orientation change
            setTimeout(() => {
                window.scrollTo(0, 0);
                
                // Trigger resize event for charts
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });
    }

    setupTouchFeedback() {
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll('button, .btn, .nav-link, .card-clickable');
        
        interactiveElements.forEach(element => {
            if (!element.classList.contains('touch-feedback')) {
                element.classList.add('touch-feedback');
            }
        });
    }

    optimizeInputs() {
        // Prevent zoom on input focus for iOS
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (!input.classList.contains('no-zoom')) {
                input.classList.add('no-zoom');
            }
        });

        // Add proper input types for mobile keyboards
        const emailInputs = document.querySelectorAll('input[name*="email"], input[id*="email"]');
        emailInputs.forEach(input => {
            input.type = 'email';
        });

        const phoneInputs = document.querySelectorAll('input[name*="phone"], input[id*="phone"]');
        phoneInputs.forEach(input => {
            input.type = 'tel';
        });

        const numberInputs = document.querySelectorAll('input[name*="quantity"], input[name*="price"], input[name*="amount"]');
        numberInputs.forEach(input => {
            input.type = 'number';
            input.inputMode = 'decimal';
        });
    }

    setupEnhancedTouchTargets() {
        // Enhance all interactive elements with proper touch targets
        const interactiveElements = document.querySelectorAll(
            'button, .btn, a, input, select, textarea, .nav-link, .card-clickable, .dropdown-toggle'
        );
        
        interactiveElements.forEach(element => {
            // Ensure minimum touch target size
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.classList.add('touch-target');
            }
            
            // Add touch feedback
            if (!element.classList.contains('touch-feedback')) {
                element.classList.add('touch-feedback');
            }
            
            // Add enhanced touch classes for mobile
            element.classList.add('btn-mobile-enhanced');
        });
        
        // Add mobile-optimized classes to existing components
        this.addMobileOptimizedClasses();
    }
    
    addMobileOptimizedClasses() {
        // Add mobile-optimized classes to existing elements
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.classList.add('card-mobile-optimized'));
        
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.classList.add('form-mobile-optimized'));
        
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => table.classList.add('table-mobile-optimized'));
        
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('modal-mobile-optimized'));
        
        const searchContainers = document.querySelectorAll('.search-container');
        searchContainers.forEach(container => container.classList.add('search-mobile-optimized'));
        
        const dashboards = document.querySelectorAll('.dashboard');
        dashboards.forEach(dashboard => dashboard.classList.add('dashboard-mobile-optimized'));
        
        const navs = document.querySelectorAll('.sidebar, .nav');
        navs.forEach(nav => nav.classList.add('nav-mobile-optimized'));
    }

    setupAccessibilityEnhancements() {
        // Add proper ARIA labels for mobile screen readers
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            const text = button.textContent.trim() || button.title || 'Button';
            button.setAttribute('aria-label', text);
        });

        // Enhance form labels
        const inputs = document.querySelectorAll('input:not([aria-label])');
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`) || 
                         input.closest('.form-group')?.querySelector('label');
            if (label) {
                input.setAttribute('aria-label', label.textContent.trim());
            }
        });

        // Add role attributes for better navigation
        const navElements = document.querySelectorAll('.nav, .navbar, .sidebar');
        navElements.forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });
    }

    setupPerformanceOptimizations() {
        // Implement passive event listeners where possible
        const scrollElements = document.querySelectorAll('.modal-body, .table-container, .chart-container');
        scrollElements.forEach(element => {
            element.addEventListener('scroll', this.throttle(() => {
                // Update scroll indicators or other UI elements
                this.updateScrollIndicators(element);
            }, 16), { passive: true });
        });

        // Optimize animations for mobile
        if (window.innerWidth <= 768) {
            document.documentElement.style.setProperty('--transition-fast', '0.15s');
            document.documentElement.style.setProperty('--transition-normal', '0.25s');
        }
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    updateScrollIndicators(element) {
        const indicator = element.querySelector('.scroll-indicator');
        if (indicator) {
            const scrollPercent = (element.scrollLeft / (element.scrollWidth - element.clientWidth)) * 100;
            indicator.style.width = `${scrollPercent}%`;
            indicator.classList.toggle('visible', element.scrollLeft > 0);
        }
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile navigation
    new MobileNavigation();
    
    // Initialize touch gestures
    new TouchGestureHandler();
    
    // Initialize mobile optimizations
    new MobileOptimizations();
});

// Export for use in other modules
window.MobileNavigation = MobileNavigation;
window.TouchGestureHandler = TouchGestureHandler;
window.MobileOptimizations = MobileOptimizations;
// ==
========================================================================
// ENHANCED MOBILE NAVIGATION GESTURES
// ==========================================================================

class EnhancedMobileNavigation extends MobileNavigation {
    constructor() {
        super();
        this.setupSwipeNavigation();
        this.setupEdgeSwipe();
        this.setupNavigationGestures();
    }

    setupSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!e.touches[0]) return;

            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;

            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            // Check for horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                isDragging = true;

                // Right swipe from left edge to open menu
                if (startX < 50 && deltaX > 100) {
                    this.openMobileMenu();
                }

                // Left swipe to close menu when open
                if (document.body.classList.contains('mobile-nav-open') && deltaX < -100) {
                    this.closeMobileMenu();
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            isDragging = false;
        }, { passive: true });
    }

    setupEdgeSwipe() {
        // Enhanced edge swipe detection
        const edgeThreshold = 20;
        let edgeSwipeStarted = false;

        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            if (touch.clientX <= edgeThreshold) {
                edgeSwipeStarted = true;
                this.showEdgeSwipeIndicator();
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (edgeSwipeStarted && e.touches[0]) {
                const deltaX = e.touches[0].clientX - edgeThreshold;
                if (deltaX > 50) {
                    this.openMobileMenu();
                    edgeSwipeStarted = false;
                    this.hideEdgeSwipeIndicator();
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            edgeSwipeStarted = false;
            this.hideEdgeSwipeIndicator();
        }, { passive: true });
    }

    showEdgeSwipeIndicator() {
        let indicator = document.querySelector('.edge-swipe-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'edge-swipe-indicator';
            indicator.style.cssText = `
                position: fixed;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 60px;
                background: var(--color-primary);
                border-radius: 0 4px 4px 0;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.opacity = '0.7';
    }

    hideEdgeSwipeIndicator() {
        const indicator = document.querySelector('.edge-swipe-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
        }
    }

    setupNavigationGestures() {
        // Add haptic-like feedback for navigation actions
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('touchstart', () => {
                link.classList.add('haptic-light');
            }, { passive: true });

            link.addEventListener('touchend', () => {
                setTimeout(() => {
                    link.classList.remove('haptic-light');
                }, 150);
            }, { passive: true });
        });

        // Enhanced menu toggle with gesture feedback
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        if (menuToggle) {
            let pressTimer;
            
            menuToggle.addEventListener('touchstart', () => {
                menuToggle.classList.add('haptic-medium');
                
                // Long press to show navigation shortcuts
                pressTimer = setTimeout(() => {
                    this.showNavigationShortcuts();
                }, 800);
            }, { passive: true });

            menuToggle.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
                setTimeout(() => {
                    menuToggle.classList.remove('haptic-medium');
                }, 200);
            }, { passive: true });
        }
    }

    showNavigationShortcuts() {
        // Create navigation shortcuts overlay
        const shortcuts = document.createElement('div');
        shortcuts.className = 'navigation-shortcuts';
        shortcuts.innerHTML = `
            <div class="shortcuts-container">
                <div class="shortcut-item" data-action="dashboard">
                    <i class="fas fa-chart-line"></i>
                    <span>Dashboard</span>
                </div>
                <div class="shortcut-item" data-action="watchlist">
                    <i class="fas fa-eye"></i>
                    <span>Watchlist</span>
                </div>
                <div class="shortcut-item" data-action="leaderboard">
                    <i class="fas fa-trophy"></i>
                    <span>Leaderboard</span>
                </div>
                <div class="shortcut-item" data-action="profile">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </div>
            </div>
        `;

        shortcuts.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const container = shortcuts.querySelector('.shortcuts-container');
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            padding: 40px;
        `;

        const items = shortcuts.querySelectorAll('.shortcut-item');
        items.forEach(item => {
            item.style.cssText = `
                background: var(--bg-card);
                border-radius: 16px;
                padding: 24px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 100px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
            `;

            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.handleShortcutAction(action);
                document.body.removeChild(shortcuts);
            });
        });

        document.body.appendChild(shortcuts);

        // Close on background click
        shortcuts.addEventListener('click', (e) => {
            if (e.target === shortcuts) {
                document.body.removeChild(shortcuts);
            }
        });
    }

    handleShortcutAction(action) {
        const routes = {
            dashboard: '/Home',
            watchlist: '/Home#watchlist',
            leaderboard: '/Home/Leaderboard',
            profile: '/User/Profile'
        };

        if (routes[action]) {
            window.location.href = routes[action];
        }
    }
}

// ==========================================================================
// ENHANCED TOUCH FEEDBACK SYSTEM
// ==========================================================================

class EnhancedTouchFeedback {
    constructor() {
        this.init();
    }

    init() {
        this.setupRippleEffect();
        this.setupHapticFeedback();
        this.setupTouchStates();
    }

    setupRippleEffect() {
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.btn, .nav-link, .card-clickable');
            if (target && !target.classList.contains('no-ripple')) {
                this.createRipple(target, e.touches[0]);
            }
        }, { passive: true });
    }

    createRipple(element, touch) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = touch.clientX - rect.left - size / 2;
        const y = touch.clientY - rect.top - size / 2;

        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;

        // Ensure element has relative positioning
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(ripple);

        // Add CSS animation if not exists
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple-animation {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    setupHapticFeedback() {
        // Visual haptic feedback for different interaction types
        const lightElements = document.querySelectorAll('.btn-sm, .nav-link');
        const mediumElements = document.querySelectorAll('.btn, .card-clickable');
        const heavyElements = document.querySelectorAll('.btn-lg, .fab');

        lightElements.forEach(el => el.classList.add('haptic-light'));
        mediumElements.forEach(el => el.classList.add('haptic-medium'));
        heavyElements.forEach(el => el.classList.add('haptic-heavy'));
    }

    setupTouchStates() {
        // Enhanced touch states for better feedback
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.btn, .nav-link, .card-clickable');
            if (target) {
                target.classList.add('touch-active');
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('.btn, .nav-link, .card-clickable');
            if (target) {
                setTimeout(() => {
                    target.classList.remove('touch-active');
                }, 150);
            }
        }, { passive: true });

        document.addEventListener('touchcancel', (e) => {
            const target = e.target.closest('.btn, .nav-link, .card-clickable');
            if (target) {
                target.classList.remove('touch-active');
            }
        }, { passive: true });
    }
}

// ==========================================================================
// MOBILE PERFORMANCE MONITOR
// ==========================================================================

class MobilePerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        this.monitorScrollPerformance();
        this.optimizeAnimations();
        this.setupLazyLoading();
    }

    monitorScrollPerformance() {
        let ticking = false;

        const updateScrollElements = () => {
            // Update scroll-dependent elements
            const scrollableElements = document.querySelectorAll('.scrollable');
            scrollableElements.forEach(element => {
                this.updateScrollIndicators(element);
            });
            ticking = false;
        };

        document.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollElements);
                ticking = true;
            }
        }, { passive: true });
    }

    updateScrollIndicators(element) {
        const indicator = element.querySelector('.scroll-indicator');
        if (indicator) {
            const scrollPercent = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
            indicator.style.width = `${Math.min(scrollPercent, 100)}%`;
            indicator.classList.toggle('visible', element.scrollTop > 0);
        }
    }

    optimizeAnimations() {
        // Reduce animations on low-end devices
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.documentElement.style.setProperty('--transition-fast', '0.1s');
            document.documentElement.style.setProperty('--transition-normal', '0.2s');
        }

        // Pause animations when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('animations-paused');
            } else {
                document.body.classList.remove('animations-paused');
            }
        });
    }

    setupLazyLoading() {
        // Lazy load images and heavy content
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// ==========================================================================
// INITIALIZATION - Enhanced Mobile Features
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Replace basic mobile navigation with enhanced version
    if (window.innerWidth <= 768) {
        new EnhancedMobileNavigation();
        new EnhancedTouchFeedback();
        new MobilePerformanceMonitor();
    }
});