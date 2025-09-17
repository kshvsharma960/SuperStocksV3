using Microsoft.AspNetCore.Mvc;
using SuperStock.Services;
using System;
using System.Threading.Tasks;

namespace SuperStock.Controllers
{
    /// <summary>
    /// Test controller for verifying TwelveDataProvider implementation
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class StockDataTestController : ControllerBase
    {
        private readonly IStockDataProvider _stockDataProvider;
        private readonly TwelveDataProviderTest _providerTest;

        public StockDataTestController(IStockDataProvider stockDataProvider)
        {
            _stockDataProvider = stockDataProvider;
            _providerTest = new TwelveDataProviderTest();
        }

        /// <summary>
        /// Tests the TwelveDataProvider implementation
        /// </summary>
        [HttpGet("test-provider")]
        public async Task<IActionResult> TestProvider()
        {
            try
            {
                var testResults = await _providerTest.RunAllTests();
                
                return Ok(new
                {
                    success = testResults,
                    message = testResults ? "All tests passed successfully" : "Some tests failed",
                    providerName = _stockDataProvider.ProviderName,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Test execution failed",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Tests health check functionality
        /// </summary>
        [HttpGet("health-check")]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                var isHealthy = await _stockDataProvider.IsHealthyAsync();
                
                return Ok(new
                {
                    providerName = _stockDataProvider.ProviderName,
                    isHealthy = isHealthy,
                    message = isHealthy ? "Provider is healthy" : "Provider is not responding",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    providerName = _stockDataProvider.ProviderName,
                    isHealthy = false,
                    message = "Health check failed",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Tests stock data retrieval with sample symbols
        /// </summary>
        [HttpGet("test-stock-data")]
        public async Task<IActionResult> TestStockData([FromQuery] string symbols = "AAPL,MSFT")
        {
            try
            {
                var symbolArray = symbols.Split(',', StringSplitOptions.RemoveEmptyEntries);
                var stockData = await _stockDataProvider.GetStockPriceAsync(symbolArray);
                
                return Ok(new
                {
                    success = true,
                    requestedSymbols = symbolArray,
                    retrievedCount = stockData.Count,
                    stockData = stockData,
                    providerName = _stockDataProvider.ProviderName,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Stock data retrieval failed",
                    error = ex.Message,
                    providerName = _stockDataProvider.ProviderName,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Tests symbol format conversion
        /// </summary>
        [HttpGet("test-symbol-conversion")]
        public IActionResult TestSymbolConversion([FromQuery] string symbol = "AAPL")
        {
            try
            {
                var convertedSymbol = SuperStock.Utilities.StockDataConverter.ConvertSymbolToTwelveDataFormat(symbol);
                var cleanedSymbol = SuperStock.Utilities.StockDataConverter.CleanSymbolName(convertedSymbol);
                var isValid = SuperStock.Utilities.StockDataConverter.IsValidSymbol(symbol);
                
                return Ok(new
                {
                    originalSymbol = symbol,
                    convertedSymbol = convertedSymbol,
                    cleanedSymbol = cleanedSymbol,
                    isValid = isValid,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Symbol conversion test failed",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }


    }
}