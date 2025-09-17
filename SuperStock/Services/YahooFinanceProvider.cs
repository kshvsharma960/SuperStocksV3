using Microsoft.Extensions.Logging;
using SuperStock.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using YahooFinanceApi;

namespace SuperStock.Services
{
    /// <summary>
    /// Fallback stock data provider using YahooFinanceAPI
    /// This provider serves as a backup when the primary TwelveData provider fails
    /// </summary>
    public class YahooFinanceProvider : IStockDataProvider
    {
        private readonly ILogger<YahooFinanceProvider> _logger;

        public string ProviderName => "YahooFinance";

        public YahooFinanceProvider(ILogger<YahooFinanceProvider> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Retrieves stock price data using YahooFinanceAPI
        /// </summary>
        public async Task<List<StockPriceModel>> GetStockPriceAsync(params string[] symbols)
        {
            if (symbols == null || symbols.Length == 0)
            {
                _logger.LogWarning("No symbols provided for stock price retrieval");
                return new List<StockPriceModel>();
            }

            _logger.LogInformation("Fetching stock prices from Yahoo Finance for {SymbolCount} symbols: {Symbols}",
                symbols.Length, string.Join(", ", symbols));

            try
            {
                var stockList = new List<StockPriceModel>();
                
                // Convert symbols to Yahoo Finance format (add .NS for Indian stocks if not present)
                var yahooSymbols = symbols.Select(ConvertToYahooFormat).ToArray();
                
                var securities = await Yahoo.Symbols(yahooSymbols)
                    .Fields(Field.Symbol, Field.RegularMarketPrice, Field.RegularMarketDayHigh, 
                           Field.RegularMarketDayLow, Field.RegularMarketOpen, Field.RegularMarketPreviousClose)
                    .QueryAsync();

                foreach (var kvp in securities)
                {
                    try
                    {
                        var stockModel = new StockPriceModel
                        {
                            Name = CleanSymbolName(kvp.Key),
                            Price = kvp.Value[Field.RegularMarketPrice],
                            High = kvp.Value[Field.RegularMarketDayHigh],
                            Low = kvp.Value[Field.RegularMarketDayLow],
                            Open = kvp.Value[Field.RegularMarketOpen],
                            Close = kvp.Value[Field.RegularMarketPreviousClose],
                            LastUpdated = DateTime.UtcNow,
                            DataSource = ProviderName,
                            IsStale = false
                        };

                        stockList.Add(stockModel);
                        _logger.LogDebug("Successfully processed stock data for {Symbol}", stockModel.Name);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to process stock data for symbol {Symbol}", kvp.Key);
                        // Continue processing other symbols
                    }
                }

                _logger.LogInformation("Successfully retrieved {ResultCount} stock prices from Yahoo Finance", stockList.Count);
                return stockList;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stock prices from Yahoo Finance for symbols: {Symbols}", 
                    string.Join(", ", symbols));
                throw;
            }
        }

        /// <summary>
        /// Checks if Yahoo Finance API is healthy
        /// </summary>
        public async Task<bool> IsHealthyAsync()
        {
            try
            {
                _logger.LogDebug("Performing health check for {ProviderName}", ProviderName);

                // Test with a well-known symbol
                var testSymbol = "AAPL";
                var securities = await Yahoo.Symbols(testSymbol)
                    .Fields(Field.Symbol, Field.RegularMarketPrice)
                    .QueryAsync();

                var isHealthy = securities.Any() && securities.First().Value[Field.RegularMarketPrice] != null;
                
                _logger.LogInformation($"{ProviderName} health check result: {isHealthy}");
                return isHealthy;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "{ProviderName} health check failed", ProviderName);
                return false;
            }
        }

        /// <summary>
        /// Converts symbol to Yahoo Finance format
        /// </summary>
        private string ConvertToYahooFormat(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return symbol;
            }

            // If symbol doesn't already have .NS suffix and appears to be an Indian stock, add it
            if (!symbol.Contains(".") && IsLikelyIndianStock(symbol))
            {
                return $"{symbol}.NS";
            }

            return symbol;
        }

        /// <summary>
        /// Determines if a symbol is likely an Indian stock
        /// This is a heuristic based on common patterns
        /// </summary>
        private bool IsLikelyIndianStock(string symbol)
        {
            // Simple heuristic: if it's all uppercase and doesn't contain common US patterns
            return symbol.All(char.IsLetterOrDigit) && 
                   symbol.All(c => !char.IsLower(c)) && 
                   !symbol.Contains("^") && 
                   !symbol.Contains("=");
        }

        /// <summary>
        /// Cleans symbol name by removing exchange suffixes
        /// </summary>
        private string CleanSymbolName(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return symbol;
            }

            // Remove common exchange suffixes
            return symbol.Replace(".NS", "")
                        .Replace(".BO", "")
                        .Replace(".TO", "")
                        .Replace(".L", "");
        }


    }
}