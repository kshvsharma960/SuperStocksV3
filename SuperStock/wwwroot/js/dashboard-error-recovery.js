/**
 * Dashboard Error Recovery Components
 * Specialized error recovery components for dashboard functionality
 */

class DashboardErrorRecovery {
    constructor() {
        this.errorRecoveryUI = window.ErrorRecoveryUI;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
    }

    /**
     * Handle portfolio loading errors
     */
    handlePortfolioError(container, error, retryCallback) {
        const retryCount = this.retryAttempts.get('portfolio') || 0;
        
        const errorOptions = {
            title: 'Portfolio Loading Error',
            message: this.getPortfolioErrorMessage(error),
            type: 'error',
            onRetry: retryCount < this.maxRetries ? () => {
                this.retryAttempts.set('portfolio', retryCount + 1);
                return retryCallback();
            } : null,
            actions: [
                {
                    text: 'Refresh Page',
                    onClick: () => window.location.reload(),
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithError(container, errorOptions);
    }

    /**
     * Handle funds loading errors
     */
    handleFundsError(container, error, retryCallback) {
        const retryCount = this.retryAttempts.get('funds') || 0;
        
        const errorOptions = {
            title: 'Available Funds Error',
            message: 'Unable to load your available funds. This may affect trading capabilities.',
            type: 'warning',
            onRetry: retryCount < this.maxRetries ? () => {
                this.retryAttempts.set('funds', retryCount + 1);
                return retryCallback();
            } : null,
            actions: [
                {
                    text: 'Continue Without Funds Info',
                    onClick: () => this.showFundsFallback(container),
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithError(container, errorOptions);
    }

    /**
     * Handle rank loading errors
     */
    handleRankError(container, error, retryCallback) {
        const retryCount = this.retryAttempts.get('rank') || 0;
        
        const errorOptions = {
            title: 'Rank Loading Error',
            message: 'Unable to load your current rank in the leaderboard.',
            type: 'info',
            onRetry: retryCount < this.maxRetries ? () => {
                this.retryAttempts.set('rank', retryCount + 1);
                return retryCallback();
            } : null,
            actions: [
                {
                    text: 'View Leaderboard',
                    onClick: () => window.location.href = '/Home/Leaderboard',
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithError(container, errorOptions);
    }

    /**
     * Show loading state for dashboard data
     */
    showDashboardLoading(container, dataType = 'dashboard data') {
        const loadingOptions = {
            text: `Loading ${dataType}...`,
            size: 'medium',
            showProgress: false
        };

        return this.errorRecoveryUI.replaceWithLoading(container, loadingOptions);
    }

    /**
     * Show loading with progress for multi-step operations
     */
    showProgressiveLoading(container, steps = []) {
        const progressOptions = {
            progress: 0,
            text: 'Initializing...',
            showPercentage: true
        };

        const progressComponent = this.errorRecoveryUI.createProgressIndicator(progressOptions);
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.innerHTML = '';
            container.appendChild(progressComponent.element);
        }

        // Simulate progress through steps
        let currentStep = 0;
        const updateProgress = () => {
            if (currentStep < steps.length) {
                const progress = ((currentStep + 1) / steps.length) * 100;
                progressComponent.updateProgress(progress, steps[currentStep]);
                currentStep++;
                setTimeout(updateProgress, 1000);
            }
        };

        if (steps.length > 0) {
            updateProgress();
        }

        return progressComponent;
    }

    /**
     * Show timeout notification for slow operations
     */
    showTimeoutWarning(container, operation, retryCallback, cancelCallback) {
        const timeoutOptions = {
            message: `Loading ${operation} is taking longer than expected. This might be due to network issues or high server load.`,
            onRetry: retryCallback,
            onCancel: cancelCallback,
            timeout: 15000
        };

        const timeoutComponent = this.errorRecoveryUI.createTimeoutNotification(timeoutOptions);
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.appendChild(timeoutComponent);
        }

        return timeoutComponent;
    }

    /**
     * Show fallback content for portfolio
     */
    showPortfolioFallback(container) {
        const fallbackOptions = {
            title: 'Portfolio Unavailable',
            message: 'Your portfolio information is temporarily unavailable. You can still browse stocks and manage your watchlist.',
            icon: '📊',
            actions: [
                {
                    text: 'Browse Stocks',
                    onClick: () => window.location.href = '/Home/Browse'
                },
                {
                    text: 'View Watchlist',
                    onClick: () => window.location.href = '/Home/Watchlist',
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithFallback(container, fallbackOptions);
    }

    /**
     * Show fallback content for funds
     */
    showFundsFallback(container) {
        const fallbackOptions = {
            title: 'Funds Information Unavailable',
            message: 'Unable to display available funds. Trading may be limited.',
            icon: '💰',
            actions: [
                {
                    text: 'Contact Support',
                    onClick: () => window.location.href = '/Support'
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithFallback(container, fallbackOptions);
    }

    /**
     * Show fallback content for rank
     */
    showRankFallback(container) {
        const fallbackOptions = {
            title: 'Rank Unavailable',
            message: 'Your current rank is temporarily unavailable.',
            icon: '🏆',
            actions: [
                {
                    text: 'View Full Leaderboard',
                    onClick: () => window.location.href = '/Home/Leaderboard'
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithFallback(container, fallbackOptions);
    }

    /**
     * Get appropriate error message for portfolio errors
     */
    getPortfolioErrorMessage(error) {
        if (error && error.message) {
            if (error.message.includes('timeout')) {
                return 'Portfolio loading timed out. Please check your connection and try again.';
            }
            if (error.message.includes('network')) {
                return 'Network error while loading portfolio. Please check your internet connection.';
            }
            if (error.message.includes('unauthorized')) {
                return 'Session expired. Please log in again to view your portfolio.';
            }
        }
        return 'Unable to load portfolio information. Please try again.';
    }

    /**
     * Reset retry attempts for a specific operation
     */
    resetRetryAttempts(operation) {
        this.retryAttempts.delete(operation);
    }

    /**
     * Reset all retry attempts
     */
    resetAllRetryAttempts() {
        this.retryAttempts.clear();
    }

    /**
     * Check if operation has exceeded max retries
     */
    hasExceededMaxRetries(operation) {
        const retryCount = this.retryAttempts.get(operation) || 0;
        return retryCount >= this.maxRetries;
    }
}

// Create global instance
window.DashboardErrorRecovery = window.DashboardErrorRecovery || new DashboardErrorRecovery();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardErrorRecovery;
}