/**
 * Accessibility Manager - Comprehensive accessibility support for SuperStock
 * Handles ARIA labels, keyboard navigation, focus management, and screen reader support
 */

class AccessibilityManager {
    constructor() {
        this.focusableElements = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]:not([disabled])'
        ].join(', ');
        
        this.init();
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupAriaLiveRegions();
        this.setupSkipLinks();
        this.enhanceFormAccessibility();
        this.setupModalAccessibility();
        this.setupTableAccessibility();
        this.setupNotificationAccessibility();
        this.setupChartAccessibility();
    }

    /**
     * Setup keyboard navigation for the entire application
     */
    setupKeyboardNavigation() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + M: Main navigation
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                this.focusMainNavigation();
                this.announceToScreenReader('Main navigation focused');
            }
            
            // Alt + C: Main content
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                this.focusMainContent();
                this.announceToScreenReader('Main content focused');
            }
            
            // Alt + S: Search
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                this.focusSearch();
                this.announceToScreenReader('Search focused');
            }
            
            // Escape: Close modals/dropdowns
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Enhanced tab navigation
        this.setupTabNavigation();
        
        // Arrow key navigation for menus and tables
        this.setupArrowKeyNavigation();
    }

    /**
     * Setup tab navigation with proper focus indicators
     */
    setupTabNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
                
                // Remove mouse navigation class after a delay
                setTimeout(() => {
                    document.body.classList.remove('mouse-navigation');
                }, 100);
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.add('mouse-navigation');
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * Setup arrow key navigation for menus and data tables
     */
    setupArrowKeyNavigation() {
        // Navigation menu arrow keys
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.addEventListener('keydown', (e) => {
                const items = navMenu.querySelectorAll('.nav-link');
                const currentIndex = Array.from(items).indexOf(document.activeElement);
                
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                    items[prevIndex].focus();
                }
            });
        }

        // Table navigation
        this.setupTableNavigation();
    }

    /**
     * Setup table keyboard navigation
     */
    setupTableNavigation() {
        const tables = document.querySelectorAll('table, .table-container');
        
        tables.forEach(table => {
            table.addEventListener('keydown', (e) => {
                if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                    return;
                }
                
                e.preventDefault();
                this.navigateTable(e, table);
            });
        });
    }

    /**
     * Navigate within tables using arrow keys
     */
    navigateTable(event, table) {
        const cells = table.querySelectorAll('td, th, [role="gridcell"], [role="columnheader"]');
        const currentCell = document.activeElement.closest('td, th, [role="gridcell"], [role="columnheader"]');
        
        if (!currentCell) return;
        
        const currentIndex = Array.from(cells).indexOf(currentCell);
        const rows = table.querySelectorAll('tr, [role="row"]');
        const currentRow = currentCell.closest('tr, [role="row"]');
        const currentRowIndex = Array.from(rows).indexOf(currentRow);
        const cellsInRow = currentRow.querySelectorAll('td, th, [role="gridcell"], [role="columnheader"]');
        const cellInRowIndex = Array.from(cellsInRow).indexOf(currentCell);
        
        let targetCell = null;
        
        switch (event.key) {
            case 'ArrowRight':
                targetCell = cells[currentIndex + 1];
                break;
            case 'ArrowLeft':
                targetCell = cells[currentIndex - 1];
                break;
            case 'ArrowDown':
                if (currentRowIndex < rows.length - 1) {
                    const nextRow = rows[currentRowIndex + 1];
                    const nextRowCells = nextRow.querySelectorAll('td, th, [role="gridcell"], [role="columnheader"]');
                    targetCell = nextRowCells[Math.min(cellInRowIndex, nextRowCells.length - 1)];
                }
                break;
            case 'ArrowUp':
                if (currentRowIndex > 0) {
                    const prevRow = rows[currentRowIndex - 1];
                    const prevRowCells = prevRow.querySelectorAll('td, th, [role="gridcell"], [role="columnheader"]');
                    targetCell = prevRowCells[Math.min(cellInRowIndex, prevRowCells.length - 1)];
                }
                break;
            case 'Home':
                targetCell = cellsInRow[0];
                break;
            case 'End':
                targetCell = cellsInRow[cellsInRow.length - 1];
                break;
        }
        
        if (targetCell) {
            const focusableElement = targetCell.querySelector(this.focusableElements) || targetCell;
            if (focusableElement.tabIndex === undefined || focusableElement.tabIndex < 0) {
                focusableElement.tabIndex = 0;
            }
            focusableElement.focus();
        }
    }

    /**
     * Setup focus management for modals and dynamic content
     */
    setupFocusManagement() {
        // Store focus before modal opens
        document.addEventListener('show.bs.modal', (e) => {
            this.previousFocus = document.activeElement;
            
            // Set up focus trap for modal
            setTimeout(() => {
                this.setupFocusTrap(e.target);
                this.focusFirstElement(e.target);
            }, 100);
        });

        // Restore focus when modal closes
        document.addEventListener('hidden.bs.modal', () => {
            if (this.previousFocus) {
                this.previousFocus.focus();
                this.previousFocus = null;
            }
        });
    }

    /**
     * Setup focus trap for modals
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(this.focusableElements);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    /**
     * Focus the first focusable element in a container
     */
    focusFirstElement(container) {
        const firstFocusable = container.querySelector(this.focusableElements);
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    /**
     * Setup ARIA live regions for dynamic content updates
     */
    setupAriaLiveRegions() {
        // Create live regions if they don't exist
        if (!document.getElementById('aria-live-polite')) {
            const politeRegion = document.createElement('div');
            politeRegion.id = 'aria-live-polite';
            politeRegion.setAttribute('aria-live', 'polite');
            politeRegion.setAttribute('aria-atomic', 'true');
            politeRegion.className = 'sr-only';
            document.body.appendChild(politeRegion);
        }

        if (!document.getElementById('aria-live-assertive')) {
            const assertiveRegion = document.createElement('div');
            assertiveRegion.id = 'aria-live-assertive';
            assertiveRegion.setAttribute('aria-live', 'assertive');
            assertiveRegion.setAttribute('aria-atomic', 'true');
            assertiveRegion.className = 'sr-only';
            document.body.appendChild(assertiveRegion);
        }
    }

    /**
     * Announce messages to screen readers
     */
    announceToScreenReader(message, priority = 'polite') {
        const liveRegion = document.getElementById(`aria-live-${priority}`);
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    /**
     * Setup skip links for keyboard navigation
     */
    setupSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#main-navigation" class="skip-link">Skip to navigation</a>
            <a href="#search" class="skip-link">Skip to search</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    /**
     * Enhance form accessibility
     */
    enhanceFormAccessibility() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Associate labels with inputs
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    if (label) {
                        input.setAttribute('aria-labelledby', label.id || this.generateId('label'));
                        if (!label.id) {
                            label.id = input.getAttribute('aria-labelledby');
                        }
                    }
                }
                
                // Add required indicators
                if (input.required) {
                    input.setAttribute('aria-required', 'true');
                }
                
                // Add invalid state handling
                input.addEventListener('invalid', () => {
                    input.setAttribute('aria-invalid', 'true');
                });
                
                input.addEventListener('input', () => {
                    if (input.checkValidity()) {
                        input.removeAttribute('aria-invalid');
                    }
                });
            });
        });
    }

    /**
     * Setup modal accessibility
     */
    setupModalAccessibility() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            // Ensure proper ARIA attributes
            if (!modal.getAttribute('role')) {
                modal.setAttribute('role', 'dialog');
            }
            
            if (!modal.getAttribute('aria-modal')) {
                modal.setAttribute('aria-modal', 'true');
            }
            
            // Add aria-labelledby if modal has a title
            const title = modal.querySelector('.modal-title, h1, h2, h3, h4, h5, h6');
            if (title && !modal.getAttribute('aria-labelledby')) {
                if (!title.id) {
                    title.id = this.generateId('modal-title');
                }
                modal.setAttribute('aria-labelledby', title.id);
            }
        });
    }

    /**
     * Setup table accessibility
     */
    setupTableAccessibility() {
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            // Add table role if not present
            if (!table.getAttribute('role')) {
                table.setAttribute('role', 'table');
            }
            
            // Add caption if not present
            if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
                const sectionTitle = table.closest('.dashboard-section')?.querySelector('.section-title');
                if (sectionTitle) {
                    table.setAttribute('aria-label', sectionTitle.textContent.trim());
                }
            }
            
            // Enhance headers
            const headers = table.querySelectorAll('th');
            headers.forEach(header => {
                if (!header.getAttribute('scope')) {
                    header.setAttribute('scope', 'col');
                }
            });
            
            // Make table focusable for keyboard navigation
            if (table.tabIndex === undefined || table.tabIndex < 0) {
                table.tabIndex = 0;
            }
        });
    }

    /**
     * Setup notification accessibility
     */
    setupNotificationAccessibility() {
        // Observe for new notifications
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('toast') || node.classList?.contains('notification')) {
                            this.enhanceNotification(node);
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Enhance notification accessibility
     */
    enhanceNotification(notification) {
        // Add ARIA attributes
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        // Make focusable
        notification.tabIndex = 0;
        
        // Auto-focus for important notifications
        if (notification.classList.contains('error') || notification.classList.contains('warning')) {
            notification.focus();
        }
        
        // Announce to screen reader
        const message = notification.textContent || notification.innerText;
        this.announceToScreenReader(message, 'assertive');
    }

    /**
     * Setup chart accessibility
     */
    setupChartAccessibility() {
        const charts = document.querySelectorAll('canvas[id*="chart"], .chart-container');
        
        charts.forEach(chart => {
            // Add ARIA label
            if (!chart.getAttribute('aria-label')) {
                chart.setAttribute('aria-label', 'Stock price chart');
            }
            
            // Add role
            chart.setAttribute('role', 'img');
            
            // Make focusable
            if (chart.tabIndex === undefined || chart.tabIndex < 0) {
                chart.tabIndex = 0;
            }
            
            // Add keyboard interaction for charts
            chart.addEventListener('keydown', (e) => {
                this.handleChartKeyboard(e, chart);
            });
        });
    }

    /**
     * Handle keyboard interaction for charts
     */
    handleChartKeyboard(event, chart) {
        const chartInstance = Chart.getChart(chart);
        if (!chartInstance) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.announceToScreenReader('Moving to previous data point');
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.announceToScreenReader('Moving to next data point');
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.announceChartData(chartInstance);
                break;
        }
    }

    /**
     * Announce chart data to screen reader
     */
    announceChartData(chartInstance) {
        const data = chartInstance.data;
        if (data && data.datasets && data.datasets.length > 0) {
            const dataset = data.datasets[0];
            const latestValue = dataset.data[dataset.data.length - 1];
            const message = `Current stock price: ${latestValue}`;
            this.announceToScreenReader(message, 'assertive');
        }
    }

    /**
     * Focus main navigation
     */
    focusMainNavigation() {
        const nav = document.querySelector('#main-navigation, .nav-menu, .sidebar');
        if (nav) {
            const firstLink = nav.querySelector('a, button');
            if (firstLink) {
                firstLink.focus();
            }
        }
    }

    /**
     * Focus main content
     */
    focusMainContent() {
        const main = document.querySelector('#main-content, main, .main-content');
        if (main) {
            if (main.tabIndex === undefined || main.tabIndex < 0) {
                main.tabIndex = -1;
            }
            main.focus();
        }
    }

    /**
     * Focus search input
     */
    focusSearch() {
        const search = document.querySelector('#search, .search-input, input[type="search"]');
        if (search) {
            search.focus();
        }
    }

    /**
     * Handle escape key press
     */
    handleEscapeKey() {
        // Close open modals
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const modal = bootstrap.Modal.getInstance(openModal);
            if (modal) {
                modal.hide();
            }
            return;
        }
        
        // Close open dropdowns
        const openDropdown = document.querySelector('.dropdown-menu.show');
        if (openDropdown) {
            const dropdown = bootstrap.Dropdown.getInstance(openDropdown.previousElementSibling);
            if (dropdown) {
                dropdown.hide();
            }
            return;
        }
        
        // Close mobile navigation
        const sidebar = document.querySelector('.sidebar.show');
        if (sidebar) {
            sidebar.classList.remove('show');
            document.body.classList.remove('sidebar-open');
        }
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = 'element') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check color contrast ratio
     */
    checkColorContrast(foreground, background) {
        // Convert colors to RGB
        const fgRgb = this.hexToRgb(foreground);
        const bgRgb = this.hexToRgb(background);
        
        if (!fgRgb || !bgRgb) return false;
        
        // Calculate relative luminance
        const fgLuminance = this.getRelativeLuminance(fgRgb);
        const bgLuminance = this.getRelativeLuminance(bgRgb);
        
        // Calculate contrast ratio
        const lighter = Math.max(fgLuminance, bgLuminance);
        const darker = Math.min(fgLuminance, bgLuminance);
        const contrast = (lighter + 0.05) / (darker + 0.05);
        
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        return contrast >= 4.5;
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Calculate relative luminance
     */
    getRelativeLuminance(rgb) {
        const { r, g, b } = rgb;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Validate accessibility compliance
     */
    validateAccessibility() {
        const issues = [];
        
        // Check for missing alt text on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.alt && !img.getAttribute('aria-label')) {
                issues.push(`Image ${index + 1} missing alt text`);
            }
        });
        
        // Check for missing form labels
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach((input, index) => {
            if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby') && !document.querySelector(`label[for="${input.id}"]`)) {
                issues.push(`Form input ${index + 1} missing label`);
            }
        });
        
        // Check for missing headings structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level > previousLevel + 1) {
                issues.push(`Heading level skipped at heading ${index + 1}`);
            }
            previousLevel = level;
        });
        
        return issues;
    }
}

// Initialize accessibility manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}