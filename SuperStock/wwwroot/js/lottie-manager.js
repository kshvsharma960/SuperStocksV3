/**
 * Lottie Animation Manager
 * Handles loading states, success/error feedback, and empty state animations
 */
class LottieManager {
    constructor() {
        this.animations = new Map();
        this.animationPaths = {
            loading: '/assets/lottie/loading.json',
            success: '/assets/lottie/success.json',
            error: '/assets/lottie/error.json',
            emptyState: '/assets/lottie/empty-state.json'
        };
    }

    /**
     * Create and play a loading animation
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Animation options
     */
    showLoading(container, options = {}) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return null;

        // Clear existing content
        element.innerHTML = '';
        
        // Create animation container
        const animationContainer = document.createElement('div');
        animationContainer.className = 'lottie-loading-container';
        animationContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: ${options.minHeight || '100px'};
            padding: 20px;
        `;

        // Create Lottie container
        const lottieContainer = document.createElement('div');
        lottieContainer.className = 'lottie-animation';
        lottieContainer.style.cssText = `
            width: ${options.width || '60px'};
            height: ${options.height || '60px'};
        `;

        animationContainer.appendChild(lottieContainer);

        // Add loading text if provided
        if (options.text) {
            const textElement = document.createElement('div');
            textElement.className = 'lottie-text';
            textElement.textContent = options.text;
            textElement.style.cssText = `
                margin-top: 12px;
                color: var(--text-muted, #6c757d);
                font-size: 14px;
                text-align: center;
            `;
            animationContainer.appendChild(textElement);
        }

        element.appendChild(animationContainer);

        // Load and play animation
        const animation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: this.animationPaths.loading
        });

        const animationId = this.generateId();
        this.animations.set(animationId, {
            animation,
            container: element,
            type: 'loading'
        });

        return animationId;
    }

    /**
     * Show success animation with optional message
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Animation options
     */
    showSuccess(container, options = {}) {
        return this.showFeedback(container, 'success', {
            message: options.message || 'Success!',
            duration: options.duration || 2000,
            ...options
        });
    }

    /**
     * Show error animation with optional message
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Animation options
     */
    showError(container, options = {}) {
        return this.showFeedback(container, 'error', {
            message: options.message || 'Error occurred',
            duration: options.duration || 3000,
            ...options
        });
    }

    /**
     * Show empty state animation
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Animation options
     */
    showEmptyState(container, options = {}) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return null;

        // Clear existing content
        element.innerHTML = '';
        
        // Create empty state container
        const emptyContainer = document.createElement('div');
        emptyContainer.className = 'lottie-empty-state';
        emptyContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: ${options.minHeight || '200px'};
            padding: 40px 20px;
            text-align: center;
        `;

        // Create Lottie container
        const lottieContainer = document.createElement('div');
        lottieContainer.className = 'lottie-animation';
        lottieContainer.style.cssText = `
            width: ${options.width || '120px'};
            height: ${options.height || '120px'};
            margin-bottom: 20px;
        `;

        emptyContainer.appendChild(lottieContainer);

        // Add title
        if (options.title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'empty-state-title';
            titleElement.textContent = options.title;
            titleElement.style.cssText = `
                margin: 0 0 8px 0;
                color: var(--text-primary, #212529);
                font-size: 18px;
                font-weight: 600;
            `;
            emptyContainer.appendChild(titleElement);
        }

        // Add message
        if (options.message) {
            const messageElement = document.createElement('p');
            messageElement.className = 'empty-state-message';
            messageElement.textContent = options.message;
            messageElement.style.cssText = `
                margin: 0 0 20px 0;
                color: var(--text-muted, #6c757d);
                font-size: 14px;
                line-height: 1.5;
                max-width: 300px;
            `;
            emptyContainer.appendChild(messageElement);
        }

        // Add action button if provided
        if (options.actionText && options.actionCallback) {
            const actionButton = document.createElement('button');
            actionButton.className = 'btn btn-primary btn-sm';
            actionButton.textContent = options.actionText;
            actionButton.onclick = options.actionCallback;
            emptyContainer.appendChild(actionButton);
        }

        element.appendChild(emptyContainer);

        // Load and play animation
        const animation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: this.animationPaths.emptyState
        });

        const animationId = this.generateId();
        this.animations.set(animationId, {
            animation,
            container: element,
            type: 'emptyState'
        });

        return animationId;
    }

    /**
     * Show feedback animation (success/error)
     * @private
     */
    showFeedback(container, type, options) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return null;

        // Create feedback container
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = `lottie-feedback lottie-${type}`;
        feedbackContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
        `;

        // Create Lottie container
        const lottieContainer = document.createElement('div');
        lottieContainer.className = 'lottie-animation';
        lottieContainer.style.cssText = `
            width: ${options.width || '50px'};
            height: ${options.height || '50px'};
            margin-bottom: 12px;
        `;

        feedbackContainer.appendChild(lottieContainer);

        // Add message
        if (options.message) {
            const messageElement = document.createElement('div');
            messageElement.className = 'feedback-message';
            messageElement.textContent = options.message;
            messageElement.style.cssText = `
                color: ${type === 'success' ? 'var(--success-color, #28a745)' : 'var(--danger-color, #dc3545)'};
                font-size: 14px;
                font-weight: 500;
            `;
            feedbackContainer.appendChild(messageElement);
        }

        // If replacing content, clear it first
        if (options.replace !== false) {
            element.innerHTML = '';
        }
        element.appendChild(feedbackContainer);

        // Load and play animation
        const animation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: this.animationPaths[type]
        });

        const animationId = this.generateId();
        this.animations.set(animationId, {
            animation,
            container: element,
            type
        });

        // Auto-remove after duration
        if (options.duration > 0) {
            setTimeout(() => {
                this.remove(animationId);
                if (options.onComplete) {
                    options.onComplete();
                }
            }, options.duration);
        }

        return animationId;
    }

    /**
     * Remove animation by ID
     * @param {string} animationId - Animation ID to remove
     */
    remove(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData) {
            animationData.animation.destroy();
            
            // Remove the animation container
            const lottieContainer = animationData.container.querySelector('.lottie-loading-container, .lottie-feedback, .lottie-empty-state');
            if (lottieContainer) {
                lottieContainer.remove();
            }
            
            this.animations.delete(animationId);
        }
    }

    /**
     * Remove all animations
     */
    removeAll() {
        this.animations.forEach((animationData, id) => {
            this.remove(id);
        });
    }

    /**
     * Create loading overlay for entire page or specific element
     * @param {HTMLElement|string} container - Container element or selector (defaults to body)
     * @param {Object} options - Overlay options
     */
    showLoadingOverlay(container = document.body, options = {}) {
        const element = typeof container === 'string' ? document.querySelector(container) : container;
        if (!element) return null;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'lottie-loading-overlay';
        overlay.style.cssText = `
            position: ${element === document.body ? 'fixed' : 'absolute'};
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        `;

        // Create Lottie container
        const lottieContainer = document.createElement('div');
        lottieContainer.style.cssText = `
            width: ${options.width || '80px'};
            height: ${options.height || '80px'};
        `;

        contentContainer.appendChild(lottieContainer);

        // Add loading text
        if (options.text) {
            const textElement = document.createElement('div');
            textElement.textContent = options.text;
            textElement.style.cssText = `
                margin-top: 16px;
                color: var(--text-primary, #212529);
                font-size: 16px;
                font-weight: 500;
            `;
            contentContainer.appendChild(textElement);
        }

        overlay.appendChild(contentContainer);
        element.appendChild(overlay);

        // Load animation
        const animation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: this.animationPaths.loading
        });

        const animationId = this.generateId();
        this.animations.set(animationId, {
            animation,
            container: element,
            overlay,
            type: 'overlay'
        });

        return animationId;
    }

    /**
     * Remove loading overlay
     * @param {string} animationId - Animation ID
     */
    removeOverlay(animationId) {
        const animationData = this.animations.get(animationId);
        if (animationData && animationData.type === 'overlay') {
            animationData.animation.destroy();
            if (animationData.overlay) {
                animationData.overlay.remove();
            }
            this.animations.delete(animationId);
        }
    }

    /**
     * Generate unique animation ID
     * @private
     */
    generateId() {
        return 'lottie_' + Math.random().toString(36).substr(2, 9);
    }
}

// Create global instance
window.lottieManager = new LottieManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LottieManager;
}