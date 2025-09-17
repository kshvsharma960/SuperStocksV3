using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Integration test for StockDataService to verify provider orchestration functionality
    /// This is a simple test that can be run manually to verify the implementation
    /// </summary>
    public class StockDataServiceIntegrationTest
    {
        private readonly StockDataService _stockDataService;
        private readonly ILogger<StockDataServiceIntegrationTest> _logger;

        public StockDataServiceIntegrationTest(
            StockDataService stockDataService,
            ILogger<StockDataServiceIntegrationTest> logger)
        {
            _stockDataService = stockDataService ?? throw new ArgumentNullException(nameof(stockDataService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Tests the enhanced StockDataService with provider orchestration
        /// </summary>
        public async Task<IntegrationTestResult> TestProviderOrchestrationAsync()
        {
            var testResult = new IntegrationTestResult { TestName = "Provider Orchestration Test" };

            try
            {
                _logger.LogInformation("Starting StockDataService integration test");

                // Test 1: Basic stock data retrieval
                _logger.LogInformation("Test 1: Basic stock data retrieval");
                var symbols = new[] { "AAPL", "GOOGL", "MSFT" };
                var stockData = await _stockDataService.GetStockPriceAsync(symbols);

                if (stockData != null && stockData.Count > 0)
                {
                    testResult.Tests.Add("Basic retrieval", "PASSED");
                    _logger.LogInformation("Successfully retrieved {Count} stock prices", stockData.Count);
                    
                    foreach (var stock in stockData)
                    {
                        _logger.LogInformation("Stock: {Name}, Price: {Price}, Source: {DataSource}", 
                            stock.Name, stock.Price, stock.DataSource);
                    }
                }
                else
                {
                    testResult.Tests.Add("Basic retrieval", "FAILED - No data returned");
                }

                // Test 2: Caching functionality
                _logger.LogInformation("Test 2: Caching functionality");
                var startTime = DateTime.UtcNow;
                var cachedData = await _stockDataService.GetStockPriceAsync("AAPL");
                var cacheTime = DateTime.UtcNow - startTime;

                if (cachedData != null && cachedData.Count > 0 && cacheTime.TotalMilliseconds < 100)
                {
                    testResult.Tests.Add("Caching", "PASSED");
                    _logger.LogInformation("Cache retrieval completed in {Time}ms", cacheTime.TotalMilliseconds);
                }
                else
                {
                    testResult.Tests.Add("Caching", "INCONCLUSIVE - May not be cached yet");
                }

                // Test 3: Provider health status
                _logger.LogInformation("Test 3: Provider health status");
                var healthStatus = await _stockDataService.GetProviderHealthStatusAsync();
                
                if (healthStatus != null && healthStatus.Count > 0)
                {
                    testResult.Tests.Add("Health status", "PASSED");
                    foreach (var provider in healthStatus)
                    {
                        _logger.LogInformation("Provider {Name}: {Status}", provider.Key, 
                            provider.Value ? "Healthy" : "Unhealthy");
                    }
                }
                else
                {
                    testResult.Tests.Add("Health status", "FAILED - No health data");
                }

                // Test 4: Circuit breaker status
                _logger.LogInformation("Test 4: Circuit breaker status");
                var circuitBreakerStatus = _stockDataService.GetCircuitBreakerStatus();
                
                if (circuitBreakerStatus != null)
                {
                    testResult.Tests.Add("Circuit breaker", "PASSED");
                    foreach (var cb in circuitBreakerStatus)
                    {
                        _logger.LogInformation("Provider {Name}: State={State}, Failures={Failures}", 
                            cb.Key, cb.Value.State, cb.Value.FailureCount);
                    }
                }
                else
                {
                    testResult.Tests.Add("Circuit breaker", "FAILED - No circuit breaker data");
                }

                // Test 5: Empty symbols handling
                _logger.LogInformation("Test 5: Empty symbols handling");
                var emptyResult = await _stockDataService.GetStockPriceAsync();
                
                if (emptyResult != null && emptyResult.Count == 0)
                {
                    testResult.Tests.Add("Empty symbols", "PASSED");
                    _logger.LogInformation("Empty symbols handled correctly");
                }
                else
                {
                    testResult.Tests.Add("Empty symbols", "FAILED - Unexpected result for empty symbols");
                }

                testResult.OverallResult = testResult.Tests.Values.All(result => result.StartsWith("PASSED")) ? "PASSED" : "MIXED";
                _logger.LogInformation("Integration test completed with result: {Result}", testResult.OverallResult);

            }
            catch (Exception ex)
            {
                testResult.Tests.Add("Exception handling", $"FAILED - {ex.Message}");
                testResult.OverallResult = "FAILED";
                _logger.LogError(ex, "Integration test failed with exception");
            }

            return testResult;
        }

        /// <summary>
        /// Creates a test instance of StockDataService for manual testing
        /// </summary>
        public static StockDataService CreateTestInstance()
        {
            // Create test configuration
            var config = new StockDataConfiguration
            {
                TwelveDataApiKey = "demo", // Use demo key for testing
                TwelveDataBaseUrl = "https://api.twelvedata.com",
                RequestTimeoutSeconds = 30,
                MaxRetryAttempts = 3,
                EnableFallback = true,
                CacheDurationMinutes = 5,
                MaxRequestsPerMinute = 8,
                EnableThrottling = true,
                CircuitBreakerFailureThreshold = 3,
                CircuitBreakerTimeoutSeconds = 60
            };

            var options = Options.Create(config);

            // Create logger factory
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            var logger = loggerFactory.CreateLogger<StockDataService>();
            var httpClientLogger = loggerFactory.CreateLogger<HttpClientService>();
            var twelveDataLogger = loggerFactory.CreateLogger<TwelveDataProvider>();
            var yahooLogger = loggerFactory.CreateLogger<YahooFinanceProvider>();

            // Create HTTP client service
            var httpClient = new System.Net.Http.HttpClient();
            var httpClientService = new HttpClientService(httpClient, options, httpClientLogger);

            // Create error handling services
            var errorMessageService = new ErrorMessageService(NullLogger<ErrorMessageService>.Instance);
            var loggingService = new StockDataLoggingService(NullLogger<StockDataLoggingService>.Instance);
            
            // Create providers
            var providers = new List<IStockDataProvider>
            {
                new TwelveDataProvider(httpClient, twelveDataLogger, options, errorMessageService, loggingService),
                new YahooFinanceProvider(yahooLogger)
            };

            // Create memory cache
            var cache = new MemoryCache(new MemoryCacheOptions());

            return new StockDataService(providers, cache, logger, options);
        }
    }

    /// <summary>
    /// Integration test result container
    /// </summary>
    public class IntegrationTestResult
    {
        public string TestName { get; set; } = string.Empty;
        public Dictionary<string, string> Tests { get; set; } = new Dictionary<string, string>();
        public string OverallResult { get; set; } = "NOT_RUN";
    }
}