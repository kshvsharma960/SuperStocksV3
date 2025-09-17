using Microsoft.Extensions.Logging;
using SuperStock.Exceptions;
using SuperStock.Models.StockData;
using System;
using System.Collections.Generic;
using System.Net;

namespace SuperStock.Services
{
    /// <summary>
    /// Service for generating user-friendly error messages and categorizing errors
    /// </summary>
    public class ErrorMessageService
    {
        private readonly ILogger<ErrorMessageService> _logger;
        private readonly Dictionary<ApiErrorType, string> _errorMessages;
        private readonly Dictionary<Type, string> _exceptionMessages;

        public ErrorMessageService(ILogger<ErrorMessageService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _errorMessages = InitializeErrorMessages();
            _exceptionMessages = InitializeExceptionMessages();
        }

        /// <summary>
        /// Gets a user-friendly error message for an API error type
        /// </summary>
        /// <param name="errorType">The type of error that occurred</param>
        /// <param name="additionalContext">Additional context for the error</param>
        /// <returns>User-friendly error message</returns>
        public string GetUserFriendlyMessage(ApiErrorType errorType, string? additionalContext = null)
        {
            var baseMessage = _errorMessages.TryGetValue(errorType, out var message) 
                ? message 
                : _errorMessages[ApiErrorType.UnknownError];

            if (!string.IsNullOrWhiteSpace(additionalContext))
            {
                baseMessage += $" {additionalContext}";
            }

            _logger.LogDebug("Generated user-friendly message for error type {ErrorType}: {Message}", 
                errorType, baseMessage);

            return baseMessage;
        }

        /// <summary>
        /// Gets a user-friendly error message for a stock data exception
        /// </summary>
        /// <param name="exception">The exception that occurred</param>
        /// <returns>User-friendly error message</returns>
        public string GetUserFriendlyMessage(StockDataException exception)
        {
            if (exception == null)
                return GetUserFriendlyMessage(ApiErrorType.UnknownError);

            var exceptionType = exception.GetType();
            var baseMessage = _exceptionMessages.TryGetValue(exceptionType, out var message)
                ? message
                : GetUserFriendlyMessage(exception.ErrorType);

            // Add specific context for certain exception types
            var contextualMessage = exception switch
            {
                RateLimitExceededException rateLimitEx => 
                    $"{baseMessage} {GetRateLimitContext(rateLimitEx)}",
                InvalidSymbolException invalidSymbolEx => 
                    $"{baseMessage} Invalid symbols: {string.Join(", ", invalidSymbolEx.InvalidSymbols)}",
                ProviderUnavailableException providerEx => 
                    $"{baseMessage} Provider '{providerEx.ProviderName}' is currently unavailable.",
                StockDataTimeoutException timeoutEx => 
                    $"{baseMessage} Request timed out after {timeoutEx.Timeout.TotalSeconds} seconds.",
                CircuitBreakerOpenException circuitEx => 
                    $"{baseMessage} Service will retry automatically in {circuitEx.RetryAfter.TotalMinutes:F1} minutes.",
                _ => baseMessage
            };

            _logger.LogDebug("Generated user-friendly message for exception {ExceptionType}: {Message}", 
                exceptionType.Name, contextualMessage);

            return contextualMessage;
        }

        /// <summary>
        /// Gets a user-friendly error message for a general exception
        /// </summary>
        /// <param name="exception">The exception that occurred</param>
        /// <returns>User-friendly error message</returns>
        public string GetUserFriendlyMessage(Exception exception)
        {
            if (exception is StockDataException stockDataEx)
            {
                return GetUserFriendlyMessage(stockDataEx);
            }

            // Handle common .NET exceptions
            var message = exception switch
            {
                TimeoutException => "The request took too long to complete. Please try again.",
                System.Net.Http.HttpRequestException => "Unable to connect to the stock data service. Please check your internet connection.",
                UnauthorizedAccessException => "You don't have permission to access this data.",
                ArgumentException => "Invalid input provided. Please check your request and try again.",
                InvalidOperationException => "The requested operation cannot be completed at this time.",
                _ => "An unexpected error occurred. Please try again later."
            };

            _logger.LogDebug("Generated user-friendly message for general exception {ExceptionType}: {Message}", 
                exception.GetType().Name, message);

            return message;
        }

        /// <summary>
        /// Categorizes an HTTP status code into an API error type
        /// </summary>
        /// <param name="statusCode">HTTP status code</param>
        /// <returns>Corresponding API error type</returns>
        public ApiErrorType CategorizeHttpStatusCode(HttpStatusCode statusCode)
        {
            var errorType = statusCode switch
            {
                HttpStatusCode.Unauthorized => ApiErrorType.AuthenticationError,
                HttpStatusCode.Forbidden => ApiErrorType.AuthenticationError,
                HttpStatusCode.NotFound => ApiErrorType.NotFound,
                HttpStatusCode.BadRequest => ApiErrorType.InvalidRequest,
                HttpStatusCode.TooManyRequests => ApiErrorType.RateLimitExceeded,
                HttpStatusCode.RequestTimeout => ApiErrorType.Timeout,
                HttpStatusCode.InternalServerError => ApiErrorType.ServerError,
                HttpStatusCode.BadGateway => ApiErrorType.ServiceUnavailable,
                HttpStatusCode.ServiceUnavailable => ApiErrorType.ServiceUnavailable,
                HttpStatusCode.GatewayTimeout => ApiErrorType.Timeout,
                _ when ((int)statusCode >= 400 && (int)statusCode < 500) => ApiErrorType.ClientError,
                _ when ((int)statusCode >= 500) => ApiErrorType.ServerError,
                _ => ApiErrorType.UnknownError
            };

            _logger.LogDebug("Categorized HTTP status code {StatusCode} as error type {ErrorType}", 
                statusCode, errorType);

            return errorType;
        }

        /// <summary>
        /// Gets retry recommendation based on error type
        /// </summary>
        /// <param name="errorType">The type of error</param>
        /// <returns>Retry recommendation message</returns>
        public string GetRetryRecommendation(ApiErrorType errorType)
        {
            var recommendation = errorType switch
            {
                ApiErrorType.NetworkError => "Please check your internet connection and try again.",
                ApiErrorType.Timeout => "The service may be busy. Please wait a moment and try again.",
                ApiErrorType.RateLimitExceeded => "You've made too many requests. Please wait a few minutes before trying again.",
                ApiErrorType.AuthenticationError => "Please check your API credentials or contact support.",
                ApiErrorType.InvalidRequest => "Please verify your input and try again.",
                ApiErrorType.NotFound => "The requested stock symbol may not exist. Please verify the symbol.",
                ApiErrorType.ServerError => "The service is experiencing issues. Please try again in a few minutes.",
                ApiErrorType.ServiceUnavailable => "The service is temporarily unavailable. Please try again later.",
                ApiErrorType.DataError => "There was an issue processing the data. Please try again.",
                _ => "Please try again. If the problem persists, contact support."
            };

            return recommendation;
        }

        /// <summary>
        /// Determines if an error type is retryable
        /// </summary>
        /// <param name="errorType">The type of error</param>
        /// <returns>True if the error is retryable</returns>
        public bool IsRetryable(ApiErrorType errorType)
        {
            return errorType switch
            {
                ApiErrorType.NetworkError => true,
                ApiErrorType.Timeout => true,
                ApiErrorType.ServerError => true,
                ApiErrorType.ServiceUnavailable => true,
                ApiErrorType.RateLimitExceeded => true,
                ApiErrorType.AuthenticationError => false,
                ApiErrorType.InvalidRequest => false,
                ApiErrorType.NotFound => false,
                ApiErrorType.DataError => false,
                _ => false
            };
        }

        /// <summary>
        /// Initializes the error message dictionary
        /// </summary>
        private Dictionary<ApiErrorType, string> InitializeErrorMessages()
        {
            return new Dictionary<ApiErrorType, string>
            {
                [ApiErrorType.None] = "Operation completed successfully.",
                [ApiErrorType.NetworkError] = "Unable to connect to the stock data service.",
                [ApiErrorType.Timeout] = "The request timed out.",
                [ApiErrorType.AuthenticationError] = "Authentication failed.",
                [ApiErrorType.RateLimitExceeded] = "Too many requests have been made.",
                [ApiErrorType.InvalidRequest] = "The request contains invalid data.",
                [ApiErrorType.NotFound] = "The requested stock symbol was not found.",
                [ApiErrorType.ServerError] = "The stock data service is experiencing issues.",
                [ApiErrorType.ClientError] = "There was an error with your request.",
                [ApiErrorType.DataError] = "There was an error processing the stock data.",
                [ApiErrorType.ServiceUnavailable] = "The stock data service is temporarily unavailable.",
                [ApiErrorType.UnknownError] = "An unexpected error occurred."
            };
        }

        /// <summary>
        /// Initializes the exception message dictionary
        /// </summary>
        private Dictionary<Type, string> InitializeExceptionMessages()
        {
            return new Dictionary<Type, string>
            {
                [typeof(ApiAuthenticationException)] = "Unable to authenticate with the stock data service.",
                [typeof(RateLimitExceededException)] = "Request limit exceeded.",
                [typeof(InvalidSymbolException)] = "One or more stock symbols are invalid.",
                [typeof(ProviderUnavailableException)] = "Stock data provider is currently unavailable.",
                [typeof(DataParsingException)] = "Unable to process the stock data received.",
                [typeof(NetworkException)] = "Network connection error occurred.",
                [typeof(StockDataTimeoutException)] = "Request timed out while fetching stock data.",
                [typeof(CircuitBreakerOpenException)] = "Stock data service is temporarily disabled due to repeated failures."
            };
        }

        /// <summary>
        /// Gets rate limit specific context message
        /// </summary>
        private string GetRateLimitContext(RateLimitExceededException exception)
        {
            if (exception.RetryAfterSeconds.HasValue)
            {
                return $"Please wait {exception.RetryAfterSeconds.Value} seconds before trying again.";
            }
            
            if (exception.ResetTime.HasValue)
            {
                var waitTime = exception.ResetTime.Value - DateTime.UtcNow;
                if (waitTime.TotalSeconds > 0)
                {
                    return $"Please wait {waitTime.TotalMinutes:F1} minutes before trying again.";
                }
            }

            return "Please wait a few minutes before trying again.";
        }
    }
}