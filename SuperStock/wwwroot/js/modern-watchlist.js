// Modern Watchlist Display with Real-time Updates
class ModernWatchlistManager {
    constructor() {
        this.watchlistData = [];
        this.updateInterval = 5000; // 5 seconds
        this.animationDuration = 300;
        this.priceUpdateTimeout = null;
        this.sortOrder = 'name'; // name, price, change
        this.sortDirection = 'asc'; // asc, desc
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadWatchlistData();
        this.startRealTimeUpdates();
    }
    
    setupEventListeners() {
        // Sort controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('.watchlist-sort-btn')) {
                const sortType = e.target.closest('.watchlist-sort-btn').dataset.sort;
                this.handleSort(sortType);
            }
            
            if (e.target.closest('.watchlist-view-toggle')) {
                this.toggleViewMode();
            }
        });
        
        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.watchlist-refresh-btn')) {
                this.refreshWatchlist();
            }
        });
    }
    
    async loadWatchlistData() {
        try {
            this.showLoadingState();
            
            const data = await this.fetchWatchlistData();
            this.watchlistData = data || [];
            this.renderWatchlist();
            
        } catch (error) {
            console.error('Failed to load watchlist:', error);
            this.showErrorState();
        }
    }
    
    fetchWatchlistData() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/UserWatchlist",
                dataType: "json",
                data: { "GameType": this.getGameType() },
                contentType: "application/json",
                success: (data) => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData.Value || []);
                    } catch (e) {
                        reject(e);
                    }
                },
                error: (xhr, status, error) => {
                    reject(error);
                }
            });
        });
    }
    
    renderWatchlist() {
        const container = document.getElementById('watchlistTable');
        if (!container) return;
        
        if (!this.watchlistData || this.watchlistData.length === 0) {
            container.innerHTML = this.getEmptyWatchlistHTML();
            return;
        }
        
        // Sort data before rendering
        const sortedData = this.sortWatchlistData(this.watchlistData);
        
        const watchlistHTML = `
            <div class="modern-watchlist-container">
                <div class="watchlist-header">
                    <div class="watchlist-controls">
                        <div class="controls-left">
                            <h3 class="watchlist-title">
                                <i class="fas fa-eye"></i>
                                Watchlist (${sortedData.length})
                            </h3>
                        </div>
                        <div class="controls-right">
                            <div class="sort-controls">
                                <button class="watchlist-sort-btn ${this.sortOrder === 'name' ? 'active' : ''}" 
                                        data-sort="name" title="Sort by Name">
                                    <i class="fas fa-sort-alpha-${this.sortDirection}"></i>
                                </button>
                                <button class="watchlist-sort-btn ${this.sortOrder === 'price' ? 'active' : ''}" 
                                        data-sort="price" title="Sort by Price">
                                    <i class="fas fa-sort-numeric-${this.sortDirection}"></i>
                                </button>
                                <button class="watchlist-sort-btn ${this.sortOrder === 'change' ? 'active' : ''}" 
                                        data-sort="change" title="Sort by Change">
                                    <i class="fas fa-sort-amount-${this.sortDirection}"></i>
                                </button>
                            </div>
                            <button class="watchlist-refresh-btn" title="Refresh Watchlist">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button class="watchlist-view-toggle" title="Toggle View">
                                <i class="fas fa-th-large"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="watchlist-content">
                    <div class="watchlist-grid" id="watchlistGrid">
                        ${this.renderWatchlistItems(sortedData)}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = watchlistHTML;
        this.addWatchlistEventListeners();
        this.animateWatchlistItems();
    }
    
    renderWatchlistItems(data) {
        return data.map((stock, index) => this.createWatchlistItemHTML(stock, index)).join('');
    }
    
    createWatchlistItemHTML(stock, index) {
        // Calculate mock change data (in real app, this would come from API)
        const mockChange = (Math.random() - 0.5) * 10; // Random change between -5 and +5
        const mockChangePercent = stock.Price > 0 ? (mockChange / stock.Price) * 100 : 0;
        
        const changeClass = mockChange >= 0 ? 'positive' : 'negative';
        const changeIcon = mockChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        return `
            <div class="watchlist-item" 
                 data-symbol="${stock.Name}" 
                 data-index="${index}"
                 style="animation-delay: ${index * 50}ms">
                <div class="item-header">
                    <div class="stock-info">
                        <div class="symbol">${stock.Name}</div>
                        <div class="company-name">${stock.CompanyName || stock.Name}</div>
                    </div>
                    <div class="item-actions">
                        <button class="action-btn trade-btn" 
                                onclick="modernWatchlist.openTradeModal('${stock.Name}', ${stock.Price})"
                                title="Trade ${stock.Name}">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="action-btn remove-btn" 
                                onclick="modernWatchlist.removeFromWatchlist('${stock.Name}')"
                                title="Remove from Watchlist">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="item-body">
                    <div class="price-section">
                        <div class="current-price" data-price="${stock.Price}">
                            ₹${parseFloat(stock.Price).toFixed(2)}
                        </div>
                        <div class="price-change ${changeClass}">
                            <i class="fas ${changeIcon}"></i>
                            <span class="change-amount">₹${Math.abs(mockChange).toFixed(2)}</span>
                            <span class="change-percent">(${mockChangePercent >= 0 ? '+' : ''}${mockChangePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                    
                    <div class="item-footer">
                        <div class="last-updated">
                            <i class="fas fa-clock"></i>
                            <span class="update-time">Just now</span>
                        </div>
                        <div class="quick-actions">
                            <button class="quick-action-btn" onclick="modernWatchlist.addToPortfolio('${stock.Name}')">
                                <i class="fas fa-plus"></i>
                                <span>Buy</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="item-overlay" onclick="modernWatchlist.showStockDetails('${stock.Name}')">
                    <div class="overlay-content">
                        <i class="fas fa-chart-line"></i>
                        <span>View Details</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    sortWatchlistData(data) {
        return [...data].sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortOrder) {
                case 'name':
                    aValue = a.Name.toLowerCase();
                    bValue = b.Name.toLowerCase();
                    break;
                case 'price':
                    aValue = parseFloat(a.Price) || 0;
                    bValue = parseFloat(b.Price) || 0;
                    break;
                case 'change':
                    // Mock change calculation for sorting
                    aValue = Math.random() - 0.5;
                    bValue = Math.random() - 0.5;
                    break;
                default:
                    return 0;
            }
            
            if (this.sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }
    
    handleSort(sortType) {
        if (this.sortOrder === sortType) {
            // Toggle direction if same sort type
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New sort type, default to ascending
            this.sortOrder = sortType;
            this.sortDirection = 'asc';
        }
        
        this.renderWatchlist();
    }
    
    addWatchlistEventListeners() {
        // Add hover effects and click handlers
        document.querySelectorAll('.watchlist-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.classList.add('hovered');
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('hovered');
            });
        });
        
        // Add refresh button animation
        const refreshBtn = document.querySelector('.watchlist-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('spinning');
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 1000);
            });
        }
    }
    
    animateWatchlistItems() {
        const items = document.querySelectorAll('.watchlist-item');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-in');
            }, index * 50);
        });
    }
    
    startRealTimeUpdates() {
        // Simulate real-time price updates
        setInterval(() => {
            this.updatePrices();
        }, this.updateInterval);
    }
    
    updatePrices() {
        const priceElements = document.querySelectorAll('.current-price');
        
        priceElements.forEach(element => {
            const currentPrice = parseFloat(element.dataset.price);
            if (currentPrice > 0) {
                // Simulate price change (±2%)
                const changePercent = (Math.random() - 0.5) * 0.04; // ±2%
                const newPrice = currentPrice * (1 + changePercent);
                
                this.animatePriceUpdate(element, newPrice, changePercent > 0);
                element.dataset.price = newPrice.toFixed(2);
            }
        });
        
        this.updateTimestamps();
    }
    
    animatePriceUpdate(element, newPrice, isIncrease) {
        const item = element.closest('.watchlist-item');
        const changeElement = item.querySelector('.price-change');
        
        // Add update animation
        element.classList.add('price-updating');
        item.classList.add('price-flash', isIncrease ? 'flash-positive' : 'flash-negative');
        
        // Update price
        setTimeout(() => {
            element.textContent = `₹${newPrice.toFixed(2)}`;
            
            // Update change indicator
            const changeClass = isIncrease ? 'positive' : 'negative';
            const changeIcon = isIncrease ? 'fa-arrow-up' : 'fa-arrow-down';
            
            changeElement.className = `price-change ${changeClass}`;
            changeElement.querySelector('i').className = `fas ${changeIcon}`;
            
            // Remove animation classes
            setTimeout(() => {
                element.classList.remove('price-updating');
                item.classList.remove('price-flash', 'flash-positive', 'flash-negative');
            }, 300);
        }, 150);
    }
    
    updateTimestamps() {
        const timeElements = document.querySelectorAll('.update-time');
        timeElements.forEach(element => {
            element.textContent = 'Just now';
        });
    }
    
    async removeFromWatchlist(symbol) {
        const item = document.querySelector(`[data-symbol="${symbol}"]`);
        if (!item) return;
        
        // Show confirmation
        if (!confirm(`Remove ${symbol} from watchlist?`)) return;
        
        try {
            // Add removing animation
            item.classList.add('removing');
            
            const actionData = {
                Stock: symbol,
                AddDel: 0,
                GameType: this.getGameType()
            };
            
            await new Promise((resolve, reject) => {
                $.ajax({
                    url: "/api/AddDelete",
                    type: "GET",
                    data: actionData,
                    contentType: "application/json",
                    success: resolve,
                    error: reject
                });
            });
            
            // Animate removal
            setTimeout(() => {
                item.style.transform = 'translateX(-100%)';
                item.style.opacity = '0';
                
                setTimeout(() => {
                    this.loadWatchlistData();
                    this.showNotification(`${symbol} removed from watchlist`, 'success');
                }, this.animationDuration);
            }, 200);
            
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
            item.classList.remove('removing');
            this.showNotification('Failed to remove stock from watchlist', 'error');
        }
    }
    
    openTradeModal(symbol, price) {
        // Use new modern stock modal if available
        if (window.stockModal) {
            const stock = this.watchlistData.find(s => s.Name === symbol);
            const stockData = {
                symbol: symbol,
                name: stock?.CompanyName || symbol,
                currentPrice: price,
                price: price,
                change: 0, // Would be calculated from real data
                changePercent: 0,
                open: price,
                high: price,
                low: price,
                prevClose: price,
                volume: 0
            };
            window.stockModal.show(stockData);
        } else if (dashboard && dashboard.openTradeModal) {
            dashboard.openTradeModal(symbol, price);
        } else {
            // Fallback to existing modal
            $("#mStock").html(symbol);
            $("#mPrice").html(price);
            $("#buyButton").prop("disabled", false);
            $("#sellButton").prop("disabled", false);
            $('#myModal').modal('show');
        }
    }
    
    addToPortfolio(symbol) {
        const stock = this.watchlistData.find(s => s.Name === symbol);
        if (stock) {
            this.openTradeModal(symbol, stock.Price);
        }
    }
    
    showStockDetails(symbol) {
        // Use new modern stock modal if available
        if (window.stockModal) {
            const stock = this.watchlistData.find(s => s.Name === symbol);
            if (stock) {
                const stockData = {
                    symbol: symbol,
                    name: stock.CompanyName || symbol,
                    currentPrice: stock.Price,
                    price: stock.Price,
                    change: 0, // Would be calculated from real data
                    changePercent: 0,
                    open: stock.Price,
                    high: stock.Price,
                    low: stock.Price,
                    prevClose: stock.Price,
                    volume: 0
                };
                window.stockModal.show(stockData);
            }
        } else {
            // Fallback - just open trade modal
            const stock = this.watchlistData.find(s => s.Name === symbol);
            if (stock) {
                this.openTradeModal(symbol, stock.Price);
            }
        }
    }
    
    toggleViewMode() {
        const grid = document.getElementById('watchlistGrid');
        if (grid) {
            grid.classList.toggle('compact-view');
            
            const toggleBtn = document.querySelector('.watchlist-view-toggle i');
            if (toggleBtn) {
                toggleBtn.className = grid.classList.contains('compact-view') ? 
                    'fas fa-th-list' : 'fas fa-th-large';
            }
        }
    }
    
    refreshWatchlist() {
        this.loadWatchlistData();
    }
    
    showLoadingState() {
        const container = document.getElementById('watchlistTable');
        if (container) {
            container.innerHTML = `
                <div class="watchlist-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading watchlist...</span>
                </div>
            `;
        }
    }
    
    showErrorState() {
        const container = document.getElementById('watchlistTable');
        if (container) {
            container.innerHTML = `
                <div class="watchlist-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load watchlist</h3>
                    <p>Please check your connection and try again</p>
                    <button class="btn btn-primary" onclick="modernWatchlist.refreshWatchlist()">
                        <i class="fas fa-retry"></i>
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    getEmptyWatchlistHTML() {
        return `
            <div class="empty-watchlist">
                <div class="empty-icon">
                    <i class="fas fa-eye-slash"></i>
                </div>
                <h3 class="empty-title">Your watchlist is empty</h3>
                <p class="empty-message">Add stocks to track their performance and get real-time updates</p>
                <button class="btn btn-primary" onclick="watchlistSearch?.focus()">
                    <i class="fas fa-plus"></i>
                    Add Stocks
                </button>
            </div>
        `;
    }
    
    showNotification(message, type = 'info') {
        if (dashboard && dashboard.showNotification) {
            dashboard.showNotification(message, type);
        } else {
            // Simple fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    getGameType() {
        if (dashboard && dashboard.getGameType) {
            return dashboard.getGameType();
        }
        
        // Fallback
        const type = $("#mainGrid")?.attr("data-value");
        switch (type) {
            case "Competition":
                return "C1";
            default:
                return "";
        }
    }
}

// Initialize the modern watchlist
let modernWatchlist;
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dashboard to initialize
    setTimeout(() => {
        modernWatchlist = new ModernWatchlistManager();
    }, 1000);
});

// Export for global access
window.ModernWatchlistManager = ModernWatchlistManager;