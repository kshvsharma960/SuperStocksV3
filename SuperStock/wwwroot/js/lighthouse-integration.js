// ==========================================================================
// LIGHTHOUSE INTEGRATION - Performance auditing and optimization
// ==========================================================================

class LighthouseIntegration {
    constructor() {
        this.metrics = {};
        this.recommendations = [];
        this.isRunning = false;
        this.auditResults = {};
        
        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.createAuditUI();
        this.startContinuousMonitoring();
    }

    // ==========================================================================
    // PERFORMANCE MONITORING
    // ==========================================================================

    setupPerformanceMonitoring() {
        // Core Web Vitals monitoring
        this.monitorLCP();
        this.monitorFID();
        this.monitorCLS();
        this.monitorFCP();
        this.monitorTTFB();
        
        // Additional metrics
        this.monitorResourceLoading();
        this.monitorMemoryUsage();
        this.monitorNetworkConditions();
    }

    monitorLCP() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    
                    this.metrics.lcp = {
                        value: lastEntry.startTime,
                        rating: this.rateLCP(lastEntry.startTime),
                        element: lastEntry.element?.tagName || 'unknown',
                        timestamp: Date.now()
                    };
                    
                    this.updateMetricDisplay('lcp', this.metrics.lcp);
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP monitoring not supported:', e);
            }
        }
    }

    monitorFID() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.fid = {
                            value: entry.processingStart - entry.startTime,
                            rating: this.rateFID(entry.processingStart - entry.startTime),
                            timestamp: Date.now()
                        };
                        
                        this.updateMetricDisplay('fid', this.metrics.fid);
                    });
                });
                
                observer.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID monitoring not supported:', e);
            }
        }
    }

    monitorCLS() {
        if ('PerformanceObserver' in window) {
            try {
                let clsValue = 0;
                let clsEntries = [];
                
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            clsEntries.push(entry);
                        }
                    });
                    
                    this.metrics.cls = {
                        value: clsValue,
                        rating: this.rateCLS(clsValue),
                        entries: clsEntries.length,
                        timestamp: Date.now()
                    };
                    
                    this.updateMetricDisplay('cls', this.metrics.cls);
                });
                
                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS monitoring not supported:', e);
            }
        }
    }

    monitorFCP() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.fcp = {
                                value: entry.startTime,
                                rating: this.rateFCP(entry.startTime),
                                timestamp: Date.now()
                            };
                            
                            this.updateMetricDisplay('fcp', this.metrics.fcp);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['paint'] });
            } catch (e) {
                console.warn('FCP monitoring not supported:', e);
            }
        }
    }

    monitorTTFB() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const ttfb = navigation.responseStart - navigation.requestStart;
            
            this.metrics.ttfb = {
                value: ttfb,
                rating: this.rateTTFB(ttfb),
                timestamp: Date.now()
            };
            
            this.updateMetricDisplay('ttfb', this.metrics.ttfb);
        }
    }

    monitorResourceLoading() {
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(r => r.duration > 1000);
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        
        this.metrics.resources = {
            total: resources.length,
            slow: slowResources.length,
            totalSize: totalSize,
            rating: slowResources.length > 5 ? 'poor' : slowResources.length > 2 ? 'needs-improvement' : 'good',
            timestamp: Date.now()
        };
        
        this.updateMetricDisplay('resources', this.metrics.resources);
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
            
            this.metrics.memory = {
                used: memory.usedJSHeapSize,
                total: memory.jsHeapSizeLimit,
                percentage: usagePercent,
                rating: usagePercent > 80 ? 'poor' : usagePercent > 60 ? 'needs-improvement' : 'good',
                timestamp: Date.now()
            };
            
            this.updateMetricDisplay('memory', this.metrics.memory);
        }
    }

    monitorNetworkConditions() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.metrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                rating: connection.effectiveType === '4g' ? 'good' : 
                       connection.effectiveType === '3g' ? 'needs-improvement' : 'poor',
                timestamp: Date.now()
            };
            
            this.updateMetricDisplay('network', this.metrics.network);
        }
    }

    // ==========================================================================
    // RATING FUNCTIONS
    // ==========================================================================

    rateLCP(value) {
        if (value <= 2500) return 'good';
        if (value <= 4000) return 'needs-improvement';
        return 'poor';
    }

    rateFID(value) {
        if (value <= 100) return 'good';
        if (value <= 300) return 'needs-improvement';
        return 'poor';
    }

    rateCLS(value) {
        if (value <= 0.1) return 'good';
        if (value <= 0.25) return 'needs-improvement';
        return 'poor';
    }

    rateFCP(value) {
        if (value <= 1800) return 'good';
        if (value <= 3000) return 'needs-improvement';
        return 'poor';
    }

    rateTTFB(value) {
        if (value <= 800) return 'good';
        if (value <= 1800) return 'needs-improvement';
        return 'poor';
    }

    // ==========================================================================
    // AUDIT FUNCTIONS
    // ==========================================================================

    async runFullAudit() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.showAuditProgress();
        
        try {
            // Performance audit
            await this.auditPerformance();
            
            // Accessibility audit
            await this.auditAccessibility();
            
            // Best practices audit
            await this.auditBestPractices();
            
            // SEO audit
            await this.auditSEO();
            
            // PWA audit
            await this.auditPWA();
            
            // Generate recommendations
            this.generateRecommendations();
            
            // Display results
            this.displayAuditResults();
            
        } catch (error) {
            console.error('Audit failed:', error);
        } finally {
            this.isRunning = false;
            this.hideAuditProgress();
        }
    }

    async auditPerformance() {
        const audit = {
            category: 'Performance',
            score: 0,
            audits: {}
        };

        // First Contentful Paint
        if (this.metrics.fcp) {
            audit.audits.fcp = {
                score: this.getScoreFromRating(this.metrics.fcp.rating),
                value: this.metrics.fcp.value,
                displayValue: `${Math.round(this.metrics.fcp.value)}ms`
            };
        }

        // Largest Contentful Paint
        if (this.metrics.lcp) {
            audit.audits.lcp = {
                score: this.getScoreFromRating(this.metrics.lcp.rating),
                value: this.metrics.lcp.value,
                displayValue: `${Math.round(this.metrics.lcp.value)}ms`
            };
        }

        // First Input Delay
        if (this.metrics.fid) {
            audit.audits.fid = {
                score: this.getScoreFromRating(this.metrics.fid.rating),
                value: this.metrics.fid.value,
                displayValue: `${Math.round(this.metrics.fid.value)}ms`
            };
        }

        // Cumulative Layout Shift
        if (this.metrics.cls) {
            audit.audits.cls = {
                score: this.getScoreFromRating(this.metrics.cls.rating),
                value: this.metrics.cls.value,
                displayValue: this.metrics.cls.value.toFixed(3)
            };
        }

        // Resource optimization
        const resources = performance.getEntriesByType('resource');
        const unoptimizedImages = resources.filter(r => 
            r.name.includes('.jpg') || r.name.includes('.png')
        ).length;
        
        audit.audits.imageOptimization = {
            score: unoptimizedImages > 10 ? 0 : unoptimizedImages > 5 ? 0.5 : 1,
            value: unoptimizedImages,
            displayValue: `${unoptimizedImages} unoptimized images`
        };

        // Calculate overall score
        const scores = Object.values(audit.audits).map(a => a.score);
        audit.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        this.auditResults.performance = audit;
    }

    async auditAccessibility() {
        const audit = {
            category: 'Accessibility',
            score: 0,
            audits: {}
        };

        // Color contrast
        const contrastIssues = await this.checkColorContrast();
        audit.audits.colorContrast = {
            score: contrastIssues.length === 0 ? 1 : contrastIssues.length < 5 ? 0.5 : 0,
            value: contrastIssues.length,
            displayValue: `${contrastIssues.length} contrast issues`
        };

        // Alt text
        const images = document.querySelectorAll('img');
        const missingAlt = Array.from(images).filter(img => !img.alt).length;
        audit.audits.altText = {
            score: missingAlt === 0 ? 1 : missingAlt < 3 ? 0.5 : 0,
            value: missingAlt,
            displayValue: `${missingAlt} images missing alt text`
        };

        // Heading structure
        const headingIssues = this.checkHeadingStructure();
        audit.audits.headings = {
            score: headingIssues.length === 0 ? 1 : headingIssues.length < 3 ? 0.5 : 0,
            value: headingIssues.length,
            displayValue: `${headingIssues.length} heading issues`
        };

        // Focus indicators
        const focusIssues = await this.checkFocusIndicators();
        audit.audits.focus = {
            score: focusIssues.length === 0 ? 1 : focusIssues.length < 5 ? 0.5 : 0,
            value: focusIssues.length,
            displayValue: `${focusIssues.length} focus issues`
        };

        // Calculate overall score
        const scores = Object.values(audit.audits).map(a => a.score);
        audit.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        this.auditResults.accessibility = audit;
    }

    async auditBestPractices() {
        const audit = {
            category: 'Best Practices',
            score: 0,
            audits: {}
        };

        // HTTPS usage
        audit.audits.https = {
            score: location.protocol === 'https:' ? 1 : 0,
            value: location.protocol === 'https:',
            displayValue: location.protocol === 'https:' ? 'Uses HTTPS' : 'Not using HTTPS'
        };

        // Console errors
        const consoleErrors = this.getConsoleErrors();
        audit.audits.consoleErrors = {
            score: consoleErrors.length === 0 ? 1 : consoleErrors.length < 3 ? 0.5 : 0,
            value: consoleErrors.length,
            displayValue: `${consoleErrors.length} console errors`
        };

        // Deprecated APIs
        const deprecatedAPIs = this.checkDeprecatedAPIs();
        audit.audits.deprecatedAPIs = {
            score: deprecatedAPIs.length === 0 ? 1 : deprecatedAPIs.length < 3 ? 0.5 : 0,
            value: deprecatedAPIs.length,
            displayValue: `${deprecatedAPIs.length} deprecated APIs`
        };

        // Calculate overall score
        const scores = Object.values(audit.audits).map(a => a.score);
        audit.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        this.auditResults.bestPractices = audit;
    }

    async auditSEO() {
        const audit = {
            category: 'SEO',
            score: 0,
            audits: {}
        };

        // Meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        audit.audits.metaDescription = {
            score: metaDescription && metaDescription.content.length > 120 ? 1 : 0,
            value: metaDescription?.content.length || 0,
            displayValue: metaDescription ? `${metaDescription.content.length} characters` : 'Missing'
        };

        // Title tag
        const title = document.title;
        audit.audits.title = {
            score: title && title.length > 30 && title.length < 60 ? 1 : 0.5,
            value: title.length,
            displayValue: `${title.length} characters`
        };

        // Viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]');
        audit.audits.viewport = {
            score: viewport ? 1 : 0,
            value: !!viewport,
            displayValue: viewport ? 'Has viewport meta tag' : 'Missing viewport meta tag'
        };

        // Calculate overall score
        const scores = Object.values(audit.audits).map(a => a.score);
        audit.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        this.auditResults.seo = audit;
    }

    async auditPWA() {
        const audit = {
            category: 'PWA',
            score: 0,
            audits: {}
        };

        // Service worker
        audit.audits.serviceWorker = {
            score: 'serviceWorker' in navigator ? 1 : 0,
            value: 'serviceWorker' in navigator,
            displayValue: 'serviceWorker' in navigator ? 'Has service worker' : 'No service worker'
        };

        // Web app manifest
        const manifest = document.querySelector('link[rel="manifest"]');
        audit.audits.manifest = {
            score: manifest ? 1 : 0,
            value: !!manifest,
            displayValue: manifest ? 'Has web app manifest' : 'No web app manifest'
        };

        // Offline functionality
        audit.audits.offline = {
            score: navigator.onLine !== undefined ? 0.5 : 0,
            value: navigator.onLine !== undefined,
            displayValue: 'Partial offline support'
        };

        // Calculate overall score
        const scores = Object.values(audit.audits).map(a => a.score);
        audit.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

        this.auditResults.pwa = audit;
    }

    // ==========================================================================
    // HELPER FUNCTIONS
    // ==========================================================================

    getScoreFromRating(rating) {
        switch (rating) {
            case 'good': return 1;
            case 'needs-improvement': return 0.5;
            case 'poor': return 0;
            default: return 0;
        }
    }

    async checkColorContrast() {
        const issues = [];
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
        
        for (const element of Array.from(textElements).slice(0, 50)) {
            const style = window.getComputedStyle(element);
            const textColor = this.parseColor(style.color);
            const bgColor = this.parseColor(style.backgroundColor);
            
            if (textColor && bgColor) {
                const contrast = this.calculateContrastRatio(textColor, bgColor);
                if (contrast < 4.5) {
                    issues.push({ element, contrast });
                }
            }
        }
        
        return issues;
    }

    checkHeadingStructure() {
        const issues = [];
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        
        for (const heading of headings) {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > lastLevel + 1) {
                issues.push({ heading, issue: 'Heading level skip' });
            }
            lastLevel = level;
        }
        
        return issues;
    }

    async checkFocusIndicators() {
        const issues = [];
        const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
        
        for (const element of Array.from(focusableElements).slice(0, 20)) {
            element.focus();
            const style = window.getComputedStyle(element, ':focus');
            
            if (style.outline === 'none' && !style.boxShadow.includes('0 0')) {
                issues.push(element);
            }
        }
        
        return issues;
    }

    getConsoleErrors() {
        // This would need to be implemented with console override
        return [];
    }

    checkDeprecatedAPIs() {
        const deprecated = [];
        
        // Check for deprecated APIs
        if (window.webkitRequestAnimationFrame) {
            deprecated.push('webkitRequestAnimationFrame');
        }
        
        if (document.webkitHidden !== undefined) {
            deprecated.push('webkitHidden');
        }
        
        return deprecated;
    }

    parseColor(colorStr) {
        if (!colorStr || colorStr === 'transparent') return null;
        
        const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3]),
                a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
            };
        }
        
        return null;
    }

    calculateContrastRatio(color1, color2) {
        const l1 = this.getLuminance(color1);
        const l2 = this.getLuminance(color2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    getLuminance(color) {
        const { r, g, b } = color;
        
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // ==========================================================================
    // UI FUNCTIONS
    // ==========================================================================

    createAuditUI() {
        const auditUI = document.createElement('div');
        auditUI.id = 'lighthouse-audit';
        auditUI.className = 'lighthouse-audit';
        auditUI.innerHTML = `
            <div class="audit-header">
                <h4><i class="fas fa-lighthouse"></i> Performance Audit</h4>
                <div class="audit-controls">
                    <button class="btn-audit" onclick="window.lighthouseIntegration.runFullAudit()">
                        <i class="fas fa-play"></i> Run Audit
                    </button>
                    <button class="btn-close" onclick="window.lighthouseIntegration.hide()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="audit-content">
                <div class="metrics-dashboard">
                    <div class="metric-card" data-metric="lcp">
                        <div class="metric-label">LCP</div>
                        <div class="metric-value">-</div>
                        <div class="metric-rating"></div>
                    </div>
                    <div class="metric-card" data-metric="fid">
                        <div class="metric-label">FID</div>
                        <div class="metric-value">-</div>
                        <div class="metric-rating"></div>
                    </div>
                    <div class="metric-card" data-metric="cls">
                        <div class="metric-label">CLS</div>
                        <div class="metric-value">-</div>
                        <div class="metric-rating"></div>
                    </div>
                    <div class="metric-card" data-metric="fcp">
                        <div class="metric-label">FCP</div>
                        <div class="metric-value">-</div>
                        <div class="metric-rating"></div>
                    </div>
                </div>
                <div class="audit-results"></div>
                <div class="recommendations"></div>
            </div>
            <div class="audit-progress" style="display: none;">
                <div class="progress-bar"></div>
                <div class="progress-text">Running audit...</div>
            </div>
        `;
        
        document.body.appendChild(auditUI);
        this.auditUI = auditUI;
        
        this.addAuditStyles();
    }

    updateMetricDisplay(metric, data) {
        const metricCard = this.auditUI?.querySelector(`[data-metric="${metric}"]`);
        if (!metricCard) return;
        
        const valueEl = metricCard.querySelector('.metric-value');
        const ratingEl = metricCard.querySelector('.metric-rating');
        
        if (metric === 'cls') {
            valueEl.textContent = data.value.toFixed(3);
        } else if (metric === 'memory') {
            valueEl.textContent = `${Math.round(data.percentage)}%`;
        } else if (metric === 'resources') {
            valueEl.textContent = data.slow;
        } else {
            valueEl.textContent = `${Math.round(data.value)}ms`;
        }
        
        ratingEl.className = `metric-rating ${data.rating}`;
        ratingEl.textContent = data.rating.replace('-', ' ');
    }

    displayAuditResults() {
        const resultsContainer = this.auditUI.querySelector('.audit-results');
        
        let html = '<div class="audit-categories">';
        
        Object.entries(this.auditResults).forEach(([category, audit]) => {
            const scorePercent = Math.round(audit.score * 100);
            const scoreClass = audit.score >= 0.9 ? 'good' : audit.score >= 0.5 ? 'needs-improvement' : 'poor';
            
            html += `
                <div class="audit-category">
                    <div class="category-header">
                        <h5>${audit.category}</h5>
                        <div class="category-score ${scoreClass}">${scorePercent}</div>
                    </div>
                    <div class="category-audits">
            `;
            
            Object.entries(audit.audits).forEach(([auditName, auditData]) => {
                const auditScore = Math.round(auditData.score * 100);
                const auditClass = auditData.score >= 0.9 ? 'good' : auditData.score >= 0.5 ? 'needs-improvement' : 'poor';
                
                html += `
                    <div class="audit-item ${auditClass}">
                        <div class="audit-name">${auditName}</div>
                        <div class="audit-value">${auditData.displayValue}</div>
                        <div class="audit-score">${auditScore}</div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        resultsContainer.innerHTML = html;
    }

    generateRecommendations() {
        this.recommendations = [];
        
        // Performance recommendations
        if (this.metrics.lcp && this.metrics.lcp.rating !== 'good') {
            this.recommendations.push({
                category: 'Performance',
                priority: 'high',
                title: 'Improve Largest Contentful Paint',
                description: 'Optimize images, reduce server response times, and eliminate render-blocking resources.',
                impact: 'High'
            });
        }
        
        if (this.metrics.cls && this.metrics.cls.rating !== 'good') {
            this.recommendations.push({
                category: 'Performance',
                priority: 'high',
                title: 'Reduce Cumulative Layout Shift',
                description: 'Add size attributes to images and videos, avoid inserting content above existing content.',
                impact: 'High'
            });
        }
        
        // Accessibility recommendations
        if (this.auditResults.accessibility && this.auditResults.accessibility.score < 0.9) {
            this.recommendations.push({
                category: 'Accessibility',
                priority: 'high',
                title: 'Improve Accessibility',
                description: 'Add alt text to images, improve color contrast, and ensure proper heading structure.',
                impact: 'High'
            });
        }
        
        // Display recommendations
        this.displayRecommendations();
    }

    displayRecommendations() {
        const recommendationsContainer = this.auditUI.querySelector('.recommendations');
        
        if (this.recommendations.length === 0) {
            recommendationsContainer.innerHTML = '<div class="no-recommendations">No recommendations at this time.</div>';
            return;
        }
        
        let html = '<h5>Recommendations</h5><div class="recommendations-list">';
        
        this.recommendations.forEach(rec => {
            html += `
                <div class="recommendation ${rec.priority}">
                    <div class="rec-header">
                        <h6>${rec.title}</h6>
                        <span class="rec-impact">${rec.impact} Impact</span>
                    </div>
                    <p>${rec.description}</p>
                </div>
            `;
        });
        
        html += '</div>';
        recommendationsContainer.innerHTML = html;
    }

    showAuditProgress() {
        const progress = this.auditUI.querySelector('.audit-progress');
        progress.style.display = 'block';
        
        let width = 0;
        const progressBar = progress.querySelector('.progress-bar');
        
        const interval = setInterval(() => {
            width += 2;
            progressBar.style.width = `${width}%`;
            
            if (width >= 100) {
                clearInterval(interval);
            }
        }, 100);
    }

    hideAuditProgress() {
        const progress = this.auditUI.querySelector('.audit-progress');
        progress.style.display = 'none';
    }

    startContinuousMonitoring() {
        // Update metrics every 5 seconds
        setInterval(() => {
            this.monitorResourceLoading();
            this.monitorMemoryUsage();
            this.monitorNetworkConditions();
        }, 5000);
    }

    addAuditStyles() {
        const styles = `
            .lighthouse-audit {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
                display: none;
            }
            
            .lighthouse-audit.show {
                display: block;
            }
            
            .audit-header {
                background: #0c5aa6;
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .audit-header h4 {
                margin: 0;
                font-size: 16px;
            }
            
            .audit-controls button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                margin-left: 5px;
                cursor: pointer;
            }
            
            .audit-content {
                padding: 15px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .metrics-dashboard {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .metric-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
            
            .metric-label {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
            }
            
            .metric-value {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .metric-rating {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 3px;
                text-transform: uppercase;
            }
            
            .metric-rating.good {
                background: #0cce6b;
                color: white;
            }
            
            .metric-rating.needs-improvement {
                background: #ffa400;
                color: white;
            }
            
            .metric-rating.poor {
                background: #ff4e42;
                color: white;
            }
            
            .audit-category {
                margin-bottom: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
            }
            
            .category-header {
                background: #f5f5f5;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .category-score {
                font-weight: bold;
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .category-score.good {
                background: #0cce6b;
                color: white;
            }
            
            .category-score.needs-improvement {
                background: #ffa400;
                color: white;
            }
            
            .category-score.poor {
                background: #ff4e42;
                color: white;
            }
            
            .audit-item {
                padding: 10px 15px;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .audit-item:last-child {
                border-bottom: none;
            }
            
            .audit-name {
                font-weight: 500;
            }
            
            .audit-value {
                font-size: 12px;
                color: #666;
            }
            
            .audit-score {
                font-weight: bold;
                min-width: 30px;
                text-align: right;
            }
            
            .recommendation {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 10px;
                border-left: 4px solid #007bff;
            }
            
            .recommendation.high {
                border-left-color: #dc3545;
            }
            
            .rec-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .rec-impact {
                font-size: 12px;
                background: #007bff;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
            }
            
            .audit-progress {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
            }
            
            .progress-bar {
                height: 4px;
                background: #007bff;
                border-radius: 2px;
                transition: width 0.3s ease;
                margin-bottom: 10px;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    show() {
        if (this.auditUI) {
            this.auditUI.classList.add('show');
        }
    }

    hide() {
        if (this.auditUI) {
            this.auditUI.classList.remove('show');
        }
    }

    // ==========================================================================
    // PUBLIC API
    // ==========================================================================

    getMetrics() {
        return this.metrics;
    }

    getAuditResults() {
        return this.auditResults;
    }

    getRecommendations() {
        return this.recommendations;
    }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lighthouse integration
    window.lighthouseIntegration = new LighthouseIntegration();
    
    // Add keyboard shortcut to show audit UI
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            window.lighthouseIntegration.show();
        }
    });
    
    console.log('Lighthouse integration initialized');
});

// Export for use in other modules
window.LighthouseIntegration = LighthouseIntegration;