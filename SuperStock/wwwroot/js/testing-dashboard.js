// ==========================================================================
// TESTING DASHBOARD - Unified testing interface for cross-browser testing
// ==========================================================================

class TestingDashboard {
    constructor() {
        this.testSuites = {};
        this.testResults = {};
        this.isRunning = false;
        this.currentSuite = null;
        
        this.init();
    }

    init() {
        this.setupTestSuites();
        this.createDashboardUI();
        this.bindKeyboardShortcuts();
        this.startAutoTesting();
    }

    // ==========================================================================
    // TEST SUITE SETUP
    // ==========================================================================

    setupTestSuites() {
        this.testSuites = {
            compatibility: {
                name: 'Browser Compatibility',
                icon: 'fas fa-globe',
                color: '#28a745',
                instance: null,
                tests: [
                    'Browser Detection',
                    'Feature Support',
                    'Polyfill Loading',
                    'API Compatibility'
                ]
            },
            performance: {
                name: 'Performance Audit',
                icon: 'fas fa-tachometer-alt',
                color: '#007bff',
                instance: null,
                tests: [
                    'Core Web Vitals',
                    'Resource Loading',
                    'Memory Usage',
                    'Animation Performance'
                ]
            },
            accessibility: {
                name: 'Accessibility Testing',
                icon: 'fas fa-universal-access',
                color: '#6f42c1',
                instance: null,
                tests: [
                    'Keyboard Navigation',
                    'Screen Reader Support',
                    'Color Contrast',
                    'ARIA Compliance'
                ]
            },
            mobile: {
                name: 'Mobile Experience',
                icon: 'fas fa-mobile-alt',
                color: '#fd7e14',
                instance: null,
                tests: [
                    'Touch Interactions',
                    'Responsive Design',
                    'Orientation Changes',
                    'Performance on Mobile'
                ]
            },
            ui: {
                name: 'UI Refinements',
                icon: 'fas fa-magic',
                color: '#e83e8c',
                instance: null,
                tests: [
                    'Animation Smoothness',
                    'Visual Hierarchy',
                    'Micro-interactions',
                    'Loading States'
                ]
            }
        };
    }

    // ==========================================================================
    // DASHBOARD UI
    // ==========================================================================

    createDashboardUI() {
        const dashboard = document.createElement('div');
        dashboard.id = 'testing-dashboard';
        dashboard.className = 'testing-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <div class="header-left">
                    <h3><i class="fas fa-flask"></i> Testing Dashboard</h3>
                    <div class="browser-info">
                        <span id="current-browser">Detecting browser...</span>
                    </div>
                </div>
                <div class="header-right">
                    <button class="btn-run-all" onclick="window.testingDashboard.runAllTests()">
                        <i class="fas fa-play"></i> Run All Tests
                    </button>
                    <button class="btn-minimize" onclick="window.testingDashboard.minimize()">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn-close" onclick="window.testingDashboard.hide()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="test-suites">
                    ${this.renderTestSuites()}
                </div>
                
                <div class="test-results-panel">
                    <div class="results-header">
                        <h4>Test Results</h4>
                        <div class="overall-score">
                            <span class="score-label">Overall Score</span>
                            <span class="score-value" id="overall-score">-</span>
                        </div>
                    </div>
                    <div class="results-content" id="results-content">
                        <div class="no-results">
                            <i class="fas fa-clipboard-list"></i>
                            <p>Run tests to see results</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-footer">
                <div class="test-progress" style="display: none;">
                    <div class="progress-bar"></div>
                    <div class="progress-text">Running tests...</div>
                </div>
                <div class="quick-actions">
                    <button class="btn-export" onclick="window.testingDashboard.exportResults()">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn-settings" onclick="window.testingDashboard.showSettings()">
                        <i class="fas fa-cog"></i> Settings
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);
        this.dashboardUI = dashboard;

        this.addDashboardStyles();
        this.updateBrowserInfo();
    }

    renderTestSuites() {
        let html = '';
        
        Object.entries(this.testSuites).forEach(([key, suite]) => {
            html += `
                <div class="test-suite" data-suite="${key}">
                    <div class="suite-header" style="border-left-color: ${suite.color}">
                        <div class="suite-info">
                            <i class="${suite.icon}"></i>
                            <h5>${suite.name}</h5>
                        </div>
                        <div class="suite-actions">
                            <button class="btn-run-suite" onclick="window.testingDashboard.runSuite('${key}')">
                                <i class="fas fa-play"></i>
                            </button>
                            <div class="suite-status" id="status-${key}">
                                <span class="status-indicator"></span>
                            </div>
                        </div>
                    </div>
                    <div class="suite-tests">
                        ${suite.tests.map(test => `
                            <div class="test-item">
                                <span class="test-name">${test}</span>
                                <span class="test-status" id="test-${key}-${test.replace(/\s+/g, '-').toLowerCase()}">
                                    <i class="fas fa-clock"></i>
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        return html;
    }

    // ==========================================================================
    // TEST EXECUTION
    // ==========================================================================

    async runAllTests() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.showProgress();
        this.clearResults();

        const allResults = {};
        let totalScore = 0;
        let suiteCount = 0;

        try {
            for (const [suiteKey, suite] of Object.entries(this.testSuites)) {
                this.updateSuiteStatus(suiteKey, 'running');
                
                const suiteResults = await this.runSuite(suiteKey, false);
                allResults[suiteKey] = suiteResults;
                
                if (suiteResults.score !== undefined) {
                    totalScore += suiteResults.score;
                    suiteCount++;
                }
                
                this.updateSuiteStatus(suiteKey, suiteResults.passed ? 'passed' : 'failed');
            }

            const overallScore = suiteCount > 0 ? Math.round(totalScore / suiteCount) : 0;
            this.updateOverallScore(overallScore);
            this.displayAllResults(allResults);

        } catch (error) {
            console.error('Test execution failed:', error);
            this.showError('Test execution failed. Please try again.');
        } finally {
            this.isRunning = false;
            this.hideProgress();
        }
    }

    async runSuite(suiteKey, updateUI = true) {
        if (updateUI) {
            this.updateSuiteStatus(suiteKey, 'running');
        }

        let results = {};

        try {
            switch (suiteKey) {
                case 'compatibility':
                    results = await this.runCompatibilityTests();
                    break;
                case 'performance':
                    results = await this.runPerformanceTests();
                    break;
                case 'accessibility':
                    results = await this.runAccessibilityTests();
                    break;
                case 'mobile':
                    results = await this.runMobileTests();
                    break;
                case 'ui':
                    results = await this.runUITests();
                    break;
                default:
                    throw new Error(`Unknown test suite: ${suiteKey}`);
            }

            if (updateUI) {
                this.updateSuiteStatus(suiteKey, results.passed ? 'passed' : 'failed');
                this.displaySuiteResults(suiteKey, results);
            }

            return results;

        } catch (error) {
            console.error(`Suite ${suiteKey} failed:`, error);
            if (updateUI) {
                this.updateSuiteStatus(suiteKey, 'failed');
            }
            return {
                passed: false,
                score: 0,
                error: error.message,
                tests: []
            };
        }
    }

    // ==========================================================================
    // INDIVIDUAL TEST SUITES
    // ==========================================================================

    async runCompatibilityTests() {
        const compatibility = window.browserCompatibility || window.crossBrowserTesting;
        if (!compatibility) {
            throw new Error('Browser compatibility testing not available');
        }

        // Run compatibility checks
        const browserInfo = compatibility.detectCurrentBrowser ? 
            compatibility.detectCurrentBrowser() : 
            compatibility.getBrowserInfo();
        
        const features = compatibility.testEssentialFeatures ? 
            compatibility.testEssentialFeatures() : 
            compatibility.getFeatures();

        const supportedFeatures = Object.values(features).filter(f => f === true).length;
        const totalFeatures = Object.keys(features).length;
        const score = Math.round((supportedFeatures / totalFeatures) * 100);

        return {
            passed: score >= 80,
            score: score,
            tests: [
                { name: 'Browser Detection', passed: browserInfo.supported, details: `${browserInfo.name} ${browserInfo.version}` },
                { name: 'Feature Support', passed: score >= 80, details: `${supportedFeatures}/${totalFeatures} features supported` },
                { name: 'ES6 Support', passed: features.es6, details: features.es6 ? 'Supported' : 'Not supported' },
                { name: 'CSS Grid', passed: features.cssGrid, details: features.cssGrid ? 'Supported' : 'Not supported' }
            ]
        };
    }

    async runPerformanceTests() {
        const lighthouse = window.lighthouseIntegration;
        if (!lighthouse) {
            throw new Error('Performance testing not available');
        }

        const metrics = lighthouse.getMetrics();
        
        // Calculate performance score based on available metrics
        let score = 0;
        let metricCount = 0;

        if (metrics.lcp) {
            score += metrics.lcp.rating === 'good' ? 100 : metrics.lcp.rating === 'needs-improvement' ? 50 : 0;
            metricCount++;
        }

        if (metrics.fid) {
            score += metrics.fid.rating === 'good' ? 100 : metrics.fid.rating === 'needs-improvement' ? 50 : 0;
            metricCount++;
        }

        if (metrics.cls) {
            score += metrics.cls.rating === 'good' ? 100 : metrics.cls.rating === 'needs-improvement' ? 50 : 0;
            metricCount++;
        }

        const avgScore = metricCount > 0 ? Math.round(score / metricCount) : 50;

        return {
            passed: avgScore >= 70,
            score: avgScore,
            tests: [
                { name: 'LCP', passed: metrics.lcp?.rating === 'good', details: metrics.lcp ? `${Math.round(metrics.lcp.value)}ms` : 'Not measured' },
                { name: 'FID', passed: metrics.fid?.rating === 'good', details: metrics.fid ? `${Math.round(metrics.fid.value)}ms` : 'Not measured' },
                { name: 'CLS', passed: metrics.cls?.rating === 'good', details: metrics.cls ? metrics.cls.value.toFixed(3) : 'Not measured' },
                { name: 'Memory Usage', passed: metrics.memory?.rating === 'good', details: metrics.memory ? `${Math.round(metrics.memory.percentage)}%` : 'Not measured' }
            ]
        };
    }

    async runAccessibilityTests() {
        const accessibility = window.accessibilityManager || window.accessibilityTesting;
        if (!accessibility) {
            // Run basic accessibility tests
            return await this.runBasicAccessibilityTests();
        }

        // Use existing accessibility testing if available
        const results = await accessibility.runFullAccessibilityAudit();
        
        return {
            passed: results.score >= 80,
            score: results.score,
            tests: results.tests || []
        };
    }

    async runBasicAccessibilityTests() {
        const tests = [];
        let score = 0;

        // Test keyboard navigation
        const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
        const keyboardScore = focusableElements.length > 0 ? 100 : 0;
        tests.push({ name: 'Keyboard Navigation', passed: keyboardScore === 100, details: `${focusableElements.length} focusable elements` });
        score += keyboardScore;

        // Test alt text
        const images = document.querySelectorAll('img');
        const imagesWithAlt = Array.from(images).filter(img => img.alt).length;
        const altScore = images.length > 0 ? (imagesWithAlt / images.length) * 100 : 100;
        tests.push({ name: 'Alt Text', passed: altScore >= 80, details: `${imagesWithAlt}/${images.length} images have alt text` });
        score += altScore;

        // Test headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingScore = headings.length > 0 ? 100 : 50;
        tests.push({ name: 'Heading Structure', passed: headingScore === 100, details: `${headings.length} headings found` });
        score += headingScore;

        const avgScore = Math.round(score / tests.length);

        return {
            passed: avgScore >= 80,
            score: avgScore,
            tests: tests
        };
    }

    async runMobileTests() {
        const mobile = window.mobilePerformance || window.crossBrowserTesting;
        const isMobile = 'ontouchstart' in window;
        
        const tests = [];
        let score = 0;

        // Test touch support
        const touchScore = isMobile ? 100 : 50;
        tests.push({ name: 'Touch Support', passed: isMobile, details: isMobile ? 'Touch supported' : 'Desktop browser' });
        score += touchScore;

        // Test responsive design
        const viewport = document.querySelector('meta[name="viewport"]');
        const responsiveScore = viewport ? 100 : 0;
        tests.push({ name: 'Responsive Design', passed: !!viewport, details: viewport ? 'Viewport meta tag present' : 'No viewport meta tag' });
        score += responsiveScore;

        // Test touch targets
        if (isMobile) {
            const touchTargets = document.querySelectorAll('button, a, input, select');
            const smallTargets = Array.from(touchTargets).filter(target => {
                const rect = target.getBoundingClientRect();
                return rect.width < 44 || rect.height < 44;
            });
            const targetScore = touchTargets.length > 0 ? ((touchTargets.length - smallTargets.length) / touchTargets.length) * 100 : 100;
            tests.push({ name: 'Touch Targets', passed: targetScore >= 80, details: `${smallTargets.length} targets too small` });
            score += targetScore;
        } else {
            tests.push({ name: 'Touch Targets', passed: true, details: 'Not applicable on desktop' });
            score += 100;
        }

        const avgScore = Math.round(score / tests.length);

        return {
            passed: avgScore >= 80,
            score: avgScore,
            tests: tests
        };
    }

    async runUITests() {
        const uiRefinements = window.finalUIRefinements;
        if (!uiRefinements) {
            return await this.runBasicUITests();
        }

        const results = await uiRefinements.runAllTests();
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

        return {
            passed: avgScore >= 80,
            score: Math.round(avgScore),
            tests: results.map(r => ({
                name: r.name,
                passed: r.passed,
                details: r.details
            }))
        };
    }

    async runBasicUITests() {
        const tests = [];
        let score = 0;

        // Test animations
        const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        const animationScore = animatedElements.length > 0 ? 100 : 50;
        tests.push({ name: 'Animations', passed: animationScore === 100, details: `${animatedElements.length} animated elements` });
        score += animationScore;

        // Test loading states
        const loadingElements = document.querySelectorAll('.spinner, .skeleton, [data-loading]');
        const loadingScore = loadingElements.length > 0 ? 100 : 50;
        tests.push({ name: 'Loading States', passed: loadingScore === 100, details: `${loadingElements.length} loading indicators` });
        score += loadingScore;

        const avgScore = Math.round(score / tests.length);

        return {
            passed: avgScore >= 80,
            score: avgScore,
            tests: tests
        };
    }

    // ==========================================================================
    // UI UPDATES
    // ==========================================================================

    updateBrowserInfo() {
        const browserInfo = document.getElementById('current-browser');
        if (browserInfo) {
            const userAgent = navigator.userAgent;
            let browser = 'Unknown';
            
            if (userAgent.includes('Chrome')) browser = 'Chrome';
            else if (userAgent.includes('Firefox')) browser = 'Firefox';
            else if (userAgent.includes('Safari')) browser = 'Safari';
            else if (userAgent.includes('Edge')) browser = 'Edge';
            
            browserInfo.textContent = browser;
        }
    }

    updateSuiteStatus(suiteKey, status) {
        const statusElement = document.getElementById(`status-${suiteKey}`);
        if (!statusElement) return;

        const indicator = statusElement.querySelector('.status-indicator');
        indicator.className = `status-indicator ${status}`;

        switch (status) {
            case 'running':
                indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                break;
            case 'passed':
                indicator.innerHTML = '<i class="fas fa-check"></i>';
                break;
            case 'failed':
                indicator.innerHTML = '<i class="fas fa-times"></i>';
                break;
            default:
                indicator.innerHTML = '<i class="fas fa-clock"></i>';
        }
    }

    updateOverallScore(score) {
        const scoreElement = document.getElementById('overall-score');
        if (scoreElement) {
            scoreElement.textContent = `${score}%`;
            scoreElement.className = `score-value ${this.getScoreClass(score)}`;
        }
    }

    getScoreClass(score) {
        if (score >= 80) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
    }

    displayAllResults(results) {
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent) return;

        let html = '<div class="results-summary">';
        
        Object.entries(results).forEach(([suiteKey, result]) => {
            const suite = this.testSuites[suiteKey];
            const scoreClass = this.getScoreClass(result.score || 0);
            
            html += `
                <div class="suite-result ${scoreClass}">
                    <div class="suite-result-header">
                        <i class="${suite.icon}"></i>
                        <span class="suite-name">${suite.name}</span>
                        <span class="suite-score">${result.score || 0}%</span>
                    </div>
                    <div class="suite-result-tests">
                        ${result.tests.map(test => `
                            <div class="test-result ${test.passed ? 'passed' : 'failed'}">
                                <span class="test-name">${test.name}</span>
                                <span class="test-details">${test.details}</span>
                                <i class="fas fa-${test.passed ? 'check' : 'times'}"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        resultsContent.innerHTML = html;
    }

    clearResults() {
        const resultsContent = document.getElementById('results-content');
        if (resultsContent) {
            resultsContent.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Running tests...</p>
                </div>
            `;
        }
    }

    showProgress() {
        const progress = this.dashboardUI.querySelector('.test-progress');
        if (progress) {
            progress.style.display = 'block';
            
            const progressBar = progress.querySelector('.progress-bar');
            let width = 0;
            
            const interval = setInterval(() => {
                width += 2;
                progressBar.style.width = `${width}%`;
                
                if (width >= 100 || !this.isRunning) {
                    clearInterval(interval);
                }
            }, 100);
        }
    }

    hideProgress() {
        const progress = this.dashboardUI.querySelector('.test-progress');
        if (progress) {
            progress.style.display = 'none';
        }
    }

    showError(message) {
        const resultsContent = document.getElementById('results-content');
        if (resultsContent) {
            resultsContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // ==========================================================================
    // DASHBOARD ACTIONS
    // ==========================================================================

    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            results: this.testResults
        };

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    showSettings() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h4>Testing Settings</h4>
                    <button class="btn-close" onclick="this.closest('.settings-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="auto-testing" ${this.autoTesting ? 'checked' : ''}>
                            Enable automatic testing
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            Test interval (minutes):
                            <input type="number" id="test-interval" value="${this.testInterval / 60000}" min="1" max="60">
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-save" onclick="window.testingDashboard.saveSettings()">Save</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    saveSettings() {
        const autoTesting = document.getElementById('auto-testing').checked;
        const testInterval = parseInt(document.getElementById('test-interval').value) * 60000;
        
        this.autoTesting = autoTesting;
        this.testInterval = testInterval;
        
        if (autoTesting) {
            this.startAutoTesting();
        } else {
            this.stopAutoTesting();
        }
        
        document.querySelector('.settings-modal').remove();
    }

    minimize() {
        this.dashboardUI.classList.toggle('minimized');
    }

    show() {
        this.dashboardUI.classList.add('show');
    }

    hide() {
        this.dashboardUI.classList.remove('show');
    }

    // ==========================================================================
    // AUTO TESTING
    // ==========================================================================

    startAutoTesting() {
        if (this.autoTestingInterval) {
            clearInterval(this.autoTestingInterval);
        }
        
        this.autoTestingInterval = setInterval(() => {
            if (!this.isRunning) {
                this.runAllTests();
            }
        }, this.testInterval || 300000); // Default 5 minutes
    }

    stopAutoTesting() {
        if (this.autoTestingInterval) {
            clearInterval(this.autoTestingInterval);
            this.autoTestingInterval = null;
        }
    }

    // ==========================================================================
    // KEYBOARD SHORTCUTS
    // ==========================================================================

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key) {
                    case 'D':
                        e.preventDefault();
                        this.show();
                        break;
                    case 'T':
                        e.preventDefault();
                        if (this.dashboardUI.classList.contains('show')) {
                            this.runAllTests();
                        }
                        break;
                }
            }
        });
    }

    // ==========================================================================
    // STYLES
    // ==========================================================================

    addDashboardStyles() {
        const styles = `
            .testing-dashboard {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90vw;
                max-width: 1200px;
                height: 80vh;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                z-index: 10003;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            
            .testing-dashboard.show {
                display: flex;
            }
            
            .testing-dashboard.minimized {
                height: 60px;
                width: 300px;
                top: 20px;
                left: 20px;
                transform: none;
            }
            
            .testing-dashboard.minimized .dashboard-content,
            .testing-dashboard.minimized .dashboard-footer {
                display: none;
            }
            
            .dashboard-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .header-left h3 {
                margin: 0 0 5px 0;
                font-size: 20px;
            }
            
            .browser-info {
                font-size: 14px;
                opacity: 0.9;
            }
            
            .header-right {
                display: flex;
                gap: 10px;
            }
            
            .header-right button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .header-right button:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .dashboard-content {
                flex: 1;
                display: flex;
                overflow: hidden;
            }
            
            .test-suites {
                width: 40%;
                padding: 20px;
                border-right: 1px solid #e0e0e0;
                overflow-y: auto;
            }
            
            .test-suite {
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 15px;
                overflow: hidden;
            }
            
            .suite-header {
                padding: 15px;
                background: white;
                border-left: 4px solid #007bff;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .suite-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .suite-info h5 {
                margin: 0;
                font-size: 16px;
            }
            
            .suite-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .btn-run-suite {
                background: #007bff;
                border: none;
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .status-indicator {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }
            
            .status-indicator.running {
                background: #ffc107;
                color: white;
            }
            
            .status-indicator.passed {
                background: #28a745;
                color: white;
            }
            
            .status-indicator.failed {
                background: #dc3545;
                color: white;
            }
            
            .suite-tests {
                padding: 10px 15px;
            }
            
            .test-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .test-item:last-child {
                border-bottom: none;
            }
            
            .test-name {
                font-size: 14px;
                color: #666;
            }
            
            .test-status {
                font-size: 12px;
                color: #999;
            }
            
            .test-results-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .results-header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .results-header h4 {
                margin: 0;
            }
            
            .overall-score {
                text-align: center;
            }
            
            .score-label {
                display: block;
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
            }
            
            .score-value {
                font-size: 24px;
                font-weight: bold;
                padding: 8px 16px;
                border-radius: 6px;
            }
            
            .score-value.good {
                background: #d4edda;
                color: #155724;
            }
            
            .score-value.fair {
                background: #fff3cd;
                color: #856404;
            }
            
            .score-value.poor {
                background: #f8d7da;
                color: #721c24;
            }
            
            .results-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .no-results, .error-message {
                text-align: center;
                color: #666;
                padding: 40px;
            }
            
            .no-results i, .error-message i {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .suite-result {
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 15px;
                overflow: hidden;
            }
            
            .suite-result-header {
                padding: 15px;
                background: white;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .suite-name {
                flex: 1;
                font-weight: 500;
            }
            
            .suite-score {
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .suite-result.good .suite-score {
                background: #28a745;
                color: white;
            }
            
            .suite-result.fair .suite-score {
                background: #ffc107;
                color: white;
            }
            
            .suite-result.poor .suite-score {
                background: #dc3545;
                color: white;
            }
            
            .suite-result-tests {
                padding: 10px 15px;
            }
            
            .test-result {
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .test-result:last-child {
                border-bottom: none;
            }
            
            .test-result .test-name {
                font-weight: 500;
                margin-right: 10px;
            }
            
            .test-result .test-details {
                flex: 1;
                font-size: 12px;
                color: #666;
            }
            
            .test-result i {
                margin-left: 10px;
            }
            
            .test-result.passed i {
                color: #28a745;
            }
            
            .test-result.failed i {
                color: #dc3545;
            }
            
            .dashboard-footer {
                padding: 15px 20px;
                border-top: 1px solid #e0e0e0;
                background: #f8f9fa;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .test-progress {
                flex: 1;
                margin-right: 20px;
            }
            
            .progress-bar {
                height: 4px;
                background: #007bff;
                border-radius: 2px;
                transition: width 0.3s ease;
                margin-bottom: 5px;
            }
            
            .progress-text {
                font-size: 12px;
                color: #666;
            }
            
            .quick-actions {
                display: flex;
                gap: 10px;
            }
            
            .quick-actions button {
                background: #6c757d;
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .settings-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10004;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .settings-modal .modal-content {
                background: white;
                border-radius: 8px;
                width: 400px;
                max-width: 90vw;
            }
            
            .settings-modal .modal-header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .settings-modal .modal-body {
                padding: 20px;
            }
            
            .setting-group {
                margin-bottom: 15px;
            }
            
            .setting-group label {
                display: block;
                margin-bottom: 5px;
            }
            
            .setting-group input {
                margin-right: 8px;
            }
            
            .settings-modal .modal-footer {
                padding: 15px 20px;
                border-top: 1px solid #e0e0e0;
                text-align: right;
            }
            
            .btn-save {
                background: #007bff;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize testing dashboard
    window.testingDashboard = new TestingDashboard();
    
    console.log('Testing dashboard initialized');
    console.log('Press Ctrl+Shift+D to open the testing dashboard');
});

// Export for use in other modules
window.TestingDashboard = TestingDashboard;