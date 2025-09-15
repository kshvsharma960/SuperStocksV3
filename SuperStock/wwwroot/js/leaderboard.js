/**
 * Modern Leaderboard Management
 * Handles leaderboard display, search, sorting, and real-time updates
 */

class LeaderboardManager {
    constructor() {
        this.leaderboardData = [];
        this.filteredData = [];
        this.currentSort = { field: 'rank', direction: 'asc' };
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.currentUserEmail = '';
        
        // Initialize the data manager and error handler
        this.dataManager = new LeaderboardDataManager();
        this.errorHandler = window.EnhancedErrorHandler ? new EnhancedErrorHandler() : null;
        
        // Error recovery state
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isLoading = false;
        this.hasError = false;
        
        // Initialize error handler if available
        if (this.errorHandler) {
            this.errorHandler.initialize();
        }
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadLeaderboardData();
        this.startCompetitionTimer();
        this.initializeCharts();
        
        // Get current user email from the page context
        this.currentUserEmail = document.querySelector('meta[name="user-email"]')?.content || '';
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('leaderboardSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterAndDisplayData();
            });
        }

        // Sorting functionality
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', (e) => {
                const sortField = header.dataset.sort;
                this.handleSort(sortField);
            });
        });

        // Filter functionality
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = e.target.dataset.filter;
                this.handleFilter(filter);
                
                // Update active filter
                document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshLeaderboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshLeaderboard();
            });
        }
    }

    async loadLeaderboardData(forceRefresh = false) {
        if (this.isLoading) {
            return; // Prevent concurrent loading
        }

        try {
            this.isLoading = true;
            this.hasError = false;
            this.showLoading(true);
            this.hideError();
            
            // Use the data manager to get processed and validated data
            const processedData = await this.dataManager.getLeaderboardData(forceRefresh);
            
            // Validate that we received valid data
            if (!Array.isArray(processedData) || processedData.length === 0) {
                throw new Error('No leaderboard data available');
            }
            
            this.leaderboardData = processedData;
            this.filteredData = [...this.leaderboardData];
            this.retryCount = 0; // Reset retry count on success
            
            // Render all components with error handling
            await this.renderAllComponents();
            
            this.showLoading(false);
            
        } catch (error) {
            this.isLoading = false;
            this.hasError = true;
            this.showLoading(false);
            
            // Handle error with enhanced error handler
            if (this.errorHandler) {
                const shouldRetry = this.errorHandler.handleApiError('leaderboard', error, this.retryCount);
                
                if (shouldRetry && this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    this.showRetryableError(error, this.retryCount);
                } else {
                    this.showFatalError(error);
                }
            } else {
                // Fallback error handling
                console.error('Error loading leaderboard data:', error);
                this.showFatalError(error);
            }
            
            // Show fallback content
            this.showFallbackContent();
        }
    }

    /**
     * Render all components with individual error handling
     */
    async renderAllComponents() {
        const components = [
            { name: 'Top Performers', fn: () => this.renderTopPerformers() },
            { name: 'Leaderboard Table', fn: () => this.filterAndDisplayData() },
            { name: 'Top Movers', fn: () => this.renderTopMovers() },
            { name: 'Competition Stats', fn: () => this.updateCompetitionStats() }
        ];

        for (const component of components) {
            try {
                await component.fn();
            } catch (error) {
                console.error(`Error rendering ${component.name}:`, error);
                
                if (this.errorHandler) {
                    this.errorHandler.handleComponentError(component.name, error, {
                        leaderboardDataLength: this.leaderboardData.length,
                        filteredDataLength: this.filteredData.length
                    });
                }
                
                // Continue with other components even if one fails
            }
        }
    }



    generatePerformanceHistory() {
        const history = [];
        let value = 1000000;
        
        for (let i = 0; i < 30; i++) {
            value += (Math.random() - 0.5) * 10000;
            history.push({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: value
            });
        }
        
        return history;
    }

    renderTopPerformers() {
        const podiumContainer = document.getElementById('topPerformersPodium');
        if (!podiumContainer) return;

        try {
            // Check if we have valid data
            if (!this.leaderboardData || this.leaderboardData.length === 0) {
                this.showPodiumFallback(podiumContainer);
                return;
            }

            const topThree = this.leaderboardData.slice(0, 3);
            
            // Validate top performers data
            const validTopThree = topThree.filter(participant => 
                participant && 
                typeof participant.portfolioValue === 'number' && 
                participant.portfolioValue > 0
            );

            if (validTopThree.length === 0) {
                this.showPodiumFallback(podiumContainer);
                return;
            }

            // Reorder for podium display (2nd, 1st, 3rd)
            const podiumOrder = [
                validTopThree[1], // 2nd place
                validTopThree[0], // 1st place  
                validTopThree[2]  // 3rd place
            ].filter(Boolean);

            const podiumHTML = podiumOrder.map((participant, index) => {
                const positions = ['second', 'first', 'third'];
                const position = positions[index];
                const actualRank = participant.rank || (index === 1 ? 1 : index === 0 ? 2 : 3);
                
                // Use data manager for safe display name resolution
                const displayName = this.dataManager.resolveDisplayName(participant);
                const avatar = this.dataManager.generateAvatar(participant);
                
                // Safe numeric formatting with fallbacks
                const portfolioValue = this.safeFormatCurrency(participant.portfolioValue);
                const pnl = this.safeFormatCurrency(Math.abs(participant.pnl || 0));
                const pnlPercent = this.safeFormatPercent(participant.pnlPercent);
                
                return `
                    <div class="podium-position ${position}">
                        <div class="podium-card">
                            <div class="user-avatar">
                                ${avatar}
                            </div>
                            <div class="user-name" title="${this.escapeHtml(displayName)}">${this.escapeHtml(displayName)}</div>
                            <div class="portfolio-value">₹${portfolioValue}</div>
                            <div class="performance ${(participant.pnl || 0) >= 0 ? 'positive' : 'negative'}">
                                ${(participant.pnl || 0) >= 0 ? '+' : ''}₹${pnl}
                                (${pnlPercent})
                            </div>
                        </div>
                        <div class="podium-base">
                            <div class="position-number">${actualRank}</div>
                        </div>
                    </div>
                `;
            }).join('');

            podiumContainer.innerHTML = podiumHTML;
            
            // Add animation with error handling
            this.animatePodium(podiumContainer);
            
        } catch (error) {
            console.error('Error rendering top performers:', error);
            this.showPodiumFallback(podiumContainer);
            
            if (this.errorHandler) {
                this.errorHandler.handleComponentError('TopPerformers', error, {
                    dataLength: this.leaderboardData?.length || 0
                });
            }
        }
    }

    /**
     * Show fallback content for podium when data is unavailable
     */
    showPodiumFallback(container) {
        container.innerHTML = `
            <div class="podium-fallback">
                <div class="fallback-message">
                    <i class="fas fa-trophy"></i>
                    <h4>Top Performers</h4>
                    <p>Leaderboard data is currently unavailable.</p>
                    <button class="btn btn-primary btn-sm" onclick="leaderboardManager.retryLoadData()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Animate podium with error handling
     */
    animatePodium(container) {
        try {
            setTimeout(() => {
                const positions = container.querySelectorAll('.podium-position');
                positions.forEach((position, index) => {
                    setTimeout(() => {
                        position.style.opacity = '0';
                        position.style.transform = 'translateY(20px)';
                        position.style.transition = 'all 0.6s ease';
                        
                        setTimeout(() => {
                            position.style.opacity = '1';
                            position.style.transform = 'translateY(0)';
                        }, 50);
                    }, index * 200);
                });
            }, 100);
        } catch (error) {
            console.error('Error animating podium:', error);
            // Animation failure shouldn't break the component
        }
    }

    filterAndDisplayData() {
        // Use the data manager's search and filter functionality
        let data = this.dataManager.searchAndFilter(
            this.leaderboardData, 
            this.searchTerm, 
            this.currentFilter
        );

        // Apply sorting
        data = this.sortData(data);

        this.filteredData = data;
        this.renderLeaderboardTable();
    }

    sortData(data) {
        return data.sort((a, b) => {
            let aValue = a[this.currentSort.field];
            let bValue = b[this.currentSort.field];

            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (this.currentSort.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    renderLeaderboardTable() {
        const tableBody = document.getElementById('leaderboardTableBody');
        const emptyState = document.getElementById('leaderboardEmpty');
        
        if (!tableBody) return;

        try {
            // Check for empty or invalid data
            if (!this.filteredData || this.filteredData.length === 0) {
                this.showTableEmptyState(tableBody, emptyState);
                return;
            }

            if (emptyState) emptyState.style.display = 'none';

            // Validate and sanitize data before rendering
            const validData = this.filteredData.filter(participant => 
                participant && 
                typeof participant === 'object' &&
                (participant.email || participant.username)
            );

            if (validData.length === 0) {
                this.showTableEmptyState(tableBody, emptyState, 'No valid participant data available');
                return;
            }

            const tableHTML = validData.map((participant, index) => {
                try {
                    return this.renderParticipantRow(participant, index);
                } catch (rowError) {
                    console.error('Error rendering participant row:', rowError, participant);
                    return this.renderFallbackRow(participant, index);
                }
            }).join('');

            tableBody.innerHTML = tableHTML;
            
            // Render components with error handling
            this.safeRenderPerformanceCharts();
            this.safeAnimateTableRows();
            
        } catch (error) {
            console.error('Error rendering leaderboard table:', error);
            this.showTableErrorState(tableBody);
            
            if (this.errorHandler) {
                this.errorHandler.handleComponentError('LeaderboardTable', error, {
                    filteredDataLength: this.filteredData?.length || 0
                });
            }
        }
    }

    /**
     * Render individual participant row with error handling
     */
    renderParticipantRow(participant, index) {
        const displayRank = this.currentFilter === 'all' ? (participant.rank || index + 1) : index + 1;
        const isCurrentUser = participant.isCurrentUser || false;
        
        // Use data manager for safe display name resolution
        const displayName = this.dataManager.resolveDisplayName(participant);
        const avatar = this.dataManager.generateAvatar(participant);
        
        // Safe formatting with fallbacks
        const portfolioValue = this.safeFormatCurrency(participant.portfolioValue);
        const pnl = this.safeFormatCurrency(Math.abs(participant.pnl || 0));
        const pnlPercent = this.safeFormatPercent(participant.pnlPercent);
        const totalTrades = participant.totalTrades || 0;
        
        // Safe email handling
        const email = participant.email ? this.escapeHtml(participant.email) : '';
        
        return `
            <tr class="participant-row ${isCurrentUser ? 'current-user' : ''}" data-email="${email}">
                <td class="rank-cell">
                    <div class="rank-number ${this.getRankClass(displayRank)}">${displayRank}</div>
                    ${this.getRankChangeIndicator(participant)}
                </td>
                <td class="user-cell">
                    <div class="user-info">
                        <div class="user-avatar">
                            ${avatar}
                        </div>
                        <div class="user-details">
                            <div class="username" title="${this.escapeHtml(displayName)}">
                                ${this.escapeHtml(displayName)}
                                ${isCurrentUser ? '<span class="badge bg-primary ms-2">You</span>' : ''}
                            </div>
                            <div class="join-date">Member since Jan 2024</div>
                        </div>
                    </div>
                </td>
                <td class="portfolio-cell">₹${portfolioValue}</td>
                <td class="performance-cell">
                    <div class="performance-value ${(participant.pnl || 0) >= 0 ? 'positive' : 'negative'}">
                        ${(participant.pnl || 0) >= 0 ? '+' : ''}₹${pnl}
                    </div>
                </td>
                <td class="performance-cell">
                    <div class="performance-value ${(participant.pnlPercent || 0) >= 0 ? 'positive' : 'negative'}">
                        ${pnlPercent}
                    </div>
                </td>
                <td class="trades-cell">${totalTrades}</td>
                <td class="performance-cell">
                    ${this.renderPerformanceChart(participant.performanceHistory, index)}
                </td>
            </tr>
        `;
    }

    /**
     * Render fallback row for corrupted data
     */
    renderFallbackRow(participant, index) {
        const displayName = participant?.email || participant?.username || 'Unknown User';
        const rank = index + 1;
        
        return `
            <tr class="participant-row error-row" data-error="true">
                <td class="rank-cell">
                    <div class="rank-number">${rank}</div>
                </td>
                <td class="user-cell">
                    <div class="user-info">
                        <div class="user-avatar">?</div>
                        <div class="user-details">
                            <div class="username">${this.escapeHtml(displayName)}</div>
                            <div class="join-date text-muted">Data unavailable</div>
                        </div>
                    </div>
                </td>
                <td class="portfolio-cell text-muted">--</td>
                <td class="performance-cell text-muted">--</td>
                <td class="performance-cell text-muted">--</td>
                <td class="trades-cell text-muted">--</td>
                <td class="performance-cell text-muted">--</td>
            </tr>
        `;
    }

    /**
     * Show empty state for table
     */
    showTableEmptyState(tableBody, emptyState, customMessage = null) {
        tableBody.innerHTML = '';
        
        if (emptyState) {
            emptyState.style.display = 'block';
            if (customMessage) {
                const messageElement = emptyState.querySelector('.empty-message');
                if (messageElement) {
                    messageElement.textContent = customMessage;
                }
            }
        } else {
            // Create inline empty state if element doesn't exist
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-users fa-2x text-muted mb-3"></i>
                            <p class="text-muted">${customMessage || 'No participants found'}</p>
                            <button class="btn btn-primary btn-sm" onclick="leaderboardManager.retryLoadData()">
                                <i class="fas fa-sync-alt"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Show error state for table
     */
    showTableErrorState(tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                        <p class="text-muted">Unable to display leaderboard data</p>
                        <button class="btn btn-primary btn-sm" onclick="leaderboardManager.retryLoadData()">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderPerformanceCharts() {
        document.querySelectorAll('.performance-chart').forEach(canvas => {
            const history = JSON.parse(canvas.dataset.history);
            this.drawMiniChart(canvas, history);
        });
    }

    drawMiniChart(canvas, history) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (history.length < 2) return;
        
        // Calculate bounds
        const values = history.map(h => h.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;
        
        if (range === 0) return;
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = values[values.length - 1] >= values[0] ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1.5;
        
        history.forEach((point, index) => {
            const x = (index / (history.length - 1)) * width;
            const y = height - ((point.value - minValue) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    getRankClass(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        return '';
    }

    getRankChangeIndicator(participant) {
        // Mock rank change data
        const change = Math.floor(Math.random() * 5) - 2;
        if (change > 0) {
            return `<div class="rank-change up"><i class="fas fa-arrow-up"></i> +${change}</div>`;
        } else if (change < 0) {
            return `<div class="rank-change down"><i class="fas fa-arrow-down"></i> ${change}</div>`;
        }
        return `<div class="rank-change same"><i class="fas fa-minus"></i> 0</div>`;
    }

    animateTableRows() {
        const rows = document.querySelectorAll('.participant-row');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }

    handleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }

        // Update sort icons
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.className = 'fas fa-sort sort-icon';
        });

        const activeHeader = document.querySelector(`[data-sort="${field}"] .sort-icon`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${this.currentSort.direction === 'asc' ? 'up' : 'down'} sort-icon`;
        }

        this.filterAndDisplayData();
    }

    handleFilter(filter) {
        this.currentFilter = filter;
        this.filterAndDisplayData();
    }

    async refreshLeaderboard() {
        const refreshBtn = document.getElementById('refreshLeaderboard');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            // Clear cache and force refresh
            this.dataManager.clearCache();
            this.retryCount = 0; // Reset retry count for manual refresh
            await this.loadLeaderboardData(true);
            
            // Show success notification
            this.showNotification('Leaderboard updated successfully!', 'success');
            
        } catch (error) {
            // Error handling is already done in loadLeaderboardData
            console.error('Refresh failed:', error);
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    startCompetitionTimer() {
        const timerElement = document.getElementById('competitionTimer');
        if (!timerElement) return;

        // Mock end date - 15 days from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 15);
        endDate.setHours(23, 59, 59, 999);

        const updateTimer = () => {
            const now = new Date();
            const timeLeft = endDate - now;

            if (timeLeft <= 0) {
                timerElement.innerHTML = '<span class="text-danger">Competition Ended</span>';
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            timerElement.innerHTML = `
                <span class="days">${days.toString().padStart(2, '0')}</span>d 
                <span class="hours">${hours.toString().padStart(2, '0')}</span>h 
                <span class="minutes">${minutes.toString().padStart(2, '0')}</span>m
            `;
        };

        updateTimer();
        setInterval(updateTimer, 60000); // Update every minute
    }

    showLoading(show) {
        const loadingElement = document.getElementById('leaderboardLoading');
        const tableElement = document.getElementById('leaderboardTable');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        if (tableElement) {
            tableElement.style.display = show ? 'none' : 'table';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Use the existing notification system
        if (window.NotificationManager) {
            window.NotificationManager.show(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Safe currency formatting with fallback
     */
    safeFormatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '0';
        }
        
        try {
            return this.formatCurrency(amount);
        } catch (error) {
            console.error('Error formatting currency:', error);
            return amount.toString();
        }
    }

    /**
     * Safe percentage formatting with fallback
     */
    safeFormatPercent(percent) {
        if (typeof percent !== 'number' || isNaN(percent)) {
            return '0.00%';
        }
        
        try {
            const sign = percent >= 0 ? '+' : '';
            return `${sign}${percent.toFixed(2)}%`;
        } catch (error) {
            console.error('Error formatting percentage:', error);
            return '0.00%';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (typeof text !== 'string') {
            return '';
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render performance chart with error handling
     */
    renderPerformanceChart(performanceHistory, index) {
        try {
            if (!performanceHistory || !Array.isArray(performanceHistory) || performanceHistory.length === 0) {
                return '<span class="text-muted">No data</span>';
            }
            
            const safeHistory = performanceHistory.filter(point => 
                point && 
                typeof point.value === 'number' && 
                !isNaN(point.value)
            );
            
            if (safeHistory.length === 0) {
                return '<span class="text-muted">No data</span>';
            }
            
            return `<canvas class="performance-chart" width="60" height="20" data-history='${JSON.stringify(safeHistory)}' data-index="${index}"></canvas>`;
        } catch (error) {
            console.error('Error rendering performance chart:', error);
            return '<span class="text-muted">Chart error</span>';
        }
    }

    /**
     * Safe performance chart rendering
     */
    safeRenderPerformanceCharts() {
        try {
            this.renderPerformanceCharts();
        } catch (error) {
            console.error('Error rendering performance charts:', error);
            
            if (this.errorHandler) {
                this.errorHandler.handleComponentError('PerformanceCharts', error);
            }
        }
    }

    /**
     * Safe table row animation
     */
    safeAnimateTableRows() {
        try {
            this.animateTableRows();
        } catch (error) {
            console.error('Error animating table rows:', error);
            // Animation failure shouldn't break the component
        }
    }

    /**
     * Show retryable error with retry button
     */
    showRetryableError(error, retryCount) {
        const message = `Failed to load leaderboard data (attempt ${retryCount}/${this.maxRetries}). Please try again.`;
        
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.API },
                message,
                [
                    {
                        text: 'Retry Now',
                        action: () => this.retryLoadData()
                    }
                ]
            );
        } else {
            this.showError(message);
        }
    }

    /**
     * Show fatal error with fallback options
     */
    showFatalError(error) {
        const message = 'Unable to load leaderboard data. Please check your connection and refresh the page.';
        
        if (this.errorHandler) {
            this.errorHandler.showUserError(
                { type: this.errorHandler.errorTypes.CRITICAL },
                message,
                [
                    {
                        text: 'Refresh Page',
                        action: () => window.location.reload()
                    },
                    {
                        text: 'Try Again',
                        action: () => this.retryLoadData()
                    }
                ]
            );
        } else {
            this.showError(message);
        }
    }

    /**
     * Show fallback content when data is unavailable
     */
    showFallbackContent() {
        // Show fallback for podium
        const podiumContainer = document.getElementById('topPerformersPodium');
        if (podiumContainer) {
            this.showPodiumFallback(podiumContainer);
        }

        // Show fallback for table
        const tableBody = document.getElementById('leaderboardTableBody');
        const emptyState = document.getElementById('leaderboardEmpty');
        if (tableBody) {
            this.showTableEmptyState(tableBody, emptyState, 'Leaderboard data is currently unavailable');
        }

        // Hide other components that depend on data
        this.hideDependentComponents();
    }

    /**
     * Hide components that depend on leaderboard data
     */
    hideDependentComponents() {
        const componentsToHide = [
            'topGainers',
            'topLosers',
            'performanceTrendChart',
            'portfolioDistributionChart'
        ];

        componentsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-chart-line"></i>
                        <p>Data unavailable</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Hide error display
     */
    hideError() {
        // Hide any existing error messages
        const errorElements = document.querySelectorAll('.error-notification');
        errorElements.forEach(element => element.remove());
    }

    /**
     * Retry loading data
     */
    async retryLoadData() {
        this.retryCount = 0; // Reset retry count for manual retry
        await this.loadLeaderboardData(true); // Force refresh
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    initializeCharts() {
        this.initPerformanceTrendChart();
        this.initPortfolioDistributionChart();
        this.bindChartControls();
    }

    initPerformanceTrendChart() {
        const ctx = document.getElementById('performanceTrendChart');
        if (!ctx) return;

        const chartData = this.generatePerformanceTrendData();
        
        this.performanceTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: '1st Place',
                        data: chartData.first,
                        borderColor: '#ffd700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: '2nd Place',
                        data: chartData.second,
                        borderColor: '#c0c0c0',
                        backgroundColor: 'rgba(192, 192, 192, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: '3rd Place',
                        data: chartData.third,
                        borderColor: '#cd7f32',
                        backgroundColor: 'rgba(205, 127, 50, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Average',
                        data: chartData.average,
                        borderColor: '#6b7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Portfolio Value (₹)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    initPortfolioDistributionChart() {
        const ctx = document.getElementById('portfolioDistributionChart');
        if (!ctx) return;

        const distributionData = this.generatePortfolioDistributionData();
        
        this.portfolioDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distributionData.labels,
                datasets: [{
                    data: distributionData.values,
                    backgroundColor: [
                        '#10b981', // Profitable
                        '#ef4444', // Loss
                        '#6b7280', // Break-even
                        '#f59e0b'  // New participants
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    generatePerformanceTrendData() {
        const days = 7;
        const labels = [];
        const first = [];
        const second = [];
        const third = [];
        const average = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));

            // Generate mock performance data
            const baseFirst = 1200000 + (Math.random() * 100000);
            const baseSecond = 1150000 + (Math.random() * 80000);
            const baseThird = 1100000 + (Math.random() * 60000);
            const baseAverage = 1050000 + (Math.random() * 40000);

            first.push(Math.round(baseFirst));
            second.push(Math.round(baseSecond));
            third.push(Math.round(baseThird));
            average.push(Math.round(baseAverage));
        }

        return { labels, first, second, third, average };
    }

    generatePortfolioDistributionData() {
        // Mock distribution data
        return {
            labels: ['Profitable (>5%)', 'Loss (<-5%)', 'Break-even (-5% to 5%)', 'New Participants'],
            values: [35, 20, 30, 15]
        };
    }

    bindChartControls() {
        // Period selection for performance trend chart
        document.querySelectorAll('[data-period]').forEach(button => {
            button.addEventListener('click', (e) => {
                // Update active button
                document.querySelectorAll('[data-period]').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                // Update chart data based on period
                const period = e.target.dataset.period;
                this.updatePerformanceTrendChart(period);
            });
        });
    }

    updatePerformanceTrendChart(period) {
        if (!this.performanceTrendChart) return;

        // Generate new data based on period
        let days;
        switch (period) {
            case '7d': days = 7; break;
            case '30d': days = 30; break;
            case '90d': days = 90; break;
            default: days = 7;
        }

        const newData = this.generatePerformanceTrendDataForPeriod(days);
        
        this.performanceTrendChart.data.labels = newData.labels;
        this.performanceTrendChart.data.datasets[0].data = newData.first;
        this.performanceTrendChart.data.datasets[1].data = newData.second;
        this.performanceTrendChart.data.datasets[2].data = newData.third;
        this.performanceTrendChart.data.datasets[3].data = newData.average;
        
        this.performanceTrendChart.update('active');
    }

    generatePerformanceTrendDataForPeriod(days) {
        const labels = [];
        const first = [];
        const second = [];
        const third = [];
        const average = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            if (days <= 7) {
                labels.push(date.toLocaleDateString('en-IN', { weekday: 'short' }));
            } else if (days <= 30) {
                labels.push(date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
            } else {
                labels.push(date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
            }

            // Generate progressive performance data
            const progress = (days - i) / days;
            const baseFirst = 1000000 + (progress * 200000) + (Math.random() * 50000);
            const baseSecond = 1000000 + (progress * 150000) + (Math.random() * 40000);
            const baseThird = 1000000 + (progress * 100000) + (Math.random() * 30000);
            const baseAverage = 1000000 + (progress * 50000) + (Math.random() * 20000);

            first.push(Math.round(baseFirst));
            second.push(Math.round(baseSecond));
            third.push(Math.round(baseThird));
            average.push(Math.round(baseAverage));
        }

        return { labels, first, second, third, average };
    }

    renderTopMovers() {
        this.renderTopGainers();
        this.renderTopLosers();
    }

    renderTopGainers() {
        const container = document.getElementById('topGainers');
        if (!container) return;

        try {
            if (!this.leaderboardData || this.leaderboardData.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-3">No data available</div>';
                return;
            }

            const gainers = this.leaderboardData
                .filter(p => p && typeof p.pnl === 'number' && p.pnl > 0)
                .sort((a, b) => (b.pnlPercent || 0) - (a.pnlPercent || 0))
                .slice(0, 5);

            if (gainers.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-3">No gainers today</div>';
                return;
            }

            const gainersHTML = gainers.map(participant => {
                const displayName = this.dataManager.resolveDisplayName(participant);
                const pnl = this.safeFormatCurrency(Math.abs(participant.pnl));
                const pnlPercent = this.safeFormatPercent(participant.pnlPercent);
                
                return `
                    <div class="mover-item">
                        <div class="mover-info">
                            <div class="username" title="${this.escapeHtml(displayName)}">${this.escapeHtml(displayName)}</div>
                            <div class="change-period">Last 24h</div>
                        </div>
                        <div class="mover-change">
                            <div class="change-value positive">+₹${pnl}</div>
                            <div class="change-percentage">${pnlPercent}</div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = gainersHTML;
            
        } catch (error) {
            console.error('Error rendering top gainers:', error);
            container.innerHTML = '<div class="text-center text-muted py-3">Unable to load gainers</div>';
            
            if (this.errorHandler) {
                this.errorHandler.handleComponentError('TopGainers', error);
            }
        }
    }

    renderTopLosers() {
        const container = document.getElementById('topLosers');
        if (!container) return;

        try {
            if (!this.leaderboardData || this.leaderboardData.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-3">No data available</div>';
                return;
            }

            const losers = this.leaderboardData
                .filter(p => p && typeof p.pnl === 'number' && p.pnl < 0)
                .sort((a, b) => (a.pnlPercent || 0) - (b.pnlPercent || 0))
                .slice(0, 5);

            if (losers.length === 0) {
                container.innerHTML = '<div class="text-center text-muted py-3">No losers today</div>';
                return;
            }

            const losersHTML = losers.map(participant => {
                const displayName = this.dataManager.resolveDisplayName(participant);
                const pnl = this.safeFormatCurrency(Math.abs(participant.pnl));
                const pnlPercent = this.safeFormatPercent(participant.pnlPercent);
                
                return `
                    <div class="mover-item">
                        <div class="mover-info">
                            <div class="username" title="${this.escapeHtml(displayName)}">${this.escapeHtml(displayName)}</div>
                            <div class="change-period">Last 24h</div>
                        </div>
                        <div class="mover-change">
                            <div class="change-value negative">-₹${pnl}</div>
                            <div class="change-percentage">${pnlPercent}</div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = losersHTML;
            
        } catch (error) {
            console.error('Error rendering top losers:', error);
            container.innerHTML = '<div class="text-center text-muted py-3">Unable to load losers</div>';
            
            if (this.errorHandler) {
                this.errorHandler.handleComponentError('TopLosers', error);
            }
        }
    }

    updateCompetitionStats() {
        if (this.leaderboardData.length === 0) return;

        // Calculate statistics
        const totalPortfolioValue = this.leaderboardData.reduce((sum, p) => sum + p.portfolioValue, 0);
        const avgPortfolioValue = totalPortfolioValue / this.leaderboardData.length;
        const totalTrades = this.leaderboardData.reduce((sum, p) => sum + p.totalTrades, 0);
        const avgReturn = this.leaderboardData.reduce((sum, p) => sum + p.pnlPercent, 0) / this.leaderboardData.length;

        // Update DOM elements
        const avgPortfolioElement = document.getElementById('avgPortfolioValue');
        const totalTradesElement = document.getElementById('totalTrades');
        const avgReturnElement = document.getElementById('avgReturn');

        if (avgPortfolioElement) {
            avgPortfolioElement.textContent = '₹' + this.formatCurrency(avgPortfolioValue);
        }
        if (totalTradesElement) {
            totalTradesElement.textContent = totalTrades.toLocaleString('en-IN');
        }
        if (avgReturnElement) {
            avgReturnElement.textContent = (avgReturn >= 0 ? '+' : '') + avgReturn.toFixed(2) + '%';
            avgReturnElement.className = `stat-value ${avgReturn >= 0 ? 'text-success' : 'text-danger'}`;
        }
    }
}

// Initialize leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
});