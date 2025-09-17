using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Models.StockData;
using System;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Manages API key validation and rotation for stock data providers
    /// </summary>
    public class ApiKeyManager
    {
        private readonly StockDataConfiguration _config;
        private readonly HttpClientService _httpClientService;
        private readonly ILogger<ApiKeyManager> _logger;
        private DateTime _lastValidationTime = DateTime.MinValue;
        private bool _isKeyValid = false;
        private readonly TimeSpan _validationCacheTimeout = TimeSpan.FromHours(1);

        public ApiKeyManager(
            IOptions<StockDataConfiguration> config,
            HttpClientService httpClientService,
            ILogger<ApiKeyManager> logger)
        {
            _config = config?.Value ?? throw new ArgumentNullException(nameof(config));
            _httpClientService = httpClientService ?? throw new ArgumentNullException(nameof(httpClientService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Gets the current API key for Twelve Data
        /// </summary>
        public string GetTwelveDataApiKey()
        {
            if (string.IsNullOrWhiteSpace(_config.TwelveDataApiKey))
            {
                throw new InvalidOperationException("Twelve Data API key is not configured");
            }

            return _config.TwelveDataApiKey;
        }

        /// <summary>
        /// Validates the API key by making a test request
        /// </summary>
        public async Task<ApiKeyValidationResult> ValidateApiKeyAsync()
        {
            // Check if we have a cached validation result
            if (_lastValidationTime != DateTime.MinValue && 
                DateTime.UtcNow - _lastValidationTime < _validationCacheTimeout && 
                _isKeyValid)
            {
                _logger.LogDebug("Using cached API key validation result");
                return new ApiKeyValidationResult
                {
                    IsValid = true,
                    Message = "API key is valid (cached result)",
                    ValidatedAt = _lastValidationTime
                };
            }

            try
            {
                _logger.LogInformation("Validating Twelve Data API key");

                var apiKey = GetTwelveDataApiKey();
                var testUrl = $"{_config.TwelveDataBaseUrl}/quote?symbol=AAPL&apikey={apiKey}";

                var response = await _httpClientService.GetAsync<TwelveDataQuoteResponse>(testUrl);

                if (response.IsSuccess && response.Data != null)
                {
                    _isKeyValid = true;
                    _lastValidationTime = DateTime.UtcNow;
                    
                    _logger.LogInformation("API key validation successful");
                    
                    return new ApiKeyValidationResult
                    {
                        IsValid = true,
                        Message = "API key is valid",
                        ValidatedAt = _lastValidationTime
                    };
                }
                else
                {
                    _isKeyValid = false;
                    var errorMessage = response.Message ?? "Unknown validation error";
                    
                    _logger.LogWarning("API key validation failed: {ErrorMessage}", errorMessage);
                    
                    return new ApiKeyValidationResult
                    {
                        IsValid = false,
                        Message = $"API key validation failed: {errorMessage}",
                        ValidatedAt = DateTime.UtcNow
                    };
                }
            }
            catch (Exception ex)
            {
                _isKeyValid = false;
                _logger.LogError(ex, "Error during API key validation");
                
                return new ApiKeyValidationResult
                {
                    IsValid = false,
                    Message = $"API key validation error: {ex.Message}",
                    ValidatedAt = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// Checks if the API key is currently valid (uses cached result if available)
        /// </summary>
        public bool IsApiKeyValid()
        {
            if (_lastValidationTime == DateTime.MinValue)
            {
                return false; // Never validated
            }

            if (DateTime.UtcNow - _lastValidationTime > _validationCacheTimeout)
            {
                return false; // Validation expired
            }

            return _isKeyValid;
        }

        /// <summary>
        /// Forces a fresh validation of the API key (ignores cache)
        /// </summary>
        public async Task<ApiKeyValidationResult> ForceValidateApiKeyAsync()
        {
            _lastValidationTime = DateTime.MinValue; // Clear cache
            return await ValidateApiKeyAsync();
        }

        /// <summary>
        /// Gets information about the current API key status
        /// </summary>
        public ApiKeyStatus GetApiKeyStatus()
        {
            return new ApiKeyStatus
            {
                HasApiKey = !string.IsNullOrWhiteSpace(_config.TwelveDataApiKey),
                IsValid = _isKeyValid,
                LastValidated = _lastValidationTime,
                ValidationExpiry = _lastValidationTime.Add(_validationCacheTimeout)
            };
        }
    }

    /// <summary>
    /// Result of API key validation
    /// </summary>
    public class ApiKeyValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime ValidatedAt { get; set; }
    }

    /// <summary>
    /// Current status of the API key
    /// </summary>
    public class ApiKeyStatus
    {
        public bool HasApiKey { get; set; }
        public bool IsValid { get; set; }
        public DateTime LastValidated { get; set; }
        public DateTime ValidationExpiry { get; set; }
    }
}