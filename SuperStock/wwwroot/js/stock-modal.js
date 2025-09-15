/**
 * Modern Stock Details Modal
 * Handles stock information display, chart rendering, and order placement
 */

class StockModal {
    constructor() {
        this.modal = null;
        this.confirmationModal = null;
        this.currentStock = null;
        this.chart = null;
        this.currentTimeframe = '1W';
        this.orderType = 'buy';
        this.isMarketOrder = true;
        
        this.init();
    }

    init() {
        this.modal = document.getElementById('stockModal');
        this.confirmationModal = document.getElementById('orderConfirmationModal');
        
        if (!this.modal) return;
        
        this.bindEvents();
        this.initChart();
    }

    bindEvents() {
        // Order type tabs
        const buyTab = document.getElementById('buyTab');
        const sellTab = document.getElementById('sellTab');
        
        buyTab?.addEventListener('click', () => this.setOrderType('buy'));
        sellTab?.addEventListener('click', () => this.setOrderType('sell'));

        // Order type switch (Market/Limit)
        const orderTypeSwitch = document.getElementById('orderTypeSwitch');
        orderTypeSwitch?.addEventListener('change', (e) => {
            this.isMarketOrder = !e.target.checked;
            this.togglePriceInput();
            this.updateOrderSummary();
        });

        // Quantity input
        const quantityInput = document.getElementById('modalQuantity');
        quantityInput?.addEventListener('input', () => {
            this.validateQuantity();
            this.updateOrderSummary();
        });

        // Price input
        const priceInput = document.getElementById('modalOrderPrice');
        priceInput?.addEventListener('input', () => {
            this.validatePrice();
            this.updateOrderSummary();
        });

        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        placeOrderBtn?.addEventListener('click', () => this.showOrderConfirmation());

        // Confirm order button
        const confirmOrderBtn = document.getElementById('confirmOrderBtn');
        confirmOrderBtn?.addEventListener('click', () => this.placeOrder());

        // Timeframe buttons
        const timeframeButtons = document.querySelectorAll('.timeframe-buttons .btn');
        timeframeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = e.target.dataset.timeframe;
                this.setTimeframe(timeframe);
            });
        });

        // Chart type buttons
        const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
        chartTypeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('.chart-type-btn').dataset.type;
                this.setChartType(type);
            });
        });

        // Technical indicator buttons
        const indicatorButtons = document.querySelectorAll('.indicator-btn');
        indicatorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const indicator = e.target.dataset.indicator;
                this.toggleIndicator(indicator);
            });
        });

        // Reset zoom button
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        resetZoomBtn?.addEventListener('click', () => {
            this.resetChartZoom();
        });

        // Real-time updates toggle
        const realTimeToggle = document.getElementById('realTimeUpdates');
        realTimeToggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.enableRealTimeUpdates();
            } else {
                this.disableRealTimeUpdates();
            }
        });

        // Zoom controls
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn2 = document.getElementById('resetZoomBtn2');

        zoomInBtn?.addEventListener('click', () => {
            if (this.chart && this.chart.chart && this.chart.chart.zoom) {
                this.chart.chart.zoom(1.1);
            }
        });

        zoomOutBtn?.addEventListener('click', () => {
            if (this.chart && this.chart.chart && this.chart.chart.zoom) {
                this.chart.chart.zoom(0.9);
            }
        });

        resetZoomBtn2?.addEventListener('click', () => {
            this.resetChartZoom();
        });

        // Modal events
        this.modal.addEventListener('shown.bs.modal', () => {
            this.onModalShown();
        });

        this.modal.addEventListener('hidden.bs.modal', () => {
            this.onModalHidden();
        });
    }

    /**
     * Show stock modal with stock data
     */
    show(stockData) {
        if (!this.modal) return;

        this.currentStock = stockData;
        this.populateStockData(stockData);
        this.resetForm();
        
        // Show modal using Bootstrap 5
        const bsModal = new bootstrap.Modal(this.modal);
        bsModal.show();
    }

    /**
     * Populate modal with stock data
     */
    populateStockData(stock) {
        // Header information
        document.getElementById('modalStockSymbol').textContent = stock.symbol || 'N/A';
        document.getElementById('modalStockName').textContent = stock.name || stock.symbol || 'N/A';

        // Price information
        const currentPrice = parseFloat(stock.currentPrice || stock.price || 0);
        const change = parseFloat(stock.change || 0);
        const changePercent = parseFloat(stock.changePercent || 0);

        document.getElementById('modalCurrentPrice').textContent = `₹${currentPrice.toFixed(2)}`;
        
        const changeElement = document.getElementById('modalPriceChange');
        const changeClass = change >= 0 ? 'positive' : 'negative';
        changeElement.className = `change ${changeClass}`;
        changeElement.innerHTML = `
            <span class="change-value">${change >= 0 ? '+' : ''}₹${change.toFixed(2)}</span>
            <span class="change-percent">(${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)</span>
        `;

        // Market data
        document.getElementById('modalOpenPrice').textContent = `₹${(stock.open || currentPrice).toFixed(2)}`;
        document.getElementById('modalHighPrice').textContent = `₹${(stock.high || currentPrice).toFixed(2)}`;
        document.getElementById('modalLowPrice').textContent = `₹${(stock.low || currentPrice).toFixed(2)}`;
        document.getElementById('modalPrevClose').textContent = `₹${(stock.prevClose || currentPrice).toFixed(2)}`;
        document.getElementById('modalVolume').textContent = this.formatVolume(stock.volume || 0);

        // Update order price placeholder
        const priceInput = document.getElementById('modalOrderPrice');
        if (priceInput) {
            priceInput.placeholder = `₹${currentPrice.toFixed(2)}`;
        }
    }

    /**
     * Format volume for display
     */
    formatVolume(volume) {
        if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(1)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}K`;
        }
        return volume.toString();
    }

    /**
     * Initialize chart
     */
    initChart() {
        // Initialize enhanced stock chart with candlestick support
        this.chart = new StockChart('stockChart', {
            responsive: true,
            maintainAspectRatio: false,
            showVolume: true,
            showIndicators: true,
            enableZoom: true,
            enablePan: true
        });
        
        // Override chart event handlers
        this.chart.onDataPointClick = (data, index) => {
            this.onChartDataPointClick(data, index);
        };
        
        this.chart.onChartUpdated = (chartData) => {
            this.onChartUpdated(chartData);
        };
    }

    /**
     * Load chart data for current stock and timeframe
     */
    async loadChartData() {
        if (!this.currentStock || !this.chart) return;

        // Use the enhanced chart's loadData method
        await this.chart.loadData(this.currentStock.symbol, this.currentTimeframe);
    }

    /**
     * Handle chart data point click
     */
    onChartDataPointClick(data, index) {
        // Show detailed information about the selected data point
        console.log('Chart data point clicked:', data, index);
        
        // You can implement additional functionality here like:
        // - Show detailed OHLC info in a tooltip
        // - Update order price to the clicked price
        // - Highlight the selected time period
    }

    /**
     * Handle chart update completion
     */
    onChartUpdated(chartData) {
        // Update any UI elements that depend on chart data
        console.log('Chart updated with data:', chartData);
        
        // Update chart type buttons if needed
        this.updateChartTypeButtons();
        
        // Enable real-time updates if checkbox is checked
        const realTimeToggle = document.getElementById('realTimeUpdates');
        if (realTimeToggle && realTimeToggle.checked) {
            this.enableRealTimeUpdates();
        }
    }

    /**
     * Enable real-time updates
     */
    enableRealTimeUpdates() {
        if (this.chart && this.chart.enableRealTimeUpdates) {
            this.chart.enableRealTimeUpdates(30000); // Update every 30 seconds
            
            // Override the real-time update handler
            this.chart.onRealTimeUpdate = (realtimeData) => {
                this.onRealTimeUpdate(realtimeData);
            };
        }
    }

    /**
     * Disable real-time updates
     */
    disableRealTimeUpdates() {
        if (this.chart && this.chart.disableRealTimeUpdates) {
            this.chart.disableRealTimeUpdates();
        }
    }

    /**
     * Handle real-time price updates
     */
    onRealTimeUpdate(realtimeData) {
        // Update the current price display
        if (realtimeData.price) {
            const currentPriceEl = document.getElementById('modalCurrentPrice');
            if (currentPriceEl) {
                currentPriceEl.textContent = `₹${realtimeData.price.toFixed(2)}`;
                
                // Add flash animation for price changes
                currentPriceEl.classList.add('price-flash');
                setTimeout(() => {
                    currentPriceEl.classList.remove('price-flash');
                }, 500);
            }
            
            // Update change indicator
            if (realtimeData.change) {
                const changeEl = document.getElementById('modalPriceChange');
                if (changeEl) {
                    const changePercent = (realtimeData.change / (realtimeData.price - realtimeData.change)) * 100;
                    const changeClass = realtimeData.change >= 0 ? 'positive' : 'negative';
                    
                    changeEl.className = `change ${changeClass}`;
                    changeEl.innerHTML = `
                        <span class="change-value">${realtimeData.change >= 0 ? '+' : ''}₹${realtimeData.change.toFixed(2)}</span>
                        <span class="change-percent">(${realtimeData.change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)</span>
                    `;
                }
            }
        }
        
        // Update order price placeholder if in market order mode
        if (this.isMarketOrder) {
            const priceInput = document.getElementById('modalOrderPrice');
            if (priceInput && realtimeData.price) {
                priceInput.placeholder = `₹${realtimeData.price.toFixed(2)}`;
            }
        }
        
        // Update order summary
        this.updateOrderSummary();
    }

    /**
     * Update chart type button states
     */
    updateChartTypeButtons() {
        const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
        chartTypeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === this.chart.chartType) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Set chart timeframe
     */
    setTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        
        // Update active button
        document.querySelectorAll('.timeframe-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-timeframe="${timeframe}"]`)?.classList.add('active');
        
        this.loadChartData();
    }

    /**
     * Set chart type (candlestick, line, area)
     */
    setChartType(type) {
        if (this.chart && this.chart.setChartType) {
            this.chart.setChartType(type);
            this.updateChartTypeButtons();
        }
    }

    /**
     * Toggle technical indicator
     */
    toggleIndicator(indicator) {
        if (!this.chart) return;
        
        if (this.chart.indicators.has(indicator)) {
            this.chart.removeIndicator(indicator);
        } else {
            this.chart.addIndicator(indicator);
        }
        
        // Update indicator button state
        const btn = document.querySelector(`[data-indicator="${indicator}"]`);
        if (btn) {
            btn.classList.toggle('active');
        }
    }

    /**
     * Reset chart zoom
     */
    resetChartZoom() {
        if (this.chart && this.chart.resetZoom) {
            this.chart.resetZoom();
        }
    }

    /**
     * Set order type (buy/sell)
     */
    setOrderType(type) {
        this.orderType = type;
        
        // Update tab appearance
        document.querySelectorAll('.order-type-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(type === 'buy' ? 'buyTab' : 'sellTab')?.classList.add('active');
        
        // Update button text
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            const btnText = placeOrderBtn.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = type === 'buy' ? 'Place Buy Order' : 'Place Sell Order';
            }
        }
        
        this.updateOrderSummary();
    }

    /**
     * Toggle price input visibility based on order type
     */
    togglePriceInput() {
        const priceGroup = document.getElementById('priceGroup');
        if (priceGroup) {
            priceGroup.style.display = this.isMarketOrder ? 'none' : 'block';
        }
        
        // Clear price if switching to market order
        if (this.isMarketOrder) {
            const priceInput = document.getElementById('modalOrderPrice');
            if (priceInput) {
                priceInput.value = '';
            }
        }
    }

    /**
     * Validate quantity input
     */
    validateQuantity() {
        const quantityInput = document.getElementById('modalQuantity');
        const feedback = document.getElementById('quantityFeedback');
        
        if (!quantityInput || !feedback) return true;

        const quantity = parseInt(quantityInput.value);
        
        if (!quantity || quantity < 1) {
            quantityInput.classList.add('is-invalid');
            quantityInput.classList.remove('is-valid');
            feedback.textContent = 'Please enter a valid quantity';
            feedback.className = 'input-feedback invalid';
            return false;
        }
        
        quantityInput.classList.remove('is-invalid');
        quantityInput.classList.add('is-valid');
        feedback.textContent = '';
        feedback.className = 'input-feedback';
        return true;
    }

    /**
     * Validate price input for limit orders
     */
    validatePrice() {
        if (this.isMarketOrder) return true;

        const priceInput = document.getElementById('modalOrderPrice');
        const feedback = document.getElementById('priceFeedback');
        
        if (!priceInput || !feedback) return true;

        const price = parseFloat(priceInput.value);
        
        if (!price || price <= 0) {
            priceInput.classList.add('is-invalid');
            priceInput.classList.remove('is-valid');
            feedback.textContent = 'Please enter a valid price';
            feedback.className = 'input-feedback invalid';
            return false;
        }
        
        priceInput.classList.remove('is-invalid');
        priceInput.classList.add('is-valid');
        feedback.textContent = '';
        feedback.className = 'input-feedback';
        return true;
    }

    /**
     * Update order summary with real-time calculations
     */
    updateOrderSummary() {
        const quantityInput = document.getElementById('modalQuantity');
        const priceInput = document.getElementById('modalOrderPrice');
        const estimatedValue = document.getElementById('estimatedValue');
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        
        if (!quantityInput || !estimatedValue || !placeOrderBtn) return;

        const quantity = parseInt(quantityInput.value) || 0;
        let price = 0;
        
        if (this.isMarketOrder) {
            price = parseFloat(this.currentStock?.currentPrice || this.currentStock?.price || 0);
        } else {
            price = parseFloat(priceInput?.value || 0);
        }
        
        const totalValue = quantity * price;
        
        // Update estimated value with animation
        this.animateValueChange(estimatedValue, totalValue);
        
        // Update order summary with additional details
        this.updateOrderSummaryDetails(quantity, price, totalValue);
        
        // Enable/disable place order button with visual feedback
        const isValid = this.validateQuantity() && this.validatePrice() && quantity > 0 && price > 0;
        this.updateOrderButton(isValid, quantity, price);
    }

    /**
     * Animate value changes in the order summary
     */
    animateValueChange(element, newValue) {
        const currentValue = parseFloat(element.textContent.replace(/[₹,]/g, '')) || 0;
        
        if (Math.abs(newValue - currentValue) > 0.01) {
            element.classList.add('value-updating');
            
            setTimeout(() => {
                element.textContent = `₹${newValue.toFixed(2)}`;
                element.classList.remove('value-updating');
            }, 150);
        } else {
            element.textContent = `₹${newValue.toFixed(2)}`;
        }
    }

    /**
     * Update order summary with additional details
     */
    updateOrderSummaryDetails(quantity, price, totalValue) {
        const orderSummary = document.getElementById('orderSummary');
        if (!orderSummary) return;

        // Calculate additional fees (mock calculation)
        const brokerage = totalValue * 0.0005; // 0.05% brokerage
        const taxes = totalValue * 0.001; // 0.1% taxes
        const totalCost = totalValue + brokerage + taxes;

        const summaryHTML = `
            <div class="summary-row">
                <span class="label">Quantity:</span>
                <span class="value">${quantity} shares</span>
            </div>
            <div class="summary-row">
                <span class="label">Price:</span>
                <span class="value">${this.isMarketOrder ? 'Market Price' : `₹${price.toFixed(2)}`}</span>
            </div>
            <div class="summary-row">
                <span class="label">Order Value:</span>
                <span class="value">₹${totalValue.toFixed(2)}</span>
            </div>
            <div class="summary-row fees">
                <span class="label">Est. Brokerage:</span>
                <span class="value">₹${brokerage.toFixed(2)}</span>
            </div>
            <div class="summary-row fees">
                <span class="label">Est. Taxes:</span>
                <span class="value">₹${taxes.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span class="label">Total ${this.orderType === 'buy' ? 'Cost' : 'Credit'}:</span>
                <span class="value">₹${totalCost.toFixed(2)}</span>
            </div>
        `;

        orderSummary.innerHTML = summaryHTML;
    }

    /**
     * Update order button state with visual feedback
     */
    updateOrderButton(isValid, quantity, price) {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const btnText = placeOrderBtn?.querySelector('.btn-text');
        
        if (!placeOrderBtn || !btnText) return;

        placeOrderBtn.disabled = !isValid;
        
        if (isValid && quantity > 0 && price > 0) {
            const actionText = this.orderType === 'buy' ? 'Buy' : 'Sell';
            const orderTypeText = this.isMarketOrder ? 'Market' : 'Limit';
            btnText.textContent = `Place ${actionText} Order (${orderTypeText})`;
            placeOrderBtn.classList.remove('btn-disabled');
            placeOrderBtn.classList.add('btn-ready');
        } else {
            btnText.textContent = 'Enter Order Details';
            placeOrderBtn.classList.add('btn-disabled');
            placeOrderBtn.classList.remove('btn-ready');
        }
    }

    /**
     * Show order confirmation modal with detailed breakdown
     */
    showOrderConfirmation() {
        if (!this.validateQuantity() || !this.validatePrice()) return;

        const quantity = parseInt(document.getElementById('modalQuantity').value);
        const price = this.isMarketOrder 
            ? parseFloat(this.currentStock.currentPrice || this.currentStock.price)
            : parseFloat(document.getElementById('modalOrderPrice').value);
        
        const totalValue = quantity * price;
        
        // Calculate fees and total cost
        const brokerage = totalValue * 0.0005;
        const taxes = totalValue * 0.001;
        const totalCost = totalValue + brokerage + taxes;
        
        // Update confirmation modal title and icon based on order type
        const confirmationIcon = document.querySelector('.confirmation-modal .confirmation-icon');
        const confirmationTitle = document.querySelector('.confirmation-modal .confirmation-title');
        
        if (confirmationIcon && confirmationTitle) {
            if (this.orderType === 'buy') {
                confirmationIcon.className = 'confirmation-icon success';
                confirmationIcon.innerHTML = '<i class="fas fa-arrow-up"></i>';
                confirmationTitle.textContent = 'Confirm Buy Order';
            } else {
                confirmationIcon.className = 'confirmation-icon warning';
                confirmationIcon.innerHTML = '<i class="fas fa-arrow-down"></i>';
                confirmationTitle.textContent = 'Confirm Sell Order';
            }
        }
        
        // Populate detailed confirmation
        const orderDetails = document.getElementById('confirmationOrderDetails');
        if (orderDetails) {
            orderDetails.innerHTML = `
                <div class="order-header">
                    <div class="stock-symbol">${this.currentStock.symbol}</div>
                    <div class="stock-name">${this.currentStock.name}</div>
                </div>
                
                <div class="order-details-grid">
                    <div class="detail-row">
                        <span class="label">Action:</span>
                        <span class="value ${this.orderType}">${this.orderType.toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Quantity:</span>
                        <span class="value">${quantity} shares</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Order Type:</span>
                        <span class="value">${this.isMarketOrder ? 'Market Order' : 'Limit Order'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Price:</span>
                        <span class="value">${this.isMarketOrder ? 'Market Price' : `₹${price.toFixed(2)}`}</span>
                    </div>
                    <div class="detail-row subtotal">
                        <span class="label">Order Value:</span>
                        <span class="value">₹${totalValue.toFixed(2)}</span>
                    </div>
                    <div class="detail-row fees">
                        <span class="label">Brokerage:</span>
                        <span class="value">₹${brokerage.toFixed(2)}</span>
                    </div>
                    <div class="detail-row fees">
                        <span class="label">Taxes & Charges:</span>
                        <span class="value">₹${taxes.toFixed(2)}</span>
                    </div>
                    <div class="detail-row total">
                        <span class="label">Total ${this.orderType === 'buy' ? 'Debit' : 'Credit'}:</span>
                        <span class="value">₹${totalCost.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="order-warning">
                    <i class="fas fa-info-circle"></i>
                    <span>${this.isMarketOrder ? 
                        'Market orders execute immediately at the best available price.' : 
                        'Limit orders execute only when the stock reaches your specified price.'
                    }</span>
                </div>
            `;
        }
        
        // Update confirm button text
        const confirmBtn = document.getElementById('confirmOrderBtn');
        const btnText = confirmBtn?.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = `Confirm ${this.orderType.toUpperCase()} Order`;
        }
        
        // Show confirmation modal
        const bsModal = new bootstrap.Modal(this.confirmationModal);
        bsModal.show();
    }

    /**
     * Place the order
     */
    async placeOrder() {
        const confirmBtn = document.getElementById('confirmOrderBtn');
        const btnText = confirmBtn?.querySelector('.btn-text');
        const btnLoading = confirmBtn?.querySelector('.btn-loading');
        
        if (confirmBtn) {
            confirmBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'block';
        }

        try {
            const orderData = {
                symbol: this.currentStock.symbol,
                orderType: this.orderType,
                quantity: parseInt(document.getElementById('modalQuantity').value),
                isMarketOrder: this.isMarketOrder,
                price: this.isMarketOrder ? null : parseFloat(document.getElementById('modalOrderPrice').value)
            };

            // Call the existing OnBuySell function or make API call
            const response = await this.submitOrder(orderData);
            
            if (response.success) {
                // Close modals
                bootstrap.Modal.getInstance(this.confirmationModal)?.hide();
                bootstrap.Modal.getInstance(this.modal)?.hide();
                
                // Show success notification
                if (window.dashboard) {
                    window.dashboard.showNotification(
                        `${this.orderType.toUpperCase()} order placed successfully for ${this.currentStock.symbol}`,
                        'success'
                    );
                    // Refresh data
                    window.dashboard.loadHoldingsData();
                    window.dashboard.loadWatchlistData();
                } else {
                    alert('Order placed successfully!');
                }
            } else {
                throw new Error(response.message || 'Order placement failed');
            }
        } catch (error) {
            console.error('Order placement error:', error);
            if (window.dashboard) {
                window.dashboard.showNotification('Failed to place order: ' + error.message, 'error');
            } else {
                alert('Failed to place order: ' + error.message);
            }
        } finally {
            if (confirmBtn) {
                confirmBtn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoading) btnLoading.style.display = 'none';
            }
        }
    }

    /**
     * Submit order to server
     */
    async submitOrder(orderData) {
        // Use existing OnBuySell functionality
        return new Promise((resolve) => {
            // Simulate the existing order placement
            const button = document.createElement('button');
            button.id = orderData.orderType === 'buy' ? 'buyButton' : 'sellButton';
            
            // Set up the modal data as expected by OnBuySell
            document.getElementById('mStock').textContent = orderData.symbol;
            document.getElementById('mQuantity').value = orderData.quantity;
            document.getElementById('mOrderPrice').value = orderData.price || '';
            
            // Call existing function
            if (typeof OnBuySell === 'function') {
                try {
                    OnBuySell(button);
                    resolve({ success: true });
                } catch (error) {
                    resolve({ success: false, message: error.message });
                }
            } else {
                resolve({ success: false, message: 'Order function not available' });
            }
        });
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        // Reset order type to buy
        this.setOrderType('buy');
        
        // Reset market order
        const orderTypeSwitch = document.getElementById('orderTypeSwitch');
        if (orderTypeSwitch) {
            orderTypeSwitch.checked = false;
            this.isMarketOrder = true;
            this.togglePriceInput();
        }
        
        // Clear inputs
        const quantityInput = document.getElementById('modalQuantity');
        const priceInput = document.getElementById('modalOrderPrice');
        
        if (quantityInput) {
            quantityInput.value = '';
            quantityInput.classList.remove('is-valid', 'is-invalid');
        }
        
        if (priceInput) {
            priceInput.value = '';
            priceInput.classList.remove('is-valid', 'is-invalid');
        }
        
        // Clear feedback
        const feedbacks = document.querySelectorAll('.input-feedback');
        feedbacks.forEach(feedback => {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        });
        
        // Reset order summary
        this.updateOrderSummary();
    }

    /**
     * Handle modal shown event
     */
    onModalShown() {
        // Load chart data
        this.loadChartData();
        
        // Focus on quantity input
        const quantityInput = document.getElementById('modalQuantity');
        if (quantityInput) {
            setTimeout(() => quantityInput.focus(), 100);
        }
    }

    /**
     * Handle modal hidden event
     */
    onModalHidden() {
        // Stop real-time updates
        this.disableRealTimeUpdates();
        
        // Reset form
        this.resetForm();
        
        // Clear current stock
        this.currentStock = null;
        
        // Reset chart if it exists
        if (this.chart && this.chart.chart) {
            // Clear all indicators
            this.chart.indicators.clear();
            
            // Reset chart type to candlestick
            this.chart.setChartType('candlestick');
        }
    }
}

// Initialize stock modal when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.stockModal = new StockModal();
});

// Helper function to show stock modal (for backward compatibility)
function showStockModal(stockData) {
    if (window.stockModal) {
        window.stockModal.show(stockData);
    }
}