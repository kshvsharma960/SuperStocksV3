using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SuperStock.Configuration;
using SuperStock.Models;
using SuperStock.Models.StockData;
using SuperStock.Utilities;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Simple test class for TwelveDataProvider functionality (no external test framework dependencies)
    /// </summary>
    public class TwelveDataProviderTest
    {
        private readonly StockDataConfiguration _config;
        private readonly HttpClient _httpClient;

        public TwelveDataProviderTest()
        {
            _config = new StockDataConfiguration
            {
                TwelveDataApiKey = "demo", // Use demo key for testing
                TwelveDataBaseUrl = "https://api.twelvedata.com",
                RequestTimeoutSeconds = 30,
                MaxRetryAttempts = 3,
                EnableFallback = true,
                CacheDurationMinutes = 5,
                MaxRequestsPerMinute = 8,
                EnableThrottling = false // Disable for testing
            };
            
            _httpClient = new HttpClient();
        }

        /// <summary>
        /// Tests symbol format conversion
        /// </summary>
        public bool TestSymbolConversion()
        {
            try
            {
                Console.WriteLine("🧪 Testing symbol conversion...");

                // Test cases for symbol conversion
                var testCases = new Dictionary<string, string>
                {
                    { "AAPL", "AAPL.NS" },
                    { "MSFT", "MSFT.NS" },
                    { "GOOGL.NS", "GOOGL.NS" }, // Already has .NS suffix
                    { "tsla", "TSLA.NS" }, // Lowercase should be converted
                };

                foreach (var testCase in testCases)
                {
                    var result = StockDataConverter.ConvertSymbolToTwelveDataFormat(testCase.Key);
                    if (result != testCase.Value)
                    {
                        Console.WriteLine($"❌ Symbol conversion failed for '{testCase.Key}': expected '{testCase.Value}', got '{result}'");
                        return false;
                    }
                    Console.WriteLine($"✅ '{testCase.Key}' -> '{result}'");
                }

                Console.WriteLine("✅ Symbol conversion tests passed\n");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Symbol conversion test failed: {ex.Message}\n");
                return false;
            }
        }

        /// <summary>
        /// Tests data model conversion
        /// </summary>
        public bool TestDataModelConversion()
        {
            try
            {
                Console.WriteLine("🧪 Testing data model conversion...");

                var mockResponse = new TwelveDataQuoteResponse
                {
                    Symbol = "AAPL",
                    Name = "Apple Inc",
                    Open = "150.00",
                    High = "155.00",
                    Low = "149.00",
                    Close = "154.00",
                    PreviousClose = "151.00",
                    DateTime = "2024-01-15 16:00:00"
                };

                var stockModel = StockDataConverter.ConvertFromTwelveData(mockResponse);

                if (stockModel.Name != "AAPL" || 
                    stockModel.Price != 154.00 || 
                    stockModel.Open != 150.00 ||
                    stockModel.High != 155.00 ||
                    stockModel.Low != 149.00)
                {
                    Console.WriteLine("❌ Data model conversion failed");
                    return false;
                }

                Console.WriteLine($"✅ Converted: {stockModel.Name} - Price: {stockModel.Price}, Open: {stockModel.Open}");
                Console.WriteLine("✅ Data model conversion test passed\n");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Data model conversion test failed: {ex.Message}\n");
                return false;
            }
        }

        /// <summary>
        /// Tests basic provider functionality
        /// </summary>
        public async Task<bool> TestBasicProviderFunctionality()
        {
            try
            {
                Console.WriteLine("🧪 Testing basic provider functionality...");

                var logger = new ConsoleLogger();
                var options = Options.Create(_config);
                var errorMessageService = new ErrorMessageService(NullLogger<ErrorMessageService>.Instance);
                var loggingService = new StockDataLoggingService(NullLogger<StockDataLoggingService>.Instance);
                var provider = new TwelveDataProvider(_httpClient, logger, options, errorMessageService, loggingService);

                // Test provider name
                if (provider.ProviderName != "TwelveData")
                {
                    Console.WriteLine("❌ Provider name test failed");
                    return false;
                }
                Console.WriteLine($"✅ Provider name: {provider.ProviderName}");

                // Test empty symbols handling
                var emptyResult = await provider.GetStockPriceAsync();
                if (emptyResult.Count != 0)
                {
                    Console.WriteLine("❌ Empty symbols test failed");
                    return false;
                }
                Console.WriteLine("✅ Empty symbols handled correctly");

                Console.WriteLine("✅ Basic provider functionality tests passed\n");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Basic provider functionality test failed: {ex.Message}\n");
                return false;
            }
        }

        /// <summary>
        /// Runs all tests
        /// </summary>
        public async Task<bool> RunAllTests()
        {
            Console.WriteLine("🚀 Running TwelveDataProvider tests...\n");

            var symbolTest = TestSymbolConversion();
            var modelTest = TestDataModelConversion();
            var basicTest = await TestBasicProviderFunctionality();

            var allPassed = basicTest && symbolTest && modelTest;

            Console.WriteLine($"📊 Test Results Summary:");
            Console.WriteLine($"   Symbol Conversion: {(symbolTest ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine($"   Data Model Conversion: {(modelTest ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine($"   Basic Functionality: {(basicTest ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine($"   Overall: {(allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED")}");

            return allPassed;
        }

        /// <summary>
        /// Disposes test resources
        /// </summary>
        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    /// <summary>
    /// Simple console logger for testing
    /// </summary>
    public class ConsoleLogger : ILogger<TwelveDataProvider>
    {
        public IDisposable BeginScope<TState>(TState state) => null;
        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            var message = formatter(state, exception);
            Console.WriteLine($"[{logLevel}] {message}");
            if (exception != null)
            {
                Console.WriteLine($"Exception: {exception}");
            }
        }
    }
}