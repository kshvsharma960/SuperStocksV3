using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SuperStock.Services;
using System;
using System.Threading.Tasks;

namespace SuperStock.Controllers
{
    /// <summary>
    /// Controller for testing the enhanced StockDataService with provider orchestration
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class StockDataController : ControllerBase
    {
        private readonly StockDataService _stockDataService;
        private readonly ILogger<StockDataController> _logger;

        public StockDataController(
            StockDataService stockDataService,
            ILogger<StockDataController> logger)
        {
            _stockDataService = stockDataService ?? throw new ArgumentNullException(nameof(stockDataService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Gets stock prices using the enhanced StockDataService
        /// </summary>
        /// <param name="symbols">Comma-separated list of stock symbols</param>
        /// <returns>Stock price data with provider information</returns>
        [HttpGet("prices")]
        public async Task<IActionResult> GetStockPrices([FromQuery] string symbols)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(symbols))
                {
                    return BadRequest("Symbols parameter is required");
                }

                var symbolArray = symbols.Split(',', StringSplitOptions.RemoveEmptyEntries);
                
                _logger.LogInformation("Fetching stock prices for symbols: {Symbols}", string.Join(", ", symbolArray));

                var stockData = await _stockDataService.GetStockPriceAsync(symbolArray);

                return Ok(new
                {
                    Success = true,
                    Count = stockData.Count,
                    Data = stockData,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stock prices for symbols: {Symbols}", symbols);
                return StatusCode(500, new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Gets health status of all stock data providers
        /// </summary>
        /// <returns>Health status of each provider</returns>
        [HttpGet("health")]
        public async Task<IActionResult> GetProviderHealth()
        {
            try
            {
                _logger.LogInformation("Checking provider health status");

                var healthStatus = await _stockDataService.GetProviderHealthStatusAsync();

                return Ok(new
                {
                    Success = true,
                    Providers = healthStatus,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking provider health");
                return StatusCode(500, new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Gets circuit breaker status for all providers
        /// </summary>
        /// <returns>Circuit breaker status information</returns>
        [HttpGet("circuit-breakers")]
        public IActionResult GetCircuitBreakerStatus()
        {
            try
            {
                _logger.LogInformation("Getting circuit breaker status");

                var circuitBreakerStatus = _stockDataService.GetCircuitBreakerStatus();

                return Ok(new
                {
                    Success = true,
                    CircuitBreakers = circuitBreakerStatus,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting circuit breaker status");
                return StatusCode(500, new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Resets circuit breaker for a specific provider
        /// </summary>
        /// <param name="providerName">Name of the provider to reset</param>
        /// <returns>Success status</returns>
        [HttpPost("circuit-breakers/{providerName}/reset")]
        public IActionResult ResetCircuitBreaker(string providerName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(providerName))
                {
                    return BadRequest("Provider name is required");
                }

                _logger.LogInformation("Resetting circuit breaker for provider: {ProviderName}", providerName);

                _stockDataService.ResetCircuitBreaker(providerName);

                return Ok(new
                {
                    Success = true,
                    Message = $"Circuit breaker reset for provider: {providerName}",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting circuit breaker for provider: {ProviderName}", providerName);
                return StatusCode(500, new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Clears the stock data cache
        /// </summary>
        /// <returns>Success status</returns>
        [HttpPost("cache/clear")]
        public IActionResult ClearCache()
        {
            try
            {
                _logger.LogInformation("Clearing stock data cache");

                _stockDataService.ClearCache();

                return Ok(new
                {
                    Success = true,
                    Message = "Cache cleared successfully",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing cache");
                return StatusCode(500, new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Runs integration test for the StockDataService
        /// </summary>
        /// <returns>Test results</returns>
        [HttpGet("test")]
        public async Task<IActionResult> RunIntegrationTest()
        {
            try
            {
                _logger.LogInformation("Running StockDataService integration test");

                var testService = new StockDataServiceIntegrationTest(_stockDataService, 
                    _logger as ILogger<StockDataServiceIntegrationTest>);
                
                var testResult = await testService.TestProviderOrchestrationAsync();

                return Ok(new
                {
                    Success = true,
                    TestResult = testResult,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running integration test");
                return StatusCode(500, new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }
}