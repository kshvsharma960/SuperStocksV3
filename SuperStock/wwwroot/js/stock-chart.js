/**
 * Enhanced Stock Chart Component
 * Provides candlestick charts, technical indicators, and interactive features
 */

class StockChart {
    constructor(canvasId, options = {}) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
        this.chart = null;
        this.currentSymbol = null;
        this.currentTimeframe = '1W';
        this.chartType = 'candlestick'; // candlestick, line, area
        this.indicators = new Set(); // Technical indicators
        this.isLoading = false;
        
        // Default options
        this.options = {
            responsive: true,
            maintainAspectRatio: false,
            showVolume: true,
            showIndicators: true,
            enableZoom: true,
            enablePan: true,
            ...options
        };
        
        this.init();
    }

    init() {
        if (!this.canvas || !this.ctx) {
            console.error('Chart canvas not found:', this.canvasId);
            return;
        }
        
        this.initChart();
        this.bindEvents();
    }

    /**
     * Initialize the Chart.js instance with candlestick configuration
     */
    initChart() {
        const config = {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'Price',
                    data: [],
                    borderColor: {
                        up: 'var(--color-success)',
                        down: 'var(--color-error)',
                        unchanged: 'var(--color-secondary)'
                    },
                    backgroundColor: {
                        up: 'rgba(var(--color-success-rgb), 0.8)',
                        down: 'rgba(var(--color-error-rgb), 0.8)',
                        unchanged: 'rgba(var(--color-secondary-rgb), 0.8)'
                    }
                }]
            },
            options: {
                responsive: this.options.responsive,
                maintainAspectRatio: this.options.maintainAspectRatio,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'var(--bg-card)',
                        titleColor: 'var(--text-primary)',
                        bodyColor: 'var(--text-primary)',
                        borderColor: 'var(--border-color)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                            },
                            label: (context) => {
                                const data = context.parsed;
                                return [
                                    `Open: ₹${data.o?.toFixed(2) || 'N/A'}`,
                                    `High: ₹${data.h?.toFixed(2) || 'N/A'}`,
                                    `Low: ₹${data.l?.toFixed(2) || 'N/A'}`,
                                    `Close: ₹${data.c?.toFixed(2) || 'N/A'}`
                                ];
                            }
                        }
                    },
                    zoom: this.options.enableZoom ? {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: this.options.enablePan,
                            mode: 'x',
                        }
                    } : undefined
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM dd',
                                week: 'MMM dd',
                                month: 'MMM yyyy'
                            }
                        },
                        grid: {
                            color: 'var(--border-color-light)',
                            drawOnChartArea: true,
                            drawTicks: true
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'right',
                        grid: {
                            color: 'var(--border-color-light)',
                            drawOnChartArea: true,
                            drawTicks: true
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            callback: function(value) {
                                return '₹' + value.toFixed(2);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        };

        // Add volume chart if enabled
        if (this.options.showVolume) {
            config.data.datasets.push({
                label: 'Volume',
                type: 'bar',
                data: [],
                backgroundColor: 'rgba(var(--color-primary-rgb), 0.3)',
                borderColor: 'var(--color-primary)',
                borderWidth: 1,
                yAxisID: 'volume'
            });

            config.options.scales.volume = {
                type: 'linear',
                position: 'left',
                max: function(context) {
                    const volumes = context.chart.data.datasets[1].data;
                    const maxVolume = Math.max(...volumes.map(d => d.y || 0));
                    return maxVolume * 4; // Scale volume to 1/4 of chart height
                },
                grid: {
                    display: false
                },
                ticks: {
                    display: false
                }
            };
        }

        this.chart = new Chart(this.ctx, config);
    }

    /**
     * Bind chart events and interactions
     */
    bindEvents() {
        // Handle canvas resize
        const resizeObserver = new ResizeObserver(() => {
            if (this.chart) {
                this.chart.resize();
            }
        });
        resizeObserver.observe(this.canvas);

        // Handle chart click events
        this.canvas.addEventListener('click', (event) => {
            const points = this.chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                const datasetIndex = firstPoint.datasetIndex;
                const index = firstPoint.index;
                const data = this.chart.data.datasets[datasetIndex].data[index];
                this.onDataPointClick(data, index);
            }
        });
    }

    /**
     * Load chart data for a specific symbol and timeframe
     */
    async loadData(symbol, timeframe = '1W') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentSymbol = symbol;
        this.currentTimeframe = timeframe;
        
        this.showLoading();
        
        try {
            this.hideError(); // Hide any previous errors
            
            // Try to fetch real data first
            const response = await fetch(`/api/chart/${symbol}?timeframe=${timeframe}`);
            
            let chartData;
            if (response.ok) {
                chartData = await response.json();
            } else if (response.status === 404) {
                // API endpoint not found, use mock data
                console.info('Chart API not available, using mock data');
                chartData = this.generateMockOHLCData(symbol, timeframe);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.updateChart(chartData);
            this.hideLoading();
            
        } catch (error) {
            console.warn('Failed to load chart data:', error);
            this.hideLoading();
            
            // Try to use mock data as fallback
            try {
                const mockData = this.generateMockOHLCData(symbol, timeframe);
                this.updateChart(mockData);
                console.info('Using mock chart data for demonstration');
            } catch (mockError) {
                console.error('Failed to generate mock data:', mockError);
                this.showError('Unable to load chart data');
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Generate mock OHLC data for demonstration
     */
    generateMockOHLCData(symbol, timeframe) {
        const basePrice = 100 + Math.random() * 400; // Random base price between 100-500
        const periods = this.getPeriodsForTimeframe(timeframe);
        const data = [];
        const volumeData = [];
        
        let currentPrice = basePrice;
        
        for (let i = 0; i < periods; i++) {
            const date = this.getDateForPeriod(i, timeframe);
            
            // Generate realistic OHLC data
            const open = currentPrice;
            const volatility = 0.02 + Math.random() * 0.03; // 2-5% volatility
            const direction = Math.random() > 0.5 ? 1 : -1;
            const change = open * volatility * direction;
            
            const high = Math.max(open, open + change) + (Math.random() * open * 0.01);
            const low = Math.min(open, open + change) - (Math.random() * open * 0.01);
            const close = open + change + (Math.random() - 0.5) * open * 0.005;
            
            // Ensure high is highest and low is lowest
            const finalHigh = Math.max(high, open, close);
            const finalLow = Math.min(low, open, close);
            
            data.push({
                x: date.getTime(),
                o: parseFloat(open.toFixed(2)),
                h: parseFloat(finalHigh.toFixed(2)),
                l: parseFloat(finalLow.toFixed(2)),
                c: parseFloat(close.toFixed(2))
            });
            
            // Generate volume data
            const baseVolume = 100000 + Math.random() * 500000;
            const volumeMultiplier = Math.abs(change) / open * 10 + 1; // Higher volume on bigger moves
            volumeData.push({
                x: date.getTime(),
                y: Math.floor(baseVolume * volumeMultiplier)
            });
            
            currentPrice = close;
        }
        
        return {
            symbol,
            timeframe,
            ohlc: data,
            volume: volumeData
        };
    }

    /**
     * Get number of periods for timeframe
     */
    getPeriodsForTimeframe(timeframe) {
        const periods = {
            '1D': 24,    // 24 hours
            '1W': 7,     // 7 days
            '1M': 30,    // 30 days
            '3M': 90,    // 90 days
            '1Y': 252,   // Trading days in a year
            '5Y': 1260   // 5 years of trading days
        };
        return periods[timeframe] || 30;
    }

    /**
     * Get date for specific period based on timeframe
     */
    getDateForPeriod(index, timeframe) {
        const now = new Date();
        const date = new Date(now);
        
        switch (timeframe) {
            case '1D':
                date.setHours(date.getHours() - (23 - index));
                break;
            case '1W':
                date.setDate(date.getDate() - (6 - index));
                break;
            case '1M':
                date.setDate(date.getDate() - (29 - index));
                break;
            case '3M':
                date.setDate(date.getDate() - (89 - index));
                break;
            case '1Y':
                date.setDate(date.getDate() - (251 - index));
                break;
            case '5Y':
                date.setDate(date.getDate() - (1259 - index));
                break;
            default:
                date.setDate(date.getDate() - (29 - index));
        }
        
        return date;
    }

    /**
     * Update chart with new data
     */
    updateChart(chartData) {
        if (!this.chart || !chartData) return;
        
        // Update OHLC data
        this.chart.data.datasets[0].data = chartData.ohlc || [];
        
        // Update volume data if available
        if (this.options.showVolume && chartData.volume && this.chart.data.datasets[1]) {
            this.chart.data.datasets[1].data = chartData.volume;
        }
        
        // Update time scale based on timeframe
        this.updateTimeScale(chartData.timeframe);
        
        // Animate chart update
        this.chart.update('active');
        
        // Trigger custom event
        this.onChartUpdated(chartData);
    }

    /**
     * Update time scale configuration based on timeframe
     */
    updateTimeScale(timeframe) {
        if (!this.chart) return;
        
        const timeConfig = {
            '1D': { unit: 'hour', displayFormat: 'HH:mm' },
            '1W': { unit: 'day', displayFormat: 'MMM dd' },
            '1M': { unit: 'day', displayFormat: 'MMM dd' },
            '3M': { unit: 'week', displayFormat: 'MMM dd' },
            '1Y': { unit: 'month', displayFormat: 'MMM yyyy' },
            '5Y': { unit: 'year', displayFormat: 'yyyy' }
        };
        
        const config = timeConfig[timeframe] || timeConfig['1M'];
        
        this.chart.options.scales.x.time.unit = config.unit;
        this.chart.options.scales.x.time.displayFormats[config.unit] = config.displayFormat;
    }

    /**
     * Change chart type (candlestick, line, area)
     */
    setChartType(type) {
        if (!this.chart) return;
        
        this.chartType = type;
        
        switch (type) {
            case 'line':
                this.chart.config.type = 'line';
                this.chart.data.datasets[0] = {
                    ...this.chart.data.datasets[0],
                    type: 'line',
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    data: this.chart.data.datasets[0].data.map(d => ({
                        x: d.x,
                        y: d.c // Use close price for line chart
                    }))
                };
                break;
                
            case 'area':
                this.chart.config.type = 'line';
                this.chart.data.datasets[0] = {
                    ...this.chart.data.datasets[0],
                    type: 'line',
                    borderColor: 'var(--color-primary)',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    data: this.chart.data.datasets[0].data.map(d => ({
                        x: d.x,
                        y: d.c // Use close price for area chart
                    }))
                };
                break;
                
            case 'candlestick':
            default:
                this.chart.config.type = 'candlestick';
                // Restore original candlestick configuration
                this.chart.data.datasets[0] = {
                    label: 'Price',
                    data: this.chart.data.datasets[0].data,
                    borderColor: {
                        up: 'var(--color-success)',
                        down: 'var(--color-error)',
                        unchanged: 'var(--color-secondary)'
                    },
                    backgroundColor: {
                        up: 'rgba(var(--color-success-rgb), 0.8)',
                        down: 'rgba(var(--color-error-rgb), 0.8)',
                        unchanged: 'rgba(var(--color-secondary-rgb), 0.8)'
                    }
                };
                break;
        }
        
        this.chart.update('none');
    }

    /**
     * Add technical indicator
     */
    addIndicator(indicator) {
        this.indicators.add(indicator);
        
        switch (indicator) {
            case 'sma20':
                this.addMovingAverage(20, 'SMA 20', '#f39c12');
                break;
            case 'sma50':
                this.addMovingAverage(50, 'SMA 50', '#3498db');
                break;
            case 'ema20':
                this.addExponentialMovingAverage(20, 'EMA 20', '#2ecc71');
                break;
            case 'bollinger':
                this.addBollingerBands(20, 2, 'Bollinger Bands');
                break;
            case 'rsi':
                this.addRSI(14, 'RSI (14)');
                break;
            case 'macd':
                this.addMACD(12, 26, 9, 'MACD');
                break;
        }
    }

    /**
     * Remove technical indicator
     */
    removeIndicator(indicator) {
        this.indicators.delete(indicator);
        
        // Remove datasets associated with this indicator
        const indicatorLabels = this.getIndicatorLabels(indicator);
        
        for (let i = this.chart.data.datasets.length - 1; i >= 0; i--) {
            const dataset = this.chart.data.datasets[i];
            if (indicatorLabels.includes(dataset.label)) {
                this.chart.data.datasets.splice(i, 1);
            }
        }
        
        this.chart.update('none');
    }

    /**
     * Get all dataset labels for an indicator
     */
    getIndicatorLabels(indicator) {
        const labelMap = {
            'sma20': ['SMA 20'],
            'sma50': ['SMA 50'],
            'ema20': ['EMA 20'],
            'bollinger': ['Bollinger Upper', 'Bollinger Lower', 'Bollinger SMA'],
            'rsi': ['RSI (14)'],
            'macd': ['MACD', 'MACD Signal', 'MACD Histogram']
        };
        
        return labelMap[indicator] || [indicator];
    }

    /**
     * Add simple moving average
     */
    addMovingAverage(period, label, color) {
        const ohlcData = this.chart.data.datasets[0].data;
        const smaData = this.calculateSMA(ohlcData, period);
        
        this.chart.data.datasets.push({
            label: label,
            type: 'line',
            data: smaData,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            tension: 0.1
        });
        
        this.chart.update('none');
    }

    /**
     * Add exponential moving average
     */
    addExponentialMovingAverage(period, label, color) {
        const ohlcData = this.chart.data.datasets[0].data;
        const emaData = this.calculateEMA(ohlcData, period);
        
        this.chart.data.datasets.push({
            label: label,
            type: 'line',
            data: emaData,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            tension: 0.1
        });
        
        this.chart.update('none');
    }

    /**
     * Calculate Simple Moving Average
     */
    calculateSMA(data, period) {
        const smaData = [];
        
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].c; // Use close price
            }
            const average = sum / period;
            
            smaData.push({
                x: data[i].x,
                y: average
            });
        }
        
        return smaData;
    }

    /**
     * Calculate Exponential Moving Average
     */
    calculateEMA(data, period) {
        const emaData = [];
        const multiplier = 2 / (period + 1);
        
        // Start with SMA for first value
        let ema = data.slice(0, period).reduce((sum, d) => sum + d.c, 0) / period;
        emaData.push({
            x: data[period - 1].x,
            y: ema
        });
        
        // Calculate EMA for remaining values
        for (let i = period; i < data.length; i++) {
            ema = (data[i].c * multiplier) + (ema * (1 - multiplier));
            emaData.push({
                x: data[i].x,
                y: ema
            });
        }
        
        return emaData;
    }

    /**
     * Add Bollinger Bands
     */
    addBollingerBands(period, stdDev, label) {
        const ohlcData = this.chart.data.datasets[0].data;
        const bollingerData = this.calculateBollingerBands(ohlcData, period, stdDev);
        
        // Add upper band
        this.chart.data.datasets.push({
            label: 'Bollinger Upper',
            type: 'line',
            data: bollingerData.upper,
            borderColor: '#e74c3c',
            backgroundColor: 'transparent',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            tension: 0.1
        });
        
        // Add lower band
        this.chart.data.datasets.push({
            label: 'Bollinger Lower',
            type: 'line',
            data: bollingerData.lower,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 1,
            fill: '-1', // Fill between upper and lower
            pointRadius: 0,
            tension: 0.1
        });
        
        // Add middle line (SMA)
        this.chart.data.datasets.push({
            label: 'Bollinger SMA',
            type: 'line',
            data: bollingerData.middle,
            borderColor: '#95a5a6',
            backgroundColor: 'transparent',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
            borderDash: [5, 5]
        });
        
        this.chart.update('none');
    }

    /**
     * Calculate Bollinger Bands
     */
    calculateBollingerBands(data, period, stdDev) {
        const upperBand = [];
        const lowerBand = [];
        const middleBand = [];
        
        for (let i = period - 1; i < data.length; i++) {
            // Calculate SMA
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].c;
            }
            const sma = sum / period;
            
            // Calculate standard deviation
            let variance = 0;
            for (let j = 0; j < period; j++) {
                variance += Math.pow(data[i - j].c - sma, 2);
            }
            const standardDeviation = Math.sqrt(variance / period);
            
            const upper = sma + (stdDev * standardDeviation);
            const lower = sma - (stdDev * standardDeviation);
            
            upperBand.push({ x: data[i].x, y: upper });
            lowerBand.push({ x: data[i].x, y: lower });
            middleBand.push({ x: data[i].x, y: sma });
        }
        
        return { upper: upperBand, lower: lowerBand, middle: middleBand };
    }

    /**
     * Add RSI indicator
     */
    addRSI(period, label) {
        const ohlcData = this.chart.data.datasets[0].data;
        const rsiData = this.calculateRSI(ohlcData, period);
        
        // Create a separate chart or overlay for RSI
        // For now, we'll normalize RSI to fit on the price chart
        const normalizedRSI = rsiData.map(point => ({
            x: point.x,
            y: point.y // RSI is already 0-100, we might want to scale it
        }));
        
        this.chart.data.datasets.push({
            label: label,
            type: 'line',
            data: normalizedRSI,
            borderColor: '#9b59b6',
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'rsi'
        });
        
        // Add RSI scale if it doesn't exist
        if (!this.chart.options.scales.rsi) {
            this.chart.options.scales.rsi = {
                type: 'linear',
                position: 'left',
                min: 0,
                max: 100,
                grid: {
                    display: false
                },
                ticks: {
                    color: 'var(--text-secondary)',
                    callback: function(value) {
                        return value;
                    }
                }
            };
        }
        
        this.chart.update('none');
    }

    /**
     * Calculate RSI
     */
    calculateRSI(data, period) {
        const rsiData = [];
        const gains = [];
        const losses = [];
        
        // Calculate initial gains and losses
        for (let i = 1; i < data.length; i++) {
            const change = data[i].c - data[i - 1].c;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        
        // Calculate RSI
        for (let i = period - 1; i < gains.length; i++) {
            let avgGain, avgLoss;
            
            if (i === period - 1) {
                // First RSI calculation
                avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
                avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
            } else {
                // Smoothed averages
                const prevAvgGain = rsiData[i - period].avgGain;
                const prevAvgLoss = rsiData[i - period].avgLoss;
                avgGain = (prevAvgGain * (period - 1) + gains[i]) / period;
                avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period;
            }
            
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            
            rsiData.push({
                x: data[i + 1].x,
                y: rsi,
                avgGain: avgGain,
                avgLoss: avgLoss
            });
        }
        
        return rsiData;
    }

    /**
     * Add MACD indicator
     */
    addMACD(fastPeriod, slowPeriod, signalPeriod, label) {
        const ohlcData = this.chart.data.datasets[0].data;
        const macdData = this.calculateMACD(ohlcData, fastPeriod, slowPeriod, signalPeriod);
        
        // Add MACD line
        this.chart.data.datasets.push({
            label: 'MACD',
            type: 'line',
            data: macdData.macd,
            borderColor: '#3498db',
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'macd'
        });
        
        // Add Signal line
        this.chart.data.datasets.push({
            label: 'MACD Signal',
            type: 'line',
            data: macdData.signal,
            borderColor: '#e74c3c',
            backgroundColor: 'transparent',
            borderWidth: 1,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'macd'
        });
        
        // Add Histogram
        this.chart.data.datasets.push({
            label: 'MACD Histogram',
            type: 'bar',
            data: macdData.histogram,
            backgroundColor: 'rgba(52, 152, 219, 0.3)',
            borderColor: '#3498db',
            borderWidth: 1,
            yAxisID: 'macd'
        });
        
        // Add MACD scale if it doesn't exist
        if (!this.chart.options.scales.macd) {
            this.chart.options.scales.macd = {
                type: 'linear',
                position: 'left',
                grid: {
                    display: false
                },
                ticks: {
                    color: 'var(--text-secondary)'
                }
            };
        }
        
        this.chart.update('none');
    }

    /**
     * Calculate MACD
     */
    calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
        const fastEMA = this.calculateEMA(data, fastPeriod);
        const slowEMA = this.calculateEMA(data, slowPeriod);
        
        const macdLine = [];
        const startIndex = Math.max(fastPeriod, slowPeriod) - 1;
        
        // Calculate MACD line
        for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
            const macdValue = fastEMA[i].y - slowEMA[i].y;
            macdLine.push({
                x: fastEMA[i].x,
                y: macdValue
            });
        }
        
        // Calculate Signal line (EMA of MACD)
        const signalLine = this.calculateEMA(macdLine, signalPeriod);
        
        // Calculate Histogram
        const histogram = [];
        for (let i = 0; i < signalLine.length; i++) {
            const macdIndex = macdLine.findIndex(m => m.x === signalLine[i].x);
            if (macdIndex !== -1) {
                histogram.push({
                    x: signalLine[i].x,
                    y: macdLine[macdIndex].y - signalLine[i].y
                });
            }
        }
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram
        };
    }

    /**
     * Show loading state
     */
    showLoading() {
        const container = this.canvas.parentElement;
        const loadingEl = container.querySelector('.chart-loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const container = this.canvas.parentElement;
        const loadingEl = container.querySelector('.chart-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Show error state
     */
    showError(message = 'Failed to load chart data') {
        const container = this.canvas.parentElement;
        let errorEl = container.querySelector('.chart-error');
        
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'chart-error';
            errorEl.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle error-icon"></i>
                    <div class="error-message">${message}</div>
                    <button class="btn btn-sm btn-outline-primary retry-btn">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
            container.appendChild(errorEl);
            
            // Bind retry button
            const retryBtn = errorEl.querySelector('.retry-btn');
            retryBtn.addEventListener('click', () => {
                this.hideError();
                if (this.currentSymbol) {
                    this.loadData(this.currentSymbol, this.currentTimeframe);
                }
            });
        }
        
        errorEl.style.display = 'flex';
    }

    /**
     * Hide error state
     */
    hideError() {
        const container = this.canvas.parentElement;
        const errorEl = container.querySelector('.chart-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    /**
     * Reset zoom to fit all data
     */
    resetZoom() {
        if (this.chart && this.chart.resetZoom) {
            this.chart.resetZoom();
        }
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Enable real-time updates
     */
    enableRealTimeUpdates(interval = 30000) { // 30 seconds default
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.currentSymbol && !this.isLoading) {
                this.updateRealTimeData();
            }
        }, interval);
    }

    /**
     * Disable real-time updates
     */
    disableRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update chart with real-time data
     */
    async updateRealTimeData() {
        try {
            const response = await fetch(`/api/realtime/${this.currentSymbol}`);
            
            if (response.ok) {
                const realtimeData = await response.json();
                this.updateLatestDataPoint(realtimeData);
            } else {
                // Simulate real-time update with mock data
                this.simulateRealTimeUpdate();
            }
        } catch (error) {
            console.warn('Real-time update failed:', error);
            // Fallback to simulated update
            this.simulateRealTimeUpdate();
        }
    }

    /**
     * Update the latest data point with new real-time data
     */
    updateLatestDataPoint(realtimeData) {
        if (!this.chart || !this.chart.data.datasets[0].data.length) return;
        
        const dataset = this.chart.data.datasets[0];
        const lastIndex = dataset.data.length - 1;
        const lastDataPoint = dataset.data[lastIndex];
        
        // Update the last data point with new real-time data
        if (realtimeData.timestamp > lastDataPoint.x) {
            // Add new data point
            dataset.data.push({
                x: realtimeData.timestamp,
                o: realtimeData.open,
                h: realtimeData.high,
                l: realtimeData.low,
                c: realtimeData.close
            });
        } else {
            // Update existing data point
            lastDataPoint.h = Math.max(lastDataPoint.h, realtimeData.high);
            lastDataPoint.l = Math.min(lastDataPoint.l, realtimeData.low);
            lastDataPoint.c = realtimeData.close;
        }
        
        // Update volume if available
        if (this.options.showVolume && this.chart.data.datasets[1] && realtimeData.volume) {
            const volumeDataset = this.chart.data.datasets[1];
            if (volumeDataset.data.length > lastIndex) {
                volumeDataset.data[lastIndex].y = realtimeData.volume;
            }
        }
        
        // Animate the update
        this.chart.update('active');
        
        // Trigger update event
        this.onRealTimeUpdate(realtimeData);
    }

    /**
     * Simulate real-time updates for demonstration
     */
    simulateRealTimeUpdate() {
        if (!this.chart || !this.chart.data.datasets[0].data.length) return;
        
        const dataset = this.chart.data.datasets[0];
        const lastDataPoint = dataset.data[dataset.data.length - 1];
        
        // Simulate price movement
        const volatility = 0.005; // 0.5% volatility
        const direction = Math.random() > 0.5 ? 1 : -1;
        const change = lastDataPoint.c * volatility * direction * Math.random();
        
        const newPrice = lastDataPoint.c + change;
        
        // Update the last data point
        lastDataPoint.h = Math.max(lastDataPoint.h, newPrice);
        lastDataPoint.l = Math.min(lastDataPoint.l, newPrice);
        lastDataPoint.c = newPrice;
        
        // Add subtle animation
        this.chart.update('none');
        
        // Trigger update event
        this.onRealTimeUpdate({
            symbol: this.currentSymbol,
            price: newPrice,
            change: change,
            timestamp: Date.now()
        });
    }

    /**
     * Event handlers (can be overridden)
     */
    onDataPointClick(data, index) {
        // Override this method to handle data point clicks
        console.log('Data point clicked:', data, index);
    }

    onChartUpdated(chartData) {
        // Override this method to handle chart updates
        console.log('Chart updated:', chartData);
    }

    onRealTimeUpdate(realtimeData) {
        // Override this method to handle real-time updates
        console.log('Real-time update:', realtimeData);
    }
}

// Export for use in other modules
window.StockChart = StockChart;