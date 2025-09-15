// ==========================================================================
// MODERN APP - Main application JavaScript
// ==========================================================================

class ModernApp {
    constructor() {
        this.errorHandler = null;
        this.errorBoundaries = new Map();
        this.errorAnalytics = null;
        this.init();
    }

    init() {
        // Initialize error handling first
        this.initializeErrorHandling();
        
        // Wrap initialization in error boundary
        this.withErrorBoundary('app-initialization', () => {
            this.initializeComponents();
            this.setupEventListeners();
            this.initializeAnimations();
            this.setupTheme();
        });
    }

    /**
     * Initialize enhanced error handling system
     */
    initializeErrorHandling() {
        try {
            // Initialize enhanced error handler if available
            if (window.EnhancedErrorHandler) {
                this.errorHandler = new window.EnhancedErrorHandler();
                this.errorHandler.initialize();
                
                // Set up error analytics integration
                this.setupErrorAnalytics();
                
                // Set up application-wide error boundaries
                this.setupErrorBoundaries();
                
                console.log('ModernApp: Enhanced error handling initialized');
            } else {
                console.warn('ModernApp: Enhanced error handler not available, using fallback');
                this.setupFallbackErrorHandling();
            }
        } catch (error) {
            console.error('ModernApp: Failed to initialize error handling:', error);
            this.setupFallbackErrorHandling();
        }
    }

    /**
     * Set up error analytics and monitoring integration
     */
    setupErrorAnalytics() {
        this.errorAnalytics = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            errorCount: 0,
            criticalErrorCount: 0,
            lastErrorTime: null,
            
            // Track error occurrence
            trackError: (errorContext) => {
                this.errorAnalytics.errorCount++;
                this.errorAnalytics.lastErrorTime = Date.now();
                
                if (errorContext.type === 'critical') {
                    this.errorAnalytics.criticalErrorCount++;
                }
                
                // Send to monitoring service if available
                this.sendErrorToMonitoring(errorContext);
                
                // Log error metrics
                this.logErrorMetrics(errorContext);
            },
            
            // Get session statistics
            getSessionStats: () => ({
                sessionId: this.errorAnalytics.sessionId,
                sessionDuration: Date.now() - this.errorAnalytics.startTime,
                totalErrors: this.errorAnalytics.errorCount,
                criticalErrors: this.errorAnalytics.criticalErrorCount,
                lastError: this.errorAnalytics.lastErrorTime,
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        };
        
        // Integrate with error handler
        if (this.errorHandler) {
            const originalProcessError = this.errorHandler.processError.bind(this.errorHandler);
            this.errorHandler.processError = (errorContext) => {
                this.errorAnalytics.trackError(errorContext);
                return originalProcessError(errorContext);
            };
        }
    }

    /**
     * Set up application-wide error boundaries
     */
    setupErrorBoundaries() {
        // Component initialization boundary
        this.createErrorBoundary('component-initialization', {
            onError: (error, context) => {
                console.error('Component initialization error:', error);
                this.handleComponentInitializationError(error, context);
            },
            recovery: () => {
                console.log('Attempting component recovery...');
                this.attemptComponentRecovery();
            }
        });
        
        // Event handling boundary
        this.createErrorBoundary('event-handling', {
            onError: (error, context) => {
                console.error('Event handling error:', error);
                this.handleEventError(error, context);
            },
            recovery: () => {
                console.log('Re-initializing event listeners...');
                this.reinitializeEventListeners();
            }
        });
        
        // API communication boundary
        this.createErrorBoundary('api-communication', {
            onError: (error, context) => {
                console.error('API communication error:', error);
                this.handleApiCommunicationError(error, context);
            },
            recovery: () => {
                console.log('Retrying API operations...');
                this.retryFailedApiOperations();
            }
        });
        
        // UI rendering boundary
        this.createErrorBoundary('ui-rendering', {
            onError: (error, context) => {
                console.error('UI rendering error:', error);
                this.handleUIRenderingError(error, context);
            },
            recovery: () => {
                console.log('Attempting UI recovery...');
                this.attemptUIRecovery();
            }
        });
    }

    /**
     * Create an error boundary for a specific component or operation
     */
    createErrorBoundary(name, options = {}) {
        const boundary = {
            name,
            errorCount: 0,
            lastError: null,
            isActive: true,
            maxErrors: options.maxErrors || 5,
            onError: options.onError || ((error) => console.error(`Error in ${name}:`, error)),
            recovery: options.recovery || (() => console.log(`No recovery defined for ${name}`))
        };
        
        this.errorBoundaries.set(name, boundary);
        return boundary;
    }

    /**
     * Execute code within an error boundary
     */
    withErrorBoundary(boundaryName, operation, context = {}) {
        const boundary = this.errorBoundaries.get(boundaryName);
        
        if (!boundary || !boundary.isActive) {
            return operation();
        }
        
        try {
            return operation();
        } catch (error) {
            boundary.errorCount++;
            boundary.lastError = {
                error,
                context,
                timestamp: Date.now()
            };
            
            // Call error handler
            boundary.onError(error, context);
            
            // Handle error through enhanced error handler if available
            if (this.errorHandler) {
                this.errorHandler.handleComponentError(boundaryName, error, context);
            }
            
            // Disable boundary if too many errors
            if (boundary.errorCount >= boundary.maxErrors) {
                console.warn(`Error boundary ${boundaryName} disabled due to excessive errors`);
                boundary.isActive = false;
            } else {
                // Attempt recovery
                try {
                    boundary.recovery();
                } catch (recoveryError) {
                    console.error(`Recovery failed for ${boundaryName}:`, recoveryError);
                }
            }
            
            // Re-throw critical errors
            if (error.name === 'TypeError' || error.name === 'ReferenceError') {
                throw error;
            }
        }
    }

    /**
     * Set up fallback error handling when enhanced handler is not available
     */
    setupFallbackErrorHandling() {
        window.onerror = (message, source, lineno, colno, error) => {
            console.error('JavaScript Error:', { message, source, lineno, colno, error });
            this.handleFallbackError({ message, source, lineno, colno, error });
            return true;
        };
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            this.handleFallbackError({ message: 'Promise rejection', error: event.reason });
            event.preventDefault();
        });
    }

    /**
     * Handle errors when enhanced handler is not available
     */
    handleFallbackError(errorInfo) {
        // Simple error logging and user notification
        const errorData = {
            timestamp: new Date().toISOString(),
            message: errorInfo.message,
            source: errorInfo.source,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log to console
        console.error('Fallback Error Handler:', errorData);
        
        // Show simple user notification
        if (window.NotificationManager) {
            window.NotificationManager.show(
                'An error occurred. Please refresh the page if problems persist.',
                'error'
            );
        }
    }

    initializeComponents() {
        this.withErrorBoundary('component-initialization', () => {
            // Initialize AOS (Animate On Scroll)
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 600,
                    easing: 'ease-in-out',
                    once: true,
                    mirror: false
                });
            }

            // Initialize tooltips
            this.initializeTooltips();

            // Initialize modals
            this.initializeModals();

            // Initialize dropdowns
            this.initializeDropdowns();

            // Initialize sidebar
            this.initializeSidebar();

            // Initialize search
            this.initializeSearch();

            // Initialize notifications
            this.initializeNotifications();
        });
    }

    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    initializeModals() {
        // Auto-initialize modals with enhanced features
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('show.bs.modal', (e) => {
                // Add fade-in animation
                modal.classList.add('animate-fade-in');
            });

            modal.addEventListener('hidden.bs.modal', (e) => {
                // Clean up animations
                modal.classList.remove('animate-fade-in');
            });
        });
    }

    initializeDropdowns() {
        // Enhanced dropdown functionality
        document.querySelectorAll('.dropdown-toggle').forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = dropdown.nextElementSibling;
                if (menu && menu.classList.contains('dropdown-menu')) {
                    menu.classList.toggle('show');
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    initializeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Handle responsive sidebar
        this.handleResponsiveSidebar();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebar) {
            sidebar.classList.toggle('show');
            if (overlay) {
                overlay.classList.toggle('show');
            }
        }
    }

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebar) {
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
            }
        }
    }

    handleResponsiveSidebar() {
        const mediaQuery = window.matchMedia('(max-width: 991.98px)');
        
        const handleMediaChange = (e) => {
            if (!e.matches) {
                // Desktop view - close mobile sidebar
                this.closeSidebar();
            }
        };

        mediaQuery.addListener(handleMediaChange);
        handleMediaChange(mediaQuery);
    }

    initializeSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        
        searchInputs.forEach(input => {
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            input.addEventListener('focus', () => {
                const results = input.parentElement.querySelector('.search-results');
                if (results && input.value.length > 0) {
                    results.style.display = 'block';
                }
            });

            input.addEventListener('blur', () => {
                // Delay hiding to allow clicking on results
                setTimeout(() => {
                    const results = input.parentElement.querySelector('.search-results');
                    if (results) {
                        results.style.display = 'none';
                    }
                }, 200);
            });
        });
    }

    performSearch(query) {
        if (query.length < 2) return;

        // Implement search logic here
        console.log('Searching for:', query);
        
        // Example: Show loading state
        this.showSearchLoading();
        
        // Example: Simulate API call
        setTimeout(() => {
            this.showSearchResults([
                { symbol: 'AAPL', name: 'Apple Inc.', price: '$150.25' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$2,750.80' }
            ]);
        }, 500);
    }

    showSearchLoading() {
        const results = document.querySelector('.search-results');
        if (results) {
            results.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><span>Searching...</span></div>';
            results.style.display = 'block';
        }
    }

    showSearchResults(results) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No stocks found</div>';
        } else {
            const html = results.map(result => `
                <div class="search-result-item" data-symbol="${result.symbol}">
                    <span class="result-symbol">${result.symbol}</span>
                    <span class="result-name">${result.name}</span>
                    <span class="result-price">${result.price}</span>
                </div>
            `).join('');
            resultsContainer.innerHTML = html;
        }

        resultsContainer.style.display = 'block';
    }

    initializeNotifications() {
        // Initialize notification system
        window.NotificationManager = new NotificationManager();
    }

    initializeAnimations() {
        // Add stagger animations to lists
        document.querySelectorAll('.stagger-animation').forEach(container => {
            const items = container.children;
            Array.from(items).forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
            });
        });

        // Add intersection observer for animations
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupTheme() {
        // Theme switching functionality
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Load saved theme
        this.loadTheme();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme toggle icon
        this.updateThemeToggleIcon(newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    }

    updateThemeToggleIcon(theme) {
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    setupEventListeners() {
        this.withErrorBoundary('event-handling', () => {
            // Global event listeners
            document.addEventListener('DOMContentLoaded', () => {
                this.withErrorBoundary('event-handling', () => {
                    this.handlePageLoad();
                }, { eventType: 'DOMContentLoaded' });
            });

            window.addEventListener('resize', () => {
                this.withErrorBoundary('event-handling', () => {
                    this.handleResize();
                }, { eventType: 'resize' });
            });

            // Handle form submissions
            document.addEventListener('submit', (e) => {
                if (e.target.classList.contains('ajax-form')) {
                    e.preventDefault();
                    this.withErrorBoundary('event-handling', () => {
                        this.handleAjaxForm(e.target);
                    }, { eventType: 'submit', formId: e.target.id });
                }
            });

            // Handle button clicks
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-loading')) {
                    this.withErrorBoundary('event-handling', () => {
                        this.handleLoadingButton(e.target);
                    }, { eventType: 'click', buttonClass: 'btn-loading' });
                }
            });

            // Handle unhandled errors in event listeners
            document.addEventListener('error', (e) => {
                if (this.errorHandler) {
                    this.errorHandler.handleComponentError('event-listener', e.error || new Error(e.message), {
                        target: e.target,
                        eventType: 'error'
                    });
                }
            }, true);
        });
    }

    handlePageLoad() {
        // Add page loaded class for animations
        document.body.classList.add('page-loaded');
        
        // Initialize page-specific functionality
        this.initializePageSpecific();
    }

    handleResize() {
        // Handle responsive changes
        this.handleResponsiveSidebar();
    }

    handleAjaxForm(form) {
        this.withErrorBoundary('api-communication', () => {
            const formData = new FormData(form);
            const url = form.action || window.location.href;
            const method = form.method || 'POST';

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            }

            fetch(url, {
                method: method,
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    NotificationManager.show(data.message || 'Success!', 'success');
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    }
                } else {
                    NotificationManager.show(data.message || 'An error occurred', 'error');
                }
            })
            .catch(error => {
                // Handle error through enhanced error handler
                if (this.errorHandler) {
                    const shouldRetry = this.errorHandler.handleApiError(url, error, 0);
                    if (shouldRetry) {
                        // Add retry option
                        this.showRetryOption(form, error);
                    }
                } else {
                    console.error('Form submission error:', error);
                    NotificationManager.show('An error occurred. Please try again.', 'error');
                }
            })
            .finally(() => {
                // Remove loading state
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
            });
        }, { operation: 'form-submission', form: form.id || 'unknown' });
    }

    handleLoadingButton(button) {
        button.classList.add('loading');
        
        // Remove loading state after 2 seconds (or when operation completes)
        setTimeout(() => {
            button.classList.remove('loading');
        }, 2000);
    }

    initializePageSpecific() {
        this.withErrorBoundary('component-initialization', () => {
            const page = document.body.getAttribute('data-page');
            
            switch (page) {
                case 'dashboard':
                    this.initializeDashboard();
                    break;
                case 'leaderboard':
                    this.initializeLeaderboard();
                    break;
                case 'login':
                    this.initializeLogin();
                    break;
            }
        }, { operation: 'page-specific-initialization', page: document.body.getAttribute('data-page') });
    }

    initializeDashboard() {
        this.withErrorBoundary('component-initialization', () => {
            // Dashboard-specific initialization
            console.log('Initializing dashboard...');
            
            // Initialize charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                this.initializeCharts();
            }
            
            // Initialize real-time updates
            this.initializeRealTimeUpdates();
        }, { component: 'dashboard' });
    }

    initializeLeaderboard() {
        this.withErrorBoundary('component-initialization', () => {
            // Leaderboard-specific initialization
            console.log('Initializing leaderboard...');
            
            // Initialize data tables
            this.initializeDataTables();
        }, { component: 'leaderboard' });
    }

    initializeLogin() {
        this.withErrorBoundary('component-initialization', () => {
            // Login-specific initialization
            console.log('Initializing login...');
            
            // Initialize form validation
            this.initializeFormValidation();
        }, { component: 'login' });
    }

    initializeCharts() {
        // Chart initialization will be handled in separate chart modules
        console.log('Charts available, initializing...');
    }

    initializeRealTimeUpdates() {
        // Real-time update functionality
        console.log('Initializing real-time updates...');
    }

    initializeDataTables() {
        // Data table functionality
        console.log('Initializing data tables...');
    }

    initializeFormValidation() {
        // Form validation functionality
        console.log('Initializing form validation...');
    }

    /**
     * Error handling and recovery methods
     */

    /**
     * Generate unique session ID for error tracking
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Send error data to monitoring service
     */
    sendErrorToMonitoring(errorContext) {
        try {
            // Send to external monitoring service (e.g., Sentry, LogRocket, etc.)
            if (window.Sentry && typeof window.Sentry.captureException === 'function') {
                window.Sentry.captureException(new Error(errorContext.message), {
                    tags: {
                        component: errorContext.component,
                        type: errorContext.type
                    },
                    extra: {
                        sessionId: this.errorAnalytics.sessionId,
                        timestamp: errorContext.timestamp,
                        url: errorContext.url,
                        userAgent: errorContext.userAgent
                    }
                });
            }
            
            // Send to custom analytics endpoint
            if (window.analytics && typeof window.analytics.track === 'function') {
                window.analytics.track('Application Error', {
                    errorType: errorContext.type,
                    errorMessage: errorContext.message,
                    component: errorContext.component,
                    sessionId: this.errorAnalytics.sessionId,
                    timestamp: errorContext.timestamp
                });
            }
            
            // Send to server logging endpoint
            this.sendErrorToServer(errorContext);
        } catch (monitoringError) {
            console.error('Failed to send error to monitoring:', monitoringError);
        }
    }

    /**
     * Send error to server logging endpoint
     */
    async sendErrorToServer(errorContext) {
        try {
            const errorData = {
                sessionId: this.errorAnalytics.sessionId,
                timestamp: errorContext.timestamp,
                type: errorContext.type,
                message: errorContext.message,
                component: errorContext.component,
                stack: errorContext.stack,
                url: errorContext.url,
                userAgent: errorContext.userAgent,
                userId: this.getCurrentUserId(),
                additionalContext: errorContext.context
            };

            await fetch('/api/errors/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(errorData)
            });
        } catch (serverError) {
            console.error('Failed to log error to server:', serverError);
        }
    }

    /**
     * Log error metrics for analysis
     */
    logErrorMetrics(errorContext) {
        const metrics = {
            timestamp: Date.now(),
            errorType: errorContext.type,
            component: errorContext.component,
            sessionDuration: Date.now() - this.errorAnalytics.startTime,
            totalSessionErrors: this.errorAnalytics.errorCount,
            memoryUsage: this.getMemoryUsage(),
            performanceMetrics: this.getPerformanceMetrics()
        };
        
        console.log('Error Metrics:', metrics);
        
        // Store metrics in local storage for debugging
        try {
            const storedMetrics = JSON.parse(localStorage.getItem('errorMetrics') || '[]');
            storedMetrics.push(metrics);
            
            // Keep only last 50 metrics
            if (storedMetrics.length > 50) {
                storedMetrics.splice(0, storedMetrics.length - 50);
            }
            
            localStorage.setItem('errorMetrics', JSON.stringify(storedMetrics));
        } catch (storageError) {
            console.error('Failed to store error metrics:', storageError);
        }
    }

    /**
     * Get current memory usage if available
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            return {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                responseTime: navigation.responseEnd - navigation.responseStart
            };
        }
        return null;
    }

    /**
     * Get current user ID for error tracking
     */
    getCurrentUserId() {
        // Try to get user ID from various sources
        if (window.currentUser && window.currentUser.id) {
            return window.currentUser.id;
        }
        
        if (document.querySelector('[data-user-id]')) {
            return document.querySelector('[data-user-id]').getAttribute('data-user-id');
        }
        
        return 'anonymous';
    }

    /**
     * Error boundary handlers
     */

    /**
     * Handle component initialization errors
     */
    handleComponentInitializationError(error, context) {
        console.error('Component initialization failed:', error, context);
        
        // Try to identify which component failed
        const failedComponent = context.component || 'unknown';
        
        // Show user-friendly message
        if (window.NotificationManager) {
            window.NotificationManager.show(
                `Failed to initialize ${failedComponent}. Some features may not work properly.`,
                'warning'
            );
        }
    }

    /**
     * Handle event handling errors
     */
    handleEventError(error, context) {
        console.error('Event handling error:', error, context);
        
        // Show user-friendly message for critical events
        if (context.eventType === 'click' || context.eventType === 'submit') {
            if (window.NotificationManager) {
                window.NotificationManager.show(
                    'Action failed. Please try again.',
                    'error'
                );
            }
        }
    }

    /**
     * Handle API communication errors
     */
    handleApiCommunicationError(error, context) {
        console.error('API communication error:', error, context);
        
        // Determine error type and show appropriate message
        let message = 'Network error. Please check your connection and try again.';
        
        if (error.status >= 500) {
            message = 'Server error. Please try again later.';
        } else if (error.status === 404) {
            message = 'Requested resource not found.';
        } else if (error.status === 401) {
            message = 'Authentication required. Please log in again.';
        }
        
        if (window.NotificationManager) {
            window.NotificationManager.show(message, 'error');
        }
    }

    /**
     * Handle UI rendering errors
     */
    handleUIRenderingError(error, context) {
        console.error('UI rendering error:', error, context);
        
        // Try to recover by re-rendering the component
        if (context.element) {
            try {
                context.element.innerHTML = '<div class="error-fallback">Content temporarily unavailable</div>';
            } catch (renderError) {
                console.error('Failed to render error fallback:', renderError);
            }
        }
    }

    /**
     * Recovery methods
     */

    /**
     * Attempt component recovery
     */
    attemptComponentRecovery() {
        try {
            // Re-initialize critical components
            this.initializeTooltips();
            this.initializeModals();
            this.initializeDropdowns();
            console.log('Component recovery completed');
        } catch (recoveryError) {
            console.error('Component recovery failed:', recoveryError);
        }
    }

    /**
     * Re-initialize event listeners
     */
    reinitializeEventListeners() {
        try {
            // Remove existing listeners and re-add them
            this.setupEventListeners();
            console.log('Event listeners re-initialized');
        } catch (recoveryError) {
            console.error('Event listener recovery failed:', recoveryError);
        }
    }

    /**
     * Retry failed API operations
     */
    retryFailedApiOperations() {
        // This would be implemented based on specific API operations
        console.log('Retrying failed API operations...');
    }

    /**
     * Attempt UI recovery
     */
    attemptUIRecovery() {
        try {
            // Re-initialize animations and UI components
            this.initializeAnimations();
            console.log('UI recovery completed');
        } catch (recoveryError) {
            console.error('UI recovery failed:', recoveryError);
        }
    }

    /**
     * Show retry option for failed operations
     */
    showRetryOption(form, error) {
        if (window.NotificationManager) {
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry';
            retryButton.className = 'btn btn-sm btn-outline-primary';
            retryButton.onclick = () => {
                this.handleAjaxForm(form);
            };
            
            window.NotificationManager.show(
                'Operation failed. Would you like to retry?',
                'error',
                10000
            );
        }
    }

    /**
     * Get error handler statistics
     */
    getErrorStats() {
        const stats = {
            session: this.errorAnalytics ? this.errorAnalytics.getSessionStats() : null,
            boundaries: {}
        };
        
        // Add error boundary statistics
        this.errorBoundaries.forEach((boundary, name) => {
            stats.boundaries[name] = {
                errorCount: boundary.errorCount,
                isActive: boundary.isActive,
                lastError: boundary.lastError ? {
                    timestamp: boundary.lastError.timestamp,
                    message: boundary.lastError.error.message
                } : null
            };
        });
        
        // Add enhanced error handler stats if available
        if (this.errorHandler && typeof this.errorHandler.getErrorStats === 'function') {
            stats.enhancedHandler = this.errorHandler.getErrorStats();
        }
        
        return stats;
    }

    /**
     * Reset error boundaries
     */
    resetErrorBoundaries() {
        this.errorBoundaries.forEach(boundary => {
            boundary.errorCount = 0;
            boundary.lastError = null;
            boundary.isActive = true;
        });
        console.log('Error boundaries reset');
    }

    /**
     * Cleanup method for error handling
     */
    cleanup() {
        if (this.errorHandler && typeof this.errorHandler.destroy === 'function') {
            this.errorHandler.destroy();
        }
        
        this.errorBoundaries.clear();
        this.errorAnalytics = null;
        
        console.log('ModernApp error handling cleaned up');
    }
}

// Notification Manager Class
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => this.remove(toast), duration);

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icons[type] || icons.info} toast-icon"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            <div class="toast-progress"></div>
        `;

        return toast;
    }

    remove(toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ModernApp = new ModernApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModernApp, NotificationManager };
}