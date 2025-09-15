/**
 * Test suite for LeaderboardDataManager
 * Verifies the functionality of user name/email display logic, data validation, and ranking
 */

class LeaderboardDataManagerTest {
    constructor() {
        this.dataManager = new LeaderboardDataManager();
        this.testResults = [];
    }

    runAllTests() {
        console.log('Running LeaderboardDataManager tests...');
        
        this.testDisplayNameResolution();
        this.testDataValidation();
        this.testDataSanitization();
        this.testSortingAndRanking();
        this.testSearchAndFilter();
        
        this.printResults();
    }

    testDisplayNameResolution() {
        console.log('Testing display name resolution...');
        
        // Test with username
        const user1 = { username: 'ProTrader', email: 'trader@example.com' };
        const result1 = this.dataManager.resolveDisplayName(user1);
        this.assert(result1 === 'ProTrader', 'Should use username when available', result1);

        // Test with email fallback
        const user2 = { email: 'trader@example.com' };
        const result2 = this.dataManager.resolveDisplayName(user2);
        this.assert(result2 === 'trader', 'Should use email local part when username missing', result2);

        // Test with empty username
        const user3 = { username: '', email: 'trader@example.com' };
        const result3 = this.dataManager.resolveDisplayName(user3);
        this.assert(result3 === 'trader', 'Should fallback to email when username is empty', result3);

        // Test with null/undefined
        const result4 = this.dataManager.resolveDisplayName(null);
        this.assert(result4 === 'Unknown User', 'Should handle null user', result4);

        // Test with name field
        const user5 = { name: 'John Doe', email: 'john@example.com' };
        const result5 = this.dataManager.resolveDisplayName(user5);
        this.assert(result5 === 'John Doe', 'Should use name field when available', result5);
    }

    testDataValidation() {
        console.log('Testing data validation...');
        
        // Valid entry
        const validEntry = {
            email: 'trader@example.com',
            username: 'trader',
            portfolioValue: 1100000,
            pnl: 100000,
            pnlPercent: 10.0,
            totalTrades: 25,
            rank: 1
        };
        
        const validation1 = this.dataManager.validateLeaderboardEntry(validEntry);
        this.assert(validation1.isValid === true, 'Should validate correct entry', validation1.errors);

        // Invalid email
        const invalidEntry = {
            email: 'invalid-email',
            portfolioValue: 1100000,
            rank: 1
        };
        
        const validation2 = this.dataManager.validateLeaderboardEntry(invalidEntry);
        this.assert(validation2.isValid === false, 'Should reject invalid email', validation2.errors);

        // Missing required fields
        const incompleteEntry = {
            username: 'trader'
        };
        
        const validation3 = this.dataManager.validateLeaderboardEntry(incompleteEntry);
        this.assert(validation3.isValid === false, 'Should reject incomplete entry', validation3.errors);

        // Negative portfolio value
        const negativeEntry = {
            email: 'trader@example.com',
            portfolioValue: -1000,
            rank: 1
        };
        
        const validation4 = this.dataManager.validateLeaderboardEntry(negativeEntry);
        this.assert(validation4.isValid === false, 'Should reject negative portfolio value', validation4.errors);
    }

    testDataSanitization() {
        console.log('Testing data sanitization...');
        
        // XSS attempt
        const maliciousEntry = {
            email: 'trader@example.com',
            username: '<script>alert("xss")</script>',
            portfolioValue: 1100000,
            rank: 1
        };
        
        const validation = this.dataManager.validateLeaderboardEntry(maliciousEntry);
        const sanitized = validation.sanitizedEntry;
        
        this.assert(
            !sanitized.username.includes('<script>'), 
            'Should sanitize XSS attempts', 
            sanitized.username
        );
        
        this.assert(
            sanitized.username.includes('&lt;script&gt;'), 
            'Should escape HTML entities', 
            sanitized.username
        );
    }

    testSortingAndRanking() {
        console.log('Testing sorting and ranking...');
        
        const testData = [
            {
                email: 'trader1@example.com',
                username: 'trader1',
                portfolioValue: 1200000,
                pnl: 200000,
                pnlPercent: 20.0,
                totalTrades: 30
            },
            {
                email: 'trader2@example.com',
                username: 'trader2',
                portfolioValue: 1100000,
                pnl: 100000,
                pnlPercent: 10.0,
                totalTrades: 25
            },
            {
                email: 'trader3@example.com',
                username: 'trader3',
                portfolioValue: 1200000, // Same as trader1
                pnl: 200000,
                pnlPercent: 20.0,
                totalTrades: 35 // More trades, should rank higher in tie
            }
        ];

        const sorted = this.dataManager.sortAndRankData(testData);
        
        // trader3 should be rank 1 (same portfolio value but more trades)
        this.assert(sorted[0].email === 'trader3@example.com', 'Should rank by trades in tie', sorted[0].email);
        this.assert(sorted[0].rank === 1, 'First place should have rank 1', sorted[0].rank);
        
        // trader1 should be rank 1 too (tie)
        this.assert(sorted[1].rank === 1, 'Tied entries should have same rank', sorted[1].rank);
        
        // trader2 should be rank 3 (after the tie)
        this.assert(sorted[2].rank === 3, 'After tie, rank should skip numbers', sorted[2].rank);
    }

    testSearchAndFilter() {
        console.log('Testing search and filter...');
        
        const testData = [
            {
                email: 'alice@example.com',
                username: 'alice',
                displayName: 'alice',
                portfolioValue: 1200000,
                pnl: 200000
            },
            {
                email: 'bob@example.com',
                username: 'bob',
                displayName: 'bob',
                portfolioValue: 900000,
                pnl: -100000
            },
            {
                email: 'charlie@example.com',
                username: 'charlie',
                displayName: 'charlie',
                portfolioValue: 1100000,
                pnl: 100000
            }
        ];

        // Test search
        const searchResult = this.dataManager.searchAndFilter(testData, 'alice');
        this.assert(searchResult.length === 1, 'Should find one result for alice', searchResult.length);
        this.assert(searchResult[0].username === 'alice', 'Should return correct user', searchResult[0].username);

        // Test gainers filter
        const gainersResult = this.dataManager.searchAndFilter(testData, '', 'gainers');
        this.assert(gainersResult.length === 2, 'Should find 2 gainers', gainersResult.length);
        this.assert(gainersResult.every(u => u.pnl > 0), 'All results should have positive P&L');

        // Test losers filter
        const losersResult = this.dataManager.searchAndFilter(testData, '', 'losers');
        this.assert(losersResult.length === 1, 'Should find 1 loser', losersResult.length);
        this.assert(losersResult[0].username === 'bob', 'Should return bob as loser', losersResult[0].username);
    }

    assert(condition, message, actual = null) {
        const result = {
            passed: condition,
            message: message,
            actual: actual
        };
        
        this.testResults.push(result);
        
        if (condition) {
            console.log(`✓ ${message}`);
        } else {
            console.error(`✗ ${message}`, actual ? `(got: ${JSON.stringify(actual)})` : '');
        }
    }

    printResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`\nTest Results: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed. Check the output above for details.');
        }
    }
}

// Auto-run tests when script is loaded (for development)
if (typeof window !== 'undefined' && window.LeaderboardDataManager) {
    // Run tests after a short delay to ensure DOM is ready
    setTimeout(() => {
        const tester = new LeaderboardDataManagerTest();
        tester.runAllTests();
    }, 100);
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.LeaderboardDataManagerTest = LeaderboardDataManagerTest;
}