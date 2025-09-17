using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Models.StockData;
using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// HTTP client service with retry logic, timeout handling, and error management
    /// </summary>
    public class HttpClientService
    {
        private readonly HttpClient _httpClient;
        private readonly StockDataConfiguration _config;
        private readonly ILogger<HttpClientService> _logger;
        private readonly SemaphoreSlim _rateLimitSemaphore;
        private DateTime _lastRequestTime = DateTime.MinValue;

        public HttpClientService(
            HttpClient httpClient,
            IOptions<StockDataConfiguration> config,
            ILogger<HttpClientService> logger)
        {
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _config = config?.Value ?? throw new ArgumentNullException(nameof(config));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            // Configure HTTP client timeout
            _httpClient.Timeout = TimeSpan.FromSeconds(_config.RequestTimeoutSeconds);
            
            // Initialize rate limiting semaphore
            _rateLimitSemaphore = new SemaphoreSlim(_config.MaxRequestsPerMinute, _config.MaxRequestsPerMinute);
        }

        /// <summary>
        /// Makes an HTTP GET request with retry logic and rate limiting
        /// </summary>
        public async Task<ApiResponse<T>> GetAsync<T>(string requestUri, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(requestUri))
                throw new ArgumentException("Request URI cannot be null or empty", nameof(requestUri));

            // Apply rate limiting if enabled
            if (_config.EnableThrottling)
            {
                await ApplyRateLimitingAsync(cancellationToken);
            }

            var attempt = 0;
            Exception lastException = null;

            while (attempt < _config.MaxRetryAttempts)
            {
                attempt++;
                
                try
                {
                    _logger.LogDebug("Making HTTP GET request to {RequestUri} (Attempt {Attempt}/{MaxAttempts})", 
                        requestUri, attempt, _config.MaxRetryAttempts);

                    using var response = await _httpClient.GetAsync(requestUri, cancellationToken);
                    
                    var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var data = JsonSerializer.Deserialize<T>(responseContent, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        _logger.LogDebug("HTTP GET request successful for {RequestUri}", requestUri);
                        
                        return new ApiResponse<T>
                        {
                            IsSuccess = true,
                            Data = data,
                            StatusCode = response.StatusCode,
                            Message = "Request successful"
                        };
                    }
                    else
                    {
                        var errorMessage = $"HTTP {(int)response.StatusCode} {response.StatusCode}: {responseContent}";
                        _logger.LogWarning("HTTP GET request failed for {RequestUri}: {ErrorMessage}", requestUri, errorMessage);
                        
                        // Don't retry for client errors (4xx)
                        if ((int)response.StatusCode >= 400 && (int)response.StatusCode < 500)
                        {
                            return new ApiResponse<T>
                            {
                                IsSuccess = false,
                                StatusCode = response.StatusCode,
                                Message = errorMessage,
                                ErrorType = ApiErrorType.ClientError
                            };
                        }

                        lastException = new HttpRequestException(errorMessage);
                    }
                }
                catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || cancellationToken.IsCancellationRequested)
                {
                    var errorMessage = cancellationToken.IsCancellationRequested ? "Request was cancelled" : "Request timed out";
                    _logger.LogWarning("HTTP GET request timeout for {RequestUri} (Attempt {Attempt}): {ErrorMessage}", 
                        requestUri, attempt, errorMessage);
                    
                    lastException = new TimeoutException(errorMessage, ex);
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogWarning("HTTP GET request failed for {RequestUri} (Attempt {Attempt}): {ErrorMessage}", 
                        requestUri, attempt, ex.Message);
                    
                    lastException = ex;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error during HTTP GET request to {RequestUri} (Attempt {Attempt})", 
                        requestUri, attempt);
                    
                    lastException = ex;
                }

                // Wait before retrying (exponential backoff)
                if (attempt < _config.MaxRetryAttempts)
                {
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt - 1));
                    _logger.LogDebug("Waiting {Delay} seconds before retry attempt {NextAttempt}", 
                        delay.TotalSeconds, attempt + 1);
                    
                    await Task.Delay(delay, cancellationToken);
                }
            }

            // All retry attempts failed
            var finalErrorMessage = $"Request failed after {_config.MaxRetryAttempts} attempts. Last error: {lastException?.Message}";
            _logger.LogError(lastException, "HTTP GET request ultimately failed for {RequestUri}: {ErrorMessage}", 
                requestUri, finalErrorMessage);

            return new ApiResponse<T>
            {
                IsSuccess = false,
                StatusCode = HttpStatusCode.ServiceUnavailable,
                Message = finalErrorMessage,
                ErrorType = DetermineErrorType(lastException)
            };
        }

        /// <summary>
        /// Applies rate limiting to respect API limits
        /// </summary>
        private async Task ApplyRateLimitingAsync(CancellationToken cancellationToken)
        {
            await _rateLimitSemaphore.WaitAsync(cancellationToken);
            
            try
            {
                var timeSinceLastRequest = DateTime.UtcNow - _lastRequestTime;
                var minInterval = TimeSpan.FromMinutes(1.0 / _config.MaxRequestsPerMinute);
                
                if (timeSinceLastRequest < minInterval)
                {
                    var delay = minInterval - timeSinceLastRequest;
                    _logger.LogDebug("Rate limiting: waiting {Delay} ms before next request", delay.TotalMilliseconds);
                    await Task.Delay(delay, cancellationToken);
                }
                
                _lastRequestTime = DateTime.UtcNow;
            }
            finally
            {
                _rateLimitSemaphore.Release();
            }
        }

        /// <summary>
        /// Determines the error type based on the exception
        /// </summary>
        private static ApiErrorType DetermineErrorType(Exception exception)
        {
            return exception switch
            {
                TimeoutException => ApiErrorType.Timeout,
                HttpRequestException => ApiErrorType.NetworkError,
                TaskCanceledException => ApiErrorType.Timeout,
                _ => ApiErrorType.UnknownError
            };
        }

        public void Dispose()
        {
            _rateLimitSemaphore?.Dispose();
        }
    }
}