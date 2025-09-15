/**
 * Micro-Interactions Manager
 * Handles hover effects, button animations, focus indicators, and smooth transitions
 */
class MicroInteractionsManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupButtonInteractions();
        this.setupCardInteractions();
        this.setupFormInteractions();
        this.setupModalInteractions();
        this.setupDropdownInteractions();
        this.setupTableInteractions();
        this.setupNavigationInteractions();
        this.setupKeyboardNavigation();
        this.initializeRippleEffect();
    }

    /**
     * Setup button hover effects and click animations
     */
    setupButtonInteractions() {
        // Add hover and click effects to all buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .btn, .btn-link');
            if (button && !button.disabled) {
                this.addClickFeedback(button);
            }
        });

        // Add hover effects
        document.addEventListener('mouseover', (e) => {
            const button = e.target.closest('button, .btn, .btn-link');
            if (button && !button.disabled) {
                this.addHoverEffect(button);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const button = e.target.closest('button, .btn, .btn-link');
            if (button) {
                this.removeHoverEffect(button);
            }
        });
    }

    /**
     * Add click feedback animation to buttons
     */
    addClickFeedback(element) {
        // Add click animation class
        element.classList.add('btn-clicked');
        
        // Create ripple effect
        this.createRipple(element, event);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('btn-clicked');
        }, 200);
    }

    /**
     * Add hover effect to interactive elements
     */
    addHoverEffect(element) {
        if (!element.classList.contains('no-hover')) {
            element.classList.add('btn-hover');
        }
    }

    /**
     * Remove hover effect
     */
    removeHoverEffect(element) {
        element.classList.remove('btn-hover');
    }

    /**
     * Setup card hover and interaction effects
     */
    setupCardInteractions() {
        // Add hover effects to cards
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.card, .summary-card, .watchlist-item, .table-row');
            if (card && !card.classList.contains('no-hover')) {
                card.classList.add('card-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.card, .summary-card, .watchlist-item, .table-row');
            if (card) {
                card.classList.remove('card-hover');
            }
        });

        // Add click effects to clickable cards
        document.addEventListener('click', (e) => {
            const clickableCard = e.target.closest('.card[data-clickable], .watchlist-item, .table-row[data-clickable]');
            if (clickableCard) {
                this.addCardClickEffect(clickableCard);
            }
        });
    }

    /**
     * Add click effect to cards
     */
    addCardClickEffect(card) {
        card.classList.add('card-clicked');
        setTimeout(() => {
            card.classList.remove('card-clicked');
        }, 150);
    }

    /**
     * Setup form input interactions and focus effects
     */
    setupFormInteractions() {
        // Enhanced focus effects for form inputs
        document.addEventListener('focusin', (e) => {
            const input = e.target.closest('input, select, textarea');
            if (input) {
                this.addInputFocus(input);
            }
        });

        document.addEventListener('focusout', (e) => {
            const input = e.target.closest('input, select, textarea');
            if (input) {
                this.removeInputFocus(input);
            }
        });

        // Add floating label effects
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.matches('input, textarea')) {
                this.updateFloatingLabel(input);
            }
        });

        // Setup form validation visual feedback
        document.addEventListener('invalid', (e) => {
            this.addValidationFeedback(e.target, 'invalid');
        });
    }

    /**
     * Add focus effect to form inputs
     */
    addInputFocus(input) {
        const formGroup = input.closest('.form-group, .input-group, .form-floating');
        if (formGroup) {
            formGroup.classList.add('input-focused');
        }
        input.classList.add('input-focus');
    }

    /**
     * Remove focus effect from form inputs
     */
    removeInputFocus(input) {
        const formGroup = input.closest('.form-group, .input-group, .form-floating');
        if (formGroup) {
            formGroup.classList.remove('input-focused');
        }
        input.classList.remove('input-focus');
    }

    /**
     * Update floating label based on input value
     */
    updateFloatingLabel(input) {
        const formGroup = input.closest('.form-floating, .floating-label');
        if (formGroup) {
            if (input.value.trim() !== '') {
                formGroup.classList.add('has-value');
            } else {
                formGroup.classList.remove('has-value');
            }
        }
    }

    /**
     * Add validation feedback animation
     */
    addValidationFeedback(input, type) {
        input.classList.add(`validation-${type}`);
        
        // Shake animation for invalid inputs
        if (type === 'invalid') {
            input.classList.add('shake-input');
            setTimeout(() => {
                input.classList.remove('shake-input');
            }, 500);
        }
    }

    /**
     * Setup modal interaction effects
     */
    setupModalInteractions() {
        // Enhanced modal show/hide animations
        document.addEventListener('show.bs.modal', (e) => {
            const modal = e.target;
            modal.classList.add('modal-showing');
        });

        document.addEventListener('shown.bs.modal', (e) => {
            const modal = e.target;
            modal.classList.remove('modal-showing');
            modal.classList.add('modal-shown');
        });

        document.addEventListener('hide.bs.modal', (e) => {
            const modal = e.target;
            modal.classList.add('modal-hiding');
        });

        document.addEventListener('hidden.bs.modal', (e) => {
            const modal = e.target;
            modal.classList.remove('modal-shown', 'modal-hiding');
        });
    }

    /**
     * Setup dropdown interaction effects
     */
    setupDropdownInteractions() {
        // Enhanced dropdown animations
        document.addEventListener('show.bs.dropdown', (e) => {
            const dropdown = e.target.querySelector('.dropdown-menu');
            if (dropdown) {
                dropdown.classList.add('dropdown-showing');
            }
        });

        document.addEventListener('shown.bs.dropdown', (e) => {
            const dropdown = e.target.querySelector('.dropdown-menu');
            if (dropdown) {
                dropdown.classList.remove('dropdown-showing');
                dropdown.classList.add('dropdown-shown');
            }
        });

        document.addEventListener('hide.bs.dropdown', (e) => {
            const dropdown = e.target.querySelector('.dropdown-menu');
            if (dropdown) {
                dropdown.classList.add('dropdown-hiding');
            }
        });

        document.addEventListener('hidden.bs.dropdown', (e) => {
            const dropdown = e.target.querySelector('.dropdown-menu');
            if (dropdown) {
                dropdown.classList.remove('dropdown-shown', 'dropdown-hiding');
            }
        });
    }

    /**
     * Setup table row interactions
     */
    setupTableInteractions() {
        // Add hover effects to table rows
        document.addEventListener('mouseover', (e) => {
            const row = e.target.closest('tr, .table-row');
            if (row && !row.classList.contains('no-hover')) {
                row.classList.add('row-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const row = e.target.closest('tr, .table-row');
            if (row) {
                row.classList.remove('row-hover');
            }
        });

        // Add selection effects
        document.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-selectable], .table-row[data-selectable]');
            if (row) {
                this.toggleRowSelection(row);
            }
        });
    }

    /**
     * Toggle table row selection
     */
    toggleRowSelection(row) {
        const isSelected = row.classList.contains('row-selected');
        
        // Remove selection from other rows if single-select
        if (!isSelected && row.dataset.multiSelect !== 'true') {
            document.querySelectorAll('.row-selected').forEach(selectedRow => {
                selectedRow.classList.remove('row-selected');
            });
        }
        
        row.classList.toggle('row-selected', !isSelected);
        
        // Add selection animation
        row.classList.add('row-selecting');
        setTimeout(() => {
            row.classList.remove('row-selecting');
        }, 200);
    }

    /**
     * Setup navigation interactions
     */
    setupNavigationInteractions() {
        // Add active state animations to navigation items
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-link, .sidebar-link');
            if (navItem) {
                this.addNavItemClickEffect(navItem);
            }
        });

        // Sidebar toggle animations
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.animateSidebarToggle();
            });
        }
    }

    /**
     * Add click effect to navigation items
     */
    addNavItemClickEffect(navItem) {
        navItem.classList.add('nav-clicking');
        setTimeout(() => {
            navItem.classList.remove('nav-clicking');
        }, 200);
    }

    /**
     * Animate sidebar toggle
     */
    animateSidebarToggle() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar) {
            sidebar.classList.add('sidebar-transitioning');
            setTimeout(() => {
                sidebar.classList.remove('sidebar-transitioning');
            }, 300);
        }
        
        if (mainContent) {
            mainContent.classList.add('content-transitioning');
            setTimeout(() => {
                mainContent.classList.remove('content-transitioning');
            }, 300);
        }
    }

    /**
     * Setup keyboard navigation enhancements
     */
    setupKeyboardNavigation() {
        // Enhanced focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Arrow key navigation for lists and tables
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.handleArrowKeyNavigation(e);
            }
        });

        // Enter key activation for buttons and links
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const focusedElement = document.activeElement;
                if (focusedElement.matches('button, .btn, [role="button"]') && e.key === ' ') {
                    e.preventDefault();
                    focusedElement.click();
                }
            }
        });
    }

    /**
     * Handle arrow key navigation in lists and tables
     */
    handleArrowKeyNavigation(e) {
        const focusedElement = document.activeElement;
        const container = focusedElement.closest('.table, .list-group, .watchlist-items');
        
        if (!container) return;
        
        const items = container.querySelectorAll('[tabindex], button, a, input, select, textarea');
        const currentIndex = Array.from(items).indexOf(focusedElement);
        
        if (currentIndex === -1) return;
        
        let nextIndex;
        if (e.key === 'ArrowUp') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        
        if (items[nextIndex]) {
            e.preventDefault();
            items[nextIndex].focus();
        }
    }

    /**
     * Initialize ripple effect for material design-like interactions
     */
    initializeRippleEffect() {
        this.rippleElements = document.querySelectorAll('.btn, button, .card[data-ripple]');
        
        this.rippleElements.forEach(element => {
            element.addEventListener('click', (e) => {
                this.createRipple(element, e);
            });
        });
    }

    /**
     * Create ripple effect on click
     */
    createRipple(element, event) {
        // Don't add ripple if disabled or already has one
        if (element.disabled || element.querySelector('.ripple')) return;
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;
        
        // Ensure element has relative positioning
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Add smooth scroll behavior to anchor links
     */
    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }

    /**
     * Add loading state to buttons with async operations
     */
    addButtonLoadingState(button, promise) {
        const originalText = button.textContent;
        const originalDisabled = button.disabled;
        
        button.disabled = true;
        button.classList.add('btn-loading');
        
        // Add loading spinner if not present
        if (!button.querySelector('.spinner-border')) {
            const spinner = document.createElement('span');
            spinner.className = 'spinner-border spinner-border-sm me-2';
            spinner.setAttribute('role', 'status');
            button.insertBefore(spinner, button.firstChild);
        }
        
        return promise.finally(() => {
            button.disabled = originalDisabled;
            button.classList.remove('btn-loading');
            
            // Remove spinner
            const spinner = button.querySelector('.spinner-border');
            if (spinner) {
                spinner.remove();
            }
        });
    }

    /**
     * Add stagger animation to lists
     */
    staggerAnimation(elements, delay = 100) {
        elements.forEach((element, index) => {
            element.style.animationDelay = `${index * delay}ms`;
            element.classList.add('stagger-item');
        });
    }

    /**
     * Add parallax effect to elements
     */
    setupParallaxEffect() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) return;
        
        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.parallax) || 0.5;
                const yPos = -(scrollTop * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        };
        
        // Throttle scroll events
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
}

// Initialize micro-interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.microInteractions = new MicroInteractionsManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroInteractionsManager;
}