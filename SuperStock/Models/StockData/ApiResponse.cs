using System;
using System.Net;

namespace SuperStock.Models.StockData
{
    /// <summary>
    /// Generic API response wrapper for all stock data API calls
    /// </summary>
    /// <typeparam name="T">Type of the response data</typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// Indicates if the API call was successful
        /// </summary>
        public bool IsSuccess { get; set; }

        /// <summary>
        /// The response data (null if request failed)
        /// </summary>
        public T? Data { get; set; }

        /// <summary>
        /// HTTP status code of the response
        /// </summary>
        public HttpStatusCode StatusCode { get; set; }

        /// <summary>
        /// Human-readable message about the response
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Type of error that occurred (if any)
        /// </summary>
        public ApiErrorType ErrorType { get; set; } = ApiErrorType.None;

        /// <summary>
        /// Additional error details for debugging
        /// </summary>
        public string? ErrorDetails { get; set; }

        /// <summary>
        /// Timestamp when the response was created
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Creates a successful response
        /// </summary>
        public static ApiResponse<T> Success(T data, string message = "Request successful")
        {
            return new ApiResponse<T>
            {
                IsSuccess = true,
                Data = data,
                StatusCode = HttpStatusCode.OK,
                Message = message,
                ErrorType = ApiErrorType.None
            };
        }

        /// <summary>
        /// Creates a failed response
        /// </summary>
        public static ApiResponse<T> Failure(string message, ApiErrorType errorType = ApiErrorType.UnknownError, HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
        {
            return new ApiResponse<T>
            {
                IsSuccess = false,
                Data = default(T),
                StatusCode = statusCode,
                Message = message,
                ErrorType = errorType
            };
        }

        /// <summary>
        /// Creates a failed response with error details
        /// </summary>
        public static ApiResponse<T> Failure(string message, string errorDetails, ApiErrorType errorType = ApiErrorType.UnknownError, HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
        {
            return new ApiResponse<T>
            {
                IsSuccess = false,
                Data = default(T),
                StatusCode = statusCode,
                Message = message,
                ErrorType = errorType,
                ErrorDetails = errorDetails
            };
        }
    }

    /// <summary>
    /// Types of errors that can occur during API calls
    /// </summary>
    public enum ApiErrorType
    {
        /// <summary>
        /// No error occurred
        /// </summary>
        None = 0,

        /// <summary>
        /// Network connectivity issues
        /// </summary>
        NetworkError = 1,

        /// <summary>
        /// Request timeout
        /// </summary>
        Timeout = 2,

        /// <summary>
        /// Invalid API key or authentication failure
        /// </summary>
        AuthenticationError = 3,

        /// <summary>
        /// Rate limit exceeded
        /// </summary>
        RateLimitExceeded = 4,

        /// <summary>
        /// Invalid request parameters
        /// </summary>
        InvalidRequest = 5,

        /// <summary>
        /// Requested resource not found
        /// </summary>
        NotFound = 6,

        /// <summary>
        /// Server error on the API provider side
        /// </summary>
        ServerError = 7,

        /// <summary>
        /// Client error (4xx HTTP status codes)
        /// </summary>
        ClientError = 8,

        /// <summary>
        /// Data parsing or validation error
        /// </summary>
        DataError = 9,

        /// <summary>
        /// Service temporarily unavailable
        /// </summary>
        ServiceUnavailable = 10,

        /// <summary>
        /// Unknown or unexpected error
        /// </summary>
        UnknownError = 99
    }
}