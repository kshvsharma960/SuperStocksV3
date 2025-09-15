// Advanced Stock Search with Autocomplete
class WatchlistSearchManager {
    constructor() {
        this.searchElement = null;
        this.searchResults = [];
        this.selectedIndex = -1;
        this.searchTimeout = null;
        this.minSearchLength = 1;
        this.searchDelay = 300;
        
        this.init();
    }
    
    init() {
        this.setupSearchElement();
        this.setupEventListeners();
        this.createSearchResultsContainer();
    }
    
    setupSearchElement() {
        const searchContainer = document.querySelector('.search-container');
        if (!searchContainer) return;
        
        // Replace the existing select2 with our custom search
        const existingSelect = document.getElementById('SearchStocks');
        if (existingSelect) {
            existingSelect.remove();
        }
        
        // Create new search input with enhanced features
        const searchHTML = `
            <div class="advanced-search-wrapper">
                <div class="search-input-container">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        id="advancedStockSearch" 
                        class="advanced-search-input" 
                        placeholder="Search stocks by symbol or company name..."
                        autocomplete="off"
                        spellcheck="false"
                    >
                    <button class="search-clear-btn" id="clearSearchBtn" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-results-container" id="searchResultsContainer" style="display: none;">
                    <div class="search-results-list" id="searchResultsList"></div>
                    <div class="search-loading" id="searchLoading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <span>Searching...</span>
                    </div>
                    <div class="search-no-results" id="searchNoResults" style="display: none;">
                        <i class="fas fa-search"></i>
                        <span>No stocks found</span>
                    </div>
                </div>
            </div>
        `;
        
        searchContainer.innerHTML = searchHTML;
        this.searchElement = document.getElementById('advancedStockSearch');
    }
    
    setupEventListeners() {
        if (!this.searchElement) return;
        
        // Input event for real-time search
        this.searchElement.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
        
        // Keyboard navigation
        this.searchElement.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Focus events
        this.searchElement.addEventListener('focus', () => {
            this.showSearchResults();
        });
        
        this.searchElement.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on results
            setTimeout(() => {
                if (!this.isMouseOverResults()) {
                    this.hideSearchResults();
                }
            }, 150);
        });
        
        // Clear button
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.advanced-search-wrapper')) {
                this.hideSearchResults();
            }
        });
    }
    
    createSearchResultsContainer() {
        const container = document.getElementById('searchResultsContainer');
        if (container) {
            // Add mouse events to prevent blur when hovering over results
            container.addEventListener('mouseenter', () => {
                this.mouseOverResults = true;
            });
            
            container.addEventListener('mouseleave', () => {
                this.mouseOverResults = false;
            });
        }
    }
    
    handleSearchInput(query) {
        const trimmedQuery = query.trim();
        
        // Show/hide clear button
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.style.display = trimmedQuery ? 'flex' : 'none';
        }
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        if (trimmedQuery.length < this.minSearchLength) {
            this.hideSearchResults();
            return;
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(trimmedQuery);
        }, this.searchDelay);
    }
    
    async performSearch(query) {
        this.showLoading();
        this.selectedIndex = -1;
        
        try {
            const response = await this.fetchStockData(query);
            this.searchResults = response || [];
            this.renderSearchResults();
        } catch (error) {
            console.error('Search failed:', error);
            this.showError();
        }
    }
    
    fetchStockData(query) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/AllStocks",
                method: "GET",
                data: { item: query },
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
    
    renderSearchResults() {
        const resultsList = document.getElementById('searchResultsList');
        const noResults = document.getElementById('searchNoResults');
        
        this.hideLoading();
        
        if (!this.searchResults || this.searchResults.length === 0) {
            resultsList.innerHTML = '';
            noResults.style.display = 'flex';
            this.showSearchResults();
            return;
        }
        
        noResults.style.display = 'none';
        
        const resultsHTML = this.searchResults.map((stock, index) => 
            this.createSearchResultItem(stock, index)
        ).join('');
        
        resultsList.innerHTML = resultsHTML;
        this.addResultEventListeners();
        this.showSearchResults();
    }
    
    createSearchResultItem(stock, index) {
        const query = this.searchElement.value.toLowerCase();
        const highlightedSymbol = this.highlightMatch(stock.Symbol, query);
        const highlightedName = stock.CompanyName ? this.highlightMatch(stock.CompanyName, query) : stock.Symbol;
        
        return `
            <div class="search-result-item" data-index="${index}" data-symbol="${stock.Symbol}">
                <div class="result-main-info">
                    <div class="result-symbol">${highlightedSymbol}</div>
                    <div class="result-name">${highlightedName}</div>
                </div>
                <div class="result-actions">
                    <button class="result-action-btn add-to-watchlist" data-symbol="${stock.Symbol}">
                        <i class="fas fa-plus"></i>
                        <span>Add</span>
                    </button>
                    <button class="result-action-btn trade-stock" data-symbol="${stock.Symbol}">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Trade</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    highlightMatch(text, query) {
        if (!query || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    addResultEventListeners() {
        // Add to watchlist buttons
        document.querySelectorAll('.add-to-watchlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.dataset.symbol;
                this.addToWatchlist(symbol);
            });
        });
        
        // Trade buttons
        document.querySelectorAll('.trade-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const symbol = btn.dataset.symbol;
                this.openTradeModal(symbol);
            });
        });
        
        // Result item clicks
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const symbol = item.dataset.symbol;
                this.selectStock(symbol);
            });
            
            item.addEventListener('mouseenter', () => {
                this.highlightResult(parseInt(item.dataset.index));
            });
        });
    }
    
    handleKeyboardNavigation(e) {
        const resultsContainer = document.getElementById('searchResultsContainer');
        const isResultsVisible = resultsContainer && resultsContainer.style.display !== 'none';
        
        if (!isResultsVisible || this.searchResults.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchResults.length - 1);
                this.highlightResult(this.selectedIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.highlightResult(this.selectedIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
                    const selectedStock = this.searchResults[this.selectedIndex];
                    this.selectStock(selectedStock.Symbol);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideSearchResults();
                this.searchElement.blur();
                break;
                
            case 'Tab':
                this.hideSearchResults();
                break;
        }
    }
    
    highlightResult(index) {
        // Remove previous highlights
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Highlight current item
        if (index >= 0) {
            const item = document.querySelector(`[data-index="${index}"]`);
            if (item) {
                item.classList.add('highlighted');
                item.scrollIntoView({ block: 'nearest' });
            }
        }
        
        this.selectedIndex = index;
    }
    
    selectStock(symbol) {
        // Add to watchlist by default when selecting
        this.addToWatchlist(symbol);
    }
    
    async addToWatchlist(symbol) {
        try {
            // Show loading state on the button
            const btn = document.querySelector(`[data-symbol="${symbol}"].add-to-watchlist`);
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Adding...</span>';
                btn.disabled = true;
            }
            
            const actionData = {
                Stock: symbol,
                AddDel: 1,
                GameType: dashboard ? dashboard.getGameType() : ""
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
            
            // Success feedback
            this.showSuccessAnimation(symbol);
            
            if (dashboard) {
                dashboard.loadWatchlistData();
                dashboard.showNotification(`${symbol} added to watchlist`, 'success');
            }
            
            // Clear search and hide results
            this.clearSearch();
            
        } catch (error) {
            console.error('Failed to add to watchlist:', error);
            
            if (dashboard) {
                dashboard.showNotification('Failed to add stock to watchlist', 'error');
            }
            
            // Reset button state
            const btn = document.querySelector(`[data-symbol="${symbol}"].add-to-watchlist`);
            if (btn) {
                btn.innerHTML = '<i class="fas fa-plus"></i><span>Add</span>';
                btn.disabled = false;
            }
        }
    }
    
    openTradeModal(symbol) {
        // Get stock price first, then open modal
        const stock = this.searchResults.find(s => s.Symbol === symbol);
        if (stock && dashboard) {
            dashboard.openTradeModal(symbol, stock.Price || 0);
        }
        this.hideSearchResults();
    }
    
    showSuccessAnimation(symbol) {
        const btn = document.querySelector(`[data-symbol="${symbol}"].add-to-watchlist`);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i><span>Added!</span>';
            btn.classList.add('success');
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-plus"></i><span>Add</span>';
                btn.classList.remove('success');
                btn.disabled = false;
            }, 1500);
        }
    }
    
    showLoading() {
        const loading = document.getElementById('searchLoading');
        const resultsList = document.getElementById('searchResultsList');
        const noResults = document.getElementById('searchNoResults');
        
        if (loading) loading.style.display = 'flex';
        if (resultsList) resultsList.innerHTML = '';
        if (noResults) noResults.style.display = 'none';
        
        this.showSearchResults();
    }
    
    hideLoading() {
        const loading = document.getElementById('searchLoading');
        if (loading) loading.style.display = 'none';
    }
    
    showError() {
        this.hideLoading();
        const resultsList = document.getElementById('searchResultsList');
        if (resultsList) {
            resultsList.innerHTML = `
                <div class="search-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Search failed. Please try again.</span>
                </div>
            `;
        }
        this.showSearchResults();
    }
    
    showSearchResults() {
        const container = document.getElementById('searchResultsContainer');
        if (container) {
            container.style.display = 'block';
            // Add animation class
            setTimeout(() => {
                container.classList.add('show');
            }, 10);
        }
    }
    
    hideSearchResults() {
        const container = document.getElementById('searchResultsContainer');
        if (container) {
            container.classList.remove('show');
            setTimeout(() => {
                container.style.display = 'none';
            }, 200);
        }
        this.selectedIndex = -1;
    }
    
    clearSearch() {
        if (this.searchElement) {
            this.searchElement.value = '';
            this.searchElement.focus();
        }
        
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        this.hideSearchResults();
        this.searchResults = [];
    }
    
    isMouseOverResults() {
        return this.mouseOverResults || false;
    }
    
    focus() {
        if (this.searchElement) {
            this.searchElement.focus();
        }
    }
}

// Initialize the search manager
let watchlistSearch;
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the dashboard to initialize
    setTimeout(() => {
        watchlistSearch = new WatchlistSearchManager();
    }, 500);
});

// Export for global access
window.WatchlistSearchManager = WatchlistSearchManager;