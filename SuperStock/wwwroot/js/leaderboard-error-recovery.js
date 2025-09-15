/**
 * Leaderboard Error Recovery Components
 * Specialized error recovery components for leaderboard functionality
 */

class LeaderboardErrorRecovery {
    constructor() {
        this.errorRecoveryUI = window.ErrorRecoveryUI;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
    }

    /**
     * Handle leaderboard data loading errors
     */
    handleLeaderboardError(container, error, retryCallback) {
        const retryCount = this.retryAttempts.get('leaderboard') || 0;
        
        const errorOptions = {
            title: 'Leaderboard Loading Error',
            message: this.getLeaderboardErrorMessage(error),
            type: 'error',
            onRetry: retryCount < this.maxRetries ? () => {
                this.retryAttempts.set('leaderboard', retryCount + 1);
                return retryCallback();
            } : null,
            actions: [
                {
                    text: 'Back to Dashboard',
                    onClick: () => window.location.href = '/Home/Index',
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithError(container, errorOptions);
    }

    /**
     * Handle user data display errors
     */
    handleUserDataError(container, error, retryCallback) {
        const errorOptions = {
            title: 'User Data Error',
            message: 'Some user information could not be loaded properly.',
            type: 'warning',
            onRetry: retryCallback,
            actions: [
                {
                    text: 'Show Partial Data',
                    onClick: () => this.showPartialLeaderboard(container),
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithError(container, errorOptions);
    }

    /**
     * Show loading state for leaderboard
     */
    showLeaderboardLoading(container) {
        const loadingOptions = {
            text: 'Loading leaderboard...',
            size: 'medium',
            showProgress: false
        };

        return this.errorRecoveryUI.replaceWithLoading(container, loadingOptions);
    }

    /**
     * Show loading with progress for leaderboard data processing
     */
    showLeaderboardProgress(container) {
        const steps = [
            'Fetching user data...',
            'Calculating rankings...',
            'Processing display names...',
            'Finalizing leaderboard...'
        ];

        return this.showProgressiveLoading(container, steps);
    }

    /**
     * Show progressive loading with custom steps
     */
    showProgressiveLoading(container, steps = []) {
        const progressOptions = {
            progress: 0,
            text: 'Loading...',
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
        const stepInterval = setInterval(() => {
            if (currentStep < steps.length) {
                const progress = ((currentStep + 1) / steps.length) * 100;
                progressComponent.updateProgress(progress, steps[currentStep]);
                currentStep++;
            } else {
                clearInterval(stepInterval);
            }
        }, 800);

        return {
            component: progressComponent,
            complete: () => clearInterval(stepInterval)
        };
    }

    /**
     * Show timeout warning for leaderboard loading
     */
    showLeaderboardTimeout(container, retryCallback, cancelCallback) {
        const timeoutOptions = {
            message: 'Leaderboard is taking longer than expected to load. This might be due to processing a large number of users.',
            onRetry: retryCallback,
            onCancel: cancelCallback,
            timeout: 20000
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
     * Show fallback content when leaderboard is empty
     */
    showEmptyLeaderboard(container) {
        const fallbackOptions = {
            title: 'No Leaderboard Data',
            message: 'The leaderboard is currently empty or no users have started trading yet.',
            icon: '🏆',
            actions: [
                {
                    text: 'Start Trading',
                    onClick: () => window.location.href = '/Home/Index'
                },
                {
                    text: 'Browse Stocks',
                    onClick: () => window.location.href = '/Home/Browse',
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithFallback(container, fallbackOptions);
    }

    /**
     * Show partial leaderboard with missing data indicators
     */
    showPartialLeaderboard(container) {
        const fallbackOptions = {
            title: 'Partial Leaderboard Data',
            message: 'Some user information is missing, but available data is shown below.',
            icon: '⚠️',
            actions: [
                {
                    text: 'Refresh Data',
                    onClick: () => window.location.reload()
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithFallback(container, fallbackOptions);
    }

    /**
     * Show fallback for user ranking errors
     */
    showRankingFallback(container) {
        const fallbackOptions = {
            title: 'Ranking Unavailable',
            message: 'User rankings could not be calculated at this time.',
            icon: '📊',
            actions: [
                {
                    text: 'View User List',
                    onClick: () => this.showUserListFallback(container),
                    secondary: true
                }
            ]
        };

        return this.errorRecoveryUI.replaceWithFallback(container, fallbackOptions);
    }

    /**
     * Create a simple user list fallback
     */
    showUserListFallback(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;

        container.innerHTML = `
            <div class="fallback-content">
                <div class="fallback-icon">👥</div>
                <h3>User List Mode</h3>
                <p>Showing users without ranking information.</p>
                <div class="error-message-actions">
                    <button class="error-recovery-btn" onclick="window.location.reload()">
                        Try Full Leaderboard Again
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle individual user entry errors
     */
    createUserEntryFallback(userData) {
        const displayName = userData.name || userData.email || 'Unknown User';
        const portfolioValue = userData.portfolioValue || 'N/A';
        
        return {
            displayName,
            portfolioValue,
            rank: 'N/A',
            isError: true,
            errorMessage: 'Some data unavailable'
        };
    }

    /**
     * Get appropriate error message for leaderboard errors
     */
    getLeaderboardErrorMessage(error) {
        if (error && error.message) {
            if (error.message.includes('timeout')) {
                return 'Leaderboard loading timed out. The server may be processing a large amount of data.';
            }
            if (error.message.includes('network')) {
                return 'Network error while loading leaderboard. Please check your internet connection.';
            }
            if (error.message.includes('unauthorized')) {
                return 'Session expired. Please log in again to view the leaderboard.';
            }
            if (error.message.includes('empty')) {
                return 'No leaderboard data is currently available.';
            }
        }
        return 'Unable to load leaderboard information. Please try again.';
    }

    /**
     * Reset retry attempts for leaderboard operations
     */
    resetRetryAttempts(operation = 'leaderboard') {
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
    hasExceededMaxRetries(operation = 'leaderboard') {
        const retryCount = this.retryAttempts.get(operation) || 0;
        return retryCount >= this.maxRetries;
    }

    /**
     * Create error indicator for individual leaderboard entries
     */
    createEntryErrorIndicator(message = 'Data unavailable') {
        const indicator = document.createElement('span');
        indicator.className = 'entry-error-indicator';
        indicator.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            font-style: italic;
            margin-left: 8px;
        `;
        indicator.textContent = `(${message})`;
        return indicator;
    }
}

// Create global instance
window.LeaderboardErrorRecovery = window.LeaderboardErrorRecovery || new LeaderboardErrorRecovery();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardErrorRecovery;
}