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

    async loadLeaderboardData() {
        try {
            this.showLoading(true);
            
            // For now, we'll use the existing rankDict data and enhance it
            // In a real implementation, this would be an API call
            const response = await this.fetchLeaderboardData();
            this.leaderboardData = response;
            this.filteredData = [...this.leaderboardData];
            
            this.renderTopPerformers();
            this.filterAndDisplayData();
            this.renderTopMovers();
            this.updateCompetitionStats();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            this.showError('Failed to load leaderboard data');
            this.showLoading(false);
        }
    }

    async fetchLeaderboardData() {
        // Simulate API call - in real implementation, this would fetch from server
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate mock data based on existing rankDict
                const mockData = this.generateMockLeaderboardData();
                resolve(mockData);
            }, 500);
        });
    }

    generateMockLeaderboardData() {
        // This is temporary mock data - in real implementation, 
        // this would come from the server with actual user data
        const participants = [
            'trader1@example.com', 'trader2@example.com', 'trader3@example.com',
            'trader4@example.com', 'trader5@example.com', 'trader6@example.com',
            'trader7@example.com', 'trader8@example.com', 'trader9@example.com',
            'trader10@example.com'
        ];

        return participants.map((email, index) => {
            const portfolioValue = 1000000 + (Math.random() - 0.5) * 200000;
            const pnl = portfolioValue - 1000000;
            const pnlPercent = (pnl / 1000000) * 100;
            
            return {
                rank: index + 1,
                email: email,
                username: email.split('@')[0],
                portfolioValue: portfolioValue,
                pnl: pnl,
                pnlPercent: pnlPercent,
                totalTrades: Math.floor(Math.random() * 50) + 10,
                performanceHistory: this.generatePerformanceHistory(),
                isCurrentUser: email === this.currentUserEmail
            };
        });
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

        const topThree = this.leaderboardData.slice(0, 3);
        
        // Reorder for podium display (2nd, 1st, 3rd)
        const podiumOrder = [
            topThree[1], // 2nd place
            topThree[0], // 1st place  
            topThree[2]  // 3rd place
        ].filter(Boolean);

        const podiumHTML = podiumOrder.map((participant, index) => {
            const positions = ['second', 'first', 'third'];
            const position = positions[index];
            const actualRank = participant.rank;
            
            return `
                <div class="podium-position ${position}">
                    <div class="podium-card">
                        <div class="user-avatar">
                            ${participant.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="user-name">${participant.username}</div>
                        <div class="portfolio-value">₹${this.formatCurrency(participant.portfolioValue)}</div>
                        <div class="performance ${participant.pnl >= 0 ? 'positive' : 'negative'}">
                            ${participant.pnl >= 0 ? '+' : ''}₹${this.formatCurrency(Math.abs(participant.pnl))}
                            (${participant.pnlPercent >= 0 ? '+' : ''}${participant.pnlPercent.toFixed(2)}%)
                        </div>
                    </div>
                    <div class="podium-base">
                        <div class="position-number">${actualRank}</div>
                    </div>
                </div>
            `;
        }).join('');

        podiumContainer.innerHTML = podiumHTML;
        
        // Add animation
        setTimeout(() => {
            podiumContainer.querySelectorAll('.podium-position').forEach((position, index) => {
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
    }

    filterAndDisplayData() {
        let data = [...this.leaderboardData];

        // Apply search filter
        if (this.searchTerm) {
            data = data.filter(participant => 
                participant.username.toLowerCase().includes(this.searchTerm) ||
                participant.email.toLowerCase().includes(this.searchTerm)
            );
        }

        // Apply category filter
        switch (this.currentFilter) {
            case 'top10':
                data = data.slice(0, 10);
                break;
            case 'top50':
                data = data.slice(0, 50);
                break;
            case 'gainers':
                data = data.filter(p => p.pnl > 0).sort((a, b) => b.pnlPercent - a.pnlPercent);
                break;
            case 'losers':
                data = data.filter(p => p.pnl < 0).sort((a, b) => a.pnlPercent - b.pnlPercent);
                break;
        }

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

        if (this.filteredData.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        const tableHTML = this.filteredData.map((participant, index) => {
            const displayRank = this.currentFilter === 'all' ? participant.rank : index + 1;
            const isCurrentUser = participant.isCurrentUser;
            
            return `
                <tr class="participant-row ${isCurrentUser ? 'current-user' : ''}" data-email="${participant.email}">
                    <td class="rank-cell">
                        <div class="rank-number ${this.getRankClass(displayRank)}">${displayRank}</div>
                        ${this.getRankChangeIndicator(participant)}
                    </td>
                    <td class="user-cell">
                        <div class="user-info">
                            <div class="user-avatar">
                                ${participant.username.charAt(0).toUpperCase()}
                            </div>
                            <div class="user-details">
                                <div class="username">
                                    ${participant.username}
                                    ${isCurrentUser ? '<span class="badge bg-primary ms-2">You</span>' : ''}
                                </div>
                                <div class="join-date">Member since Jan 2024</div>
                            </div>
                        </div>
                    </td>
                    <td class="portfolio-cell">₹${this.formatCurrency(participant.portfolioValue)}</td>
                    <td class="performance-cell">
                        <div class="performance-value ${participant.pnl >= 0 ? 'positive' : 'negative'}">
                            ${participant.pnl >= 0 ? '+' : ''}₹${this.formatCurrency(Math.abs(participant.pnl))}
                        </div>
                    </td>
                    <td class="performance-cell">
                        <div class="performance-value ${participant.pnlPercent >= 0 ? 'positive' : 'negative'}">
                            ${participant.pnlPercent >= 0 ? '+' : ''}${participant.pnlPercent.toFixed(2)}%
                        </div>
                    </td>
                    <td class="trades-cell">${participant.totalTrades}</td>
                    <td class="performance-cell">
                        <canvas class="performance-chart" width="60" height="20" data-history='${JSON.stringify(participant.performanceHistory)}'></canvas>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableHTML;
        
        // Render mini charts
        this.renderPerformanceCharts();
        
        // Add row animations
        this.animateTableRows();
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
            await this.loadLeaderboardData();
            
            // Show success notification
            this.showNotification('Leaderboard updated successfully!', 'success');
            
        } catch (error) {
            this.showNotification('Failed to refresh leaderboard', 'error');
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

        const gainers = this.leaderboardData
            .filter(p => p.pnl > 0)
            .sort((a, b) => b.pnlPercent - a.pnlPercent)
            .slice(0, 5);

        const gainersHTML = gainers.map(participant => `
            <div class="mover-item">
                <div class="mover-info">
                    <div class="username">${participant.username}</div>
                    <div class="change-period">Last 24h</div>
                </div>
                <div class="mover-change">
                    <div class="change-value positive">+₹${this.formatCurrency(Math.abs(participant.pnl))}</div>
                    <div class="change-percentage">+${participant.pnlPercent.toFixed(2)}%</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = gainersHTML || '<div class="text-center text-muted py-3">No gainers today</div>';
    }

    renderTopLosers() {
        const container = document.getElementById('topLosers');
        if (!container) return;

        const losers = this.leaderboardData
            .filter(p => p.pnl < 0)
            .sort((a, b) => a.pnlPercent - b.pnlPercent)
            .slice(0, 5);

        const losersHTML = losers.map(participant => `
            <div class="mover-item">
                <div class="mover-info">
                    <div class="username">${participant.username}</div>
                    <div class="change-period">Last 24h</div>
                </div>
                <div class="mover-change">
                    <div class="change-value negative">-₹${this.formatCurrency(Math.abs(participant.pnl))}</div>
                    <div class="change-percentage">${participant.pnlPercent.toFixed(2)}%</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = losersHTML || '<div class="text-center text-muted py-3">No losers today</div>';
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