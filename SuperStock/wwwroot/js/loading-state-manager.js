/**
 * Loading State Manager
 * Coordinates loading indicators across components with timeout handling and progress indication
 */
class LoadingStateManager {
    constructor() {
        this.activeLoaders = new Set();
        this.timeouts = new Map();
        this.progressStates = new Map();
        this.maxLoadTime = 30000; // 30 seconds max timeout
        this.loadingElements = new Map();
        this.callbacks = new Map();
        
        // Initialize global loading container
        this.initializeGlobalContainer();
    }

    /**
     * Initialize global loading container for centralized loading indicators
     */
    initializeGlobalContainer() {
        if (!document.getElementById('global-loading-container')) {
            const container = document.createElement('div');
            container.id = 'global-loading-container';
            container.className = 'loading-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            document.body.appendChild(container);
        }
    }

    /**
     * Start loading state for a component
     * @param {string} component - Component identifier
     * @param {Object} options - Loading options
     * @param {number} options.timeout - Custom timeout (default: 30s)
     * @param {string} options.message - Loading message
     * @param {Function} options.onTimeout - Timeout callback
     * @param {Function} options.onComplete - Completion callback
     * @param {boolean} options.showGlobal - Show global loading overlay
     */
    startLoading(component, options = {}) {
        const {
            timeout = this.maxLoadTime,
            message = 'Loading...',
            onTimeout = null,
            onComplete = null,
            showGlobal = false
        } = options;

        // Clear any existing timeout for this component
        this.clearTimeout(component);

        // Add to active loaders
        this.activeLoaders.add(component);

        // Initialize progress state
        this.progressStates.set(component, {
            percentage: 0,
            message: message,
            startTime: Date.now(),
            showGlobal: showGlobal
        });

        // Store callbacks
        if (onTimeout || onComplete) {
            this.callbacks.set(component, { onTimeout, onComplete });
        }

        // Set timeout
        const timeoutId = setTimeout(() => {
            this.handleTimeout(component);
        }, timeout);
        
        this.timeouts.set(component, timeoutId);

        // Show loading UI
        this.showLoadingUI(component, message, showGlobal);

        console.log(`Loading started for component: ${component}`);
        return component;
    }

    /**
     * Complete loading state for a component
     * @param {string} component - Component identifier
     * @param {boolean} success - Whether operation was successful
     */
    completeLoading(component, success = true) {
        if (!this.activeLoaders.has(component)) {
            return;
        }

        // Clear timeout
        this.clearTimeout(component);

        // Remove from active loaders
        this.activeLoaders.delete(component);

        // Get progress state
        const progressState = this.progressStates.get(component);
        
        // Hide loading UI
        this.hideLoadingUI(component);

        // Call completion callback
        const callbacks = this.callbacks.get(component);
        if (callbacks && callbacks.onComplete) {
            callbacks.onComplete(success, progressState);
        }

        // Cleanup
        this.progressStates.delete(component);
        this.callbacks.delete(component);
        this.loadingElements.delete(component);

        console.log(`Loading completed for component: ${component}, success: ${success}`);
    }

    /**
     * Handle timeout for a component
     * @param {string} component - Component identifier
     */
    handleTimeout(component) {
        if (!this.activeLoaders.has(component)) {
            return;
        }

        console.warn(`Loading timeout for component: ${component}`);

        const progressState = this.progressStates.get(component);
        const callbacks = this.callbacks.get(component);

        // Show timeout message
        this.showTimeoutMessage(component);

        // Call timeout callback
        if (callbacks && callbacks.onTimeout) {
            callbacks.onTimeout(progressState);
        }

        // Complete loading with failure
        this.completeLoading(component, false);
    }

    /**
     * Update progress for a component
     * @param {string} component - Component identifier
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} message - Optional progress message
     */
    updateProgress(component, percentage, message = null) {
        if (!this.activeLoaders.has(component)) {
            return;
        }

        const progressState = this.progressStates.get(component);
        if (progressState) {
            progressState.percentage = Math.max(0, Math.min(100, percentage));
            if (message) {
                progressState.message = message;
            }

            // Update UI
            this.updateProgressUI(component, progressState);
        }
    }

    /**
     * Show loading UI for a component
     * @param {string} component - Component identifier
     * @param {string} message - Loading message
     * @param {boolean} showGlobal - Show global overlay
     */
    showLoadingUI(component, message, showGlobal) {
        // Show global loading if requested
        if (showGlobal) {
            this.showGlobalLoading(message);
        }

        // Show component-specific loading
        const targetElement = document.getElementById(component) || 
                            document.querySelector(`[data-component="${component}"]`);
        
        if (targetElement) {
            this.showComponentLoading(targetElement, component, message);
        }
    }

    /**
     * Show global loading overlay
     * @param {string} message - Loading message
     */
    showGlobalLoading(message) {
        const container = document.getElementById('global-loading-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-message">${message}</div>
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            `;
            container.style.display = 'flex';
        }
    }

    /**
     * Show component-specific loading
     * @param {Element} element - Target element
     * @param {string} component - Component identifier
     * @param {string} message - Loading message
     */
    showComponentLoading(element, component, message) {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'component-loading-overlay';
        overlay.setAttribute('data-loading-component', component);
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        overlay.innerHTML = `
            <div class="loading-spinner small">
                <div class="spinner"></div>
                <div class="loading-message">${message}</div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;

        // Ensure parent has relative positioning
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
        this.loadingElements.set(component, overlay);
    }

    /**
     * Update progress UI
     * @param {string} component - Component identifier
     * @param {Object} progressState - Progress state object
     */
    updateProgressUI(component, progressState) {
        // Update global progress if visible
        const globalContainer = document.getElementById('global-loading-container');
        if (globalContainer && globalContainer.style.display !== 'none') {
            const progressFill = globalContainer.querySelector('.progress-fill');
            const messageEl = globalContainer.querySelector('.loading-message');
            
            if (progressFill) {
                progressFill.style.width = `${progressState.percentage}%`;
            }
            if (messageEl) {
                messageEl.textContent = progressState.message;
            }
        }

        // Update component progress
        const componentOverlay = this.loadingElements.get(component);
        if (componentOverlay) {
            const progressFill = componentOverlay.querySelector('.progress-fill');
            const messageEl = componentOverlay.querySelector('.loading-message');
            
            if (progressFill) {
                progressFill.style.width = `${progressState.percentage}%`;
            }
            if (messageEl) {
                messageEl.textContent = progressState.message;
            }
        }
    }

    /**
     * Hide loading UI for a component
     * @param {string} component - Component identifier
     */
    hideLoadingUI(component) {
        // Hide global loading if no other active loaders
        if (this.activeLoaders.size <= 1) {
            const globalContainer = document.getElementById('global-loading-container');
            if (globalContainer) {
                globalContainer.style.display = 'none';
            }
        }

        // Hide component loading
        const componentOverlay = this.loadingElements.get(component);
        if (componentOverlay && componentOverlay.parentNode) {
            componentOverlay.parentNode.removeChild(componentOverlay);
        }
    }

    /**
     * Show timeout message
     * @param {string} component - Component identifier
     */
    showTimeoutMessage(component) {
        const progressState = this.progressStates.get(component);
        if (progressState && progressState.showGlobal) {
            const globalContainer = document.getElementById('global-loading-container');
            if (globalContainer) {
                globalContainer.innerHTML = `
                    <div class="loading-timeout">
                        <div class="timeout-icon">⚠️</div>
                        <div class="timeout-message">Operation timed out</div>
                        <button class="retry-button" onclick="window.loadingStateManager.retryOperation('${component}')">
                            Retry
                        </button>
                    </div>
                `;
            }
        }

        // Show timeout in component
        const componentOverlay = this.loadingElements.get(component);
        if (componentOverlay) {
            componentOverlay.innerHTML = `
                <div class="loading-timeout">
                    <div class="timeout-icon">⚠️</div>
                    <div class="timeout-message">Loading timed out</div>
                    <button class="retry-button" onclick="window.loadingStateManager.retryOperation('${component}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Retry operation for a component
     * @param {string} component - Component identifier
     */
    retryOperation(component) {
        // This method can be overridden or extended by specific implementations
        console.log(`Retry requested for component: ${component}`);
        
        // Hide timeout UI
        this.hideLoadingUI(component);
        
        // Emit retry event
        const event = new CustomEvent('loadingRetry', {
            detail: { component }
        });
        document.dispatchEvent(event);
    }

    /**
     * Clear timeout for a component
     * @param {string} component - Component identifier
     */
    clearTimeout(component) {
        const timeoutId = this.timeouts.get(component);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(component);
        }
    }

    /**
     * Get loading state for a component
     * @param {string} component - Component identifier
     * @returns {Object|null} Loading state or null if not loading
     */
    getLoadingState(component) {
        if (!this.activeLoaders.has(component)) {
            return null;
        }

        const progressState = this.progressStates.get(component);
        return {
            isLoading: true,
            percentage: progressState?.percentage || 0,
            message: progressState?.message || 'Loading...',
            startTime: progressState?.startTime || Date.now(),
            duration: Date.now() - (progressState?.startTime || Date.now())
        };
    }

    /**
     * Check if any component is currently loading
     * @returns {boolean} True if any component is loading
     */
    isAnyLoading() {
        return this.activeLoaders.size > 0;
    }

    /**
     * Get all active loading components
     * @returns {Array} Array of component identifiers
     */
    getActiveLoaders() {
        return Array.from(this.activeLoaders);
    }

    /**
     * Force cleanup all loading states (emergency cleanup)
     */
    forceCleanup() {
        console.warn('Force cleanup of all loading states');
        
        // Clear all timeouts
        this.timeouts.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });

        // Hide all loading UI
        this.activeLoaders.forEach((component) => {
            this.hideLoadingUI(component);
        });

        // Clear all state
        this.activeLoaders.clear();
        this.timeouts.clear();
        this.progressStates.clear();
        this.callbacks.clear();
        this.loadingElements.clear();

        // Hide global loading
        const globalContainer = document.getElementById('global-loading-container');
        if (globalContainer) {
            globalContainer.style.display = 'none';
        }
    }

    /**
     * Add CSS styles for loading components
     */
    addStyles() {
        if (document.getElementById('loading-state-manager-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'loading-state-manager-styles';
        style.textContent = `
            .loading-spinner {
                text-align: center;
                padding: 20px;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            .loading-spinner.small .spinner {
                width: 30px;
                height: 30px;
                border-width: 3px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-message {
                font-size: 14px;
                color: #666;
                margin-bottom: 15px;
            }

            .loading-progress {
                width: 200px;
                margin: 0 auto;
            }

            .progress-bar {
                width: 100%;
                height: 4px;
                background-color: #e9ecef;
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background-color: #007bff;
                transition: width 0.3s ease;
            }

            .loading-timeout {
                text-align: center;
                padding: 20px;
            }

            .timeout-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }

            .timeout-message {
                font-size: 16px;
                color: #dc3545;
                margin-bottom: 20px;
            }

            .retry-button {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .retry-button:hover {
                background-color: #0056b3;
            }

            .component-loading-overlay {
                border-radius: inherit;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize global instance
window.loadingStateManager = new LoadingStateManager();

// Add styles when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.loadingStateManager.addStyles();
    });
} else {
    window.loadingStateManager.addStyles();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingStateManager;
}