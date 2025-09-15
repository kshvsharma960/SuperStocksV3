/**
 * Enhanced Error Handler
 * Provides comprehensive error handling with global error catching,
 * user-friendly messaging, and error loop prevention
 */
class EnhancedErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxErrors = 50;
        this.errorCooldown = 5000; // 5 seconds
        this.lastErrorTime = 0;
        this.errorCounts = new Map();
        this.isInitialized = false;
        this.errorContainer = null;
        this.retryCallbacks = new Map();
        
        // Error type classifications
        this.errorTypes = {
            JAVASCRIPT: 'javascript',
            API: 'api',
            NETWORK: 'network',
            TIMEOUT: 'timeout',
            VALIDATION: 'validation',
            CRITICAL: 'critical'
        };
        
        // User-friendly error messages
        this.userMessages = {
            [this.errorTypes.JAVASCRIPT]: 'Something went wrong with the application. Please refresh the page.',
            [this.errorTypes.API]: 'Unable to load data. Please check your connection and try again.',
            [this.errorTypes.NETWORK]: 'Network connection issue. Please check your internet connection.',
            [this.errorTypes.TIMEOUT]: 'The request is taking longer than expected. Please try again.',
            [this.errorTypes.VALIDATION]: 'Please check your input and try again.',
            [this.errorTypes.CRITICAL]: 'A critical error occurred. Please refresh the page or contact support.'
        };
    }

    /**
     * Initialize the error handler with global listeners
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        this.setupGlobalHandlers();
        this.createErrorContainer();
        this.isInitialized = true;
        
        console.log('Enhanced Error Handler initialized');
    }

    /**
     * Set up global error handlers
     */
    setupGlobalHandlers() {
        // Handle JavaScript errors
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleJavaScriptError({
                message,
                source,
                lineno,
                colno,
                error,
                type: this.errorTypes.JAVASCRIPT
            });
            return true; // Prevent default browser error handling
        };

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event);
            event.preventDefault(); // Prevent default browser handling
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            }
        }, true);
    }

    /**
     * Handle JavaScript errors
     */
    handleJavaScriptError(errorInfo) {
        const errorContext = {
            timestamp: new Date(),
            type: errorInfo.type,
            message: errorInfo.message,
            source: errorInfo.source,
            line: errorInfo.lineno,
            column: errorInfo.colno,
            stack: errorInfo.error ? errorInfo.error.stack : null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            component: this.extractComponentFromStack(errorInfo.error)
        };

        this.processError(errorContext);
    }

    /**
     * Handle unhandled promise rejections
     */
    handlePromiseRejection(event) {
        const errorContext = {
            timestamp: new Date(),
            type: this.errorTypes.API,
            message: event.reason ? event.reason.message || event.reason : 'Promise rejection',
            stack: event.reason ? event.reason.stack : null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            component: 'Promise'
        };

        this.processError(errorContext);
    }

    /**
     * Handle resource loading errors
     */
    handleResourceError(event) {
        const errorContext = {
            timestamp: new Date(),
            type: this.errorTypes.NETWORK,
            message: `Failed to load resource: ${event.target.src || event.target.href}`,
            source: event.target.src || event.target.href,
            userAgent: navigator.userAgent,
            url: window.location.href,
            component: 'Resource Loading'
        };

        this.processError(errorContext);
    }

    /**
     * Handle component-specific errors
     */
    handleComponentError(component, error, context = {}) {
        const errorContext = {
            timestamp: new Date(),
            type: this.errorTypes.JAVASCRIPT,
            message: error.message || 'Component error',
            stack: error.stack,
            component: component,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.processError(errorContext);
    }

    /**
     * Handle API errors
     */
    handleApiError(endpoint, error, retryCount = 0) {
        const errorType = this.classifyApiError(error);
        
        const errorContext = {
            timestamp: new Date(),
            type: errorType,
            message: error.message || 'API request failed',
            endpoint: endpoint,
            status: error.status,
            retryCount: retryCount,
            userAgent: navigator.userAgent,
            url: window.location.href,
            component: 'API'
        };

        this.processError(errorContext);
        
        // Return whether retry should be attempted
        return this.shouldRetry(errorType, retryCount);
    }

    /**
     * Process and queue errors with cooldown logic
     */
    processError(errorContext) {
        const now = Date.now();
        const errorKey = this.generateErrorKey(errorContext);
        
        // Check for error loops
        if (this.isErrorLoop(errorKey, now)) {
            console.warn('Error loop detected, suppressing similar errors');
            return;
        }

        // Add to error queue
        if (this.errorQueue.length >= this.maxErrors) {
            this.errorQueue.shift(); // Remove oldest error
        }
        
        this.errorQueue.push(errorContext);
        
        // Update error counts
        const count = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, count + 1);
        
        // Log error for debugging
        this.logError(errorContext);
        
        // Show user-friendly error if not in cooldown
        if (now - this.lastErrorTime > this.errorCooldown) {
            this.showUserError(errorContext);
            this.lastErrorTime = now;
        }
    }

    /**
     * Check if error is part of a loop
     */
    isErrorLoop(errorKey, timestamp) {
        const count = this.errorCounts.get(errorKey) || 0;
        const recentErrors = this.errorQueue.filter(error => 
            this.generateErrorKey(error) === errorKey &&
            timestamp - error.timestamp.getTime() < this.errorCooldown
        );
        
        return count > 3 || recentErrors.length > 2;
    }

    /**
     * Generate unique key for error deduplication
     */
    generateErrorKey(errorContext) {
        return `${errorContext.type}-${errorContext.message}-${errorContext.component}`;
    }

    /**
     * Classify API errors
     */
    classifyApiError(error) {
        if (!error.status) {
            return this.errorTypes.NETWORK;
        }
        
        if (error.status >= 500) {
            return this.errorTypes.CRITICAL;
        }
        
        if (error.status === 408 || error.message?.includes('timeout')) {
            return this.errorTypes.TIMEOUT;
        }
        
        if (error.status >= 400 && error.status < 500) {
            return this.errorTypes.VALIDATION;
        }
        
        return this.errorTypes.API;
    }

    /**
     * Determine if retry should be attempted
     */
    shouldRetry(errorType, retryCount) {
        if (retryCount >= 3) return false;
        
        return [
            this.errorTypes.NETWORK,
            this.errorTypes.TIMEOUT,
            this.errorTypes.API
        ].includes(errorType);
    }

    /**
     * Extract component name from error stack
     */
    extractComponentFromStack(error) {
        if (!error || !error.stack) return 'Unknown';
        
        const stackLines = error.stack.split('\n');
        for (const line of stackLines) {
            if (line.includes('.js:')) {
                const match = line.match(/([^/\\]+\.js)/);
                if (match) {
                    return match[1].replace('.js', '');
                }
            }
        }
        
        return 'Unknown';
    }

    /**
     * Log error for debugging
     */
    logError(errorContext) {
        const logData = {
            timestamp: errorContext.timestamp.toISOString(),
            type: errorContext.type,
            message: errorContext.message,
            component: errorContext.component,
            url: errorContext.url,
            userAgent: errorContext.userAgent
        };
        
        if (errorContext.stack) {
            logData.stack = errorContext.stack;
        }
        
        console.error('Enhanced Error Handler:', logData);
        
        // Send to analytics/monitoring service if available
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('Error Occurred', logData);
        }
    }

    /**
     * Create error display container
     */
    createErrorContainer() {
        this.errorContainer = document.createElement('div');
        this.errorContainer.id = 'error-handler-container';
        this.errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.errorContainer);
    }

    /**
     * Show user-friendly error message
     */
    showUserError(errorContext, customMessage = null, actions = []) {
        const message = customMessage || this.userMessages[errorContext.type] || 'An unexpected error occurred.';
        
        const errorElement = this.createErrorElement(message, errorContext.type, actions, errorContext);
        this.errorContainer.appendChild(errorElement);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 10000);
    }

    /**
     * Create error display element
     */
    createErrorElement(message, type, actions, errorContext) {
        const errorDiv = document.createElement('div');
        errorDiv.className = `error-notification error-${type}`;
        errorDiv.style.cssText = `
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            pointer-events: auto;
            animation: slideIn 0.3s ease-out;
            position: relative;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('error-handler-styles')) {
            const style = document.createElement('style');
            style.id = 'error-handler-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .error-network { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
                .error-timeout { background: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
                .error-critical { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
            `;
            document.head.appendChild(style);
        }
        
        // Message content
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.marginBottom = actions.length > 0 ? '8px' : '0';
        errorDiv.appendChild(messageDiv);
        
        // Action buttons
        if (actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.text;
                button.style.cssText = `
                    background: transparent;
                    border: 1px solid currentColor;
                    color: inherit;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                button.onclick = () => {
                    action.callback(errorContext);
                    errorDiv.remove();
                };
                actionsDiv.appendChild(button);
            });
            
            errorDiv.appendChild(actionsDiv);
        }
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
        `;
        closeButton.onclick = () => errorDiv.remove();
        errorDiv.appendChild(closeButton);
        
        return errorDiv;
    }

    /**
     * Add retry callback for specific operations
     */
    addRetryCallback(operation, callback) {
        this.retryCallbacks.set(operation, callback);
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        return {
            totalErrors: this.errorQueue.length,
            errorsByType: this.groupErrorsByType(),
            recentErrors: this.getRecentErrors(),
            errorCounts: Object.fromEntries(this.errorCounts)
        };
    }

    /**
     * Group errors by type
     */
    groupErrorsByType() {
        const groups = {};
        this.errorQueue.forEach(error => {
            groups[error.type] = (groups[error.type] || 0) + 1;
        });
        return groups;
    }

    /**
     * Get recent errors (last 5 minutes)
     */
    getRecentErrors() {
        const fiveMinutesAgo = Date.now() - 300000;
        return this.errorQueue.filter(error => 
            error.timestamp.getTime() > fiveMinutesAgo
        );
    }

    /**
     * Clear error queue
     */
    clearErrors() {
        this.errorQueue = [];
        this.errorCounts.clear();
        console.log('Error queue cleared');
    }

    /**
     * Destroy error handler
     */
    destroy() {
        window.onerror = null;
        window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
        window.removeEventListener('error', this.handleResourceError, true);
        
        if (this.errorContainer && this.errorContainer.parentNode) {
            this.errorContainer.remove();
        }
        
        this.isInitialized = false;
        console.log('Enhanced Error Handler destroyed');
    }
}

// Create global instance
window.EnhancedErrorHandler = EnhancedErrorHandler;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.errorHandler) {
            window.errorHandler = new EnhancedErrorHandler();
            window.errorHandler.initialize();
        }
    });
} else {
    if (!window.errorHandler) {
        window.errorHandler = new EnhancedErrorHandler();
        window.errorHandler.initialize();
    }
}