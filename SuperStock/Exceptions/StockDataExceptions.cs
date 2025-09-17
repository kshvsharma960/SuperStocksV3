using SuperStock.Models.StockData;
using System;

#nullable enable

namespace SuperStock.Exceptions
{
    /// <summary>
    /// Base exception for all stock data related errors
    /// </summary>
    public abstract class StockDataException : Exception
    {
        public ApiErrorType ErrorType { get; }
        public string? ErrorCode { get; }

        protected StockDataException(string message, ApiErrorType errorType, string? errorCode = null) 
            : base(message)
        {
            ErrorType = errorType;
            ErrorCode = errorCode;
        }

        protected StockDataException(string message, Exception innerException, ApiErrorType errorType, string? errorCode = null) 
            : base(message, innerException)
        {
            ErrorType = errorType;
            ErrorCode = errorCode;
        }
    }

    /// <summary>
    /// Exception thrown when API authentication fails
    /// </summary>
    public class ApiAuthenticationException : StockDataException
    {
        public ApiAuthenticationException(string message, string? errorCode = null) 
            : base(message, ApiErrorType.AuthenticationError, errorCode)
        {
        }

        public ApiAuthenticationException(string message, Exception innerException, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.AuthenticationError, errorCode)
        {
        }
    }

    /// <summary>
    /// Exception thrown when rate limits are exceeded
    /// </summary>
    public class RateLimitExceededException : StockDataException
    {
        public DateTime? ResetTime { get; }
        public int? RetryAfterSeconds { get; }

        public RateLimitExceededException(string message, DateTime? resetTime = null, int? retryAfterSeconds = null, string? errorCode = null) 
            : base(message, ApiErrorType.RateLimitExceeded, errorCode)
        {
            ResetTime = resetTime;
            RetryAfterSeconds = retryAfterSeconds;
        }

        public RateLimitExceededException(string message, Exception innerException, DateTime? resetTime = null, int? retryAfterSeconds = null, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.RateLimitExceeded, errorCode)
        {
            ResetTime = resetTime;
            RetryAfterSeconds = retryAfterSeconds;
        }
    }

    /// <summary>
    /// Exception thrown when invalid stock symbols are provided
    /// </summary>
    public class InvalidSymbolException : StockDataException
    {
        public string[] InvalidSymbols { get; }

        public InvalidSymbolException(string message, string[] invalidSymbols, string? errorCode = null) 
            : base(message, ApiErrorType.InvalidRequest, errorCode)
        {
            InvalidSymbols = invalidSymbols ?? Array.Empty<string>();
        }

        public InvalidSymbolException(string message, Exception innerException, string[] invalidSymbols, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.InvalidRequest, errorCode)
        {
            InvalidSymbols = invalidSymbols ?? Array.Empty<string>();
        }
    }

    /// <summary>
    /// Exception thrown when stock data provider is unavailable
    /// </summary>
    public class ProviderUnavailableException : StockDataException
    {
        public string ProviderName { get; }

        public ProviderUnavailableException(string providerName, string message, string? errorCode = null) 
            : base(message, ApiErrorType.ServiceUnavailable, errorCode)
        {
            ProviderName = providerName;
        }

        public ProviderUnavailableException(string providerName, string message, Exception innerException, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.ServiceUnavailable, errorCode)
        {
            ProviderName = providerName;
        }
    }

    /// <summary>
    /// Exception thrown when data parsing fails
    /// </summary>
    public class DataParsingException : StockDataException
    {
        public string? RawData { get; }

        public DataParsingException(string message, string? rawData = null, string? errorCode = null) 
            : base(message, ApiErrorType.DataError, errorCode)
        {
            RawData = rawData;
        }

        public DataParsingException(string message, Exception innerException, string? rawData = null, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.DataError, errorCode)
        {
            RawData = rawData;
        }
    }

    /// <summary>
    /// Exception thrown when network operations fail
    /// </summary>
    public class NetworkException : StockDataException
    {
        public NetworkException(string message, string? errorCode = null) 
            : base(message, ApiErrorType.NetworkError, errorCode)
        {
        }

        public NetworkException(string message, Exception innerException, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.NetworkError, errorCode)
        {
        }
    }

    /// <summary>
    /// Exception thrown when operations timeout
    /// </summary>
    public class StockDataTimeoutException : StockDataException
    {
        public TimeSpan Timeout { get; }

        public StockDataTimeoutException(string message, TimeSpan timeout, string? errorCode = null) 
            : base(message, ApiErrorType.Timeout, errorCode)
        {
            Timeout = timeout;
        }

        public StockDataTimeoutException(string message, Exception innerException, TimeSpan timeout, string? errorCode = null) 
            : base(message, innerException, ApiErrorType.Timeout, errorCode)
        {
            Timeout = timeout;
        }
    }

    /// <summary>
    /// Exception thrown when circuit breaker is open
    /// </summary>
    public class CircuitBreakerOpenException : StockDataException
    {
        public string ProviderName { get; }
        public DateTime OpenedAt { get; }
        public TimeSpan RetryAfter { get; }

        public CircuitBreakerOpenException(string providerName, DateTime openedAt, TimeSpan retryAfter, string? errorCode = null) 
            : base($"Circuit breaker is open for provider '{providerName}'. Retry after {retryAfter.TotalSeconds} seconds.", ApiErrorType.ServiceUnavailable, errorCode)
        {
            ProviderName = providerName;
            OpenedAt = openedAt;
            RetryAfter = retryAfter;
        }
    }
}