// Dashboard functionality for portfolio summary cards and holdings
class DashboardManager {
    constructor() {
        this.portfolioData = {
            totalHoldings: 0,
            currentValue: 0,
            profitLoss: 0,
            availableFunds: 0,
            userRank: 1,
            totalParticipants: 1
        };
        
        this.animationDuration = 1000; // 1 second
        this.updateInterval = 5000; // 5 seconds
        this.rankUpdateInterval = 30000; // 30 seconds
        
        // Initialize error handler and data manager integration
        this.errorHandler = window.errorHandler;
        this.dataManager = null;
        this.loadingManager = window.loadingStateManager;
        
        // Retry tracking
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.init();
    }
    
    init() {
        this.initializeManagers();
        this.setupEventListeners();
        this.setupMobileEnhancements();
        this.setupErrorRecovery();
        this.loadInitialData();
        this.startPeriodicUpdates();
    }
    
    /**
     * Initialize error handler and data manager
     */
    initializeManagers() {
        // Initialize data manager
        if (window.DashboardDataManager) {
            this.dataManager = new window.DashboardDataManager();
        }
        
        // Ensure error handler is available
        if (!this.errorHandler && window.EnhancedErrorHandler) {
            this.errorHandler = new window.EnhancedErrorHandler();
            this.errorHandler.initialize();
        }
        
        // Setup retry callbacks
        if (this.errorHandler) {
            this.errorHandler.addRetryCallback('dashboard-portfolio', () => this.retryPortfolioLoad());
            this.errorHandler.addRetryCallback('dashboard-funds', () => this.retryFundsLoad());
            this.errorHandler.addRetryCallback('dashboard-rank', () => this.retryRankLoad());
            this.errorHandler.addRetryCallback('dashboard-holdings', () => this.retryHoldingsLoad());
            this.errorHandler.addRetryCallback('dashboard-watchlist', () => this.retryWatchlistLoad());
        }
    }
    
    /**
     * Setup error recovery mechanisms
     */
    setupErrorRecovery() {
        // Listen for loading retry events
        document.addEventListener('loadingRetry', (event) => {
            const { component } = event.detail;
            this.handleRetryRequest(component);
        });
        
        // Listen for data manager loading state changes
        window.addEventListener('dashboardLoadingStateChange', (event) => {
            const { component, isLoading } = event.detail;
            this.handleLoadingStateChange(component, isLoading);
        });
    }
    
    setupEventListeners() {
        // Add any event listeners for dashboard interactions
        document.addEventListener('DOMContentLoaded', () => {
            this.animateWelcomeMessage();
        });

        // Handle swipe events on watchlist items
        document.addEventListener('removestock', (e) => {
            this.handleRemoveStock(e.detail.symbol);
        });

        document.addEventListener('tradestock', (e) => {
            this.handleTradeStock(e.detail.symbol);
        });

        // Handle pull-to-refresh
        document.addEventListener('pullrefresh', (e) => {
            this.handlePullToRefresh();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }

    setupMobileEnhancements() {
        // Add pull-to-refresh to main content
        const mainContent = document.querySelector('.dashboard-content');
        if (mainContent && this.isMobile()) {
            mainContent.classList.add('pull-to-refresh');
        }

        // Add swipeable class to watchlist items
        this.setupWatchlistSwipes();

        // Add touch feedback to summary cards
        this.setupCardTouchFeedback();

        // Setup mobile-specific table handling
        this.setupMobileTableHandling();
    }

    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupWatchlistSwipes() {
        // This will be called when watchlist items are created
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('watchlist-item')) {
                        this.addSwipeSupport(node);
                    }
                });
            });
        });

        const watchlistContainer = document.querySelector('#watchlistTable');
        if (watchlistContainer) {
            observer.observe(watchlistContainer, { childList: true, subtree: true });
        }
    }

    addSwipeSupport(item) {
        if (!this.isMobile()) return;

        item.classList.add('swipeable');
        
        // Add data attribute for symbol
        const symbolElement = item.querySelector('.stock-symbol');
        if (symbolElement) {
            item.dataset.symbol = symbolElement.textContent.trim();
        }
    }

    setupCardTouchFeedback() {
        const summaryCards = document.querySelectorAll('.summary-card');
        summaryCards.forEach(card => {
            if (this.isMobile()) {
                card.addEventListener('touchstart', () => {
                    card.classList.add('touch-active');
                });

                card.addEventListener('touchend', () => {
                    setTimeout(() => {
                        card.classList.remove('touch-active');
                    }, 150);
                });
            }
        });
    }

    setupMobileTableHandling() {
        if (!this.isMobile()) return;

        const tables = document.querySelectorAll('.modern-table-container table');
        tables.forEach(table => {
            // Add mobile-specific attributes to table cells
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const headers = table.querySelectorAll('thead th');
                
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index].textContent.trim());
                    }
                });
            });
        });
    }

    handleRemoveStock(symbol) {
        if (!symbol) return;

        // Show confirmation with haptic feedback
        if (this.isMobile() && navigator.vibrate) {
            navigator.vibrate(50); // Light haptic feedback
        }

        // Call existing remove stock functionality
        if (typeof AddStock === 'function') {
            const actionData = {
                Stock: symbol,
                AddDel: 0, // 0 for delete
                GameType: this.getGameType()
            };

            $.ajax({
                url: "/api/AddDelete",
                type: "GET",
                data: actionData,
                success: (data) => {
                    this.loadWatchlistData();
                    this.showNotification(`${symbol} removed from watchlist`, 'success');
                    
                    // Haptic feedback for success
                    if (this.isMobile() && navigator.vibrate) {
                        navigator.vibrate([50, 50, 50]);
                    }
                },
                error: () => {
                    this.showNotification('Failed to remove stock from watchlist', 'error');
                }
            });
        }
    }

    handleTradeStock(symbol) {
        if (!symbol) return;

        // Light haptic feedback
        if (this.isMobile() && navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Open stock modal (assuming this function exists)
        if (typeof openStockModal === 'function') {
            openStockModal(symbol);
        } else {
            // Fallback: trigger click on existing trade button
            const tradeBtn = document.querySelector(`[data-symbol="${symbol}"] .trade-btn`);
            if (tradeBtn) {
                tradeBtn.click();
            }
        }
    }

    handlePullToRefresh() {
        // Refresh all dashboard data
        this.loadInitialData();
        
        // Hide refresh indicator after data loads
        setTimeout(() => {
            const refreshElement = document.querySelector('.pull-to-refresh');
            if (refreshElement) {
                refreshElement.classList.remove('refreshing');
            }
        }, 1500);
    }

    handleOrientationChange() {
        // Recalculate layouts and refresh charts
        if (typeof window.stockChart !== 'undefined' && window.stockChart.resize) {
            window.stockChart.resize();
        }

        // Refresh table layouts
        this.setupMobileTableHandling();

        // Trigger window resize for other components
        window.dispatchEvent(new Event('resize'));
    }
    
    animateWelcomeMessage() {
        const welcomeTitle = document.getElementById('user');
        if (welcomeTitle) {
            setTimeout(() => {
                welcomeTitle.style.opacity = '0';
                welcomeTitle.style.transform = 'translateY(-20px)';
                welcomeTitle.style.transition = 'all 0.5s ease-out';
            }, 2000);
        }
    }
    
    async loadInitialData() {
        try {
            // Use data manager if available for coordinated loading
            if (this.dataManager) {
                await this.loadDataWithManager();
            } else {
                // Fallback to individual loading with enhanced error handling
                await this.loadDataIndividually();
            }
        } catch (error) {
            this.handleCriticalError('loadInitialData', error);
        }
    }
    
    /**
     * Load data using the dashboard data manager
     */
    async loadDataWithManager() {
        const gameType = this.getGameType();
        const userId = this.getCurrentUserId();
        
        try {
            // Start loading states
            this.startLoadingStates();
            
            // Load all dashboard data simultaneously
            const dashboardData = await this.dataManager.loadDashboardData(userId, gameType);
            
            // Process successful data
            this.processDashboardData(dashboardData);
            
            // Load additional data that's not part of core dashboard
            await Promise.allSettled([
                this.loadHoldingsDataWithErrorHandling(),
                this.loadWatchlistDataWithErrorHandling()
            ]);
            
        } catch (error) {
            this.handleDashboardLoadError(error);
        } finally {
            this.completeLoadingStates();
        }
    }
    
    /**
     * Load data individually with enhanced error handling
     */
    async loadDataIndividually() {
        // Start loading states
        this.startLoadingStates();
        
        // Load data with individual error handling
        const dataPromises = [
            this.updatePortfolioSummaryWithErrorHandling(),
            this.updateUserRankWithErrorHandling(),
            this.loadHoldingsDataWithErrorHandling(),
            this.loadWatchlistDataWithErrorHandling()
        ];
        
        // Wait for all operations to complete
        const results = await Promise.allSettled(dataPromises);
        
        // Process results and show specific errors
        this.processLoadResults(results);
        
        this.completeLoadingStates();
    }
    
    /**
     * Start loading states for all components
     */
    startLoadingStates() {
        if (this.loadingManager) {
            this.loadingManager.startLoading('portfolio-summary', {
                message: 'Loading portfolio data...',
                timeout: 10000,
                onTimeout: () => this.handleTimeout('portfolio')
            });
            
            this.loadingManager.startLoading('holdings-table', {
                message: 'Loading holdings...',
                timeout: 10000,
                onTimeout: () => this.handleTimeout('holdings')
            });
            
            this.loadingManager.startLoading('watchlist-table', {
                message: 'Loading watchlist...',
                timeout: 10000,
                onTimeout: () => this.handleTimeout('watchlist')
            });
        } else {
            // Fallback loading indicators
            this.showPortfolioLoading();
            this.showHoldingsLoading();
            this.showWatchlistLoading();
        }
    }
    
    /**
     * Complete loading states for all components
     */
    completeLoadingStates() {
        if (this.loadingManager) {
            this.loadingManager.completeLoading('portfolio-summary', true);
            this.loadingManager.completeLoading('holdings-table', true);
            this.loadingManager.completeLoading('watchlist-table', true);
        }
    }
    
    showPortfolioLoading() {
        const portfolioCards = document.querySelectorAll('.summary-card .card-body');
        portfolioCards.forEach(card => {
            if (window.lottieManager) {
                window.lottieManager.showLoading(card, {
                    width: '40px',
                    height: '40px',
                    minHeight: '60px'
                });
            }
        });
    }
    
    showHoldingsLoading() {
        const holdingsContainer = document.getElementById('holdingsTable');
        if (holdingsContainer && window.lottieManager) {
            window.lottieManager.showLoading(holdingsContainer, {
                width: '60px',
                height: '60px',
                text: 'Loading holdings...',
                minHeight: '200px'
            });
        }
    }
    
    showWatchlistLoading() {
        const watchlistContainer = document.getElementById('watchlistTable');
        if (watchlistContainer && window.lottieManager) {
            window.lottieManager.showLoading(watchlistContainer, {
                width: '60px',
                height: '60px',
                text: 'Loading watchlist...',
                minHeight: '200px'
            });
        }
    }
    
    startPeriodicUpdates() {
        // Update holdings and watchlist every 5 seconds
        setInterval(() => {
            this.updatePortfolioSummary();
            this.loadHoldingsData();
            this.loadWatchlistData();
        }, this.updateInterval);
        
        // Update rank every 30 seconds
        setInterval(() => {
            this.updateUserRank();
        }, this.rankUpdateInterval);
    }
    
    /**
     * Update portfolio summary with enhanced error handling
     */
    async updatePortfolioSummaryWithErrorHandling() {
        const operation = 'portfolio-summary';
        
        try {
            if (this.dataManager) {
                // Use data manager for portfolio data
                const gameType = this.getGameType();
                const userId = this.getCurrentUserId();
                
                const [portfolioData, fundsData] = await Promise.all([
                    this.dataManager.loadPortfolioData(userId, gameType),
                    this.dataManager.getAvailableFunds(gameType)
                ]);
                
                this.processPortfolioData(portfolioData);
                this.processFundsData(fundsData);
                
            } else {
                // Fallback to legacy method with error handling
                await this.updatePortfolioSummaryLegacy();
            }
            
        } catch (error) {
            this.handleOperationError(operation, error, () => this.retryPortfolioLoad());
        }
    }
    
    /**
     * Legacy portfolio summary update with error handling
     */
    updatePortfolioSummaryLegacy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/UserStocks",
                dataType: "json",
                data: { "GameType": this.getGameType() },
                contentType: "application/json",
                timeout: 10000,
                success: (data) => {
                    try {
                        const listData = JSON.parse(data).Value.UserStockList;
                        this.calculatePortfolioMetrics(listData);
                        this.updatePortfolioCards();
                        resolve(data);
                    } catch (parseError) {
                        reject(new Error('Failed to parse portfolio data'));
                    }
                },
                error: (xhr, status, error) => {
                    const apiError = new Error(error || 'Failed to load portfolio data');
                    apiError.status = xhr.status;
                    apiError.statusText = xhr.statusText;
                    reject(apiError);
                }
            });
            
            // Also update available funds
            this.updateAvailableFundsLegacy().catch(reject);
        });
    }
    
    /**
     * Update available funds with error handling
     */
    updateAvailableFundsLegacy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: "/api/GetFunds",
                data: { "GameType": this.getGameType() },
                contentType: "application/json",
                timeout: 10000,
                success: (funds) => {
                    this.portfolioData.availableFunds = parseFloat(funds) || 0;
                    this.animateCounter('availableFunds', this.portfolioData.availableFunds, 2);
                    resolve(funds);
                },
                error: (xhr, status, error) => {
                    const apiError = new Error(error || 'Failed to load available funds');
                    apiError.status = xhr.status;
                    reject(apiError);
                }
            });
        });
    }
    
    calculatePortfolioMetrics(holdings) {
        if (!holdings || holdings.length === 0) {
            this.portfolioData = {
                totalHoldings: 0,
                currentValue: 0,
                profitLoss: 0,
                availableFunds: this.portfolioData.availableFunds,
                userRank: this.portfolioData.userRank,
                totalParticipants: this.portfolioData.totalParticipants
            };
            return;
        }
        
        let totalHoldings = 0;
        let currentValue = 0;
        
        holdings.forEach(stock => {
            stock.ProfitLoss = Number((stock.Price - stock.AveragePrice) * stock.Count).toFixed(2);
            totalHoldings += stock.AveragePrice * stock.Count;
            currentValue += stock.Price * stock.Count;
        });
        
        this.portfolioData.totalHoldings = totalHoldings;
        this.portfolioData.currentValue = currentValue;
        this.portfolioData.profitLoss = currentValue - totalHoldings;
    }
    
    updatePortfolioCards() {
        // Animate portfolio value
        this.animateCounter('portfolioValue', this.portfolioData.currentValue, 2);
        
        // Update P&L with color coding
        const changeElement = document.getElementById('portfolioChange');
        const changeValueElement = document.getElementById('portfolioChangeValue');
        const changePercentElement = document.getElementById('portfolioChangePercent');
        
        if (changeElement && changeValueElement && changePercentElement) {
            const pnl = this.portfolioData.profitLoss;
            const pnlPercent = this.portfolioData.totalHoldings > 0 ? 
                (pnl / this.portfolioData.totalHoldings) * 100 : 0;
            
            changeValueElement.textContent = `${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toFixed(2)}`;
            changePercentElement.textContent = `(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`;
            
            // Update color class
            changeElement.className = 'change-indicator ' + (pnl >= 0 ? 'positive' : 'negative');
        }
    }
    
    updateAvailableFunds() {
        $.ajax({
            type: "GET",
            url: "/api/GetFunds",
            data: { "GameType": this.getGameType() },
            contentType: "application/json",
            success: (funds) => {
                this.portfolioData.availableFunds = parseFloat(funds) || 0;
                this.animateCounter('availableFunds', this.portfolioData.availableFunds, 2);
            },
            error: (error) => {
                console.error("Failed to load funds:", error);
            }
        });
    }
    
    /**
     * Update user rank with enhanced error handling
     */
    async updateUserRankWithErrorHandling() {
        const operation = 'user-rank';
        
        try {
            if (this.dataManager) {
                const gameType = this.getGameType();
                const rankData = await this.dataManager.calculateUserRank(gameType);
                this.processRankData(rankData);
            } else {
                await this.updateUserRankLegacy();
            }
        } catch (error) {
            this.handleOperationError(operation, error, () => this.retryRankLoad());
        }
    }
    
    /**
     * Legacy user rank update with error handling
     */
    updateUserRankLegacy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: "/api/GetRank",
                data: { "GameType": this.getGameType() },
                contentType: "application/json",
                timeout: 10000,
                success: (rankData) => {
                    try {
                        const rankParts = rankData.split(" / ");
                        this.portfolioData.userRank = parseInt(rankParts[0]) || 1;
                        this.portfolioData.totalParticipants = parseInt(rankParts[1]) || 1;
                        
                        this.animateCounter('userRank', this.portfolioData.userRank, 0);
                        this.animateCounter('totalParticipants', this.portfolioData.totalParticipants, 0);
                        resolve(rankData);
                    } catch (parseError) {
                        reject(new Error('Failed to parse rank data'));
                    }
                },
                error: (xhr, status, error) => {
                    const apiError = new Error(error || 'Failed to load user rank');
                    apiError.status = xhr.status;
                    reject(apiError);
                }
            });
        });
    }
    
    animateCounter(elementId, targetValue, decimals = 0) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startValue = parseFloat(element.textContent.replace(/[₹,]/g, '')) || 0;
        const difference = targetValue - startValue;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (difference * easeOutQuart);
            
            element.textContent = currentValue.toFixed(decimals);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue.toFixed(decimals);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Load holdings data with enhanced error handling
     */
    async loadHoldingsDataWithErrorHandling() {
        const operation = 'holdings-data';
        
        try {
            if (this.dataManager) {
                const gameType = this.getGameType();
                const userId = this.getCurrentUserId();
                const portfolioData = await this.dataManager.loadPortfolioData(userId, gameType);
                this.renderModernHoldingsTable(portfolioData.holdings);
            } else {
                await this.loadHoldingsDataLegacy();
            }
        } catch (error) {
            this.handleOperationError(operation, error, () => this.retryHoldingsLoad());
        }
    }
    
    /**
     * Legacy holdings data loading with error handling
     */
    loadHoldingsDataLegacy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/UserStocks",
                dataType: "json",
                data: { "GameType": this.getGameType() },
                contentType: "application/json",
                timeout: 10000,
                success: (data) => {
                    try {
                        const listData = JSON.parse(data).Value.UserStockList;
                        this.renderModernHoldingsTable(listData);
                        resolve(data);
                    } catch (parseError) {
                        reject(new Error('Failed to parse holdings data'));
                    }
                },
                error: (xhr, status, error) => {
                    const apiError = new Error(error || 'Failed to load holdings data');
                    apiError.status = xhr.status;
                    reject(apiError);
                }
            });
        });
    }
    
    renderModernHoldingsTable(holdings) {
        const container = document.getElementById('holdingsTable');
        if (!container) return;
        
        if (!holdings || holdings.length === 0) {
            // Show empty state with Lottie animation
            if (window.lottieManager) {
                window.lottieManager.showEmptyState(container, {
                    title: 'No Holdings Yet',
                    message: 'Start trading to see your portfolio here',
                    actionText: 'Add Stocks to Watchlist',
                    actionCallback: () => this.focusStockSearch(),
                    width: '120px',
                    height: '120px'
                });
            } else {
                container.innerHTML = this.getEmptyHoldingsHTML();
            }
            return;
        }
        
        // Calculate P&L for each holding
        holdings.forEach(stock => {
            stock.ProfitLoss = Number((stock.Price - stock.AveragePrice) * stock.Count).toFixed(2);
            stock.ProfitLossPercent = stock.AveragePrice > 0 ? 
                (((stock.Price - stock.AveragePrice) / stock.AveragePrice) * 100).toFixed(2) : 0;
        });
        
        // Store holdings data for sorting/filtering
        this.currentHoldings = holdings;
        
        const tableHTML = `
            <div class="holdings-controls">
                <div class="controls-left">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="holdingsSearch" placeholder="Search holdings..." class="form-control">
                    </div>
                </div>
                <div class="controls-right">
                    <div class="sort-dropdown">
                        <select id="holdingsSort" class="form-select">
                            <option value="name">Sort by Name</option>
                            <option value="quantity">Sort by Quantity</option>
                            <option value="pnl">Sort by P&L</option>
                            <option value="value">Sort by Value</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modern-table">
                <div class="table-header">
                    <div class="header-cell stock-col sortable" data-sort="name">
                        Stock <i class="fas fa-sort"></i>
                    </div>
                    <div class="header-cell qty-col sortable" data-sort="quantity">
                        Qty <i class="fas fa-sort"></i>
                    </div>
                    <div class="header-cell price-col sortable" data-sort="avgPrice">
                        Avg Price <i class="fas fa-sort"></i>
                    </div>
                    <div class="header-cell price-col sortable" data-sort="currentPrice">
                        LTP <i class="fas fa-sort"></i>
                    </div>
                    <div class="header-cell pnl-col sortable" data-sort="pnl">
                        P&L <i class="fas fa-sort"></i>
                    </div>
                    <div class="header-cell actions-col">Actions</div>
                </div>
                <div class="table-body" id="holdingsTableBody">
                    ${this.renderHoldingsRows(holdings)}
                </div>
            </div>
        `;
        
        container.innerHTML = tableHTML;
        this.addHoldingRowEventListeners();
        this.setupHoldingsControls();
        this.renderHoldingsSummary(holdings);
    }
    
    renderHoldingsRows(holdings) {
        return holdings.map(stock => this.getHoldingRowHTML(stock)).join('');
    }
    
    setupHoldingsControls() {
        // Search functionality
        const searchInput = document.getElementById('holdingsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterHoldings(e.target.value);
            });
        }
        
        // Sort functionality
        const sortSelect = document.getElementById('holdingsSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortHoldings(e.target.value);
            });
        }
        
        // Header click sorting
        document.querySelectorAll('.header-cell.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.dataset.sort;
                this.sortHoldings(sortBy);
                this.updateSortIndicators(header);
            });
        });
    }
    
    filterHoldings(searchTerm) {
        if (!this.currentHoldings) return;
        
        const filtered = this.currentHoldings.filter(stock => 
            stock.Name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const tableBody = document.getElementById('holdingsTableBody');
        if (tableBody) {
            tableBody.innerHTML = this.renderHoldingsRows(filtered);
            this.addHoldingRowEventListeners();
        }
    }
    
    sortHoldings(sortBy) {
        if (!this.currentHoldings) return;
        
        const sorted = [...this.currentHoldings].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.Name.localeCompare(b.Name);
                case 'quantity':
                    return b.Count - a.Count;
                case 'pnl':
                    return parseFloat(b.ProfitLoss) - parseFloat(a.ProfitLoss);
                case 'value':
                    return (b.Price * b.Count) - (a.Price * a.Count);
                case 'avgPrice':
                    return b.AveragePrice - a.AveragePrice;
                case 'currentPrice':
                    return b.Price - a.Price;
                default:
                    return 0;
            }
        });
        
        const tableBody = document.getElementById('holdingsTableBody');
        if (tableBody) {
            // Add fade out animation
            tableBody.style.opacity = '0.5';
            
            setTimeout(() => {
                tableBody.innerHTML = this.renderHoldingsRows(sorted);
                this.addHoldingRowEventListeners();
                
                // Fade back in
                tableBody.style.opacity = '1';
            }, 150);
        }
    }
    
    updateSortIndicators(activeHeader) {
        // Remove active class from all headers
        document.querySelectorAll('.header-cell.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add active class to clicked header
        const currentSort = activeHeader.classList.contains('sort-asc') ? 'desc' : 'asc';
        activeHeader.classList.remove('sort-asc', 'sort-desc');
        activeHeader.classList.add(`sort-${currentSort}`);
    }
    
    renderHoldingsSummary(holdings) {
        const summaryContainer = document.getElementById('holdingsSummary');
        if (!summaryContainer || !holdings || holdings.length === 0) return;
        
        let totalInvested = 0;
        let currentValue = 0;
        let totalPnL = 0;
        
        holdings.forEach(stock => {
            totalInvested += stock.AveragePrice * stock.Count;
            currentValue += stock.Price * stock.Count;
            totalPnL += parseFloat(stock.ProfitLoss);
        });
        
        const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100) : 0;
        const pnlClass = totalPnL >= 0 ? 'positive' : 'negative';
        
        const summaryHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Total Invested</div>
                    <div class="summary-value">₹${totalInvested.toFixed(2)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Current Value</div>
                    <div class="summary-value">₹${currentValue.toFixed(2)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total P&L</div>
                    <div class="summary-value ${pnlClass}">
                        ${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toFixed(2)}
                        <small>(${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)</small>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Holdings Count</div>
                    <div class="summary-value">${holdings.length} stocks</div>
                </div>
            </div>
        `;
        
        summaryContainer.innerHTML = summaryHTML;
    }
    
    addRealTimeUpdateAnimation(element, type = 'neutral') {
        if (!element) return;
        
        element.classList.add('price-update', type);
        
        setTimeout(() => {
            element.classList.remove('price-update', type);
        }, 800);
    }
    
    updateHoldingRow(stockName, newData) {
        const row = document.querySelector(`[data-stock="${stockName}"]`);
        if (!row) return;
        
        // Add updating animation
        row.classList.add('updating');
        
        // Update price cells with animation
        const priceCell = row.querySelector('.price-col:last-of-type .price');
        const pnlCell = row.querySelector('.pnl-col');
        
        if (priceCell && newData.Price) {
            const oldPrice = parseFloat(priceCell.textContent.replace('₹', ''));
            const newPrice = parseFloat(newData.Price);
            
            priceCell.textContent = `₹${newPrice.toFixed(2)}`;
            
            // Add price change animation
            const changeType = newPrice > oldPrice ? 'positive' : newPrice < oldPrice ? 'negative' : 'neutral';
            this.addRealTimeUpdateAnimation(priceCell, changeType);
        }
        
        if (pnlCell && newData.ProfitLoss) {
            const pnlAmount = pnlCell.querySelector('.pnl-amount');
            const pnlPercent = pnlCell.querySelector('.pnl-percent');
            
            if (pnlAmount) {
                const pnl = parseFloat(newData.ProfitLoss);
                const icon = pnl >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                pnlAmount.innerHTML = `<i class="fas ${icon}"></i> ₹${Math.abs(pnl).toFixed(2)}`;
            }
            
            if (pnlPercent && newData.ProfitLossPercent) {
                pnlPercent.textContent = `(${newData.ProfitLossPercent}%)`;
            }
            
            // Update P&L color class
            pnlCell.classList.remove('positive', 'negative');
            pnlCell.classList.add(parseFloat(newData.ProfitLoss) >= 0 ? 'positive' : 'negative');
            
            this.addRealTimeUpdateAnimation(pnlCell, parseFloat(newData.ProfitLoss) >= 0 ? 'positive' : 'negative');
        }
        
        // Remove updating animation
        setTimeout(() => {
            row.classList.remove('updating');
        }, 500);
    }
    
    getHoldingRowHTML(stock) {
        const pnlClass = parseFloat(stock.ProfitLoss) >= 0 ? 'positive' : 'negative';
        const pnlIcon = parseFloat(stock.ProfitLoss) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        return `
            <div class="table-row" data-stock="${stock.Name}">
                <div class="table-cell stock-col">
                    <div class="stock-info">
                        <div class="stock-symbol">${stock.Name}</div>
                        <div class="stock-name">${stock.Name}</div>
                    </div>
                </div>
                <div class="table-cell qty-col">
                    <span class="quantity">${stock.Count}</span>
                </div>
                <div class="table-cell price-col">
                    <span class="price">₹${parseFloat(stock.AveragePrice).toFixed(2)}</span>
                </div>
                <div class="table-cell price-col">
                    <span class="price">₹${parseFloat(stock.Price).toFixed(2)}</span>
                </div>
                <div class="table-cell pnl-col ${pnlClass}">
                    <div class="pnl-container">
                        <span class="pnl-amount">
                            <i class="fas ${pnlIcon}"></i>
                            ₹${Math.abs(parseFloat(stock.ProfitLoss)).toFixed(2)}
                        </span>
                        <span class="pnl-percent">(${stock.ProfitLossPercent}%)</span>
                    </div>
                </div>
                <div class="table-cell actions-col">
                    <button class="btn btn-sm btn-primary trade-btn" onclick="dashboard.openTradeModal('${stock.Name}', ${stock.Price})">
                        <i class="fas fa-exchange-alt"></i>
                        Trade
                    </button>
                </div>
            </div>
        `;
    }
    
    getEmptyHoldingsHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3 class="empty-title">No Holdings Yet</h3>
                <p class="empty-message">Start trading to see your portfolio here</p>
                <button class="btn btn-primary" onclick="dashboard.focusStockSearch()">
                    <i class="fas fa-plus"></i>
                    Add Stocks to Watchlist
                </button>
            </div>
        `;
    }
    
    addHoldingRowEventListeners() {
        // Add click handlers for table rows
        document.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.trade-btn')) {
                    const stockName = row.dataset.stock;
                    this.showStockDetails(stockName);
                }
            });
        });
    }
    
    /**
     * Load watchlist data with enhanced error handling
     */
    async loadWatchlistDataWithErrorHandling() {
        const operation = 'watchlist-data';
        
        try {
            // Use modern watchlist if available
            if (window.modernWatchlist && modernWatchlist.loadWatchlistData) {
                await new Promise((resolve, reject) => {
                    try {
                        modernWatchlist.loadWatchlistData();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            } else {
                await this.loadWatchlistDataLegacy();
            }
        } catch (error) {
            this.handleOperationError(operation, error, () => this.retryWatchlistLoad());
        }
    }
    
    /**
     * Legacy watchlist data loading with error handling
     */
    loadWatchlistDataLegacy() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/UserWatchlist",
                dataType: "json",
                data: { "GameType": this.getGameType() },
                contentType: "application/json",
                timeout: 10000,
                success: (data) => {
                    try {
                        const listData = JSON.parse(data).Value;
                        this.renderModernWatchlist(listData);
                        resolve(data);
                    } catch (parseError) {
                        reject(new Error('Failed to parse watchlist data'));
                    }
                },
                error: (xhr, status, error) => {
                    const apiError = new Error(error || 'Failed to load watchlist data');
                    apiError.status = xhr.status;
                    reject(apiError);
                }
            });
        });
    }
    
    renderModernWatchlist(watchlist) {
        const container = document.getElementById('watchlistTable');
        if (!container) return;
        
        if (!watchlist || watchlist.length === 0) {
            // Show empty state with Lottie animation
            if (window.lottieManager) {
                window.lottieManager.showEmptyState(container, {
                    title: 'No Stocks in Watchlist',
                    message: 'Add stocks to track their performance',
                    width: '100px',
                    height: '100px'
                });
            } else {
                container.innerHTML = this.getEmptyWatchlistHTML();
            }
            return;
        }
        
        const watchlistHTML = `
            <div class="watchlist-items">
                ${watchlist.map(stock => this.getWatchlistItemHTML(stock)).join('')}
            </div>
        `;
        
        container.innerHTML = watchlistHTML;
        this.addWatchlistEventListeners();
    }
    
    getWatchlistItemHTML(stock) {
        // Calculate change (assuming we have previous price data)
        const change = 0; // This would come from API
        const changePercent = 0; // This would come from API
        const changeClass = change >= 0 ? 'positive' : 'negative';
        
        return `
            <div class="watchlist-item" data-stock="${stock.Name}">
                <div class="stock-info">
                    <div class="symbol">${stock.Name}</div>
                    <div class="name">${stock.Name}</div>
                </div>
                <div class="price-info">
                    <div class="current-price">₹${parseFloat(stock.Price).toFixed(2)}</div>
                    <div class="change ${changeClass}">
                        ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)
                    </div>
                </div>
                <div class="actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboard.openTradeModal('${stock.Name}', ${stock.Price})">
                        Trade
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.removeFromWatchlist('${stock.Name}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    getEmptyWatchlistHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <h3 class="empty-title">No Stocks in Watchlist</h3>
                <p class="empty-message">Add stocks to track their performance</p>
            </div>
        `;
    }
    
    addWatchlistEventListeners() {
        document.querySelectorAll('.watchlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const stockName = item.dataset.stock;
                    this.showStockDetails(stockName);
                }
            });
        });
    }
    
    openTradeModal(stockName, price) {
        // Use new modern stock modal if available
        if (window.stockModal) {
            const stockData = {
                symbol: stockName,
                name: stockName,
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
        } else {
            // Fallback to existing modal functionality
            $("#mStock").html(stockName);
            $("#mPrice").html(price);
            $("#buyButton").prop("disabled", false);
            $("#sellButton").prop("disabled", false);
            $('#myModal').modal('show');
        }
    }
    
    removeFromWatchlist(stockName) {
        if (confirm(`Remove ${stockName} from watchlist?`)) {
            const actionData = {
                Stock: stockName,
                AddDel: 0,
                GameType: this.getGameType()
            };
            
            $.ajax({
                url: "/api/AddDelete",
                type: "GET",
                data: actionData,
                contentType: "application/json",
                success: () => {
                    this.loadWatchlistData();
                    this.showNotification(`${stockName} removed from watchlist`, 'success');
                },
                error: () => {
                    this.showNotification('Failed to remove stock from watchlist', 'error');
                }
            });
        }
    }
    
    focusStockSearch() {
        const searchElement = document.getElementById('SearchStocks');
        if (searchElement) {
            searchElement.focus();
        }
    }
    
    showStockDetails(stockName) {
        // Find stock data from current holdings or watchlist
        let stockData = null;
        
        // Try to find in holdings first
        if (this.currentHoldings) {
            const holding = this.currentHoldings.find(h => h.Name === stockName);
            if (holding) {
                stockData = {
                    symbol: holding.Name,
                    name: holding.Name,
                    currentPrice: holding.Price,
                    price: holding.Price,
                    change: holding.ProfitLoss / holding.Count, // Per share P&L
                    changePercent: holding.ProfitLossPercent,
                    open: holding.Price,
                    high: holding.Price,
                    low: holding.Price,
                    prevClose: holding.AveragePrice,
                    volume: 0
                };
            }
        }
        
        // If not found in holdings, create basic stock data
        if (!stockData) {
            stockData = {
                symbol: stockName,
                name: stockName,
                currentPrice: 0,
                price: 0,
                change: 0,
                changePercent: 0,
                open: 0,
                high: 0,
                low: 0,
                prevClose: 0,
                volume: 0
            };
        }
        
        // Open stock modal
        if (window.stockModal) {
            window.stockModal.show(stockData);
        } else {
            console.log(`Show details for ${stockName}`);
        }
    }
    
    showNotification(message, type = 'info') {
        // Use Lottie animations for notifications if available
        if (window.lottieManager && type === 'success') {
            this.showSuccessNotification(message);
        } else if (window.lottieManager && type === 'error') {
            this.showErrorNotification(message);
        } else {
            // Fallback to simple notification system
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    showSuccessNotification(message) {
        if (window.lottieManager) {
            // Create a temporary container for the notification
            const notificationContainer = document.createElement('div');
            notificationContainer.className = 'toast-notification success';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 16px;
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(notificationContainer);
            
            window.lottieManager.showSuccess(notificationContainer, {
                message: message,
                duration: 3000,
                width: '30px',
                height: '30px',
                replace: false,
                onComplete: () => {
                    notificationContainer.remove();
                }
            });
        }
    }
    
    showErrorNotification(message) {
        if (window.lottieManager) {
            // Create a temporary container for the notification
            const notificationContainer = document.createElement('div');
            notificationContainer.className = 'toast-notification error';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 16px;
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(notificationContainer);
            
            window.lottieManager.showError(notificationContainer, {
                message: message,
                duration: 4000,
                width: '30px',
                height: '30px',
                replace: false,
                onComplete: () => {
                    notificationContainer.remove();
                }
            });
        }
    }
    
    /**
     * Process dashboard data from data manager
     */
    processDashboardData(dashboardData) {
        if (dashboardData.portfolio.success) {
            this.processPortfolioData(dashboardData.portfolio.data);
        } else {
            this.showPortfolioError(dashboardData.portfolio.error);
        }
        
        if (dashboardData.funds.success) {
            this.processFundsData(dashboardData.funds.data);
        } else {
            this.showFundsError(dashboardData.funds.error);
        }
        
        if (dashboardData.rank.success) {
            this.processRankData(dashboardData.rank.data);
        } else {
            this.showRankError(dashboardData.rank.error);
        }
    }
    
    /**
     * Process portfolio data from data manager
     */
    processPortfolioData(portfolioData) {
        if (portfolioData && portfolioData.summary) {
            this.portfolioData.totalHoldings = portfolioData.summary.totalInvested;
            this.portfolioData.currentValue = portfolioData.summary.currentValue;
            this.portfolioData.profitLoss = portfolioData.summary.totalPnL;
            this.updatePortfolioCards();
        }
    }
    
    /**
     * Process funds data from data manager
     */
    processFundsData(fundsData) {
        if (fundsData && typeof fundsData.amount === 'number') {
            this.portfolioData.availableFunds = fundsData.amount;
            this.animateCounter('availableFunds', this.portfolioData.availableFunds, 2);
        }
    }
    
    /**
     * Process rank data from data manager
     */
    processRankData(rankData) {
        if (rankData) {
            this.portfolioData.userRank = rankData.userRank;
            this.portfolioData.totalParticipants = rankData.totalParticipants;
            
            this.animateCounter('userRank', this.portfolioData.userRank, 0);
            this.animateCounter('totalParticipants', this.portfolioData.totalParticipants, 0);
        }
    }
    
    /**
     * Process load results from Promise.allSettled
     */
    processLoadResults(results) {
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const operations = ['portfolio', 'rank', 'holdings', 'watchlist'];
                const operation = operations[index];
                console.error(`Failed to load ${operation}:`, result.reason);
                
                // Show specific error for each operation
                switch (operation) {
                    case 'portfolio':
                        this.showPortfolioError(result.reason);
                        break;
                    case 'rank':
                        this.showRankError(result.reason);
                        break;
                    case 'holdings':
                        this.showHoldingsError(result.reason);
                        break;
                    case 'watchlist':
                        this.showWatchlistError(result.reason);
                        break;
                }
            }
        });
    }
    
    /**
     * Handle operation errors with specific messaging and retry options
     */
    handleOperationError(operation, error, retryCallback) {
        console.error(`Dashboard operation failed: ${operation}`, error);
        
        // Track retry attempts
        const retryCount = this.retryAttempts.get(operation) || 0;
        
        // Use error handler if available
        if (this.errorHandler) {
            const shouldRetry = this.errorHandler.handleApiError(`/api/${operation}`, error, retryCount);
            
            if (shouldRetry && retryCount < this.maxRetries) {
                // Show retry option
                this.showRetryOption(operation, error, retryCallback);
            } else {
                // Show final error state
                this.showFinalErrorState(operation, error);
            }
        } else {
            // Fallback error handling
            this.showRetryOption(operation, error, retryCallback);
        }
    }
    
    /**
     * Handle critical errors that affect the entire dashboard
     */
    handleCriticalError(operation, error) {
        console.error(`Critical dashboard error in ${operation}:`, error);
        
        if (this.errorHandler) {
            this.errorHandler.handleComponentError('Dashboard', error, { operation });
        }
        
        // Show critical error message
        this.showCriticalErrorMessage(error);
    }
    
    /**
     * Handle dashboard load error
     */
    handleDashboardLoadError(error) {
        console.error('Dashboard load error:', error);
        
        if (this.errorHandler) {
            this.errorHandler.handleComponentError('Dashboard', error, { 
                operation: 'loadDashboardData',
                timestamp: new Date()
            });
        }
        
        // Show user-friendly error with retry option
        this.showDashboardLoadError(error);
    }
    
    /**
     * Handle timeout events
     */
    handleTimeout(component) {
        console.warn(`Timeout occurred for component: ${component}`);
        
        const timeoutError = new Error(`Loading timeout for ${component}`);
        timeoutError.type = 'timeout';
        
        if (this.errorHandler) {
            this.errorHandler.handleComponentError('Dashboard', timeoutError, { 
                component,
                operation: 'timeout'
            });
        }
        
        this.showTimeoutError(component);
    }
    
    /**
     * Handle loading state changes
     */
    handleLoadingStateChange(component, isLoading) {
        // Update UI based on loading state changes
        if (isLoading) {
            this.showComponentLoading(component);
        } else {
            this.hideComponentLoading(component);
        }
    }
    
    /**
     * Handle retry requests
     */
    handleRetryRequest(component) {
        console.log(`Retry requested for component: ${component}`);
        
        switch (component) {
            case 'portfolio-summary':
                this.retryPortfolioLoad();
                break;
            case 'holdings-table':
                this.retryHoldingsLoad();
                break;
            case 'watchlist-table':
                this.retryWatchlistLoad();
                break;
            default:
                console.warn(`Unknown component for retry: ${component}`);
        }
    }
    
    /**
     * Show retry option for failed operations
     */
    showRetryOption(operation, error, retryCallback) {
        const message = this.getErrorMessage(operation, error);
        const actions = [{
            text: 'Retry',
            callback: () => {
                const retryCount = this.retryAttempts.get(operation) || 0;
                this.retryAttempts.set(operation, retryCount + 1);
                retryCallback();
            }
        }];
        
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.API },
                message,
                actions
            );
        } else {
            // Fallback notification
            this.showNotification(message + ' Click to retry.', 'error');
        }
    }
    
    /**
     * Get user-friendly error message for operations
     */
    getErrorMessage(operation, error) {
        const baseMessages = {
            'portfolio-summary': 'Unable to load portfolio data',
            'user-rank': 'Unable to load your ranking',
            'holdings-data': 'Unable to load your holdings',
            'watchlist-data': 'Unable to load your watchlist'
        };
        
        let message = baseMessages[operation] || 'An error occurred';
        
        // Add specific error details
        if (error.status === 408 || error.message?.includes('timeout')) {
            message += '. The request timed out.';
        } else if (error.status >= 500) {
            message += '. Server error occurred.';
        } else if (!navigator.onLine) {
            message += '. Please check your internet connection.';
        } else {
            message += '. Please try again.';
        }
        
        return message;
    }
    
    /**
     * Show specific error states for different components
     */
    showPortfolioError(error) {
        const portfolioValue = document.getElementById('portfolioValue');
        const availableFunds = document.getElementById('availableFunds');
        
        if (portfolioValue) {
            portfolioValue.innerHTML = `
                <span class="error-text">Unable to load</span>
                <button class="btn btn-sm btn-link retry-btn" onclick="dashboard.retryPortfolioLoad()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            `;
        }
        
        if (availableFunds) {
            availableFunds.innerHTML = `
                <span class="error-text">Unable to load</span>
                <button class="btn btn-sm btn-link retry-btn" onclick="dashboard.retryPortfolioLoad()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            `;
        }
    }
    
    showFundsError(error) {
        const availableFunds = document.getElementById('availableFunds');
        if (availableFunds) {
            availableFunds.innerHTML = `
                <span class="error-text">Unable to load funds</span>
                <button class="btn btn-sm btn-link retry-btn" onclick="dashboard.retryFundsLoad()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            `;
        }
    }
    
    showRankError(error) {
        const userRank = document.getElementById('userRank');
        const totalParticipants = document.getElementById('totalParticipants');
        
        if (userRank) {
            userRank.innerHTML = `
                <span class="error-text">--</span>
                <button class="btn btn-sm btn-link retry-btn" onclick="dashboard.retryRankLoad()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            `;
        }
        
        if (totalParticipants) {
            totalParticipants.textContent = "Unable to load";
        }
    }
    
    showHoldingsError(error) {
        const container = document.getElementById('holdingsTable');
        if (container) {
            const errorMessage = this.getErrorMessage('holdings-data', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-content">
                        <h4>Unable to Load Holdings</h4>
                        <p>${errorMessage}</p>
                        <div class="error-actions">
                            <button class="btn btn-primary" onclick="dashboard.retryHoldingsLoad()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                            <button class="btn btn-outline-secondary" onclick="dashboard.loadInitialData()">
                                <i class="fas fa-refresh"></i> Refresh All
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    showWatchlistError(error) {
        const container = document.getElementById('watchlistTable');
        if (container) {
            const errorMessage = this.getErrorMessage('watchlist-data', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="error-content">
                        <h4>Unable to Load Watchlist</h4>
                        <p>${errorMessage}</p>
                        <div class="error-actions">
                            <button class="btn btn-primary" onclick="dashboard.retryWatchlistLoad()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                            <button class="btn btn-outline-secondary" onclick="dashboard.loadInitialData()">
                                <i class="fas fa-refresh"></i> Refresh All
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    showFinalErrorState(operation, error) {
        // Show final error state when max retries exceeded
        const message = `${this.getErrorMessage(operation, error)} Maximum retry attempts exceeded.`;
        
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.CRITICAL },
                message,
                [{
                    text: 'Refresh Page',
                    callback: () => window.location.reload()
                }]
            );
        }
    }
    
    showCriticalErrorMessage(error) {
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.CRITICAL },
                'A critical error occurred while loading the dashboard. Please refresh the page.',
                [{
                    text: 'Refresh Page',
                    callback: () => window.location.reload()
                }]
            );
        }
    }
    
    showDashboardLoadError(error) {
        const message = 'Unable to load dashboard data. Please check your connection and try again.';
        
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.API },
                message,
                [{
                    text: 'Retry',
                    callback: () => this.loadInitialData()
                }, {
                    text: 'Refresh Page',
                    callback: () => window.location.reload()
                }]
            );
        }
    }
    
    showTimeoutError(component) {
        const message = `Loading ${component} is taking longer than expected. Please try again.`;
        
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.TIMEOUT },
                message,
                [{
                    text: 'Retry',
                    callback: () => this.handleRetryRequest(component)
                }]
            );
        }
    }
    
    /**
     * Show/hide component loading states
     */
    showComponentLoading(component) {
        // Implementation depends on specific component
        console.log(`Showing loading for ${component}`);
    }
    
    hideComponentLoading(component) {
        // Implementation depends on specific component
        console.log(`Hiding loading for ${component}`);
    }
    
    /**
     * Retry methods for different operations
     */
    retryPortfolioLoad() {
        console.log('Retrying portfolio load...');
        this.updatePortfolioSummaryWithErrorHandling();
    }
    
    retryFundsLoad() {
        console.log('Retrying funds load...');
        this.updateAvailableFundsLegacy().catch(error => {
            this.handleOperationError('funds', error, () => this.retryFundsLoad());
        });
    }
    
    retryRankLoad() {
        console.log('Retrying rank load...');
        this.updateUserRankWithErrorHandling();
    }
    
    retryHoldingsLoad() {
        console.log('Retrying holdings load...');
        this.loadHoldingsDataWithErrorHandling();
    }
    
    retryWatchlistLoad() {
        console.log('Retrying watchlist load...');
        this.loadWatchlistDataWithErrorHandling();
    }
    
    /**
     * Get current user ID (implement based on your authentication system)
     */
    getCurrentUserId() {
        // This should be implemented based on your authentication system
        // For now, return a default or extract from DOM/session
        return 'current-user';
    }
    
    getGameType() {
        const type = $("#mainGrid").attr("data-value");
        switch (type) {
            case "Competition":
                return "C1";
            default:
                return "";
        }
    }
}

// Add CSS styles for error states
function addDashboardErrorStyles() {
    if (document.getElementById('dashboard-error-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'dashboard-error-styles';
    style.textContent = `
        .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
            min-height: 200px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        
        .error-icon {
            font-size: 48px;
            color: #dc3545;
            margin-bottom: 16px;
        }
        
        .error-content h4 {
            color: #495057;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .error-content p {
            color: #6c757d;
            margin-bottom: 20px;
            max-width: 400px;
        }
        
        .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .error-text {
            color: #dc3545;
            font-size: 14px;
            font-weight: 500;
        }
        
        .retry-btn {
            color: #007bff !important;
            font-size: 12px;
            padding: 2px 6px !important;
            text-decoration: none !important;
        }
        
        .retry-btn:hover {
            color: #0056b3 !important;
            text-decoration: underline !important;
        }
        
        .retry-btn i {
            margin-right: 4px;
        }
        
        @media (max-width: 768px) {
            .error-state {
                padding: 30px 15px;
                min-height: 150px;
            }
            
            .error-icon {
                font-size: 36px;
            }
            
            .error-actions {
                flex-direction: column;
                align-items: center;
            }
            
            .error-actions .btn {
                width: 100%;
                max-width: 200px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    addDashboardErrorStyles();
    dashboard = new DashboardManager();
});

// Legacy function compatibility with error handling
function GetGameType() {
    return dashboard ? dashboard.getGameType() : "";
}

function GetHoldingsGrid() {
    if (dashboard) {
        dashboard.loadHoldingsDataWithErrorHandling().catch(error => {
            console.error('Legacy GetHoldingsGrid failed:', error);
        });
    }
}

function GetWatchListGrid() {
    if (dashboard) {
        dashboard.loadWatchlistDataWithErrorHandling().catch(error => {
            console.error('Legacy GetWatchListGrid failed:', error);
        });
    }
}

function GetUserData() {
    if (dashboard) {
        dashboard.updatePortfolioSummaryWithErrorHandling().catch(error => {
            console.error('Legacy GetUserData failed:', error);
        });
    }
}

function GetRank() {
    if (dashboard) {
        dashboard.updateUserRankWithErrorHandling().catch(error => {
            console.error('Legacy GetRank failed:', error);
        });
    }
}