/**
 * Error Recovery UI Components
 * Provides reusable UI components for error handling, loading states, and recovery options
 */

class ErrorRecoveryUI {
    constructor() {
        this.activeComponents = new Map();
        this.componentCounter = 0;
        this.initializeStyles();
    }

    /**
     * Initialize CSS styles for error recovery components
     */
    initializeStyles() {
        if (document.getElementById('error-recovery-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'error-recovery-styles';
        styles.textContent = `
            .error-recovery-container {
                position: relative;
                min-height: 100px;
            }

            .error-message {
                background: #fee;
                border: 1px solid #fcc;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                color: #c33;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .error-message.warning {
                background: #fff3cd;
                border-color: #ffeaa7;
                color: #856404;
            }

            .error-message.info {
                background: #d1ecf1;
                border-color: #bee5eb;
                color: #0c5460;
            }

            .error-message-header {
                font-weight: 600;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .error-message-content {
                margin-bottom: 12px;
                line-height: 1.4;
            }

            .error-message-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .error-recovery-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }

            .error-recovery-btn:hover {
                background: #0056b3;
            }

            .error-recovery-btn.secondary {
                background: #6c757d;
            }

            .error-recovery-btn.secondary:hover {
                background: #545b62;
            }

            .error-recovery-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }

            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .loading-container {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 32px;
                flex-direction: column;
                gap: 16px;
            }

            .loading-text {
                color: #666;
                font-size: 14px;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin: 8px 0;
            }

            .progress-fill {
                height: 100%;
                background: #007bff;
                transition: width 0.3s ease;
                border-radius: 4px;
            }

            .timeout-notification {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                color: #856404;
            }

            .fallback-content {
                background: #f8f9fa;
                border: 1px dashed #dee2e6;
                border-radius: 8px;
                padding: 24px;
                text-align: center;
                color: #6c757d;
            }

            .fallback-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .pulse {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Create an error message component with retry functionality
     */
    createErrorMessage(options = {}) {
        const {
            title = 'Error',
            message = 'Something went wrong',
            type = 'error', // error, warning, info
            retryText = 'Try Again',
            onRetry = null,
            dismissible = true,
            actions = []
        } = options;

        const componentId = `error-msg-${++this.componentCounter}`;
        
        const container = document.createElement('div');
        container.className = `error-message ${type}`;
        container.id = componentId;
        
        container.innerHTML = `
            <div class="error-message-header">
                <span>${this.getErrorIcon(type)}</span>
                <span>${title}</span>
                ${dismissible ? '<button class="error-dismiss" style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>' : ''}
            </div>
            <div class="error-message-content">${message}</div>
            <div class="error-message-actions"></div>
        `;

        const actionsContainer = container.querySelector('.error-message-actions');
        
        // Add retry button if callback provided
        if (onRetry) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'error-recovery-btn';
            retryBtn.textContent = retryText;
            retryBtn.onclick = () => {
                retryBtn.disabled = true;
                retryBtn.textContent = 'Retrying...';
                
                Promise.resolve(onRetry()).finally(() => {
                    retryBtn.disabled = false;
                    retryBtn.textContent = retryText;
                });
            };
            actionsContainer.appendChild(retryBtn);
        }

        // Add custom actions
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `error-recovery-btn ${action.secondary ? 'secondary' : ''}`;
            btn.textContent = action.text;
            btn.onclick = action.onClick;
            actionsContainer.appendChild(btn);
        });

        // Add dismiss functionality
        if (dismissible) {
            const dismissBtn = container.querySelector('.error-dismiss');
            dismissBtn.onclick = () => this.removeComponent(componentId);
        }

        this.activeComponents.set(componentId, container);
        return container;
    }

    /**
     * Create a loading spinner component
     */
    createLoadingSpinner(options = {}) {
        const {
            text = 'Loading...',
            size = 'medium', // small, medium, large
            showProgress = false,
            progress = 0
        } = options;

        const componentId = `loading-${++this.componentCounter}`;
        
        const container = document.createElement('div');
        container.className = 'loading-container';
        container.id = componentId;
        
        const sizeClass = size === 'small' ? 'width: 16px; height: 16px;' : 
                         size === 'large' ? 'width: 32px; height: 32px;' : '';
        
        container.innerHTML = `
            <div class="loading-spinner" style="${sizeClass}"></div>
            <div class="loading-text">${text}</div>
            ${showProgress ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            ` : ''}
        `;

        this.activeComponents.set(componentId, container);
        return container;
    }

    /**
     * Create a progress indicator component
     */
    createProgressIndicator(options = {}) {
        const {
            progress = 0,
            text = '',
            showPercentage = true
        } = options;

        const componentId = `progress-${++this.componentCounter}`;
        
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.id = componentId;
        
        container.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
            </div>
            <div class="progress-text">
                ${text} ${showPercentage ? `${Math.round(progress)}%` : ''}
            </div>
        `;

        const component = {
            element: container,
            updateProgress: (newProgress, newText = text) => {
                const fill = container.querySelector('.progress-fill');
                const textEl = container.querySelector('.progress-text');
                
                fill.style.width = `${Math.min(100, Math.max(0, newProgress))}%`;
                textEl.textContent = `${newText} ${showPercentage ? `${Math.round(newProgress)}%` : ''}`;
            }
        };

        this.activeComponents.set(componentId, component);
        return component;
    }

    /**
     * Create a timeout notification component
     */
    createTimeoutNotification(options = {}) {
        const {
            message = 'The operation is taking longer than expected',
            onRetry = null,
            onCancel = null,
            timeout = 30000
        } = options;

        const componentId = `timeout-${++this.componentCounter}`;
        
        const container = document.createElement('div');
        container.className = 'timeout-notification';
        container.id = componentId;
        
        container.innerHTML = `
            <div class="error-message-header">
                <span>⏱️</span>
                <span>Timeout Warning</span>
            </div>
            <div class="error-message-content">${message}</div>
            <div class="error-message-actions"></div>
        `;

        const actionsContainer = container.querySelector('.error-message-actions');
        
        if (onRetry) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'error-recovery-btn';
            retryBtn.textContent = 'Retry';
            retryBtn.onclick = () => {
                this.removeComponent(componentId);
                onRetry();
            };
            actionsContainer.appendChild(retryBtn);
        }

        if (onCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'error-recovery-btn secondary';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => {
                this.removeComponent(componentId);
                onCancel();
            };
            actionsContainer.appendChild(cancelBtn);
        }

        // Auto-remove after timeout
        setTimeout(() => {
            this.removeComponent(componentId);
        }, timeout);

        this.activeComponents.set(componentId, container);
        return container;
    }

    /**
     * Create fallback content for missing data
     */
    createFallbackContent(options = {}) {
        const {
            title = 'No Data Available',
            message = 'Unable to load content at this time',
            icon = '📄',
            actions = []
        } = options;

        const componentId = `fallback-${++this.componentCounter}`;
        
        const container = document.createElement('div');
        container.className = 'fallback-content';
        container.id = componentId;
        
        container.innerHTML = `
            <div class="fallback-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="error-message-actions"></div>
        `;

        const actionsContainer = container.querySelector('.error-message-actions');
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `error-recovery-btn ${action.secondary ? 'secondary' : ''}`;
            btn.textContent = action.text;
            btn.onclick = action.onClick;
            actionsContainer.appendChild(btn);
        });

        this.activeComponents.set(componentId, container);
        return container;
    }

    /**
     * Get appropriate icon for error type
     */
    getErrorIcon(type) {
        const icons = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.error;
    }

    /**
     * Remove a component by ID
     */
    removeComponent(componentId) {
        const component = this.activeComponents.get(componentId);
        if (component) {
            const element = component.element || component;
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.activeComponents.delete(componentId);
        }
    }

    /**
     * Clear all active components
     */
    clearAllComponents() {
        this.activeComponents.forEach((component, id) => {
            this.removeComponent(id);
        });
    }

    /**
     * Replace content in a container with error recovery UI
     */
    replaceWithError(container, options) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return null;
        
        container.innerHTML = '';
        const errorComponent = this.createErrorMessage(options);
        container.appendChild(errorComponent);
        return errorComponent;
    }

    /**
     * Replace content in a container with loading UI
     */
    replaceWithLoading(container, options) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return null;
        
        container.innerHTML = '';
        const loadingComponent = this.createLoadingSpinner(options);
        container.appendChild(loadingComponent);
        return loadingComponent;
    }

    /**
     * Replace content in a container with fallback UI
     */
    replaceWithFallback(container, options) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return null;
        
        container.innerHTML = '';
        const fallbackComponent = this.createFallbackContent(options);
        container.appendChild(fallbackComponent);
        return fallbackComponent;
    }
}

// Create global instance
window.ErrorRecoveryUI = window.ErrorRecoveryUI || new ErrorRecoveryUI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRecoveryUI;
}