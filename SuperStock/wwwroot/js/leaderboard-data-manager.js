/**
 * Leaderboard Data Manager
 * Handles user name/email display logic, data validation, and ranking calculations
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

class LeaderboardDataManager {
    constructor() {
        this.userCache = new Map();
        this.leaderboardCache = null;
        this.cacheExpiry = 300000; // 5 minutes
        this.lastCacheTime = null;
        this.validationRules = this.initializeValidationRules();
        
        // Initialize enhanced caching and performance manager
        this.cacheManager = window.cachePerformanceManager || new CachePerformanceManager();
    }

    /**
     * Initialize validation rules for leaderboard entries
     */
    initializeValidationRules() {
        return {
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                maxLength: 254
            },
            portfolioValue: {
                required: true,
                type: 'number',
                min: 0,
                max: Number.MAX_SAFE_INTEGER
            },
            rank: {
                required: true,
                type: 'number',
                min: 1
            },
            username: {
                maxLength: 50,
                pattern: /^[a-zA-Z0-9_.-]+$/
            },
            pnl: {
                type: 'number'
            },
            pnlPercent: {
                type: 'number',
                min: -100
            },
            totalTrades: {
                type: 'number',
                min: 0
            }
        };
    }

    /**
     * Resolve display name for a user (name first, email fallback)
     * Requirement 3.1: Display user names if available
     * Requirement 3.2: Use email as fallback if name not available
     */
    resolveDisplayName(user) {
        if (!user) {
            return 'Unknown User';
        }

        // Sanitize inputs
        const sanitizedUser = this.sanitizeUserData(user);

        // Priority order: username > name > email local part > email
        if (sanitizedUser.username && sanitizedUser.username.trim()) {
            return sanitizedUser.username.trim();
        }

        if (sanitizedUser.name && sanitizedUser.name.trim()) {
            return sanitizedUser.name.trim();
        }

        if (sanitizedUser.email && sanitizedUser.email.trim()) {
            const email = sanitizedUser.email.trim();
            // Extract local part of email as display name
            const localPart = email.split('@')[0];
            return localPart || email;
        }

        return 'Anonymous User';
    }

    /**
     * Sanitize user data to prevent XSS and ensure data integrity
     */
    sanitizeUserData(user) {
        const sanitized = {};

        // Sanitize string fields
        ['username', 'name', 'email'].forEach(field => {
            if (user[field]) {
                sanitized[field] = this.sanitizeString(user[field]);
            }
        });

        // Copy numeric fields as-is (will be validated separately)
        ['portfolioValue', 'pnl', 'pnlPercent', 'totalTrades', 'rank'].forEach(field => {
            if (user[field] !== undefined && user[field] !== null) {
                sanitized[field] = user[field];
            }
        });

        // Copy other safe fields
        ['isCurrentUser', 'performanceHistory', 'joinDate'].forEach(field => {
            if (user[field] !== undefined) {
                sanitized[field] = user[field];
            }
        });

        return sanitized;
    }

    /**
     * Sanitize string input to prevent XSS attacks
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            return '';
        }

        return str
            .replace(/[<>'"&]/g, (match) => {
                const escapeMap = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#x27;',
                    '&': '&amp;'
                };
                return escapeMap[match];
            })
            .trim();
    }

    /**
     * Validate leaderboard entry data
     * Requirement 3.3: Add data validation for leaderboard entries
     */
    validateLeaderboardEntry(entry) {
        const errors = [];
        const warnings = [];

        if (!entry || typeof entry !== 'object') {
            errors.push('Entry must be a valid object');
            return { isValid: false, errors, warnings, sanitizedEntry: null };
        }

        const sanitizedEntry = this.sanitizeUserData(entry);

        // Validate each field according to rules
        Object.keys(this.validationRules).forEach(field => {
            const rule = this.validationRules[field];
            const value = sanitizedEntry[field];

            // Check required fields
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`Field '${field}' is required`);
                return;
            }

            // Skip validation if field is not present and not required
            if (value === undefined || value === null) {
                return;
            }

            // Type validation
            if (rule.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
                errors.push(`Field '${field}' must be a valid number`);
                return;
            }

            // String length validation
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                warnings.push(`Field '${field}' exceeds maximum length of ${rule.maxLength}`);
                sanitizedEntry[field] = value.substring(0, rule.maxLength);
            }

            // Pattern validation
            if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
                if (field === 'email') {
                    errors.push(`Field '${field}' must be a valid email address`);
                } else {
                    warnings.push(`Field '${field}' contains invalid characters`);
                }
            }

            // Numeric range validation
            if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
                errors.push(`Field '${field}' must be at least ${rule.min}`);
            }

            if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
                errors.push(`Field '${field}' must not exceed ${rule.max}`);
            }
        });

        // Additional business logic validation
        if (sanitizedEntry.portfolioValue && sanitizedEntry.pnl !== undefined) {
            const calculatedPnl = sanitizedEntry.portfolioValue - 1000000; // Assuming 1M starting capital
            const pnlDifference = Math.abs(calculatedPnl - sanitizedEntry.pnl);
            
            if (pnlDifference > 1000) { // Allow for small rounding differences
                warnings.push('P&L value does not match portfolio value calculation');
            }
        }

        if (sanitizedEntry.pnl !== undefined && sanitizedEntry.pnlPercent !== undefined) {
            const calculatedPercent = (sanitizedEntry.pnl / 1000000) * 100;
            const percentDifference = Math.abs(calculatedPercent - sanitizedEntry.pnlPercent);
            
            if (percentDifference > 0.1) { // Allow for small rounding differences
                warnings.push('P&L percentage does not match P&L value calculation');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedEntry
        };
    }

    /**
     * Process and validate leaderboard data
     * Requirement 3.3: Data validation and sanitization
     */
    processLeaderboardData(rawData) {
        if (!Array.isArray(rawData)) {
            throw new Error('Leaderboard data must be an array');
        }

        const processedData = [];
        const processingErrors = [];

        rawData.forEach((entry, index) => {
            const validation = this.validateLeaderboardEntry(entry);
            
            if (validation.isValid) {
                const processedEntry = this.enhanceLeaderboardEntry(validation.sanitizedEntry);
                processedData.push(processedEntry);
                
                // Log warnings if any
                if (validation.warnings.length > 0) {
                    console.warn(`Entry ${index} warnings:`, validation.warnings);
                }
            } else {
                processingErrors.push({
                    index,
                    entry,
                    errors: validation.errors
                });
                console.error(`Entry ${index} validation failed:`, validation.errors);
            }
        });

        // Sort and recalculate ranks
        const sortedData = this.sortAndRankData(processedData);

        return {
            data: sortedData,
            errors: processingErrors,
            totalProcessed: processedData.length,
            totalErrors: processingErrors.length
        };
    }

    /**
     * Enhance leaderboard entry with additional computed fields
     */
    enhanceLeaderboardEntry(entry) {
        const enhanced = { ...entry };

        // Ensure display name is set
        enhanced.displayName = this.resolveDisplayName(entry);

        // Calculate missing P&L values if possible
        if (enhanced.portfolioValue && enhanced.pnl === undefined) {
            enhanced.pnl = enhanced.portfolioValue - 1000000; // Assuming 1M starting capital
        }

        if (enhanced.pnl !== undefined && enhanced.pnlPercent === undefined) {
            enhanced.pnlPercent = (enhanced.pnl / 1000000) * 100;
        }

        // Set default values for missing optional fields
        enhanced.totalTrades = enhanced.totalTrades || 0;
        enhanced.isCurrentUser = enhanced.isCurrentUser || false;
        enhanced.joinDate = enhanced.joinDate || new Date().toISOString();

        // Generate performance history if missing
        if (!enhanced.performanceHistory || !Array.isArray(enhanced.performanceHistory)) {
            enhanced.performanceHistory = this.generateDefaultPerformanceHistory(enhanced.portfolioValue);
        }

        return enhanced;
    }

    /**
     * Generate default performance history for entries missing this data
     */
    generateDefaultPerformanceHistory(currentValue) {
        const history = [];
        const days = 30;
        const startValue = 1000000; // Starting capital
        const totalChange = currentValue - startValue;
        
        for (let i = 0; i < days; i++) {
            const progress = i / (days - 1);
            const value = startValue + (totalChange * progress) + (Math.random() - 0.5) * 5000;
            
            history.push({
                date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000),
                value: Math.max(0, value) // Ensure non-negative values
            });
        }
        
        return history;
    }

    /**
     * Sort data and recalculate rankings
     * Requirement 3.4: Fix data sorting and ranking calculations
     */
    sortAndRankData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return data;
        }

        // Sort by portfolio value (descending) as primary criteria
        const sorted = data.sort((a, b) => {
            // Primary sort: Portfolio value (descending)
            if (b.portfolioValue !== a.portfolioValue) {
                return b.portfolioValue - a.portfolioValue;
            }

            // Secondary sort: P&L percentage (descending)
            if (b.pnlPercent !== a.pnlPercent) {
                return b.pnlPercent - a.pnlPercent;
            }

            // Tertiary sort: Total trades (descending - more active traders ranked higher)
            if (b.totalTrades !== a.totalTrades) {
                return b.totalTrades - a.totalTrades;
            }

            // Final sort: Email (ascending) for consistent ordering
            return a.email.localeCompare(b.email);
        });

        // Recalculate ranks, handling ties properly
        let currentRank = 1;
        let previousValue = null;
        let sameRankCount = 0;

        sorted.forEach((entry, index) => {
            const currentValue = entry.portfolioValue;
            
            if (previousValue !== null && currentValue < previousValue) {
                // Different value, update rank
                currentRank = index + 1;
                sameRankCount = 0;
            } else if (previousValue !== null && currentValue === previousValue) {
                // Same value, same rank
                sameRankCount++;
            }

            entry.rank = currentRank;
            entry.rankChange = this.calculateRankChange(entry, index);
            previousValue = currentValue;
        });

        return sorted;
    }

    /**
     * Calculate rank change (mock implementation - in real app would compare with previous data)
     */
    calculateRankChange(entry, currentIndex) {
        // Mock rank change calculation
        // In a real implementation, this would compare with previous leaderboard data
        const mockPreviousRank = currentIndex + 1 + (Math.floor(Math.random() * 5) - 2);
        return entry.rank - mockPreviousRank;
    }

    /**
     * Get leaderboard data with enhanced caching and performance optimization
     * Requirements: 5.1, 5.4, 5.5
     */
    async getLeaderboardData(forceRefresh = false, gameType = 'default') {
        const cacheKey = `leaderboard-${gameType}`;
        
        // Try enhanced cache first if not forcing refresh
        if (!forceRefresh) {
            const cachedData = this.cacheManager.get('leaderboard', cacheKey);
            if (cachedData) {
                return cachedData;
            }
            
            // Fallback to local cache
            const now = Date.now();
            if (this.leaderboardCache && 
                this.lastCacheTime && 
                (now - this.lastCacheTime) < this.cacheExpiry) {
                return this.leaderboardCache;
            }
        }

        try {
            // Fetch fresh data (this would be an API call in real implementation)
            const rawData = await this.fetchLeaderboardFromAPI();
            
            // Process and validate the data
            const processedResult = this.processLeaderboardData(rawData);
            
            if (processedResult.totalErrors > 0) {
                console.warn(`Processed leaderboard with ${processedResult.totalErrors} errors`);
            }

            // Cache the processed data with enhanced caching
            this.cacheManager.set('leaderboard', cacheKey, processedResult.data, {
                ttl: this.cacheExpiry,
                tags: ['leaderboard', 'rankings', gameType],
                priority: 2 // High priority for leaderboard data
            });
            
            // Update local cache as fallback
            this.leaderboardCache = processedResult.data;
            this.lastCacheTime = Date.now();

            return processedResult.data;
        } catch (error) {
            console.error('Failed to fetch leaderboard data:', error);
            
            // Try enhanced cache even on error
            const cachedData = this.cacheManager.get('leaderboard', cacheKey);
            if (cachedData) {
                return cachedData;
            }
            
            // Return local cached data if available, otherwise empty array
            return this.leaderboardCache || [];
        }
    }

    /**
     * Mock API call - in real implementation this would fetch from server
     */
    async fetchLeaderboardFromAPI() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data that might come from server with various data quality issues
        return [
            {
                email: 'trader1@example.com',
                username: 'ProTrader1',
                portfolioValue: 1250000,
                pnl: 250000,
                pnlPercent: 25.0,
                totalTrades: 45,
                isCurrentUser: false
            },
            {
                email: 'trader2@example.com',
                username: '', // Empty username - should fallback to email
                portfolioValue: 1180000,
                pnl: 180000,
                pnlPercent: 18.0,
                totalTrades: 32,
                isCurrentUser: false
            },
            {
                email: 'current.user@example.com',
                username: 'CurrentUser',
                portfolioValue: 1120000,
                pnl: 120000,
                pnlPercent: 12.0,
                totalTrades: 28,
                isCurrentUser: true
            },
            {
                email: 'trader4@example.com',
                // Missing username - should use email local part
                portfolioValue: 980000,
                pnl: -20000,
                pnlPercent: -2.0,
                totalTrades: 15,
                isCurrentUser: false
            },
            {
                email: 'invalid-email', // Invalid email format
                username: 'BadData',
                portfolioValue: 1050000,
                pnl: 50000,
                pnlPercent: 5.0,
                totalTrades: 22,
                isCurrentUser: false
            },
            {
                email: 'trader6@example.com',
                username: 'Trader<script>alert("xss")</script>', // XSS attempt
                portfolioValue: 1090000,
                pnl: 90000,
                pnlPercent: 9.0,
                totalTrades: 38,
                isCurrentUser: false
            }
        ];
    }

    /**
     * Clear cache with enhanced cache management
     * Requirements: 5.4, 5.5
     */
    clearCache(gameType = null) {
        // Clear enhanced cache
        if (gameType) {
            this.cacheManager.invalidate('leaderboard', {
                tags: [gameType]
            });
        } else {
            this.cacheManager.invalidate('leaderboard');
        }
        
        // Clear user cache
        this.cacheManager.invalidate('users', {
            tags: ['leaderboard']
        });
        
        // Clear local cache
        this.leaderboardCache = null;
        this.lastCacheTime = null;
        this.userCache.clear();
    }

    /**
     * Refresh leaderboard data
     * Requirements: 5.4
     */
    async refreshLeaderboardData(gameType = 'default') {
        const cacheKey = `leaderboard-${gameType}`;
        
        return await this.cacheManager.refresh('leaderboard', cacheKey, 
            () => this.fetchLeaderboardFromAPI(), {
                ttl: this.cacheExpiry,
                tags: ['leaderboard', 'rankings', gameType],
                priority: 2
            });
    }

    /**
     * Get user display information with enhanced caching
     * Requirements: 5.1, 5.5
     */
    getUserDisplayInfo(user) {
        const cacheKey = user.email || user.username || 'unknown';
        
        // Try enhanced cache first
        let displayInfo = this.cacheManager.get('users', cacheKey);
        if (displayInfo) {
            return displayInfo;
        }
        
        // Try local cache
        if (this.userCache.has(cacheKey)) {
            return this.userCache.get(cacheKey);
        }

        // Generate display info
        displayInfo = {
            displayName: this.resolveDisplayName(user),
            email: user.email || '',
            username: user.username || '',
            avatar: this.generateAvatar(user)
        };

        // Cache in enhanced cache manager
        this.cacheManager.set('users', cacheKey, displayInfo, {
            ttl: 900000, // 15 minutes for user data
            tags: ['users', 'display-info', 'leaderboard'],
            priority: 1 // Medium priority for user display info
        });
        
        // Cache locally as fallback
        this.userCache.set(cacheKey, displayInfo);
        return displayInfo;
    }

    /**
     * Generate avatar initials or placeholder
     */
    generateAvatar(user) {
        const displayName = this.resolveDisplayName(user);
        
        if (displayName && displayName !== 'Unknown User' && displayName !== 'Anonymous User') {
            return displayName.charAt(0).toUpperCase();
        }
        
        return '?';
    }

    /**
     * Search and filter leaderboard data
     */
    searchAndFilter(data, searchTerm = '', filterType = 'all') {
        if (!Array.isArray(data)) {
            return [];
        }

        let filtered = [...data];

        // Apply search filter
        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(entry => {
                const displayName = entry.displayName || this.resolveDisplayName(entry);
                return displayName.toLowerCase().includes(term) ||
                       (entry.email && entry.email.toLowerCase().includes(term)) ||
                       (entry.username && entry.username.toLowerCase().includes(term));
            });
        }

        // Apply category filter
        switch (filterType) {
            case 'top10':
                filtered = filtered.slice(0, 10);
                break;
            case 'top50':
                filtered = filtered.slice(0, 50);
                break;
            case 'gainers':
                filtered = filtered.filter(entry => entry.pnl > 0);
                break;
            case 'losers':
                filtered = filtered.filter(entry => entry.pnl < 0);
                break;
            case 'breakeven':
                filtered = filtered.filter(entry => Math.abs(entry.pnl) <= 50000); // Within 5% of starting capital
                break;
            // 'all' case - no additional filtering
        }

        return filtered;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardDataManager;
} else if (typeof window !== 'undefined') {
    window.LeaderboardDataManager = LeaderboardDataManager;
}