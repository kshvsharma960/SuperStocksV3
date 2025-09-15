// ==========================================================================
// SERVICE WORKER REGISTRATION - Enhanced offline capability
// ==========================================================================

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.isOnline = navigator.onLine;
        this.updateAvailable = false;
        this.init();
    }

    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }

        try {
            await this.registerServiceWorker();
            this.setupUpdateHandling();
            this.setupOnlineOfflineHandling();
            this.setupBackgroundSync();
            this.setupPushNotifications();
        } catch (error) {
            console.error('Service Worker initialization failed:', error);
        }
    }

    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker registered successfully:', this.registration);

            // Handle different registration states
            if (this.registration.installing) {
                console.log('Service Worker installing...');
                this.trackInstallProgress(this.registration.installing);
            } else if (this.registration.waiting) {
                console.log('Service Worker waiting...');
                this.showUpdateAvailable();
            } else if (this.registration.active) {
                console.log('Service Worker active');
            }

            // Listen for updates
            this.registration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                this.trackInstallProgress(this.registration.installing);
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    trackInstallProgress(worker) {
        worker.addEventListener('statechange', () => {
            console.log('Service Worker state changed:', worker.state);
            
            switch (worker.state) {
                case 'installed':
                    if (navigator.serviceWorker.controller) {
                        // New update available
                        this.showUpdateAvailable();
                    } else {
                        // First install
                        this.showInstallComplete();
                    }
                    break;
                case 'activated':
                    console.log('Service Worker activated');
                    this.showActivated();
                    break;
                case 'redundant':
                    console.log('Service Worker redundant');
                    break;
            }
        });
    }

    setupUpdateHandling() {
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });

        // Check for updates periodically
        setInterval(() => {
            if (this.registration) {
                this.registration.update();
            }
        }, 60000); // Check every minute
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'trade-synced':
                this.handleTradeSynced(data);
                break;
            case 'watchlist-synced':
                this.handleWatchlistSynced(data);
                break;
            case 'cache-updated':
                this.handleCacheUpdated(data);
                break;
            case 'offline-ready':
                this.handleOfflineReady();
                break;
        }
    }

    setupOnlineOfflineHandling() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });

        // Initial state
        if (this.isOnline) {
            this.handleOnline();
        } else {
            this.handleOffline();
        }
    }

    handleOnline() {
        console.log('Application is online');
        
        // Update UI
        document.body.classList.remove('offline');
        document.body.classList.add('online');
        
        // Show online notification
        this.showNotification('Back online', 'Connection restored', 'success');
        
        // Trigger background sync
        this.triggerBackgroundSync();
        
        // Update cached resources
        this.updateCaches();
    }

    handleOffline() {
        console.log('Application is offline');
        
        // Update UI
        document.body.classList.remove('online');
        document.body.classList.add('offline');
        
        // Show offline notification
        this.showNotification('Offline mode', 'Some features may be limited', 'warning');
        
        // Enable offline features
        this.enableOfflineFeatures();
    }

    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            console.log('Background Sync supported');
            
            // Register sync events
            this.registerBackgroundSync('background-sync-trades');
            this.registerBackgroundSync('background-sync-watchlist');
        } else {
            console.log('Background Sync not supported');
        }
    }

    async registerBackgroundSync(tag) {
        try {
            if (this.registration && this.registration.sync) {
                await this.registration.sync.register(tag);
                console.log('Background sync registered:', tag);
            }
        } catch (error) {
            console.error('Background sync registration failed:', error);
        }
    }

    triggerBackgroundSync() {
        this.registerBackgroundSync('background-sync-trades');
        this.registerBackgroundSync('background-sync-watchlist');
    }

    setupPushNotifications() {
        if ('PushManager' in window && 'Notification' in window) {
            console.log('Push notifications supported');
            this.requestNotificationPermission();
        } else {
            console.log('Push notifications not supported');
        }
    }

    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            
            if (permission === 'granted') {
                this.subscribeToPushNotifications();
            }
        } else if (Notification.permission === 'granted') {
            this.subscribeToPushNotifications();
        }
    }

    async subscribeToPushNotifications() {
        try {
            if (this.registration && this.registration.pushManager) {
                const subscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
                });
                
                console.log('Push subscription:', subscription);
                
                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            }
        } catch (error) {
            console.error('Push subscription failed:', error);
        }
    }

    getVapidPublicKey() {
        // Replace with your actual VAPID public key
        return 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKHSr3txbueJHHieurqDFt0NdNiS5PhzSA6jZxaZYTBBDM';
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });
            
            if (response.ok) {
                console.log('Push subscription sent to server');
            }
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }

    // ==========================================================================
    // UPDATE HANDLING
    // ==========================================================================

    showUpdateAvailable() {
        this.updateAvailable = true;
        
        const notification = this.createUpdateNotification();
        document.body.appendChild(notification);
    }

    createUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <div class="update-icon">
                    <i class="fas fa-download"></i>
                </div>
                <div class="update-text">
                    <h4>Update Available</h4>
                    <p>A new version of SuperStock is ready to install.</p>
                </div>
                <div class="update-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.swManager.applyUpdate()">
                        Update Now
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="window.swManager.dismissUpdate()">
                        Later
                    </button>
                </div>
            </div>
        `;
        
        return notification;
    }

    async applyUpdate() {
        if (this.registration && this.registration.waiting) {
            // Tell the waiting service worker to skip waiting
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload the page to activate the new service worker
            window.location.reload();
        }
    }

    dismissUpdate() {
        const notification = document.querySelector('.update-notification');
        if (notification) {
            notification.remove();
        }
    }

    showInstallComplete() {
        this.showNotification(
            'App Installed',
            'SuperStock is now available offline',
            'success'
        );
    }

    showActivated() {
        this.showNotification(
            'App Updated',
            'SuperStock has been updated to the latest version',
            'success'
        );
    }

    // ==========================================================================
    // OFFLINE FEATURES
    // ==========================================================================

    enableOfflineFeatures() {
        // Show offline indicators
        this.showOfflineIndicators();
        
        // Enable offline data storage
        this.enableOfflineStorage();
        
        // Setup offline form handling
        this.setupOfflineFormHandling();
    }

    showOfflineIndicators() {
        // Add offline badges to interactive elements
        document.querySelectorAll('button, .btn').forEach(button => {
            if (!button.classList.contains('offline-available')) {
                button.classList.add('offline-disabled');
                button.title = 'This feature requires an internet connection';
            }
        });
    }

    enableOfflineStorage() {
        // Setup IndexedDB for offline data
        this.setupOfflineDatabase();
    }

    async setupOfflineDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SuperStockOffline', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores for offline data
                if (!db.objectStoreNames.contains('trades')) {
                    db.createObjectStore('trades', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('watchlist')) {
                    db.createObjectStore('watchlist', { keyPath: 'id', autoIncrement: true });
                }
                
                if (!db.objectStoreNames.contains('portfolio')) {
                    db.createObjectStore('portfolio', { keyPath: 'symbol' });
                }
            };
        });
    }

    setupOfflineFormHandling() {
        // Intercept form submissions when offline
        document.addEventListener('submit', (event) => {
            if (!this.isOnline) {
                this.handleOfflineFormSubmission(event);
            }
        });
    }

    handleOfflineFormSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Store form data for later sync
        this.storeOfflineFormData(form.action, data);
        
        // Show offline submission message
        this.showNotification(
            'Saved for later',
            'Your request will be processed when you\'re back online',
            'info'
        );
    }

    async storeOfflineFormData(action, data) {
        try {
            const db = await this.setupOfflineDatabase();
            const transaction = db.transaction(['trades'], 'readwrite');
            const store = transaction.objectStore('trades');
            
            await store.add({
                action: action,
                data: data,
                timestamp: Date.now(),
                synced: false
            });
            
            console.log('Offline form data stored');
        } catch (error) {
            console.error('Failed to store offline form data:', error);
        }
    }

    // ==========================================================================
    // CACHE MANAGEMENT
    // ==========================================================================

    async updateCaches() {
        if (this.registration) {
            // Send message to service worker to update caches
            this.registration.active?.postMessage({
                type: 'CACHE_URLS',
                urls: this.getCriticalUrls()
            });
        }
    }

    getCriticalUrls() {
        return [
            '/',
            '/Home/Index',
            '/Home/Leaderboard',
            '/css/site.min.css',
            '/js/site.min.js',
            '/js/dashboard.min.js'
        ];
    }

    async clearCaches() {
        if (this.registration) {
            this.registration.active?.postMessage({
                type: 'CLEAR_CACHE'
            });
        }
    }

    // ==========================================================================
    // SYNC HANDLERS
    // ==========================================================================

    handleTradeSynced(data) {
        console.log('Trade synced:', data);
        
        if (data.success) {
            this.showNotification(
                'Trade Executed',
                'Your offline trade has been processed',
                'success'
            );
            
            // Update UI
            if (window.dashboard) {
                window.dashboard.refreshPortfolio();
            }
        }
    }

    handleWatchlistSynced(data) {
        console.log('Watchlist synced:', data);
        
        if (data.success) {
            this.showNotification(
                'Watchlist Updated',
                'Your offline watchlist changes have been synced',
                'success'
            );
            
            // Update UI
            if (window.watchlist) {
                window.watchlist.refresh();
            }
        }
    }

    handleCacheUpdated(data) {
        console.log('Cache updated:', data);
    }

    handleOfflineReady() {
        this.showNotification(
            'Offline Ready',
            'SuperStock is now available offline',
            'success'
        );
    }

    // ==========================================================================
    // NOTIFICATION SYSTEM
    // ==========================================================================

    showNotification(title, message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `sw-notification sw-notification-${type}`;
        notification.innerHTML = `
            <div class="sw-notification-content">
                <div class="sw-notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                </div>
                <div class="sw-notification-text">
                    <h5>${title}</h5>
                    <p>${message}</p>
                </div>
                <button class="sw-notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    // Get service worker registration
    getRegistration() {
        return this.registration;
    }

    // Check if app is online
    isAppOnline() {
        return this.isOnline;
    }

    // Check if update is available
    isUpdateAvailable() {
        return this.updateAvailable;
    }

    // Manually check for updates
    async checkForUpdates() {
        if (this.registration) {
            await this.registration.update();
        }
    }

    // Get offline data
    async getOfflineData(storeName) {
        try {
            const db = await this.setupOfflineDatabase();
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get offline data:', error);
            return [];
        }
    }

    // Clear offline data
    async clearOfflineData(storeName) {
        try {
            const db = await this.setupOfflineDatabase();
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to clear offline data:', error);
        }
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize service worker manager
    window.swManager = new ServiceWorkerManager();
    
    console.log('Service Worker Manager initialized');
});

// Export for use in other modules
window.ServiceWorkerManager = ServiceWorkerManager;