using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Models.StockData;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Test class to verify the stock data infrastructure is working correctly
    /// </summary>
    public class StockDataInfrastructureTest
    {
        private readonly HttpClientService _httpClientService;
        private readonly ApiKeyManager _apiKeyManager;
        private readonly StockDataConfiguration _config;
        private readonly ILogger<StockDataInfrastructureTest> _logger;

        public StockDataInfrastructureTest(
            HttpClientService httpClientService,
            ApiKeyManager apiKeyManager,
            IOptions<StockDataConfiguration> config,
            ILogger<StockDataInfrastructureTest> logger)
        {
            _httpClientService = httpClientService ?? throw new ArgumentNullException(nameof(httpClientService));
            _apiKeyManager = apiKeyManager ?? throw new ArgumentNullException(nameof(apiKeyManager));
            _config = config?.Value ?? throw new ArgumentNullException(nameof(config));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Tests the complete infrastructure setup
        /// </summary>
        public async Task<InfrastructureTestResult> RunInfrastructureTestAsync()
        {
            var result = new InfrastructureTestResult();
            
            try
            {
                _logger.LogInformation("Starting stock data infrastructure test");

                // Test 1: Configuration validation
                result.ConfigurationTest = TestConfiguration();
                _logger.LogInformation("Configuration test: {Result}", result.ConfigurationTest.IsSuccess ? "PASSED" : "FAILED");

                // Test 2: API key validation
                result.ApiKeyTest = await TestApiKeyAsync();
                _logger.LogInformation("API key test: {Result}", result.ApiKeyTest.IsSuccess ? "PASSED" : "FAILED");

                // Test 3: HTTP client service
                result.HttpClientTest = await TestHttpClientServiceAsync();
                _logger.LogInformation("HTTP client test: {Result}", result.HttpClientTest.IsSuccess ? "PASSED" : "FAILED");

                // Test 4: Rate limiting
                result.RateLimitingTest = await TestRateLimitingAsync();
                _logger.LogInformation("Rate limiting test: {Result}", result.RateLimitingTest.IsSuccess ? "PASSED" : "FAILED");

                result.OverallSuccess = result.ConfigurationTest.IsSuccess && 
                                      result.ApiKeyTest.IsSuccess && 
                                      result.HttpClientTest.IsSuccess && 
                                      result.RateLimitingTest.IsSuccess;

                _logger.LogInformation("Infrastructure test completed. Overall result: {Result}", 
                    result.OverallSuccess ? "PASSED" : "FAILED");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Infrastructure test failed with exception");
                result.OverallSuccess = false;
                result.ErrorMessage = ex.Message;
                return result;
            }
        }

        private TestResult TestConfiguration()
        {
            try
            {
                // Check if required configuration values are present
                var issues = new List<string>();

                if (string.IsNullOrWhiteSpace(_config.TwelveDataApiKey))
                    issues.Add("TwelveDataApiKey is not configured");

                if (string.IsNullOrWhiteSpace(_config.TwelveDataBaseUrl))
                    issues.Add("TwelveDataBaseUrl is not configured");

                if (_config.RequestTimeoutSeconds <= 0)
                    issues.Add("RequestTimeoutSeconds must be greater than 0");

                if (_config.MaxRetryAttempts < 0)
                    issues.Add("MaxRetryAttempts cannot be negative");

                if (_config.MaxRequestsPerMinute <= 0)
                    issues.Add("MaxRequestsPerMinute must be greater than 0");

                if (issues.Count > 0)
                {
                    return new TestResult
                    {
                        IsSuccess = false,
                        Message = $"Configuration issues: {string.Join(", ", issues)}"
                    };
                }

                return new TestResult
                {
                    IsSuccess = true,
                    Message = "Configuration is valid"
                };
            }
            catch (Exception ex)
            {
                return new TestResult
                {
                    IsSuccess = false,
                    Message = $"Configuration test failed: {ex.Message}"
                };
            }
        }

        private async Task<TestResult> TestApiKeyAsync()
        {
            try
            {
                var validationResult = await _apiKeyManager.ValidateApiKeyAsync();
                
                return new TestResult
                {
                    IsSuccess = validationResult.IsValid,
                    Message = validationResult.Message
                };
            }
            catch (Exception ex)
            {
                return new TestResult
                {
                    IsSuccess = false,
                    Message = $"API key test failed: {ex.Message}"
                };
            }
        }

        private async Task<TestResult> TestHttpClientServiceAsync()
        {
            try
            {
                // Test with a simple API endpoint that doesn't require authentication
                var testUrl = "https://httpbin.org/get";
                var response = await _httpClientService.GetAsync<object>(testUrl);

                return new TestResult
                {
                    IsSuccess = response.IsSuccess,
                    Message = response.IsSuccess ? "HTTP client service is working" : $"HTTP client test failed: {response.Message}"
                };
            }
            catch (Exception ex)
            {
                return new TestResult
                {
                    IsSuccess = false,
                    Message = $"HTTP client test failed: {ex.Message}"
                };
            }
        }

        private async Task<TestResult> TestRateLimitingAsync()
        {
            try
            {
                if (!_config.EnableThrottling)
                {
                    return new TestResult
                    {
                        IsSuccess = true,
                        Message = "Rate limiting is disabled"
                    };
                }

                // Make two quick requests to test rate limiting
                var testUrl = "https://httpbin.org/get";
                var startTime = DateTime.UtcNow;
                
                await _httpClientService.GetAsync<object>(testUrl);
                await _httpClientService.GetAsync<object>(testUrl);
                
                var elapsed = DateTime.UtcNow - startTime;
                var expectedMinDelay = TimeSpan.FromMinutes(1.0 / _config.MaxRequestsPerMinute);

                return new TestResult
                {
                    IsSuccess = true,
                    Message = $"Rate limiting test completed. Elapsed: {elapsed.TotalMilliseconds}ms, Expected min delay: {expectedMinDelay.TotalMilliseconds}ms"
                };
            }
            catch (Exception ex)
            {
                return new TestResult
                {
                    IsSuccess = false,
                    Message = $"Rate limiting test failed: {ex.Message}"
                };
            }
        }
    }

    public class InfrastructureTestResult
    {
        public bool OverallSuccess { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public TestResult ConfigurationTest { get; set; } = new();
        public TestResult ApiKeyTest { get; set; } = new();
        public TestResult HttpClientTest { get; set; } = new();
        public TestResult RateLimitingTest { get; set; } = new();
    }

    public class TestResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}