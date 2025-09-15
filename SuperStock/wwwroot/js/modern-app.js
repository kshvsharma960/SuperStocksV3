// ==========================================================================
// MODERN APP - Main application JavaScript
// ==========================================================================

class ModernApp {
    constructor() {
        this.init();
    }

    init() {
        this.initializeComponents();
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupTheme();
    }

    initializeComponents() {
        // Initialize AOS (Animate On Scroll)
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-in-out',
                once: true,
                mirror: false
            });
        }

        // Initialize tooltips
        this.initializeTooltips();

        // Initialize modals
        this.initializeModals();

        // Initialize dropdowns
        this.initializeDropdowns();

        // Initialize sidebar
        this.initializeSidebar();

        // Initialize search
        this.initializeSearch();

        // Initialize notifications
        this.initializeNotifications();
    }

    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    initializeModals() {
        // Auto-initialize modals with enhanced features
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('show.bs.modal', (e) => {
                // Add fade-in animation
                modal.classList.add('animate-fade-in');
            });

            modal.addEventListener('hidden.bs.modal', (e) => {
                // Clean up animations
                modal.classList.remove('animate-fade-in');
            });
        });
    }

    initializeDropdowns() {
        // Enhanced dropdown functionality
        document.querySelectorAll('.dropdown-toggle').forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = dropdown.nextElementSibling;
                if (menu && menu.classList.contains('dropdown-menu')) {
                    menu.classList.toggle('show');
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    initializeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Handle responsive sidebar
        this.handleResponsiveSidebar();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebar) {
            sidebar.classList.toggle('show');
            if (overlay) {
                overlay.classList.toggle('show');
            }
        }
    }

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebar) {
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
            }
        }
    }

    handleResponsiveSidebar() {
        const mediaQuery = window.matchMedia('(max-width: 991.98px)');
        
        const handleMediaChange = (e) => {
            if (!e.matches) {
                // Desktop view - close mobile sidebar
                this.closeSidebar();
            }
        };

        mediaQuery.addListener(handleMediaChange);
        handleMediaChange(mediaQuery);
    }

    initializeSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        
        searchInputs.forEach(input => {
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            input.addEventListener('focus', () => {
                const results = input.parentElement.querySelector('.search-results');
                if (results && input.value.length > 0) {
                    results.style.display = 'block';
                }
            });

            input.addEventListener('blur', () => {
                // Delay hiding to allow clicking on results
                setTimeout(() => {
                    const results = input.parentElement.querySelector('.search-results');
                    if (results) {
                        results.style.display = 'none';
                    }
                }, 200);
            });
        });
    }

    performSearch(query) {
        if (query.length < 2) return;

        // Implement search logic here
        console.log('Searching for:', query);
        
        // Example: Show loading state
        this.showSearchLoading();
        
        // Example: Simulate API call
        setTimeout(() => {
            this.showSearchResults([
                { symbol: 'AAPL', name: 'Apple Inc.', price: '$150.25' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$2,750.80' }
            ]);
        }, 500);
    }

    showSearchLoading() {
        const results = document.querySelector('.search-results');
        if (results) {
            results.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><span>Searching...</span></div>';
            results.style.display = 'block';
        }
    }

    showSearchResults(results) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No stocks found</div>';
        } else {
            const html = results.map(result => `
                <div class="search-result-item" data-symbol="${result.symbol}">
                    <span class="result-symbol">${result.symbol}</span>
                    <span class="result-name">${result.name}</span>
                    <span class="result-price">${result.price}</span>
                </div>
            `).join('');
            resultsContainer.innerHTML = html;
        }

        resultsContainer.style.display = 'block';
    }

    initializeNotifications() {
        // Initialize notification system
        window.NotificationManager = new NotificationManager();
    }

    initializeAnimations() {
        // Add stagger animations to lists
        document.querySelectorAll('.stagger-animation').forEach(container => {
            const items = container.children;
            Array.from(items).forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
            });
        });

        // Add intersection observer for animations
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-slide-up');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupTheme() {
        // Theme switching functionality
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Load saved theme
        this.loadTheme();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme toggle icon
        this.updateThemeToggleIcon(newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    }

    updateThemeToggleIcon(theme) {
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.handlePageLoad();
        });

        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('ajax-form')) {
                e.preventDefault();
                this.handleAjaxForm(e.target);
            }
        });

        // Handle button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-loading')) {
                this.handleLoadingButton(e.target);
            }
        });
    }

    handlePageLoad() {
        // Add page loaded class for animations
        document.body.classList.add('page-loaded');
        
        // Initialize page-specific functionality
        this.initializePageSpecific();
    }

    handleResize() {
        // Handle responsive changes
        this.handleResponsiveSidebar();
    }

    handleAjaxForm(form) {
        const formData = new FormData(form);
        const url = form.action || window.location.href;
        const method = form.method || 'POST';

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        fetch(url, {
            method: method,
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                NotificationManager.show(data.message || 'Success!', 'success');
                if (data.redirect) {
                    window.location.href = data.redirect;
                }
            } else {
                NotificationManager.show(data.message || 'An error occurred', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            NotificationManager.show('An error occurred', 'error');
        })
        .finally(() => {
            // Remove loading state
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }

    handleLoadingButton(button) {
        button.classList.add('loading');
        
        // Remove loading state after 2 seconds (or when operation completes)
        setTimeout(() => {
            button.classList.remove('loading');
        }, 2000);
    }

    initializePageSpecific() {
        const page = document.body.getAttribute('data-page');
        
        switch (page) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'leaderboard':
                this.initializeLeaderboard();
                break;
            case 'login':
                this.initializeLogin();
                break;
        }
    }

    initializeDashboard() {
        // Dashboard-specific initialization
        console.log('Initializing dashboard...');
        
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeCharts();
        }
        
        // Initialize real-time updates
        this.initializeRealTimeUpdates();
    }

    initializeLeaderboard() {
        // Leaderboard-specific initialization
        console.log('Initializing leaderboard...');
        
        // Initialize data tables
        this.initializeDataTables();
    }

    initializeLogin() {
        // Login-specific initialization
        console.log('Initializing login...');
        
        // Initialize form validation
        this.initializeFormValidation();
    }

    initializeCharts() {
        // Chart initialization will be handled in separate chart modules
        console.log('Charts available, initializing...');
    }

    initializeRealTimeUpdates() {
        // Real-time update functionality
        console.log('Initializing real-time updates...');
    }

    initializeDataTables() {
        // Data table functionality
        console.log('Initializing data tables...');
    }

    initializeFormValidation() {
        // Form validation functionality
        console.log('Initializing form validation...');
    }
}

// Notification Manager Class
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => this.remove(toast), duration);

        return toast;
    }

    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icons[type] || icons.info} toast-icon"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            <div class="toast-progress"></div>
        `;

        return toast;
    }

    remove(toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ModernApp = new ModernApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModernApp, NotificationManager };
}