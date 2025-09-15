// ==========================================================================
// ORIENTATION HANDLER - Handle orientation changes and adaptive layouts
// ==========================================================================

class OrientationHandler {
    constructor() {
        this.currentOrientation = this.getOrientation();
        this.isTransitioning = false;
        this.transitionTimeout = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.applyInitialClasses();
        this.setupViewportHeightFix();
    }

    bindEvents() {
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });

        // Handle resize as fallback
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle visual viewport changes (for keyboard)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportResize();
            });
        }

        // Handle device motion for better orientation detection
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                this.handleDeviceOrientation(e);
            });
        }
    }

    getOrientation() {
        // Use screen.orientation if available
        if (screen.orientation) {
            return screen.orientation.angle;
        }
        
        // Fallback to window.orientation
        if (window.orientation !== undefined) {
            return window.orientation;
        }
        
        // Fallback to aspect ratio
        return window.innerWidth > window.innerHeight ? 90 : 0;
    }

    isPortrait() {
        const orientation = this.getOrientation();
        return orientation === 0 || orientation === 180;
    }

    isLandscape() {
        const orientation = this.getOrientation();
        return orientation === 90 || orientation === -90;
    }

    handleOrientationChange() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // Add transition class
        document.body.classList.add('orientation-transition');
        
        // Clear any existing timeout
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        
        // Wait for orientation to stabilize
        this.transitionTimeout = setTimeout(() => {
            this.updateOrientation();
        }, 100);
    }

    handleResize() {
        // Debounce resize events
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            const newOrientation = this.getOrientation();
            if (newOrientation !== this.currentOrientation) {
                this.updateOrientation();
            }
        }, 150);
    }

    handleViewportResize() {
        // Handle keyboard show/hide
        const viewport = window.visualViewport;
        const isKeyboardOpen = viewport.height < window.innerHeight * 0.75;
        
        document.body.classList.toggle('keyboard-open', isKeyboardOpen);
        
        // Adjust elements for keyboard
        if (isKeyboardOpen) {
            this.adjustForKeyboard();
        } else {
            this.restoreFromKeyboard();
        }
    }

    handleDeviceOrientation(event) {
        // Use device orientation for more accurate detection
        const { alpha, beta, gamma } = event;
        
        // Determine orientation based on device tilt
        let orientation;
        if (Math.abs(gamma) > Math.abs(beta)) {
            orientation = gamma > 0 ? 90 : -90;
        } else {
            orientation = beta > 0 ? 180 : 0;
        }
        
        if (orientation !== this.currentOrientation) {
            this.currentOrientation = orientation;
            this.updateOrientationClasses();
        }
    }

    updateOrientation() {
        const newOrientation = this.getOrientation();
        
        if (newOrientation !== this.currentOrientation) {
            this.currentOrientation = newOrientation;
            this.updateOrientationClasses();
        }
        
        // Update viewport height
        this.updateViewportHeight();
        
        // Notify components of orientation change
        this.notifyComponents();
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('orientation-transition');
            this.isTransitioning = false;
        }, 300);
    }

    updateOrientationClasses() {
        const body = document.body;
        
        // Remove existing orientation classes
        body.classList.remove('portrait', 'landscape', 'landscape-left', 'landscape-right');
        
        // Add new orientation classes
        if (this.isPortrait()) {
            body.classList.add('portrait');
        } else if (this.isLandscape()) {
            body.classList.add('landscape');
            
            // Add specific landscape direction
            if (this.currentOrientation === 90) {
                body.classList.add('landscape-left');
            } else if (this.currentOrientation === -90) {
                body.classList.add('landscape-right');
            }
        }
        
        // Add device-specific classes
        this.addDeviceSpecificClasses();
    }

    addDeviceSpecificClasses() {
        const body = document.body;
        const { innerWidth, innerHeight } = window;
        
        // Small screen detection
        if (innerHeight <= 667 && innerWidth <= 375) {
            body.classList.add('small-screen-optimize');
        } else {
            body.classList.remove('small-screen-optimize');
        }
        
        // Tall screen detection
        if (innerHeight >= 800) {
            body.classList.add('tall-screen-optimize');
        } else {
            body.classList.remove('tall-screen-optimize');
        }
        
        // Foldable device detection
        if (window.screen && window.screen.isExtended) {
            body.classList.add('foldable-device');
        }
    }

    applyInitialClasses() {
        this.updateOrientationClasses();
        
        // Add adaptive classes to components
        this.addAdaptiveClasses();
    }

    addAdaptiveClasses() {
        // Add classes to tables
        document.querySelectorAll('table, .table-container').forEach(element => {
            element.classList.add('table-orientation-adaptive');
        });
        
        // Add classes to forms
        document.querySelectorAll('form, .form-container').forEach(element => {
            element.classList.add('form-orientation-adaptive');
        });
        
        // Add classes to charts
        document.querySelectorAll('.chart-container').forEach(element => {
            element.classList.add('chart-orientation-adaptive');
        });
        
        // Add classes to notifications
        document.querySelectorAll('.toast, .alert').forEach(element => {
            element.classList.add('notification-orientation-adaptive');
        });
    }

    setupViewportHeightFix() {
        // Fix for mobile browsers that change viewport height
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
    }

    updateViewportHeight() {
        // Update CSS custom property for viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Update elements that use viewport height
        document.querySelectorAll('.viewport-height-adaptive').forEach(element => {
            element.style.height = `${window.innerHeight}px`;
        });
    }

    adjustForKeyboard() {
        // Adjust modals for keyboard
        document.querySelectorAll('.modal.show').forEach(modal => {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.style.paddingBottom = '50vh';
            }
        });
        
        // Adjust bottom sheets
        document.querySelectorAll('.bottom-sheet.active').forEach(sheet => {
            sheet.style.transform = 'translateY(-30vh)';
        });
        
        // Adjust FAB
        document.querySelectorAll('.fab').forEach(fab => {
            fab.style.bottom = '60vh';
        });
    }

    restoreFromKeyboard() {
        // Restore modal padding
        document.querySelectorAll('.modal .modal-body').forEach(modalBody => {
            modalBody.style.paddingBottom = '';
        });
        
        // Restore bottom sheets
        document.querySelectorAll('.bottom-sheet').forEach(sheet => {
            sheet.style.transform = '';
        });
        
        // Restore FAB
        document.querySelectorAll('.fab').forEach(fab => {
            fab.style.bottom = '';
        });
    }

    notifyComponents() {
        // Notify charts to resize
        window.dispatchEvent(new Event('resize'));
        
        // Notify custom components
        document.dispatchEvent(new CustomEvent('orientationchange', {
            detail: {
                orientation: this.currentOrientation,
                isPortrait: this.isPortrait(),
                isLandscape: this.isLandscape()
            }
        }));
        
        // Resize charts specifically
        this.resizeCharts();
        
        // Recalculate table layouts
        this.recalculateTableLayouts();
        
        // Update modal layouts
        this.updateModalLayouts();
    }

    resizeCharts() {
        // Resize Chart.js charts
        if (window.Chart) {
            Object.values(window.Chart.instances).forEach(chart => {
                if (chart && chart.resize) {
                    setTimeout(() => chart.resize(), 100);
                }
            });
        }
        
        // Resize custom charts
        document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
            if (canvas.chart && canvas.chart.resize) {
                setTimeout(() => canvas.chart.resize(), 100);
            }
        });
    }

    recalculateTableLayouts() {
        // Force table reflow
        document.querySelectorAll('.table-responsive').forEach(container => {
            const display = container.style.display;
            container.style.display = 'none';
            container.offsetHeight; // Trigger reflow
            container.style.display = display;
        });
        
        // Update mobile table cards
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.mobile-table-card').forEach(card => {
                card.classList.add('orientation-animate');
                setTimeout(() => {
                    card.classList.remove('orientation-animate');
                }, 300);
            });
        }
    }

    updateModalLayouts() {
        // Update modal sizes and positions
        document.querySelectorAll('.modal.show').forEach(modal => {
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog) {
                // Force recalculation
                dialog.style.transform = 'none';
                dialog.offsetHeight; // Trigger reflow
                dialog.style.transform = '';
            }
        });
    }

    // Public methods
    getCurrentOrientation() {
        return this.currentOrientation;
    }

    isCurrentlyPortrait() {
        return this.isPortrait();
    }

    isCurrentlyLandscape() {
        return this.isLandscape();
    }

    forceUpdate() {
        this.updateOrientation();
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize orientation handler
    window.orientationHandler = new OrientationHandler();
});

// Export for use in other modules
window.OrientationHandler = OrientationHandler;