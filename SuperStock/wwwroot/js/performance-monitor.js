// ==========================================================================
// PERFORMANCE MONITOR - Real-time performance monitoring dashboard
// ==========================================================================

class PerformanceMonitor {
    constructor() {
        this.isEnabled = false;
        this.metrics = {
            fps: 0,
            memory: { used: 0, total: 0, limit: 0 },
            loadTime: 0,
            domNodes: 0,
            eventListeners: 0,
            networkRequests: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.observers = [];
        this.startTime = performance.now();
        this.lastFrameTime = 0;
        this.frameCount = 0;
        
        this.init();
    }

    init() {
        this.createMonitorUI();
        this.setupKeyboardShortcut();
        this.startMonitoring();
    }

    createMonitorUI() {
        const monitor = document.createElement('div');
        monitor.id = 'performance-monitor';
        monitor.className = 'performance-monitor';
        monitor.innerHTML = `
            <div class="monitor-header">
                <h4>Performance Monitor</h4>
                <div class="monitor-controls">
                    <button class="btn-toggle" onclick="window.perfMonitor.toggle()">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="btn-close" onclick="window.perfMonitor.hide()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="monitor-content">
                <div class="metric-group">
                    <h5>Rendering</h5>
                    <div class="metric">
                        <span class="label">FPS:</span>
                        <span class="value" id="fps-value">0</span>
                    </div>
                    <div class="metric">
                        <span class="label">Frame Time:</span>
                        <span class="value" id="frame-time-value">0ms</span>
                    </div>
                </div>
                
                <div class="metric-group">
                    <h5>Memory</h5>
                    <div class="metric">
                        <span class="label">Used:</span>
                        <span class="value" id="memory-used-value">0 MB</span>
                    </div>
                    <div class="metric">
                        <span class="label">Total:</span>
                        <span class="value" id="memory-total-value">0 MB</span>
                    </div>
                    <div class="metric">
                        <span class="label">Usage:</span>
                        <span class="value" id="memory-usage-value">0%</span>
                    </div>
                </div>
                
                <div class="metric-group">
                    <h5>DOM</h5>
                    <div class="metric">
                        <span class="label">Nodes:</span>
                        <span class="value" id="dom-nodes-value">0</span>
                    </div>
                    <div class="metric">
                        <span class="label">Listeners:</span>
                        <span class="value" id="event-listeners-value">0</span>
                    </div>
                </div>
                
                <div class="metric-group">
                    <h5>Network</h5>
                    <div class="metric">
                        <span class="label">Requests:</span>
                        <span class="value" id="network-requests-value">0</span>
                    </div>
                    <div class="metric">
                        <span class="label">Cache Hits:</span>
                        <span class="value" id="cache-hits-value">0</span>
                    </div>
                </div>
                
                <div class="metric-group">
                    <h5>Performance</h5>
                    <div class="metric">
                        <span class="label">Load Time:</span>
                        <span class="value" id="load-time-value">0ms</span>
                    </div>
                    <div class="metric">
                        <span class="label">Queue Size:</span>
                        <span class="value" id="queue-size-value">0</span>
                    </div>
                </div>
            </div>
            <div class="monitor-footer">
                <button class="btn-export" onclick="window.perfMonitor.exportMetrics()">
                    Export Data
                </button>
                <button class="btn-reset" onclick="window.perfMonitor.resetMetrics()">
                    Reset
                </button>
            </div>
        `;
        
        document.body.appendChild(monitor);
        this.monitorElement = monitor;
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+P to toggle performance monitor
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    startMonitoring() {
        this.isEnabled = true;
        
        // Start FPS monitoring
        this.startFPSMonitoring();
        
        // Start memory monitoring
        this.startMemoryMonitoring();
        
        // Start DOM monitoring
        this.startDOMMonitoring();
        
        // Start network monitoring
        this.startNetworkMonitoring();
        
        // Start performance observer
        this.startPerformanceObserver();
        
        // Update UI every second
        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, 1000);
    }

    startFPSMonitoring() {
        const measureFPS = (timestamp) => {
            if (this.lastFrameTime) {
                const delta = timestamp - this.lastFrameTime;
                this.metrics.fps = Math.round(1000 / delta);
                this.frameCount++;
            }
            
            this.lastFrameTime = timestamp;
            
            if (this.isEnabled) {
                requestAnimationFrame(measureFPS);
            }
        };
        
        requestAnimationFrame(measureFPS);
    }

    startMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                if (this.isEnabled) {
                    const memInfo = performance.memory;
                    this.metrics.memory = {
                        used: memInfo.usedJSHeapSize,
                        total: memInfo.totalJSHeapSize,
                        limit: memInfo.jsHeapSizeLimit
                    };
                }
            }, 1000);
        }
    }

    startDOMMonitoring() {
        // Count DOM nodes
        setInterval(() => {
            if (this.isEnabled) {
                this.metrics.domNodes = document.querySelectorAll('*').length;
                
                // Estimate event listeners (approximation)
                this.metrics.eventListeners = this.estimateEventListeners();
            }
        }, 2000);
    }

    estimateEventListeners() {
        // This is an approximation since there's no direct way to count all event listeners
        let count = 0;
        
        // Count elements with common event attributes
        count += document.querySelectorAll('[onclick]').length;
        count += document.querySelectorAll('[onchange]').length;
        count += document.querySelectorAll('[onsubmit]').length;
        count += document.querySelectorAll('[onload]').length;
        
        // Estimate based on interactive elements
        count += document.querySelectorAll('button, input, select, textarea, a').length * 2;
        
        return count;
    }

    startNetworkMonitoring() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            this.metrics.networkRequests++;
            return originalFetch.apply(this, args);
        };
        
        // Monitor XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalSend = xhr.send;
            xhr.send = function() {
                window.perfMonitor.metrics.networkRequests++;
                return originalSend.apply(this, arguments);
            };
            return xhr;
        };
    }

    startPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Monitor navigation timing
            const navObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'navigation') {
                        this.metrics.loadTime = entry.loadEventEnd - entry.loadEventStart;
                    }
                });
            });
            
            try {
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navObserver);
            } catch (e) {
                console.log('Navigation observer not supported');
            }
            
            // Monitor resource timing
            const resourceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
                        this.metrics.cacheHits++;
                    } else if (entry.transferSize > 0) {
                        this.metrics.cacheMisses++;
                    }
                });
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (e) {
                console.log('Resource observer not supported');
            }
            
            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.duration > 50) {
                        this.logPerformanceIssue('Long Task', `${entry.duration.toFixed(2)}ms`, 'warning');
                    }
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longTaskObserver);
            } catch (e) {
                console.log('Long task observer not supported');
            }
        }
    }

    updateUI() {
        if (!this.isEnabled || !this.monitorElement.classList.contains('show')) return;
        
        // Update FPS
        const fpsElement = document.getElementById('fps-value');
        if (fpsElement) {
            fpsElement.textContent = this.metrics.fps;
            fpsElement.className = this.getPerformanceClass(this.metrics.fps, 30, 60);
        }
        
        // Update frame time
        const frameTimeElement = document.getElementById('frame-time-value');
        if (frameTimeElement) {
            const frameTime = this.metrics.fps > 0 ? (1000 / this.metrics.fps).toFixed(1) : 0;
            frameTimeElement.textContent = frameTime + 'ms';
            frameTimeElement.className = this.getPerformanceClass(parseFloat(frameTime), 33, 16, true);
        }
        
        // Update memory
        if (this.metrics.memory.used > 0) {
            const usedMB = (this.metrics.memory.used / 1024 / 1024).toFixed(1);
            const totalMB = (this.metrics.memory.total / 1024 / 1024).toFixed(1);
            const usage = ((this.metrics.memory.used / this.metrics.memory.limit) * 100).toFixed(1);
            
            const usedElement = document.getElementById('memory-used-value');
            if (usedElement) usedElement.textContent = usedMB + ' MB';
            
            const totalElement = document.getElementById('memory-total-value');
            if (totalElement) totalElement.textContent = totalMB + ' MB';
            
            const usageElement = document.getElementById('memory-usage-value');
            if (usageElement) {
                usageElement.textContent = usage + '%';
                usageElement.className = this.getPerformanceClass(parseFloat(usage), 80, 60, true);
            }
        }
        
        // Update DOM metrics
        const domNodesElement = document.getElementById('dom-nodes-value');
        if (domNodesElement) {
            domNodesElement.textContent = this.metrics.domNodes;
            domNodesElement.className = this.getPerformanceClass(this.metrics.domNodes, 5000, 2000, true);
        }
        
        const listenersElement = document.getElementById('event-listeners-value');
        if (listenersElement) {
            listenersElement.textContent = this.metrics.eventListeners;
            listenersElement.className = this.getPerformanceClass(this.metrics.eventListeners, 1000, 500, true);
        }
        
        // Update network metrics
        const requestsElement = document.getElementById('network-requests-value');
        if (requestsElement) requestsElement.textContent = this.metrics.networkRequests;
        
        const cacheHitsElement = document.getElementById('cache-hits-value');
        if (cacheHitsElement) cacheHitsElement.textContent = this.metrics.cacheHits;
        
        // Update performance metrics
        const loadTimeElement = document.getElementById('load-time-value');
        if (loadTimeElement) {
            loadTimeElement.textContent = this.metrics.loadTime.toFixed(0) + 'ms';
            loadTimeElement.className = this.getPerformanceClass(this.metrics.loadTime, 3000, 1000, true);
        }
        
        // Update queue size from performance optimizer
        const queueSizeElement = document.getElementById('queue-size-value');
        if (queueSizeElement && window.performanceOptimizer) {
            const metrics = window.performanceOptimizer.getPerformanceMetrics();
            queueSizeElement.textContent = metrics.queueSize + metrics.dataQueueSize;
        }
    }

    getPerformanceClass(value, warningThreshold, goodThreshold, reverse = false) {
        if (reverse) {
            if (value > warningThreshold) return 'value error';
            if (value > goodThreshold) return 'value warning';
            return 'value';
        } else {
            if (value < warningThreshold) return 'value error';
            if (value < goodThreshold) return 'value warning';
            return 'value';
        }
    }

    logPerformanceIssue(type, details, severity = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] Performance ${severity.toUpperCase()}: ${type} - ${details}`);
        
        // Could also send to analytics or logging service
        if (window.analytics) {
            window.analytics.track('Performance Issue', {
                type: type,
                details: details,
                severity: severity,
                timestamp: timestamp
            });
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    show() {
        this.monitorElement.classList.add('show');
    }

    hide() {
        this.monitorElement.classList.remove('show');
    }

    toggle() {
        if (this.monitorElement.classList.contains('show')) {
            this.hide();
        } else {
            this.show();
        }
    }

    pause() {
        this.isEnabled = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    resume() {
        this.isEnabled = true;
        this.startMonitoring();
    }

    resetMetrics() {
        this.metrics = {
            fps: 0,
            memory: { used: 0, total: 0, limit: 0 },
            loadTime: 0,
            domNodes: 0,
            eventListeners: 0,
            networkRequests: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.frameCount = 0;
        this.startTime = performance.now();
    }

    exportMetrics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            sessionDuration: (performance.now() - this.startTime) / 1000,
            metrics: this.metrics,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `performance-metrics-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    getMetrics() {
        return { ...this.metrics };
    }

    // Method to be called by other components to report custom metrics
    reportCustomMetric(name, value, category = 'custom') {
        if (!this.metrics.custom) {
            this.metrics.custom = {};
        }
        
        if (!this.metrics.custom[category]) {
            this.metrics.custom[category] = {};
        }
        
        this.metrics.custom[category][name] = value;
    }

    // Method to track component performance
    trackComponentPerformance(componentName, startTime, endTime) {
        const duration = endTime - startTime;
        
        if (!this.metrics.components) {
            this.metrics.components = {};
        }
        
        if (!this.metrics.components[componentName]) {
            this.metrics.components[componentName] = {
                totalTime: 0,
                callCount: 0,
                averageTime: 0
            };
        }
        
        const component = this.metrics.components[componentName];
        component.totalTime += duration;
        component.callCount++;
        component.averageTime = component.totalTime / component.callCount;
        
        if (duration > 100) {
            this.logPerformanceIssue('Slow Component', `${componentName}: ${duration.toFixed(2)}ms`, 'warning');
        }
    }

    destroy() {
        this.isEnabled = false;
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        
        if (this.monitorElement) {
            this.monitorElement.remove();
        }
    }
}

// ==========================================================================
// PERFORMANCE MONITOR STYLES
// ==========================================================================

const monitorStyles = `
.performance-monitor {
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-height: 80vh;
    overflow-y: auto;
}

.performance-monitor.show {
    transform: translateX(0);
}

.performance-monitor .monitor-header {
    padding: 10px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.performance-monitor .monitor-header h4 {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
}

.performance-monitor .monitor-controls {
    display: flex;
    gap: 5px;
}

.performance-monitor .monitor-controls button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
}

.performance-monitor .monitor-controls button:hover {
    background: rgba(255, 255, 255, 0.1);
}

.performance-monitor .monitor-content {
    padding: 10px;
}

.performance-monitor .metric-group {
    margin-bottom: 15px;
}

.performance-monitor .metric-group h5 {
    margin: 0 0 5px 0;
    font-size: 12px;
    color: #ccc;
    border-bottom: 1px solid #333;
    padding-bottom: 2px;
}

.performance-monitor .metric {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
}

.performance-monitor .metric .label {
    color: #aaa;
}

.performance-monitor .metric .value {
    color: #0f0;
    font-weight: bold;
}

.performance-monitor .metric .value.warning {
    color: #ff0;
}

.performance-monitor .metric .value.error {
    color: #f00;
}

.performance-monitor .monitor-footer {
    padding: 10px;
    border-top: 1px solid #333;
    display: flex;
    gap: 10px;
}

.performance-monitor .monitor-footer button {
    flex: 1;
    background: #333;
    border: none;
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
}

.performance-monitor .monitor-footer button:hover {
    background: #555;
}

@media (max-width: 768px) {
    .performance-monitor {
        width: 250px;
        font-size: 11px;
    }
    
    .performance-monitor .monitor-header h4 {
        font-size: 12px;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = monitorStyles;
document.head.appendChild(styleSheet);

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize performance monitor (hidden by default)
    window.perfMonitor = new PerformanceMonitor();
    
    // Show monitor in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Performance Monitor available. Press Ctrl+Shift+P to toggle.');
    }
});

// Export for use in other modules
window.PerformanceMonitor = PerformanceMonitor;