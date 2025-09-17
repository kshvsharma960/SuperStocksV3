using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using SuperStock.Exceptions;
using SuperStock.Models;
using System;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Verification class to test watchlist CRUD operations
    /// This can be called from a controller endpoint for manual testing
    /// </summary>
    public class WatchlistVerification
    {
        private readonly WatchlistService _watchlistService;
        private readonly ILogger<WatchlistVerification> _logger;

        public WatchlistVerification(WatchlistService watchlistService, ILogger<WatchlistVerification> logger)
        {
            _watchlistService = watchlistService ?? throw new ArgumentNullException(nameof(watchlistService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Runs comprehensive tests on watchlist functionality
        /// </summary>
        public async Task<WatchlistVerificationResult> RunVerificationTests(string testEmail)
        {
            var result = new WatchlistVerificationResult();
            
            try
            {
                _logger.LogInformation("Starting watchlist verification tests for {Email}", testEmail);

                // Test 1: Add stock to watchlist
                await TestAddToWatchlist(testEmail, "AAPL", result);

                // Test 2: Add another stock
                await TestAddToWatchlist(testEmail, "MSFT", result);

                // Test 3: Try to add duplicate (should fail)
                await TestDuplicateAddition(testEmail, "AAPL", result);

                // Test 4: Get watchlist symbols
                await TestGetWatchlistSymbols(testEmail, result);

                // Test 5: Remove stock from watchlist
                await TestRemoveFromWatchlist(testEmail, "AAPL", result);

                // Test 6: Try to remove non-existent stock (should fail)
                await TestRemoveNonExistent(testEmail, "GOOGL", result);

                // Test 7: Test invalid symbol format
                await TestInvalidSymbol(testEmail, "INVALID@SYMBOL", result);

                // Test 8: Batch add stocks
                await TestBatchAdd(testEmail, new[] { "GOOGL", "TSLA", "NVDA" }, result);

                // Test 9: Case insensitive operations
                await TestCaseInsensitive(testEmail, result);

                // Test 10: Symbol validation
                await TestSymbolValidation(testEmail, result);

                result.OverallSuccess = result.PassedTests == result.TotalTests;
                
                _logger.LogInformation("Watchlist verification completed. Passed: {Passed}/{Total}", 
                    result.PassedTests, result.TotalTests);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during watchlist verification");
                result.ErrorMessage = ex.Message;
                result.OverallSuccess = false;
                return result;
            }
        }

        private async Task TestAddToWatchlist(string email, string symbol, WatchlistVerificationResult result)
        {
            try
            {
                var response = await _watchlistService.AddToWatchlistAsync(email, symbol);
                if (response.Success && response.Message.Contains(symbol))
                {
                    result.AddTestResult($"✓ Add {symbol} to watchlist", true, "Successfully added stock");
                }
                else
                {
                    result.AddTestResult($"✗ Add {symbol} to watchlist", false, "Unexpected response");
                }
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Add {symbol} to watchlist", false, ex.Message);
            }
        }

        private async Task TestDuplicateAddition(string email, string symbol, WatchlistVerificationResult result)
        {
            try
            {
                await _watchlistService.AddToWatchlistAsync(email, symbol);
                result.AddTestResult($"✗ Duplicate addition prevention", false, "Should have thrown exception");
            }
            catch (DuplicateWatchlistItemException)
            {
                result.AddTestResult($"✓ Duplicate addition prevention", true, "Correctly prevented duplicate");
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Duplicate addition prevention", false, $"Wrong exception: {ex.Message}");
            }
        }

        private async Task TestGetWatchlistSymbols(string email, WatchlistVerificationResult result)
        {
            try
            {
                var symbols = await _watchlistService.GetWatchlistSymbolsAsync(email);
                if (symbols != null && symbols.Count > 0)
                {
                    result.AddTestResult($"✓ Get watchlist symbols", true, $"Retrieved {symbols.Count} symbols");
                }
                else
                {
                    result.AddTestResult($"✗ Get watchlist symbols", false, "No symbols returned");
                }
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Get watchlist symbols", false, ex.Message);
            }
        }

        private async Task TestRemoveFromWatchlist(string email, string symbol, WatchlistVerificationResult result)
        {
            try
            {
                var response = await _watchlistService.RemoveFromWatchlistAsync(email, symbol);
                if (response.Success && response.Message.Contains(symbol))
                {
                    result.AddTestResult($"✓ Remove {symbol} from watchlist", true, "Successfully removed stock");
                }
                else
                {
                    result.AddTestResult($"✗ Remove {symbol} from watchlist", false, "Unexpected response");
                }
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Remove {symbol} from watchlist", false, ex.Message);
            }
        }

        private async Task TestRemoveNonExistent(string email, string symbol, WatchlistVerificationResult result)
        {
            try
            {
                await _watchlistService.RemoveFromWatchlistAsync(email, symbol);
                result.AddTestResult($"✗ Remove non-existent stock", false, "Should have thrown exception");
            }
            catch (WatchlistItemNotFoundException)
            {
                result.AddTestResult($"✓ Remove non-existent stock", true, "Correctly handled non-existent stock");
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Remove non-existent stock", false, $"Wrong exception: {ex.Message}");
            }
        }

        private async Task TestInvalidSymbol(string email, string symbol, WatchlistVerificationResult result)
        {
            try
            {
                await _watchlistService.AddToWatchlistAsync(email, symbol);
                result.AddTestResult($"✗ Invalid symbol validation", false, "Should have thrown exception");
            }
            catch (InvalidStockSymbolException)
            {
                result.AddTestResult($"✓ Invalid symbol validation", true, "Correctly rejected invalid symbol");
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Invalid symbol validation", false, $"Wrong exception: {ex.Message}");
            }
        }

        private async Task TestBatchAdd(string email, string[] symbols, WatchlistVerificationResult result)
        {
            try
            {
                var response = await _watchlistService.BatchAddToWatchlistAsync(email, symbols);
                if (response.Success)
                {
                    result.AddTestResult($"✓ Batch add stocks", true, "Successfully added multiple stocks");
                }
                else
                {
                    result.AddTestResult($"✗ Batch add stocks", false, "Batch add failed");
                }
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Batch add stocks", false, ex.Message);
            }
        }

        private async Task TestCaseInsensitive(string email, WatchlistVerificationResult result)
        {
            try
            {
                // Try to add lowercase version of existing stock
                await _watchlistService.AddToWatchlistAsync(email, "msft");
                result.AddTestResult($"✗ Case insensitive duplicate check", false, "Should have prevented duplicate");
            }
            catch (DuplicateWatchlistItemException)
            {
                result.AddTestResult($"✓ Case insensitive duplicate check", true, "Correctly handled case insensitive duplicate");
            }
            catch (Exception ex)
            {
                result.AddTestResult($"✗ Case insensitive duplicate check", false, ex.Message);
            }
        }

        private async Task TestSymbolValidation(string email, WatchlistVerificationResult result)
        {
            var validSymbols = new[] { "AAPL", "BRK.A", "BRK-B", "A" };
            var invalidSymbols = new[] { "SYMBOL@", "SYMBOL WITH SPACES", "SYMBOL!", "" };

            int validCount = 0;
            int invalidCount = 0;

            // Test valid symbols
            foreach (var symbol in validSymbols)
            {
                try
                {
                    await _watchlistService.AddToWatchlistAsync(email, symbol);
                    validCount++;
                    // Clean up
                    try { await _watchlistService.RemoveFromWatchlistAsync(email, symbol); } catch { }
                }
                catch (DuplicateWatchlistItemException)
                {
                    validCount++; // Already exists, that's fine
                }
                catch (Exception)
                {
                    // Invalid symbol rejected
                }
            }

            // Test invalid symbols
            foreach (var symbol in invalidSymbols)
            {
                try
                {
                    await _watchlistService.AddToWatchlistAsync(email, symbol);
                }
                catch (InvalidStockSymbolException)
                {
                    invalidCount++; // Correctly rejected
                }
                catch (Exception)
                {
                    // Other exceptions are also acceptable for invalid symbols
                    invalidCount++;
                }
            }

            if (validCount == validSymbols.Length && invalidCount == invalidSymbols.Length)
            {
                result.AddTestResult($"✓ Symbol format validation", true, "All symbols validated correctly");
            }
            else
            {
                result.AddTestResult($"✗ Symbol format validation", false, 
                    $"Valid: {validCount}/{validSymbols.Length}, Invalid: {invalidCount}/{invalidSymbols.Length}");
            }
        }
    }

    public class WatchlistVerificationResult
    {
        public bool OverallSuccess { get; set; }
        public int TotalTests { get; set; }
        public int PassedTests { get; set; }
        public string ErrorMessage { get; set; }
        public System.Collections.Generic.List<string> TestResults { get; set; } = new System.Collections.Generic.List<string>();

        public void AddTestResult(string testName, bool passed, string message)
        {
            TotalTests++;
            if (passed) PassedTests++;
            TestResults.Add($"{testName}: {message}");
        }

        public override string ToString()
        {
            var result = $"Watchlist Verification Results:\n";
            result += $"Overall Success: {OverallSuccess}\n";
            result += $"Tests Passed: {PassedTests}/{TotalTests}\n";
            
            if (!string.IsNullOrEmpty(ErrorMessage))
            {
                result += $"Error: {ErrorMessage}\n";
            }

            result += "\nDetailed Results:\n";
            foreach (var testResult in TestResults)
            {
                result += $"  {testResult}\n";
            }

            return result;
        }
    }
}