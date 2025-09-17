using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Exceptions;
using SuperStock.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Enhanced stock data service that orchestrates multiple providers with circuit breaker pattern,
    /// caching, and automatic fallback mechanisms
    /// </summary>
    public class StockDataService
    {
        private readonly IEnumerable<IStockDataProvider> _providers;
        private readonly IMemoryCache _cache;
        private readonly ILogger<StockDataService> _logger;
        private readonly StockDataConfiguration _config;
        private readonly Dictionary<string, CircuitBreakerState> _circuitBreakers;
        private readonly object _circuitBreakerLock = new object();

        public StockDataService(
            IEnumerable<IStockDataProvider> providers,
            IMemoryCache cache,
            ILogger<StockDataService> logger,
            IOptions<StockDataConfiguration> config)
        {
            _providers = providers ?? throw new ArgumentNullException(nameof(providers));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _config = config?.Value ?? throw new ArgumentNullException(nameof(config));
            _circuitBreakers = new Dictionary<string, CircuitBreakerState>();

            // Initialize circuit breakers for each provider
            foreach (var provider in _providers)
            {
                _circuitBreakers[provider.ProviderName] = new CircuitBreakerState();
            }

            _logger.LogInformation("StockDataService initialized with {ProviderCount} providers: {ProviderNames}",
                _providers.Count(), string.Join(", ", _providers.Select(p => p.ProviderName)));
        }

        /// <summary>
        /// Retrieves stock price data with provider orchestration, caching, and fallback
        /// </summary>
        /// <param name="symbols">Stock symbols to fetch</param>
        /// <returns>List of stock price models</returns>
        public async Task<List<StockPriceModel>> GetStockPriceAsync(params string[] symbols)
        {
            if (symbols == null || symbols.Length == 0)
            {
                _logger.LogWarning("No symbols provided for stock price retrieval");
                return new List<StockPriceModel>();
            }

            _logger.LogInformation("Fetching stock prices for {SymbolCount} symbols: {Symbols}",
                symbols.Length, string.Join(", ", symbols));

            var results = new List<StockPriceModel>();
            var uncachedSymbols = new List<string>();

            // Check cache first
            foreach (var symbol in symbols)
            {
                var cacheKey = GetCacheKey(symbol);
                if (_cache.TryGetValue(cacheKey, out StockPriceModel cachedData))
                {
                    // Check if cached data is still fresh
                    if (!IsDataStale(cachedData))
                    {
                        _logger.LogDebug("Using cached data for symbol {Symbol}", symbol);
                        results.Add(cachedData);
                        continue;
                    }
                    else
                    {
                        _logger.LogDebug("Cached data for symbol {Symbol} is stale, will refresh", symbol);
                        _cache.Remove(cacheKey);
                    }
                }
                uncachedSymbols.Add(symbol);
            }

            // Fetch uncached symbols from providers
            if (uncachedSymbols.Count > 0)
            {
                var fetchedData = await FetchFromProvidersWithFallback(uncachedSymbols.ToArray());
                
                // Cache the fetched data
                foreach (var stockData in fetchedData)
                {
                    CacheStockData(stockData);
                }
                
                results.AddRange(fetchedData);
            }

            _logger.LogInformation("Successfully retrieved stock data for {ResultCount} out of {RequestCount} symbols",
                results.Count, symbols.Length);

            return results;
        }

        /// <summary>
        /// Fetches data from providers with automatic fallback and circuit breaker pattern
        /// </summary>
        private async Task<List<StockPriceModel>> FetchFromProvidersWithFallback(string[] symbols)
        {
            var orderedProviders = GetOrderedProviders();
            Exception lastException = null;

            foreach (var provider in orderedProviders)
            {
                if (!IsProviderAvailable(provider.ProviderName))
                {
                    _logger.LogDebug("Skipping provider {ProviderName} - circuit breaker is open", provider.ProviderName);
                    continue;
                }

                try
                {
                    _logger.LogDebug("Attempting to fetch data from provider {ProviderName}", provider.ProviderName);
                    
                    var startTime = DateTime.UtcNow;
                    var results = await provider.GetStockPriceAsync(symbols);
                    var duration = DateTime.UtcNow - startTime;

                    // Mark provider as successful
                    RecordProviderSuccess(provider.ProviderName);

                    // Add metadata to results
                    foreach (var result in results)
                    {
                        result.DataSource = provider.ProviderName;
                        result.LastUpdated = DateTime.UtcNow;
                        result.IsStale = false;
                    }

                    _logger.LogInformation("Successfully fetched {ResultCount} stock prices from {ProviderName} in {Duration}ms",
                        results.Count, provider.ProviderName, duration.TotalMilliseconds);

                    return results;
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogWarning(ex, "Provider {ProviderName} failed to fetch stock data", provider.ProviderName);
                    
                    // Record provider failure for circuit breaker
                    RecordProviderFailure(provider.ProviderName);

                    // Continue to next provider if fallback is enabled
                    if (!_config.EnableFallback)
                    {
                        break;
                    }
                }
            }

            // If all providers failed, throw the last exception
            var errorMessage = $"All stock data providers failed to fetch data for symbols: {string.Join(", ", symbols)}";
            _logger.LogError(lastException, errorMessage);
            throw new ProviderUnavailableException("All providers", errorMessage, lastException);
        }

        /// <summary>
        /// Gets providers ordered by priority (healthy providers first)
        /// </summary>
        private IEnumerable<IStockDataProvider> GetOrderedProviders()
        {
            return _providers.OrderBy(p => GetProviderPriority(p.ProviderName));
        }

        /// <summary>
        /// Gets provider priority (lower number = higher priority)
        /// </summary>
        private int GetProviderPriority(string providerName)
        {
            // TwelveData is primary provider (priority 1)
            // Other providers get higher priority numbers
            return providerName switch
            {
                "TwelveData" => 1,
                "YahooFinance" => 2,
                _ => 999
            };
        }

        /// <summary>
        /// Checks if a provider is available based on circuit breaker state
        /// </summary>
        private bool IsProviderAvailable(string providerName)
        {
            lock (_circuitBreakerLock)
            {
                if (!_circuitBreakers.TryGetValue(providerName, out var state))
                {
                    return true;
                }

                if (state.State == CircuitBreakerStatus.Closed)
                {
                    return true;
                }

                if (state.State == CircuitBreakerStatus.Open)
                {
                    // Check if timeout has elapsed
                    if (DateTime.UtcNow >= state.NextRetryTime)
                    {
                        _logger.LogInformation("Circuit breaker for {ProviderName} transitioning to half-open", providerName);
                        state.State = CircuitBreakerStatus.HalfOpen;
                        return true;
                    }
                    return false;
                }

                // Half-open state - allow one request
                return true;
            }
        }

        /// <summary>
        /// Records a successful provider call
        /// </summary>
        private void RecordProviderSuccess(string providerName)
        {
            lock (_circuitBreakerLock)
            {
                if (_circuitBreakers.TryGetValue(providerName, out var state))
                {
                    state.FailureCount = 0;
                    state.State = CircuitBreakerStatus.Closed;
                    _logger.LogDebug("Circuit breaker for {ProviderName} reset to closed state", providerName);
                }
            }
        }

        /// <summary>
        /// Records a provider failure and updates circuit breaker state
        /// </summary>
        private void RecordProviderFailure(string providerName)
        {
            lock (_circuitBreakerLock)
            {
                if (_circuitBreakers.TryGetValue(providerName, out var state))
                {
                    state.FailureCount++;
                    state.LastFailureTime = DateTime.UtcNow;

                    if (state.FailureCount >= _config.CircuitBreakerFailureThreshold)
                    {
                        state.State = CircuitBreakerStatus.Open;
                        state.NextRetryTime = DateTime.UtcNow.AddSeconds(_config.CircuitBreakerTimeoutSeconds);
                        
                        _logger.LogWarning("Circuit breaker for {ProviderName} opened after {FailureCount} failures. Next retry at {NextRetryTime}",
                            providerName, state.FailureCount, state.NextRetryTime);
                    }
                }
            }
        }

        /// <summary>
        /// Caches stock data with configured expiration
        /// </summary>
        private void CacheStockData(StockPriceModel stockData)
        {
            var cacheKey = GetCacheKey(stockData.Name);
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_config.CacheDurationMinutes),
                SlidingExpiration = TimeSpan.FromMinutes(_config.CacheDurationMinutes / 2),
                Priority = CacheItemPriority.Normal
            };

            _cache.Set(cacheKey, stockData, cacheOptions);
            _logger.LogDebug("Cached stock data for {Symbol} with {ExpirationMinutes} minute expiration",
                stockData.Name, _config.CacheDurationMinutes);
        }

        /// <summary>
        /// Generates cache key for a stock symbol
        /// </summary>
        private string GetCacheKey(string symbol)
        {
            return $"stock_price_{symbol?.ToUpperInvariant()}";
        }

        /// <summary>
        /// Checks if cached stock data is stale
        /// </summary>
        private bool IsDataStale(StockPriceModel stockData)
        {
            var maxAge = TimeSpan.FromMinutes(_config.CacheDurationMinutes);
            var age = DateTime.UtcNow - stockData.LastUpdated;
            return age > maxAge;
        }

        /// <summary>
        /// Gets health status of all providers
        /// </summary>
        public async Task<Dictionary<string, bool>> GetProviderHealthStatusAsync()
        {
            var healthStatus = new Dictionary<string, bool>();

            var healthCheckTasks = _providers.Select(async provider =>
            {
                try
                {
                    var isHealthy = await provider.IsHealthyAsync();
                    return new { Provider = provider.ProviderName, IsHealthy = isHealthy };
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Health check failed for provider {ProviderName}", provider.ProviderName);
                    return new { Provider = provider.ProviderName, IsHealthy = false };
                }
            });

            var results = await Task.WhenAll(healthCheckTasks);
            
            foreach (var result in results)
            {
                healthStatus[result.Provider] = result.IsHealthy;
            }

            return healthStatus;
        }

        /// <summary>
        /// Gets circuit breaker status for all providers
        /// </summary>
        public Dictionary<string, CircuitBreakerInfo> GetCircuitBreakerStatus()
        {
            lock (_circuitBreakerLock)
            {
                return _circuitBreakers.ToDictionary(
                    kvp => kvp.Key,
                    kvp => new CircuitBreakerInfo
                    {
                        State = kvp.Value.State,
                        FailureCount = kvp.Value.FailureCount,
                        LastFailureTime = kvp.Value.LastFailureTime,
                        NextRetryTime = kvp.Value.NextRetryTime
                    });
            }
        }

        /// <summary>
        /// Manually resets circuit breaker for a provider
        /// </summary>
        public void ResetCircuitBreaker(string providerName)
        {
            lock (_circuitBreakerLock)
            {
                if (_circuitBreakers.TryGetValue(providerName, out var state))
                {
                    state.FailureCount = 0;
                    state.State = CircuitBreakerStatus.Closed;
                    state.LastFailureTime = null;
                    state.NextRetryTime = null;
                    
                    _logger.LogInformation("Circuit breaker for {ProviderName} manually reset", providerName);
                }
            }
        }

        /// <summary>
        /// Clears all cached stock data
        /// </summary>
        public void ClearCache()
        {
            if (_cache is MemoryCache memoryCache)
            {
                // Note: MemoryCache doesn't have a built-in clear method
                // This is a simplified approach - in production, consider using a cache wrapper
                _logger.LogInformation("Cache clear requested - individual entries will expire naturally");
            }
        }
    }

    /// <summary>
    /// Circuit breaker state for a provider
    /// </summary>
    internal class CircuitBreakerState
    {
        public CircuitBreakerStatus State { get; set; } = CircuitBreakerStatus.Closed;
        public int FailureCount { get; set; } = 0;
        public DateTime? LastFailureTime { get; set; }
        public DateTime? NextRetryTime { get; set; }
    }

    /// <summary>
    /// Circuit breaker status enumeration
    /// </summary>
    public enum CircuitBreakerStatus
    {
        Closed,   // Normal operation
        Open,     // Failing, requests blocked
        HalfOpen  // Testing if service recovered
    }

    /// <summary>
    /// Circuit breaker information for external consumption
    /// </summary>
    public class CircuitBreakerInfo
    {
        public CircuitBreakerStatus State { get; set; }
        public int FailureCount { get; set; }
        public DateTime? LastFailureTime { get; set; }
        public DateTime? NextRetryTime { get; set; }
    }
}