using Microsoft.Extensions.Logging;
using SuperStock.Exceptions;
using SuperStock.Models;
using SuperStock.Models.StockData;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace SuperStock.Services
{
    /// <summary>
    /// Specialized logging service for stock data operations with performance metrics and structured logging
    /// </summary>
    public class StockDataLoggingService
    {
        private readonly ILogger<StockDataLoggingService> _logger;

        public StockDataLoggingService(ILogger<StockDataLoggingService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Logs the start of a stock data operation
        /// </summary>
        /// <param name="operation">Name of the operation</param>
        /// <param name="symbols">Stock symbols being processed</param>
        /// <param name="provider">Data provider name</param>
        /// <returns>Stopwatch for measuring operation duration</returns>
        public Stopwatch LogOperationStart(string operation, string[] symbols, string? provider = null)
        {
            var stopwatch = Stopwatch.StartNew();
            
            _logger.LogInformation("Starting {Operation} for {SymbolCount} symbols: {Symbols} {Provider}",
                operation,
                symbols?.Length ?? 0,
                symbols != null ? string.Join(", ", symbols) : "none",
                !string.IsNullOrEmpty(provider) ? $"using {provider}" : "");

            return stopwatch;
        }

        /// <summary>
        /// Logs the completion of a stock data operation with performance metrics
        /// </summary>
        /// <param name="operation">Name of the operation</param>
        /// <param name="stopwatch">Stopwatch started at operation begin</param>
        /// <param name="resultCount">Number of results returned</param>
        /// <param name="requestCount">Number of items requested</param>
        /// <param name="provider">Data provider name</param>
        /// <param name="cacheHits">Number of cache hits (optional)</param>
        public void LogOperationComplete(string operation, Stopwatch stopwatch, int resultCount, int requestCount, string? provider = null, int? cacheHits = null)
        {
            stopwatch.Stop();
            var duration = stopwatch.ElapsedMilliseconds;
            var successRate = requestCount > 0 ? (double)resultCount / requestCount * 100 : 0;

            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Operation"] = operation,
                ["DurationMs"] = duration,
                ["ResultCount"] = resultCount,
                ["RequestCount"] = requestCount,
                ["SuccessRate"] = successRate,
                ["Provider"] = provider ?? "Unknown",
                ["CacheHits"] = cacheHits
            });

            _logger.LogInformation("Completed {Operation} in {Duration}ms - {ResultCount}/{RequestCount} successful ({SuccessRate:F1}%) {Provider} {CacheInfo}",
                operation,
                duration,
                resultCount,
                requestCount,
                successRate,
                !string.IsNullOrEmpty(provider) ? $"via {provider}" : "",
                cacheHits.HasValue ? $"({cacheHits.Value} cache hits)" : "");

            // Log performance warnings
            if (duration > 5000) // More than 5 seconds
            {
                _logger.LogWarning("Slow operation detected: {Operation} took {Duration}ms", operation, duration);
            }

            if (successRate < 80) // Less than 80% success rate
            {
                _logger.LogWarning("Low success rate detected: {Operation} had {SuccessRate:F1}% success rate", operation, successRate);
            }
        }

        /// <summary>
        /// Logs API call metrics
        /// </summary>
        /// <param name="provider">Provider name</param>
        /// <param name="endpoint">API endpoint called</param>
        /// <param name="duration">Call duration in milliseconds</param>
        /// <param name="statusCode">HTTP status code</param>
        /// <param name="requestSize">Size of request in bytes (optional)</param>
        /// <param name="responseSize">Size of response in bytes (optional)</param>
        public void LogApiCall(string provider, string endpoint, long duration, int statusCode, long? requestSize = null, long? responseSize = null)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Provider"] = provider,
                ["Endpoint"] = endpoint,
                ["DurationMs"] = duration,
                ["StatusCode"] = statusCode,
                ["RequestSize"] = requestSize,
                ["ResponseSize"] = responseSize
            });

            var isSuccess = statusCode >= 200 && statusCode < 300;
            var logLevel = isSuccess ? LogLevel.Debug : LogLevel.Warning;

            _logger.Log(logLevel, "API call to {Provider} {Endpoint}: {StatusCode} in {Duration}ms {SizeInfo}",
                provider,
                endpoint,
                statusCode,
                duration,
                (requestSize.HasValue || responseSize.HasValue) 
                    ? $"(req: {requestSize?.ToString() ?? "unknown"} bytes, resp: {responseSize?.ToString() ?? "unknown"} bytes)"
                    : "");
        }

        /// <summary>
        /// Logs cache operation metrics
        /// </summary>
        /// <param name="operation">Cache operation (hit, miss, set, evict)</param>
        /// <param name="key">Cache key</param>
        /// <param name="duration">Operation duration in milliseconds (optional)</param>
        /// <param name="size">Size of cached data in bytes (optional)</param>
        public void LogCacheOperation(string operation, string key, long? duration = null, long? size = null)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["CacheOperation"] = operation,
                ["CacheKey"] = key,
                ["DurationMs"] = duration,
                ["Size"] = size
            });

            _logger.LogDebug("Cache {Operation} for key {Key} {DurationInfo} {SizeInfo}",
                operation,
                key,
                duration.HasValue ? $"in {duration.Value}ms" : "",
                size.HasValue ? $"({size.Value} bytes)" : "");
        }

        /// <summary>
        /// Logs circuit breaker state changes
        /// </summary>
        /// <param name="provider">Provider name</param>
        /// <param name="oldState">Previous circuit breaker state</param>
        /// <param name="newState">New circuit breaker state</param>
        /// <param name="failureCount">Current failure count</param>
        /// <param name="nextRetryTime">Next retry time (for open state)</param>
        public void LogCircuitBreakerStateChange(string provider, string oldState, string newState, int failureCount, DateTime? nextRetryTime = null)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Provider"] = provider,
                ["OldState"] = oldState,
                ["NewState"] = newState,
                ["FailureCount"] = failureCount,
                ["NextRetryTime"] = nextRetryTime
            });

            var logLevel = newState == "Open" ? LogLevel.Warning : LogLevel.Information;

            _logger.Log(logLevel, "Circuit breaker for {Provider} changed from {OldState} to {NewState} (failures: {FailureCount}) {RetryInfo}",
                provider,
                oldState,
                newState,
                failureCount,
                nextRetryTime.HasValue ? $"- next retry at {nextRetryTime.Value:HH:mm:ss}" : "");
        }

        /// <summary>
        /// Logs rate limiting events
        /// </summary>
        /// <param name="provider">Provider name</param>
        /// <param name="delayMs">Delay applied in milliseconds</param>
        /// <param name="reason">Reason for rate limiting</param>
        public void LogRateLimit(string provider, long delayMs, string reason)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["Provider"] = provider,
                ["DelayMs"] = delayMs,
                ["RateLimitReason"] = reason
            });

            _logger.LogDebug("Rate limiting applied for {Provider}: {Delay}ms delay ({Reason})",
                provider, delayMs, reason);
        }

        /// <summary>
        /// Logs detailed error information with context
        /// </summary>
        /// <param name="exception">Exception that occurred</param>
        /// <param name="operation">Operation being performed</param>
        /// <param name="symbols">Symbols being processed (optional)</param>
        /// <param name="provider">Provider name (optional)</param>
        /// <param name="additionalContext">Additional context information</param>
        public void LogError(Exception exception, string operation, string[]? symbols = null, string? provider = null, Dictionary<string, object>? additionalContext = null)
        {
            var context = new Dictionary<string, object>
            {
                ["Operation"] = operation,
                ["ExceptionType"] = exception.GetType().Name,
                ["Provider"] = provider ?? "Unknown"
            };

            if (symbols != null && symbols.Length > 0)
            {
                context["Symbols"] = string.Join(", ", symbols);
                context["SymbolCount"] = symbols.Length;
            }

            if (additionalContext != null)
            {
                foreach (var kvp in additionalContext)
                {
                    context[kvp.Key] = kvp.Value;
                }
            }

            // Add specific context for stock data exceptions
            if (exception is StockDataException stockDataEx)
            {
                context["ErrorType"] = stockDataEx.ErrorType.ToString();
                context["ErrorCode"] = stockDataEx.ErrorCode ?? "None";

                // Add exception-specific context
                switch (stockDataEx)
                {
                    case RateLimitExceededException rateLimitEx:
                        context["ResetTime"] = rateLimitEx.ResetTime;
                        context["RetryAfterSeconds"] = rateLimitEx.RetryAfterSeconds;
                        break;
                    case InvalidSymbolException invalidSymbolEx:
                        context["InvalidSymbols"] = string.Join(", ", invalidSymbolEx.InvalidSymbols);
                        break;
                    case ProviderUnavailableException providerEx:
                        context["UnavailableProvider"] = providerEx.ProviderName;
                        break;
                    case StockDataTimeoutException timeoutEx:
                        context["TimeoutDuration"] = timeoutEx.Timeout.TotalSeconds;
                        break;
                }
            }

            using var scope = _logger.BeginScope(context);

            _logger.LogError(exception, "Error in {Operation}: {ErrorMessage} {ProviderInfo} {SymbolInfo}",
                operation,
                exception.Message,
                !string.IsNullOrEmpty(provider) ? $"(Provider: {provider})" : "",
                symbols != null && symbols.Length > 0 ? $"(Symbols: {string.Join(", ", symbols)})" : "");
        }

        /// <summary>
        /// Logs performance metrics summary
        /// </summary>
        /// <param name="metrics">Performance metrics to log</param>
        public void LogPerformanceMetrics(PerformanceMetrics metrics)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["TotalRequests"] = metrics.TotalRequests,
                ["SuccessfulRequests"] = metrics.SuccessfulRequests,
                ["FailedRequests"] = metrics.FailedRequests,
                ["AverageResponseTime"] = metrics.AverageResponseTimeMs,
                ["CacheHitRate"] = metrics.CacheHitRate,
                ["ProviderUsage"] = metrics.ProviderUsage
            });

            _logger.LogInformation("Performance metrics - Requests: {Total} (Success: {Success}, Failed: {Failed}), " +
                                 "Avg Response: {AvgResponse}ms, Cache Hit Rate: {CacheHitRate:F1}%",
                metrics.TotalRequests,
                metrics.SuccessfulRequests,
                metrics.FailedRequests,
                metrics.AverageResponseTimeMs,
                metrics.CacheHitRate);

            // Log provider usage breakdown
            if (metrics.ProviderUsage.Any())
            {
                foreach (var provider in metrics.ProviderUsage)
                {
                    _logger.LogInformation("Provider usage - {Provider}: {Usage} requests ({Percentage:F1}%)",
                        provider.Key, provider.Value, (double)provider.Value / metrics.TotalRequests * 100);
                }
            }
        }

        /// <summary>
        /// Logs watchlist operation
        /// </summary>
        /// <param name="operation">Watchlist operation (add, remove, view)</param>
        /// <param name="userId">User ID</param>
        /// <param name="symbol">Stock symbol (optional)</param>
        /// <param name="success">Whether operation was successful</param>
        /// <param name="duration">Operation duration in milliseconds</param>
        public void LogWatchlistOperation(string operation, string userId, string? symbol = null, bool success = true, long? duration = null)
        {
            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["WatchlistOperation"] = operation,
                ["UserId"] = userId,
                ["Symbol"] = symbol ?? "N/A",
                ["Success"] = success,
                ["DurationMs"] = duration
            });

            var logLevel = success ? LogLevel.Information : LogLevel.Warning;

            _logger.Log(logLevel, "Watchlist {Operation} for user {UserId} {SymbolInfo} - {Result} {DurationInfo}",
                operation,
                userId,
                !string.IsNullOrEmpty(symbol) ? $"(symbol: {symbol})" : "",
                success ? "SUCCESS" : "FAILED",
                duration.HasValue ? $"in {duration.Value}ms" : "");
        }
    }

    /// <summary>
    /// Performance metrics data structure
    /// </summary>
    public class PerformanceMetrics
    {
        public int TotalRequests { get; set; }
        public int SuccessfulRequests { get; set; }
        public int FailedRequests { get; set; }
        public double AverageResponseTimeMs { get; set; }
        public double CacheHitRate { get; set; }
        public Dictionary<string, int> ProviderUsage { get; set; } = new();
    }
}