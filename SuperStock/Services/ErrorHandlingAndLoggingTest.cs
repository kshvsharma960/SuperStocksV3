using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using SuperStock.Exceptions;
using SuperStock.Models.StockData;
using SuperStock.Services;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Comprehensive test for error handling and logging functionality
    /// </summary>
    public class ErrorHandlingAndLoggingTest
    {
        private readonly ErrorMessageService _errorMessageService;
        private readonly StockDataLoggingService _loggingService;
        private readonly ILogger<ErrorHandlingAndLoggingTest> _logger;

        public ErrorHandlingAndLoggingTest(
            ErrorMessageService errorMessageService,
            StockDataLoggingService loggingService,
            ILogger<ErrorHandlingAndLoggingTest> logger)
        {
            _errorMessageService = errorMessageService ?? throw new ArgumentNullException(nameof(errorMessageService));
            _loggingService = loggingService ?? throw new ArgumentNullException(nameof(loggingService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Runs comprehensive tests for error handling and logging functionality
        /// </summary>
        public async Task<ErrorHandlingTestResult> RunComprehensiveTestAsync()
        {
            var testResult = new ErrorHandlingTestResult
            {
                TestName = "Comprehensive Error Handling and Logging Test",
                StartTime = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Starting comprehensive error handling and logging tests");

                // Test 1: Error Message Service - API Error Types
                await TestErrorMessageService(testResult);

                // Test 2: Error Message Service - Exception Handling
                await TestExceptionHandling(testResult);

                // Test 3: HTTP Status Code Categorization
                await TestHttpStatusCodeCategorization(testResult);

                // Test 4: Logging Service - Operation Logging
                await TestOperationLogging(testResult);

                // Test 5: Logging Service - Performance Metrics
                await TestPerformanceMetricsLogging(testResult);

                // Test 6: Logging Service - Error Logging
                await TestErrorLogging(testResult);

                // Test 7: Retry Logic Recommendations
                await TestRetryRecommendations(testResult);

                // Test 8: Circuit Breaker Logging
                await TestCircuitBreakerLogging(testResult);

                testResult.EndTime = DateTime.UtcNow;
                testResult.Duration = testResult.EndTime - testResult.StartTime;
                testResult.OverallSuccess = testResult.FailedTests.Count == 0;

                _logger.LogInformation("Completed error handling and logging tests. Success: {Success}, Passed: {Passed}, Failed: {Failed}",
                    testResult.OverallSuccess, testResult.PassedTests.Count, testResult.FailedTests.Count);

                return testResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during comprehensive error handling test");
                testResult.FailedTests.Add($"Test execution failed: {ex.Message}");
                testResult.OverallSuccess = false;
                return testResult;
            }
        }

        private async Task TestErrorMessageService(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing ErrorMessageService - API Error Types");

                // Test all API error types
                var errorTypes = Enum.GetValues<ApiErrorType>();
                foreach (var errorType in errorTypes)
                {
                    var message = _errorMessageService.GetUserFriendlyMessage(errorType);
                    if (string.IsNullOrWhiteSpace(message))
                    {
                        testResult.FailedTests.Add($"Empty message for error type: {errorType}");
                    }
                }

                // Test with additional context
                var contextMessage = _errorMessageService.GetUserFriendlyMessage(ApiErrorType.NetworkError, "Connection timeout");
                if (!contextMessage.Contains("Connection timeout"))
                {
                    testResult.FailedTests.Add("Additional context not included in error message");
                }

                testResult.PassedTests.Add("ErrorMessageService - API Error Types");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"ErrorMessageService test failed: {ex.Message}");
            }
        }

        private async Task TestExceptionHandling(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing ErrorMessageService - Exception Handling");

                // Test StockDataException handling
                var rateLimitEx = new RateLimitExceededException("Rate limit exceeded", retryAfterSeconds: 60);
                var rateLimitMessage = _errorMessageService.GetUserFriendlyMessage(rateLimitEx);
                if (!rateLimitMessage.Contains("60"))
                {
                    testResult.FailedTests.Add("Rate limit exception context not properly handled");
                }

                // Test InvalidSymbolException
                var invalidSymbolEx = new InvalidSymbolException("Invalid symbols", new[] { "INVALID1", "INVALID2" });
                var invalidSymbolMessage = _errorMessageService.GetUserFriendlyMessage(invalidSymbolEx);
                if (!invalidSymbolMessage.Contains("INVALID1") || !invalidSymbolMessage.Contains("INVALID2"))
                {
                    testResult.FailedTests.Add("Invalid symbol exception context not properly handled");
                }

                // Test general exceptions
                var timeoutEx = new TimeoutException("Request timed out");
                var timeoutMessage = _errorMessageService.GetUserFriendlyMessage(timeoutEx);
                if (string.IsNullOrWhiteSpace(timeoutMessage))
                {
                    testResult.FailedTests.Add("General exception handling failed");
                }

                testResult.PassedTests.Add("ErrorMessageService - Exception Handling");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"Exception handling test failed: {ex.Message}");
            }
        }

        private async Task TestHttpStatusCodeCategorization(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing HTTP Status Code Categorization");

                var testCases = new Dictionary<HttpStatusCode, ApiErrorType>
                {
                    [HttpStatusCode.Unauthorized] = ApiErrorType.AuthenticationError,
                    [HttpStatusCode.TooManyRequests] = ApiErrorType.RateLimitExceeded,
                    [HttpStatusCode.NotFound] = ApiErrorType.NotFound,
                    [HttpStatusCode.BadRequest] = ApiErrorType.InvalidRequest,
                    [HttpStatusCode.InternalServerError] = ApiErrorType.ServerError,
                    [HttpStatusCode.ServiceUnavailable] = ApiErrorType.ServiceUnavailable,
                    [HttpStatusCode.RequestTimeout] = ApiErrorType.Timeout
                };

                foreach (var testCase in testCases)
                {
                    var categorized = _errorMessageService.CategorizeHttpStatusCode(testCase.Key);
                    if (categorized != testCase.Value)
                    {
                        testResult.FailedTests.Add($"HTTP {testCase.Key} categorized as {categorized}, expected {testCase.Value}");
                    }
                }

                testResult.PassedTests.Add("HTTP Status Code Categorization");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"HTTP status code categorization test failed: {ex.Message}");
            }
        }

        private async Task TestOperationLogging(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing StockDataLoggingService - Operation Logging");

                var symbols = new[] { "AAPL", "GOOGL", "MSFT" };
                var stopwatch = _loggingService.LogOperationStart("TestOperation", symbols, "TestProvider");

                // Simulate some work
                await Task.Delay(100);

                _loggingService.LogOperationComplete("TestOperation", stopwatch, 3, 3, "TestProvider", 1);

                // Test API call logging
                _loggingService.LogApiCall("TestProvider", "/api/test", 150, 200, 1024, 2048);

                // Test cache operation logging
                _loggingService.LogCacheOperation("hit", "test_key", 5, 512);

                testResult.PassedTests.Add("StockDataLoggingService - Operation Logging");
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"Operation logging test failed: {ex.Message}");
            }
        }

        private async Task TestPerformanceMetricsLogging(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing StockDataLoggingService - Performance Metrics");

                var metrics = new PerformanceMetrics
                {
                    TotalRequests = 100,
                    SuccessfulRequests = 95,
                    FailedRequests = 5,
                    AverageResponseTimeMs = 250.5,
                    CacheHitRate = 75.2,
                    ProviderUsage = new Dictionary<string, int>
                    {
                        ["TwelveData"] = 80,
                        ["YahooFinance"] = 20
                    }
                };

                _loggingService.LogPerformanceMetrics(metrics);

                testResult.PassedTests.Add("StockDataLoggingService - Performance Metrics");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"Performance metrics logging test failed: {ex.Message}");
            }
        }

        private async Task TestErrorLogging(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing StockDataLoggingService - Error Logging");

                // Test StockDataException logging
                var rateLimitEx = new RateLimitExceededException("Rate limit exceeded", retryAfterSeconds: 60);
                _loggingService.LogError(rateLimitEx, "TestOperation", new[] { "AAPL" }, "TestProvider");

                // Test general exception logging
                var generalEx = new InvalidOperationException("Test exception");
                _loggingService.LogError(generalEx, "TestOperation", new[] { "GOOGL" }, "TestProvider",
                    new Dictionary<string, object> { ["CustomContext"] = "TestValue" });

                testResult.PassedTests.Add("StockDataLoggingService - Error Logging");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"Error logging test failed: {ex.Message}");
            }
        }

        private async Task TestRetryRecommendations(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing Retry Recommendations");

                var retryableTypes = new[] 
                { 
                    ApiErrorType.NetworkError, 
                    ApiErrorType.Timeout, 
                    ApiErrorType.ServerError,
                    ApiErrorType.ServiceUnavailable,
                    ApiErrorType.RateLimitExceeded
                };

                var nonRetryableTypes = new[]
                {
                    ApiErrorType.AuthenticationError,
                    ApiErrorType.InvalidRequest,
                    ApiErrorType.NotFound
                };

                foreach (var errorType in retryableTypes)
                {
                    var isRetryable = _errorMessageService.IsRetryable(errorType);
                    if (!isRetryable)
                    {
                        testResult.FailedTests.Add($"Error type {errorType} should be retryable but isn't");
                    }

                    var recommendation = _errorMessageService.GetRetryRecommendation(errorType);
                    if (string.IsNullOrWhiteSpace(recommendation))
                    {
                        testResult.FailedTests.Add($"Empty retry recommendation for {errorType}");
                    }
                }

                foreach (var errorType in nonRetryableTypes)
                {
                    var isRetryable = _errorMessageService.IsRetryable(errorType);
                    if (isRetryable)
                    {
                        testResult.FailedTests.Add($"Error type {errorType} should not be retryable but is");
                    }
                }

                testResult.PassedTests.Add("Retry Recommendations");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"Retry recommendations test failed: {ex.Message}");
            }
        }

        private async Task TestCircuitBreakerLogging(ErrorHandlingTestResult testResult)
        {
            try
            {
                _logger.LogInformation("Testing Circuit Breaker Logging");

                _loggingService.LogCircuitBreakerStateChange("TestProvider", "Closed", "Open", 5, DateTime.UtcNow.AddMinutes(5));
                _loggingService.LogRateLimit("TestProvider", 1000, "API rate limit");
                _loggingService.LogWatchlistOperation("add", "user123", "AAPL", true, 50);

                testResult.PassedTests.Add("Circuit Breaker Logging");
                await Task.Delay(1); // Simulate async operation
            }
            catch (Exception ex)
            {
                testResult.FailedTests.Add($"Circuit breaker logging test failed: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Test result for error handling and logging tests
    /// </summary>
    public class ErrorHandlingTestResult
    {
        public string TestName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration { get; set; }
        public bool OverallSuccess { get; set; }
        public List<string> PassedTests { get; set; } = new();
        public List<string> FailedTests { get; set; } = new();
    }
}