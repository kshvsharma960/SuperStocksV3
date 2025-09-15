// ==========================================================================
// SWIPE GESTURES - Swipe gesture support for charts and tables
// ==========================================================================

class SwipeGestureManager {
    constructor() {
        this.activeGestures = new Map();
        this.init();
    }

    init() {
        this.setupChartSwipes();
        this.setupTableSwipes();
        this.setupWatchlistSwipes();
    }

    setupChartSwipes() {
        const chartContainers = document.querySelectorAll('.chart-container, .stock-chart');
        
        chartContainers.forEach(container => {
            this.addChartSwipeSupport(container);
        });
    }

    addChartSwipeSupport(container) {
        const gesture = new ChartSwipeGesture(container);
        this.activeGestures.set(container, gesture);
    }

    setupTableSwipes() {
        const tables = document.querySelectorAll('.holdings-table, .leaderboard-table');
        
        tables.forEach(table => {
            this.addTableSwipeSupport(table);
        });
    }

    addTableSwipeSupport(table) {
        const gesture = new TableSwipeGesture(table);
        this.activeGestures.set(table, gesture);
    }

    setupWatchlistSwipes() {
        const watchlistItems = document.querySelectorAll('.watchlist-item');
        
        watchlistItems.forEach(item => {
            this.addWatchlistSwipeSupport(item);
        });
    }

    addWatchlistSwipeSupport(item) {
        const gesture = new WatchlistSwipeGesture(item);
        this.activeGestures.set(item, gesture);
    }
}

// ==========================================================================
// CHART SWIPE GESTURE
// ==========================================================================

class ChartSwipeGesture {
    constructor(container) {
        this.container = container;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.timeframes = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
        this.currentTimeframeIndex = 0;
        
        this.init();
    }

    init() {
        this.createTimeframeIndicator();
        this.bindEvents();
        this.addChartZoomSupport();
    }

    createTimeframeIndicator() {
        if (this.container.querySelector('.timeframe-indicator')) return;

        const indicator = document.createElement('div');
        indicator.className = 'timeframe-indicator';
        indicator.innerHTML = `
            <div class="timeframe-pills">
                ${this.timeframes.map((tf, index) => 
                    `<span class="timeframe-pill ${index === 0 ? 'active' : ''}" data-timeframe="${tf}">${tf}</span>`
                ).join('')}
            </div>
        `;
        
        this.container.appendChild(indicator);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .timeframe-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 10;
            }
            
            .timeframe-pills {
                display: flex;
                gap: 4px;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 20px;
                padding: 4px;
            }
            
            .timeframe-pill {
                padding: 4px 8px;
                border-radius: 16px;
                color: white;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .timeframe-pill.active {
                background: var(--color-primary, #007bff);
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        // Timeframe pill clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('timeframe-pill')) {
                this.changeTimeframe(e.target.dataset.timeframe);
            }
        });
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.isDragging = false;
    }

    handleTouchMove(e) {
        if (!e.touches[0]) return;

        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;

        // Check if this is a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            this.isDragging = true;
            e.preventDefault(); // Prevent scrolling
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;

        const deltaX = this.currentX - this.startX;
        const threshold = 50;

        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                this.previousTimeframe();
            } else {
                this.nextTimeframe();
            }
        }

        this.isDragging = false;
    }

    nextTimeframe() {
        if (this.currentTimeframeIndex < this.timeframes.length - 1) {
            this.currentTimeframeIndex++;
            this.updateTimeframe();
        }
    }

    previousTimeframe() {
        if (this.currentTimeframeIndex > 0) {
            this.currentTimeframeIndex--;
            this.updateTimeframe();
        }
    }

    changeTimeframe(timeframe) {
        const index = this.timeframes.indexOf(timeframe);
        if (index !== -1) {
            this.currentTimeframeIndex = index;
            this.updateTimeframe();
        }
    }

    updateTimeframe() {
        const pills = this.container.querySelectorAll('.timeframe-pill');
        pills.forEach((pill, index) => {
            pill.classList.toggle('active', index === this.currentTimeframeIndex);
        });

        // Show swipe hint
        this.showSwipeHint();

        // Emit event for chart update
        this.container.dispatchEvent(new CustomEvent('timeframechange', {
            detail: { 
                timeframe: this.timeframes[this.currentTimeframeIndex],
                index: this.currentTimeframeIndex
            }
        }));
    }

    showSwipeHint() {
        const hint = this.container.querySelector('.swipe-hint');
        if (hint) {
            hint.textContent = `Swipe to change timeframe (${this.timeframes[this.currentTimeframeIndex]})`;
            hint.classList.add('visible');
            
            setTimeout(() => {
                hint.classList.remove('visible');
            }, 2000);
        }
    }

    addChartZoomSupport() {
        let initialDistance = 0;
        let currentScale = 1;
        let initialCenter = { x: 0, y: 0 };
        let currentTranslate = { x: 0, y: 0 };
        
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialCenter = this.getCenter(e.touches[0], e.touches[1]);
            }
        }, { passive: true });

        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const currentCenter = this.getCenter(e.touches[0], e.touches[1]);
                
                const scale = currentDistance / initialDistance;
                currentScale = Math.min(Math.max(scale, 0.5), 3);
                
                // Calculate translation based on center point
                const deltaX = currentCenter.x - initialCenter.x;
                const deltaY = currentCenter.y - initialCenter.y;
                currentTranslate.x += deltaX;
                currentTranslate.y += deltaY;
                
                const chart = this.container.querySelector('canvas');
                if (chart) {
                    chart.style.transform = `scale(${currentScale}) translate(${currentTranslate.x}px, ${currentTranslate.y}px)`;
                }
                
                this.showZoomIndicator(currentScale);
            }
        }, { passive: false });

        this.container.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                // Reset or apply zoom
                const chart = this.container.querySelector('canvas');
                if (chart && currentScale !== 1) {
                    // Emit zoom event
                    this.container.dispatchEvent(new CustomEvent('chartzoom', {
                        detail: { 
                            scale: currentScale,
                            translate: currentTranslate
                        }
                    }));
                }
                this.hideZoomIndicator();
            }
        }, { passive: true });

        // Add zoom controls
        this.addZoomControls();
    }

    addZoomControls() {
        if (this.container.querySelector('.zoom-controls')) return;

        const controls = document.createElement('div');
        controls.className = 'zoom-controls';
        controls.innerHTML = `
            <button class="zoom-btn zoom-in" data-action="zoom-in">
                <i class="fas fa-plus"></i>
            </button>
            <button class="zoom-btn zoom-out" data-action="zoom-out">
                <i class="fas fa-minus"></i>
            </button>
            <button class="zoom-btn zoom-reset" data-action="zoom-reset">
                <i class="fas fa-expand-arrows-alt"></i>
            </button>
        `;

        this.container.appendChild(controls);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .zoom-controls {
                position: absolute;
                bottom: 60px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 10;
            }
            
            .zoom-btn {
                width: 44px;
                height: 44px;
                border: none;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .zoom-btn:hover {
                background: rgba(0, 0, 0, 0.8);
                transform: scale(1.1);
            }
            
            .zoom-indicator {
                position: absolute;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 10;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .zoom-indicator.visible {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);

        // Bind zoom control events
        controls.addEventListener('click', (e) => {
            const btn = e.target.closest('.zoom-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.handleZoomAction(action);
            }
        });
    }

    handleZoomAction(action) {
        const chart = this.container.querySelector('canvas');
        if (!chart) return;

        let newScale = 1;
        const currentTransform = chart.style.transform;
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
        const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

        switch (action) {
            case 'zoom-in':
                newScale = Math.min(currentScale * 1.2, 3);
                break;
            case 'zoom-out':
                newScale = Math.max(currentScale / 1.2, 0.5);
                break;
            case 'zoom-reset':
                newScale = 1;
                break;
        }

        chart.style.transform = `scale(${newScale})`;
        this.showZoomIndicator(newScale);
        
        setTimeout(() => {
            this.hideZoomIndicator();
        }, 1500);

        // Emit zoom event
        this.container.dispatchEvent(new CustomEvent('chartzoom', {
            detail: { scale: newScale }
        }));
    }

    showZoomIndicator(scale) {
        let indicator = this.container.querySelector('.zoom-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'zoom-indicator';
            this.container.appendChild(indicator);
        }
        
        indicator.textContent = `${Math.round(scale * 100)}%`;
        indicator.classList.add('visible');
    }

    hideZoomIndicator() {
        const indicator = this.container.querySelector('.zoom-indicator');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    }

    getCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// ==========================================================================
// TABLE SWIPE GESTURE
// ==========================================================================

class TableSwipeGesture {
    constructor(table) {
        this.table = table;
        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.addTableRowActions();
    }

    bindEvents() {
        this.table.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.table.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.table.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.isDragging = false;
    }

    handleTouchMove(e) {
        if (!e.touches[0]) return;

        this.currentX = e.touches[0].clientX;
        const deltaX = this.currentX - this.startX;

        // Allow horizontal scrolling for tables
        if (Math.abs(deltaX) > 10) {
            this.isDragging = true;
            // Don't prevent default - allow native scrolling
        }
    }

    handleTouchEnd(e) {
        if (this.isDragging) {
            // Add momentum scrolling effect
            this.addMomentumScrolling();
        }
        this.isDragging = false;
    }

    addMomentumScrolling() {
        // Add CSS class for momentum scrolling
        this.table.style.webkitOverflowScrolling = 'touch';
        this.table.style.scrollBehavior = 'smooth';
        
        // Add scroll indicators
        this.addScrollIndicators();
    }

    addScrollIndicators() {
        if (this.table.querySelector('.scroll-indicator')) return;

        // Create scroll indicator container
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'scroll-indicator-container';
        
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        
        const leftFade = document.createElement('div');
        leftFade.className = 'scroll-fade scroll-fade-left';
        
        const rightFade = document.createElement('div');
        rightFade.className = 'scroll-fade scroll-fade-right';
        
        indicatorContainer.appendChild(indicator);
        this.table.parentNode.appendChild(indicatorContainer);
        this.table.parentNode.appendChild(leftFade);
        this.table.parentNode.appendChild(rightFade);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scroll-indicator-container {
                position: relative;
                height: 3px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 2px;
                margin-top: 4px;
            }
            
            .scroll-indicator {
                height: 100%;
                background: var(--color-primary);
                border-radius: 2px;
                transition: width 0.2s ease;
                width: 0%;
            }
            
            .scroll-fade {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 20px;
                pointer-events: none;
                z-index: 1;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .scroll-fade-left {
                left: 0;
                background: linear-gradient(to right, var(--bg-card), transparent);
            }
            
            .scroll-fade-right {
                right: 0;
                background: linear-gradient(to left, var(--bg-card), transparent);
            }
            
            .scroll-fade.visible {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);

        // Update indicator on scroll
        this.table.addEventListener('scroll', () => {
            const scrollPercent = (this.table.scrollLeft / (this.table.scrollWidth - this.table.clientWidth)) * 100;
            indicator.style.width = `${Math.min(scrollPercent, 100)}%`;
            
            // Show/hide fade indicators
            leftFade.classList.toggle('visible', this.table.scrollLeft > 10);
            rightFade.classList.toggle('visible', 
                this.table.scrollLeft < (this.table.scrollWidth - this.table.clientWidth - 10)
            );
        }, { passive: true });

        // Initial check
        const scrollPercent = (this.table.scrollLeft / (this.table.scrollWidth - this.table.clientWidth)) * 100;
        indicator.style.width = `${Math.min(scrollPercent, 100)}%`;
        
        rightFade.classList.toggle('visible', 
            this.table.scrollWidth > this.table.clientWidth
        );
    }

    addTableRowActions() {
        // Add swipe actions to table rows on mobile
        if (window.innerWidth > 768) return;

        const rows = this.table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            this.addRowSwipeSupport(row);
        });
    }

    addRowSwipeSupport(row) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        row.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = false;
        }, { passive: true });

        row.addEventListener('touchmove', (e) => {
            if (!e.touches[0]) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;

            if (Math.abs(deltaX) > 10) {
                isDragging = true;
                e.preventDefault();

                // Show row actions on left swipe
                if (deltaX < 0) {
                    row.style.transform = `translateX(${Math.max(deltaX, -80)}px)`;
                    this.showRowActions(row);
                }
            }
        }, { passive: false });

        row.addEventListener('touchend', () => {
            if (isDragging) {
                const deltaX = currentX - startX;
                
                if (deltaX < -40) {
                    // Keep actions visible
                    row.style.transform = 'translateX(-80px)';
                } else {
                    // Hide actions
                    row.style.transform = '';
                    this.hideRowActions(row);
                }
            }
            isDragging = false;
        }, { passive: true });
    }

    showRowActions(row) {
        if (row.querySelector('.row-actions')) return;

        const actions = document.createElement('div');
        actions.className = 'row-actions';
        actions.innerHTML = `
            <button class="action-btn view-btn" data-action="view">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn edit-btn" data-action="edit">
                <i class="fas fa-edit"></i>
            </button>
        `;
        
        row.appendChild(actions);

        // Bind action events
        actions.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.handleRowAction(row, action);
            }
        });
    }

    hideRowActions(row) {
        const actions = row.querySelector('.row-actions');
        if (actions) {
            actions.remove();
        }
    }

    handleRowAction(row, action) {
        // Emit custom event for row actions
        row.dispatchEvent(new CustomEvent('rowaction', {
            detail: { action, row },
            bubbles: true
        }));
        
        // Hide actions after action
        this.hideRowActions(row);
        row.style.transform = '';
    }
}

// ==========================================================================
// WATCHLIST SWIPE GESTURE
// ==========================================================================

class WatchlistSwipeGesture {
    constructor(item) {
        this.item = item;
        this.startX = 0;
        this.currentX = 0;
        this.isDragging = false;
        this.threshold = 80;
        
        this.init();
    }

    init() {
        this.createSwipeActions();
        this.bindEvents();
    }

    createSwipeActions() {
        if (this.item.querySelector('.swipe-actions')) return;

        const actions = document.createElement('div');
        actions.className = 'swipe-actions';
        actions.innerHTML = `
            <button class="action-btn delete-btn touch-target" data-action="remove">
                <i class="fas fa-trash"></i>
            </button>
            <button class="action-btn trade-btn touch-target" data-action="trade">
                <i class="fas fa-chart-line"></i>
            </button>
        `;
        
        this.item.appendChild(actions);
        
        // Bind action events
        actions.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const action = btn.dataset.action;
                this.handleAction(action);
            }
        });
    }

    bindEvents() {
        this.item.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.item.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.item.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.isDragging = false;
    }

    handleTouchMove(e) {
        if (!e.touches[0]) return;

        this.currentX = e.touches[0].clientX;
        const deltaX = this.currentX - this.startX;

        if (Math.abs(deltaX) > 10) {
            this.isDragging = true;
            e.preventDefault();

            // Only allow left swipe to reveal actions
            if (deltaX < 0) {
                const progress = Math.min(Math.abs(deltaX) / this.threshold, 1);
                this.item.style.transform = `translateX(${deltaX}px)`;
                
                const actions = this.item.querySelector('.swipe-actions');
                if (actions) {
                    actions.style.opacity = progress;
                }
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;

        const deltaX = this.currentX - this.startX;
        const actions = this.item.querySelector('.swipe-actions');

        if (deltaX < -this.threshold) {
            // Show actions
            this.item.style.transform = `translateX(-${this.threshold}px)`;
            if (actions) {
                actions.classList.add('visible');
                actions.style.opacity = '1';
            }
        } else {
            // Hide actions
            this.hideActions();
        }

        this.isDragging = false;
    }

    hideActions() {
        this.item.style.transform = '';
        const actions = this.item.querySelector('.swipe-actions');
        if (actions) {
            actions.classList.remove('visible');
            actions.style.opacity = '0';
        }
    }

    handleAction(action) {
        const symbol = this.item.dataset.symbol || this.item.querySelector('.stock-symbol')?.textContent;
        
        switch (action) {
            case 'remove':
                this.removeFromWatchlist(symbol);
                break;
            case 'trade':
                this.openTradeModal(symbol);
                break;
        }
        
        this.hideActions();
    }

    removeFromWatchlist(symbol) {
        // Emit custom event
        this.item.dispatchEvent(new CustomEvent('removestock', {
            detail: { symbol },
            bubbles: true
        }));
    }

    openTradeModal(symbol) {
        // Emit custom event
        this.item.dispatchEvent(new CustomEvent('tradestock', {
            detail: { symbol },
            bubbles: true
        }));
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    new SwipeGestureManager();
});

// Export for use in other modules
window.SwipeGestureManager = SwipeGestureManager;
window.ChartSwipeGesture = ChartSwipeGesture;
window.TableSwipeGesture = TableSwipeGesture;
window.WatchlistSwipeGesture = WatchlistSwipeGesture;
            