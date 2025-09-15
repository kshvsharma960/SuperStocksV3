/**
 * Error Recovery Integration Example
 * Shows how to integrate error recovery UI components with existing dashboard and leaderboard
 */

class ErrorRecoveryIntegrationExample {
    constructor() {
        this.errorRecoveryUI = window.ErrorRecoveryUI;
        this.dashboardErrorRecovery = window.DashboardErrorRecovery;
        this.leaderboardErrorRecovery = window.LeaderboardErrorRecovery;
    }

    /**
     * Example: Integrate error recovery with dashboard data loading
     */
    integrateWithDashboard() {
        // Example of how to use error recovery in dashboard.js
        const dashboardContainer = document.getElementById('dashboard-content');
        
        if (!dashboardContainer) {
            console.log('Dashboard container not found - this is just an example');
            return;
        }

        // Show loading state
        this.dashboardErrorRecovery.showDashboardLoading(dashboardContainer, 'portfolio data');

        // Simulate data loading with potential errors
        this.simulateDataLoading('portfolio')
            .then(data => {
                // Success - show actual data
                dashboardContainer.innerHTML = `
                    <div class="portfolio-summary">
                        <h3>Portfolio Value: $${data.portfolioValue}</h3>
                        <p>Available Funds: $${data.availableFunds}</p>
                        <p>Current Rank: #${data.rank}</p>
                    </div>
                `;
            })
            .catch(error => {
                // Error - show error recovery UI
                this.dashboardErrorRecovery.handlePortfolioError(
                    dashboardContainer,
                    error,
                    () => this.integrateWithDashboard() // Retry callback
                );
            });
    }

    /**
     * Example: Integrate error recovery with leaderboard loading
     */
    integrateWithLeaderboard() {
        // Example of how to use error recovery in leaderboard.js
        const leaderboardContainer = document.getElementById('leaderboard-content');
        
        if (!leaderboardContainer) {
            console.log('Leaderboard container not found - this is just an example');
            return;
        }

        // Show loading with progress
        const progressLoader = this.leaderboardErrorRecovery.showLeaderboardProgress(leaderboardContainer);

        // Simulate leaderboard loading
        this.simulateLeaderboardLoading()
            .then(data => {
                // Complete progress
                if (progressLoader.complete) {
                    progressLoader.complete();
                }

                // Success - show leaderboard data
                if (data.length === 0) {
                    this.leaderboardErrorRecovery.showEmptyLeaderboard(leaderboardContainer);
                } else {
                    this.renderLeaderboard(leaderboardContainer, data);
                }
            })
            .catch(error => {
                // Complete progress
                if (progressLoader.complete) {
                    progressLoader.complete();
                }

                // Error - show error recovery UI
                this.leaderboardErrorRecovery.handleLeaderboardError(
                    leaderboardContainer,
                    error,
                    () => this.integrateWithLeaderboard() // Retry callback
                );
            });
    }

    /**
     * Example: Handle timeout scenarios
     */
    handleTimeoutScenario(container, operation) {
        // Show initial loading
        this.errorRecoveryUI.replaceWithLoading(container, {
            text: `Loading ${operation}...`,
            size: 'medium'
        });

        // Set up timeout warning after 10 seconds
        const timeoutWarning = setTimeout(() => {
            this.dashboardErrorRecovery.showTimeoutWarning(
                container,
                operation,
                () => {
                    // Retry callback
                    clearTimeout(timeoutWarning);
                    this.handleTimeoutScenario(container, operation);
                },
                () => {
                    // Cancel callback
                    this.errorRecoveryUI.replaceWithFallback(container, {
                        title: 'Operation Cancelled',
                        message: `${operation} was cancelled due to timeout.`,
                        icon: '⏰',
                        actions: [
                            {
                                text: 'Try Again',
                                onClick: () => this.handleTimeoutScenario(container, operation)
                            }
                        ]
                    });
                }
            );
        }, 10000);

        // Simulate operation that might timeout
        this.simulateSlowOperation(operation)
            .then(() => {
                clearTimeout(timeoutWarning);
                container.innerHTML = `<p>✅ ${operation} completed successfully!</p>`;
            })
            .catch(error => {
                clearTimeout(timeoutWarning);
                this.errorRecoveryUI.replaceWithError(container, {
                    title: `${operation} Failed`,
                    message: error.message,
                    onRetry: () => this.handleTimeoutScenario(container, operation)
                });
            });
    }

    /**
     * Example: Progressive loading with multiple steps
     */
    showProgressiveLoadingExample(container) {
        const steps = [
            'Connecting to server...',
            'Authenticating user...',
            'Loading portfolio data...',
            'Calculating rankings...',
            'Preparing display...'
        ];

        const progressComponent = this.errorRecoveryUI.createProgressIndicator({
            progress: 0,
            text: 'Initializing...',
            showPercentage: true
        });

        container.innerHTML = '';
        container.appendChild(progressComponent.element);

        // Simulate progressive loading
        let currentStep = 0;
        const stepInterval = setInterval(() => {
            if (currentStep < steps.length) {
                const progress = ((currentStep + 1) / steps.length) * 100;
                progressComponent.updateProgress(progress, steps[currentStep]);
                currentStep++;
            } else {
                clearInterval(stepInterval);
                setTimeout(() => {
                    container.innerHTML = '<p>✅ All data loaded successfully!</p>';
                }, 500);
            }
        }, 1000);
    }

    /**
     * Simulate data loading that might fail
     */
    simulateDataLoading(dataType) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Randomly succeed or fail for demo purposes
                if (Math.random() > 0.3) {
                    resolve({
                        portfolioValue: 125000,
                        availableFunds: 5000,
                        rank: 42
                    });
                } else {
                    reject(new Error(`Failed to load ${dataType} data - network timeout`));
                }
            }, 2000);
        });
    }

    /**
     * Simulate leaderboard loading
     */
    simulateLeaderboardLoading() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Randomly succeed, fail, or return empty for demo
                const random = Math.random();
                if (random > 0.7) {
                    reject(new Error('Leaderboard server unavailable'));
                } else if (random > 0.5) {
                    resolve([]); // Empty leaderboard
                } else {
                    resolve([
                        { name: 'John Doe', portfolioValue: 150000, rank: 1 },
                        { name: 'Jane Smith', portfolioValue: 125000, rank: 2 },
                        { email: 'user@example.com', portfolioValue: 100000, rank: 3 }
                    ]);
                }
            }, 3000);
        });
    }

    /**
     * Simulate slow operation
     */
    simulateSlowOperation(operation) {
        return new Promise((resolve, reject) => {
            const delay = Math.random() * 15000 + 5000; // 5-20 seconds
            setTimeout(() => {
                if (Math.random() > 0.2) {
                    resolve();
                } else {
                    reject(new Error(`${operation} failed due to server error`));
                }
            }, delay);
        });
    }

    /**
     * Render leaderboard data
     */
    renderLeaderboard(container, data) {
        const leaderboardHTML = `
            <div class="leaderboard-table">
                <h3>Leaderboard</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>User</th>
                            <th>Portfolio Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(user => `
                            <tr>
                                <td>#${user.rank}</td>
                                <td>${user.name || user.email}</td>
                                <td>$${user.portfolioValue.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = leaderboardHTML;
    }

    /**
     * Demo all integration examples
     */
    runAllExamples() {
        console.log('🚀 Running Error Recovery Integration Examples...');
        
        // Create demo containers
        const demoContainer = document.createElement('div');
        demoContainer.innerHTML = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <h2>Error Recovery Integration Examples</h2>
                
                <div style="margin: 20px 0;">
                    <h3>Dashboard Integration</h3>
                    <div id="dashboard-demo" style="border: 1px solid #ccc; padding: 15px; min-height: 100px;"></div>
                    <button onclick="integrationExample.integrateWithDashboard()">Test Dashboard Loading</button>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Leaderboard Integration</h3>
                    <div id="leaderboard-demo" style="border: 1px solid #ccc; padding: 15px; min-height: 100px;"></div>
                    <button onclick="integrationExample.integrateWithLeaderboard()">Test Leaderboard Loading</button>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Timeout Handling</h3>
                    <div id="timeout-demo" style="border: 1px solid #ccc; padding: 15px; min-height: 100px;"></div>
                    <button onclick="integrationExample.handleTimeoutScenario(document.getElementById('timeout-demo'), 'data synchronization')">Test Timeout Scenario</button>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3>Progressive Loading</h3>
                    <div id="progress-demo" style="border: 1px solid #ccc; padding: 15px; min-height: 100px;"></div>
                    <button onclick="integrationExample.showProgressiveLoadingExample(document.getElementById('progress-demo'))">Test Progressive Loading</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(demoContainer);
        
        // Make this instance globally available for button clicks
        window.integrationExample = this;
        
        console.log('✅ Integration examples ready! Check the page for interactive demos.');
    }
}

// Create global instance when page loads
if (typeof window !== 'undefined') {
    window.ErrorRecoveryIntegrationExample = ErrorRecoveryIntegrationExample;
    
    // Auto-initialize when all components are loaded
    document.addEventListener('DOMContentLoaded', () => {
        if (window.ErrorRecoveryUI && window.DashboardErrorRecovery && window.LeaderboardErrorRecovery) {
            const integrationExample = new ErrorRecoveryIntegrationExample();
            window.integrationExample = integrationExample;
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRecoveryIntegrationExample;
}