using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Exceptions;
using SuperStock.Models;
using SuperStock.Models.StockData;
using SuperStock.Utilities;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Stock data provider implementation using Twelve Data API
    /// </summary>
    public class TwelveDataProvider : IStockDataProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TwelveDataProvider> _logger;
        private readonly StockDataConfiguration _config;
        private readonly SemaphoreSlim _rateLimitSemaphore;
        private readonly Queue<DateTime> _requestTimes;
        private readonly object _rateLimitLock = new object();
        private readonly ErrorMessageService _errorMessageService;
        private readonly StockDataLoggingService _loggingService;

        public string ProviderName => "TwelveData";

        public TwelveDataProvider(
            HttpClient httpClient,
            ILogger<TwelveDataProvider> logger,
            IOptions<StockDataConfiguration> config,
            ErrorMessageService errorMessageService,
            StockDataLoggingService loggingService)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _errorMessageService = errorMessageService ?? throw new ArgumentNullException(nameof(errorMessageService));
            _loggingService = loggingService ?? throw new ArgumentNullException(nameof(loggingService));
            _config = config?.Value ?? throw new ArgumentNullException(nameof(config));

            // Initialize rate limiting
            _rateLimitSemaphore = new SemaphoreSlim(_config.MaxRequestsPerMinute, _config.MaxRequestsPerMinute);
            _requestTimes = new Queue<DateTime>();

            // Configure HTTP client
            _httpClient.BaseAddress = new Uri(_config.TwelveDataBaseUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(_config.RequestTimeoutSeconds);
        }

        /// <summary>
        /// Retrieves stock price data for the specified symbols
        /// </summary>
        public async Task<List<StockPriceModel>> GetStockPriceAsync(params string[] symbols)
        {
            if (symbols == null || symbols.Length == 0)
            {
                _logger.LogWarning("No symbols provided for stock price retrieval");
                return new List<StockPriceModel>();
            }

            var stopwatch = _loggingService.LogOperationStart("GetStockPrice", symbols, ProviderName);

            var results = new List<StockPriceModel>();

            try
            {
                // Process symbols in batches to respect rate limits
                const int batchSize = 5; // Twelve Data supports up to 120 symbols per request, but we'll be conservative
                var batches = symbols
                    .Select(ConvertSymbolFormat)
                    .Select((symbol, index) => new { Symbol = symbol, Index = index })
                    .GroupBy(x => x.Index / batchSize)
                    .Select(g => g.Select(x => x.Symbol).ToArray())
                    .ToList();

                foreach (var batch in batches)
                {
                    await ApplyRateLimitAsync();
                    var batchResults = await FetchBatchStockDataAsync(batch);
                    results.AddRange(batchResults);
                }

                _loggingService.LogOperationComplete("GetStockPrice", stopwatch, results.Count, symbols.Length, ProviderName);
                return results;
            }
            catch (Exception ex)
            {
                _loggingService.LogError(ex, "GetStockPrice", symbols, ProviderName);
                
                // Convert to appropriate stock data exception with user-friendly message
                var stockDataException = ex switch
                {
                    StockDataException => ex,
                    TimeoutException => new StockDataTimeoutException(
                        _errorMessageService.GetUserFriendlyMessage(ApiErrorType.Timeout), 
                        TimeSpan.FromSeconds(_config.RequestTimeoutSeconds)),
                    System.Net.Http.HttpRequestException => new NetworkException(
                        _errorMessageService.GetUserFriendlyMessage(ApiErrorType.NetworkError)),
                    _ => new NetworkException(
                        _errorMessageService.GetUserFriendlyMessage(ex))
                };
                
                throw stockDataException;
            }
        }

        /// <summary>
        /// Checks if the Twelve Data API is healthy and accessible
        /// </summary>
        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                _logger.LogDebug("Performing health check for {ProviderName}", ProviderName);

                await ApplyRateLimitAsync();

                // Use a simple quote request for a well-known symbol to test connectivity
                var healthCheckUrl = $"/quote?symbol=AAPL&apikey={_config.TwelveDataApiKey}";
                
                using var response = await _httpClient.GetAsync(healthCheckUrl);
                
                var isHealthy = response.IsSuccessStatusCode;
                
                _logger.LogInformation("{ProviderName} health check result: {IsHealthy} (Status: {StatusCode})", 
                    ProviderName, isHealthy, response.StatusCode);

                return isHealthy;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "{ProviderName} health check failed", ProviderName);
                return false;
            }
        }

        /// <summary>
        /// Fetches stock data for a batch of symbols
        /// </summary>
        private async Task<List<StockPriceModel>> FetchBatchStockDataAsync(string[] symbols)
        {
            var results = new List<StockPriceModel>();

            try
            {
                if (symbols.Length == 1)
                {
                    // Single symbol request
                    var result = await FetchSingleStockDataAsync(symbols[0]);
                    if (result != null)
                    {
                        results.Add(result);
                    }
                }
                else
                {
                    // Batch request - process individually for now due to API limitations
                    foreach (var symbol in symbols)
                    {
                        try
                        {
                            await ApplyRateLimitAsync();
                            var result = await FetchSingleStockDataAsync(symbol);
                            if (result != null)
                            {
                                results.Add(result);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to fetch data for symbol {Symbol}", symbol);
                            // Continue with other symbols
                        }
                    }
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch stock data fetch for symbols: {Symbols}", string.Join(", ", symbols));
                throw;
            }
        }

        /// <summary>
        /// Fetches stock data for a single symbol
        /// </summary>
        private async Task<StockPriceModel?> FetchSingleStockDataAsync(string symbol)
        {
            try
            {
                var url = $"/quote?symbol={symbol}&apikey={_config.TwelveDataApiKey}";
                
                _logger.LogDebug("Requesting stock data for {Symbol} from {Url}", symbol, url);

                using var response = await _httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    await HandleApiErrorAsync(response, content, symbol);
                    return null;
                }

                var quoteResponse = JsonSerializer.Deserialize<TwelveDataQuoteResponse>(content);
                
                if (quoteResponse == null)
                {
                    _logger.LogWarning("Received null response for symbol {Symbol}", symbol);
                    return null;
                }

                return ConvertToStockPriceModel(quoteResponse, symbol);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching single stock data for symbol {Symbol}", symbol);
                throw;
            }
        }

        /// <summary>
        /// Converts Twelve Data response to StockPriceModel
        /// </summary>
        private StockPriceModel ConvertToStockPriceModel(TwelveDataQuoteResponse response, string originalSymbol)
        {
            try
            {
                var stockModel = StockDataConverter.ConvertFromTwelveData(response);
                
                // Override name if response doesn't have it
                if (string.IsNullOrEmpty(stockModel.Name))
                {
                    stockModel.Name = StockDataConverter.CleanSymbolName(originalSymbol);
                }
                
                return stockModel;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting Twelve Data response to StockPriceModel for symbol {Symbol}", originalSymbol);
                throw new DataParsingException($"Failed to convert API response for symbol {originalSymbol}", ex);
            }
        }

        /// <summary>
        /// Converts symbol format for Twelve Data API (handles .NS suffix for Indian stocks)
        /// </summary>
        private string ConvertSymbolFormat(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return symbol;
            }

            if (!StockDataConverter.IsValidSymbol(symbol))
            {
                _logger.LogWarning("Invalid symbol format: {Symbol}", symbol);
                return symbol;
            }

            var convertedSymbol = StockDataConverter.ConvertSymbolToTwelveDataFormat(symbol);
            
            if (convertedSymbol != symbol)
            {
                _logger.LogDebug("Converted symbol {OriginalSymbol} to {ConvertedSymbol}", symbol, convertedSymbol);
            }
            
            return convertedSymbol;
        }

        /// <summary>
        /// Applies rate limiting to respect API limits
        /// </summary>
        private async Task ApplyRateLimitAsync()
        {
            if (!_config.EnableThrottling)
            {
                return;
            }

            await _rateLimitSemaphore.WaitAsync();

            try
            {
                lock (_rateLimitLock)
                {
                    var now = DateTime.UtcNow;
                    var oneMinuteAgo = now.AddMinutes(-1);

                    // Remove requests older than 1 minute
                    while (_requestTimes.Count > 0 && _requestTimes.Peek() < oneMinuteAgo)
                    {
                        _requestTimes.Dequeue();
                    }

                    // Check if we're at the rate limit
                    if (_requestTimes.Count >= _config.MaxRequestsPerMinute)
                    {
                        var oldestRequest = _requestTimes.Peek();
                        var waitTime = oldestRequest.AddMinutes(1) - now;
                        
                        if (waitTime > TimeSpan.Zero)
                        {
                            _logger.LogDebug("Rate limit reached, waiting {WaitTimeMs}ms", waitTime.TotalMilliseconds);
                            Thread.Sleep(waitTime);
                        }
                    }

                    _requestTimes.Enqueue(now);
                }
            }
            finally
            {
                _rateLimitSemaphore.Release();
            }
        }

        /// <summary>
        /// Handles API error responses with enhanced error categorization and user-friendly messages
        /// </summary>
        private async Task HandleApiErrorAsync(HttpResponseMessage response, string content, string symbol)
        {
            try
            {
                var errorResponse = JsonSerializer.Deserialize<TwelveDataErrorResponse>(content);
                var errorMessage = errorResponse?.Message ?? $"HTTP {response.StatusCode}";
                var errorType = _errorMessageService.CategorizeHttpStatusCode(response.StatusCode);
                
                _loggingService.LogError(
                    new HttpRequestException($"API error: {errorMessage}"),
                    "HandleApiError",
                    new[] { symbol },
                    ProviderName,
                    new Dictionary<string, object>
                    {
                        ["StatusCode"] = (int)response.StatusCode,
                        ["ErrorType"] = errorType,
                        ["RawResponse"] = content
                    });

                // Handle specific error types with user-friendly messages
                switch (response.StatusCode)
                {
                    case HttpStatusCode.Unauthorized:
                        throw new ApiAuthenticationException(
                            _errorMessageService.GetUserFriendlyMessage(ApiErrorType.AuthenticationError),
                            errorResponse?.Code.ToString());
                    
                    case HttpStatusCode.TooManyRequests:
                        var retryAfter = GetRetryAfterSeconds(response);
                        throw new RateLimitExceededException(
                            _errorMessageService.GetUserFriendlyMessage(ApiErrorType.RateLimitExceeded),
                            retryAfterSeconds: retryAfter,
                            errorCode: errorResponse?.Code.ToString());
                    
                    case HttpStatusCode.NotFound:
                        _logger.LogWarning("Symbol {Symbol} not found", symbol);
                        return; // Don't throw for not found symbols
                    
                    case HttpStatusCode.BadRequest:
                        throw new InvalidSymbolException(
                            _errorMessageService.GetUserFriendlyMessage(ApiErrorType.InvalidRequest, $"Symbol: {symbol}"),
                            new[] { symbol },
                            errorResponse?.Code.ToString());
                    
                    default:
                        var userMessage = _errorMessageService.GetUserFriendlyMessage(errorType);
                        throw new ProviderUnavailableException(ProviderName, userMessage, errorResponse?.Code.ToString());
                }
            }
            catch (JsonException ex)
            {
                // If we can't parse the error response, use the raw content
                _loggingService.LogError(ex, "ParseErrorResponse", new[] { symbol }, ProviderName,
                    new Dictionary<string, object> { ["RawContent"] = content });
                
                var errorType = _errorMessageService.CategorizeHttpStatusCode(response.StatusCode);
                var userMessage = _errorMessageService.GetUserFriendlyMessage(errorType);
                throw new ProviderUnavailableException(ProviderName, userMessage);
            }
        }

        /// <summary>
        /// Extracts retry-after seconds from HTTP response headers
        /// </summary>
        private int? GetRetryAfterSeconds(HttpResponseMessage response)
        {
            if (response.Headers.RetryAfter?.Delta.HasValue == true)
            {
                return (int)response.Headers.RetryAfter.Delta.Value.TotalSeconds;
            }
            
            if (response.Headers.RetryAfter?.Date.HasValue == true)
            {
                var retryAfter = response.Headers.RetryAfter.Date.Value - DateTimeOffset.UtcNow;
                return Math.Max(0, (int)retryAfter.TotalSeconds);
            }
            
            return null;
        }



        /// <summary>
        /// Disposes resources used by the provider
        /// </summary>
        public void Dispose()
        {
            _rateLimitSemaphore?.Dispose();
        }
    }
}