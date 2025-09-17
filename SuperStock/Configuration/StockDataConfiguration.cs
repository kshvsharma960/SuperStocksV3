using System.ComponentModel.DataAnnotations;

namespace SuperStock.Configuration
{
    /// <summary>
    /// Configuration settings for stock data API providers
    /// </summary>
    public class StockDataConfiguration
    {
        public const string SectionName = "StockData";

        /// <summary>
        /// Twelve Data API key for authentication
        /// </summary>
        [Required]
        public string TwelveDataApiKey { get; set; } = string.Empty;

        /// <summary>
        /// Base URL for Twelve Data API
        /// </summary>
        public string TwelveDataBaseUrl { get; set; } = "https://api.twelvedata.com";

        /// <summary>
        /// HTTP request timeout in seconds
        /// </summary>
        public int RequestTimeoutSeconds { get; set; } = 30;

        /// <summary>
        /// Maximum number of retry attempts for failed requests
        /// </summary>
        public int MaxRetryAttempts { get; set; } = 3;

        /// <summary>
        /// Enable fallback to alternative providers when primary fails
        /// </summary>
        public bool EnableFallback { get; set; } = true;

        /// <summary>
        /// Cache duration for stock data in minutes
        /// </summary>
        public int CacheDurationMinutes { get; set; } = 5;

        /// <summary>
        /// Rate limit: maximum requests per minute
        /// </summary>
        public int MaxRequestsPerMinute { get; set; } = 8;

        /// <summary>
        /// Enable request throttling to respect rate limits
        /// </summary>
        public bool EnableThrottling { get; set; } = true;

        /// <summary>
        /// Circuit breaker failure threshold before switching providers
        /// </summary>
        public int CircuitBreakerFailureThreshold { get; set; } = 5;

        /// <summary>
        /// Circuit breaker timeout in seconds before retrying failed provider
        /// </summary>
        public int CircuitBreakerTimeoutSeconds { get; set; } = 60;
    }
}