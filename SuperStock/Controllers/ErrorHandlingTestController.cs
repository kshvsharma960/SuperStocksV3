using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SuperStock.Services;
using System;
using System.Threading.Tasks;

namespace SuperStock.Controllers
{
    /// <summary>
    /// Controller for testing error handling and logging functionality
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ErrorHandlingTestController : ControllerBase
    {
        private readonly ErrorHandlingAndLoggingTest _errorHandlingTest;
        private readonly ILogger<ErrorHandlingTestController> _logger;

        public ErrorHandlingTestController(
            ErrorHandlingAndLoggingTest errorHandlingTest,
            ILogger<ErrorHandlingTestController> logger)
        {
            _errorHandlingTest = errorHandlingTest ?? throw new ArgumentNullException(nameof(errorHandlingTest));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Runs comprehensive error handling and logging tests
        /// </summary>
        /// <returns>Test results</returns>
        [HttpGet("run-comprehensive-test")]
        public async Task<IActionResult> RunComprehensiveTest()
        {
            try
            {
                _logger.LogInformation("Starting comprehensive error handling and logging test via API");
                
                var result = await _errorHandlingTest.RunComprehensiveTestAsync();
                
                if (result.OverallSuccess)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "All error handling and logging tests passed successfully",
                        result = new
                        {
                            testName = result.TestName,
                            duration = result.Duration.TotalMilliseconds,
                            passedTests = result.PassedTests,
                            failedTests = result.FailedTests,
                            totalPassed = result.PassedTests.Count,
                            totalFailed = result.FailedTests.Count
                        }
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Some error handling and logging tests failed",
                        result = new
                        {
                            testName = result.TestName,
                            duration = result.Duration.TotalMilliseconds,
                            passedTests = result.PassedTests,
                            failedTests = result.FailedTests,
                            totalPassed = result.PassedTests.Count,
                            totalFailed = result.FailedTests.Count
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running comprehensive error handling test");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error running error handling tests",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Tests error message generation for different error types
        /// </summary>
        /// <returns>Error message examples</returns>
        [HttpGet("test-error-messages")]
        public IActionResult TestErrorMessages()
        {
            try
            {
                var errorMessageService = HttpContext.RequestServices.GetService(typeof(ErrorMessageService)) as ErrorMessageService;
                if (errorMessageService == null)
                {
                    return StatusCode(500, new { error = "ErrorMessageService not available" });
                }

                var errorMessages = new
                {
                    networkError = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.NetworkError),
                    timeout = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.Timeout),
                    rateLimitExceeded = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.RateLimitExceeded),
                    authenticationError = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.AuthenticationError),
                    invalidRequest = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.InvalidRequest),
                    notFound = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.NotFound),
                    serverError = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.ServerError),
                    serviceUnavailable = errorMessageService.GetUserFriendlyMessage(Models.StockData.ApiErrorType.ServiceUnavailable)
                };

                return Ok(new
                {
                    success = true,
                    message = "Error message examples generated successfully",
                    errorMessages = errorMessages
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing error messages");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error testing error messages",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Tests retry recommendations for different error types
        /// </summary>
        /// <returns>Retry recommendation examples</returns>
        [HttpGet("test-retry-recommendations")]
        public IActionResult TestRetryRecommendations()
        {
            try
            {
                var errorMessageService = HttpContext.RequestServices.GetService(typeof(ErrorMessageService)) as ErrorMessageService;
                if (errorMessageService == null)
                {
                    return StatusCode(500, new { error = "ErrorMessageService not available" });
                }

                var retryRecommendations = new
                {
                    networkError = new
                    {
                        isRetryable = errorMessageService.IsRetryable(Models.StockData.ApiErrorType.NetworkError),
                        recommendation = errorMessageService.GetRetryRecommendation(Models.StockData.ApiErrorType.NetworkError)
                    },
                    timeout = new
                    {
                        isRetryable = errorMessageService.IsRetryable(Models.StockData.ApiErrorType.Timeout),
                        recommendation = errorMessageService.GetRetryRecommendation(Models.StockData.ApiErrorType.Timeout)
                    },
                    rateLimitExceeded = new
                    {
                        isRetryable = errorMessageService.IsRetryable(Models.StockData.ApiErrorType.RateLimitExceeded),
                        recommendation = errorMessageService.GetRetryRecommendation(Models.StockData.ApiErrorType.RateLimitExceeded)
                    },
                    authenticationError = new
                    {
                        isRetryable = errorMessageService.IsRetryable(Models.StockData.ApiErrorType.AuthenticationError),
                        recommendation = errorMessageService.GetRetryRecommendation(Models.StockData.ApiErrorType.AuthenticationError)
                    },
                    invalidRequest = new
                    {
                        isRetryable = errorMessageService.IsRetryable(Models.StockData.ApiErrorType.InvalidRequest),
                        recommendation = errorMessageService.GetRetryRecommendation(Models.StockData.ApiErrorType.InvalidRequest)
                    }
                };

                return Ok(new
                {
                    success = true,
                    message = "Retry recommendations generated successfully",
                    retryRecommendations = retryRecommendations
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing retry recommendations");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error testing retry recommendations",
                    error = ex.Message
                });
            }
        }
    }
}