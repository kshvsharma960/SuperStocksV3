using SuperStock.Models;
using SuperStock.Models.StockData;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace SuperStock.Utilities
{
    /// <summary>
    /// Utility class for converting between different stock data formats
    /// </summary>
    public static class StockDataConverter
    {
        /// <summary>
        /// Converts Twelve Data quote response to internal StockPriceModel
        /// </summary>
        public static StockPriceModel ConvertFromTwelveData(TwelveDataQuoteResponse quote)
        {
            if (quote == null)
                throw new ArgumentNullException(nameof(quote));

            return new StockPriceModel
            {
                Name = CleanSymbolName(quote.Symbol),
                Price = ParseDouble(quote.Close),
                High = ParseDouble(quote.High),
                Low = ParseDouble(quote.Low),
                Open = ParseDouble(quote.Open),
                Close = ParseDouble(quote.PreviousClose),
                LastUpdated = ParseDateTime(quote.DateTime),
                DataSource = "TwelveData",
                IsStale = false
            };
        }

        /// <summary>
        /// Converts symbol to Twelve Data format (adds exchange suffix if needed)
        /// </summary>
        public static string ConvertSymbolToTwelveDataFormat(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return string.Empty;

            var cleanSymbol = symbol.Trim().ToUpperInvariant();

            // If symbol already has .NS suffix, return as is
            if (cleanSymbol.EndsWith(".NS"))
                return cleanSymbol;

            // For Indian stocks, add .NS suffix
            // This is a simplified approach - in production, you might want more sophisticated logic
            return $"{cleanSymbol}.NS";
        }

        /// <summary>
        /// Converts symbol from API format to display format (removes exchange suffix)
        /// </summary>
        public static string CleanSymbolName(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return string.Empty;

            return symbol.Replace(".NS", "").Trim();
        }

        /// <summary>
        /// Safely parses double values from string
        /// </summary>
        public static double ParseDouble(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return 0.0;

            if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var result))
                return result;

            return 0.0;
        }

        /// <summary>
        /// Safely parses DateTime from string
        /// </summary>
        public static DateTime ParseDateTime(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return DateTime.UtcNow;

            // Try different date formats
            var formats = new[]
            {
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd",
                "MM/dd/yyyy HH:mm:ss",
                "MM/dd/yyyy"
            };

            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
                    return result;
            }

            // Fallback to general parsing
            if (DateTime.TryParse(value, out var fallbackResult))
                return fallbackResult;

            return DateTime.UtcNow;
        }

        /// <summary>
        /// Validates if a symbol is in correct format
        /// </summary>
        public static bool IsValidSymbol(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return false;

            var cleanSymbol = symbol.Trim();
            
            // Basic validation - symbol should be alphanumeric with optional dots and dashes
            return System.Text.RegularExpressions.Regex.IsMatch(cleanSymbol, @"^[A-Za-z0-9\.\-]+$");
        }

        /// <summary>
        /// Normalizes an array of symbols for API calls
        /// </summary>
        public static string[] NormalizeSymbols(params string[] symbols)
        {
            if (symbols == null || symbols.Length == 0)
                return Array.Empty<string>();

            var normalizedSymbols = new List<string>();

            foreach (var symbol in symbols)
            {
                if (IsValidSymbol(symbol))
                {
                    normalizedSymbols.Add(ConvertSymbolToTwelveDataFormat(symbol));
                }
            }

            return normalizedSymbols.ToArray();
        }

        /// <summary>
        /// Creates a StockPriceModel with error state
        /// </summary>
        public static StockPriceModel CreateErrorStock(string symbol, string errorMessage)
        {
            return new StockPriceModel
            {
                Name = CleanSymbolName(symbol),
                Price = 0,
                High = 0,
                Low = 0,
                Open = 0,
                Close = 0,
                LastUpdated = DateTime.UtcNow,
                DataSource = "Error",
                IsStale = true
            };
        }

        /// <summary>
        /// Checks if stock data is considered stale based on timestamp
        /// </summary>
        public static bool IsDataStale(DateTime lastUpdated, TimeSpan maxAge)
        {
            return DateTime.UtcNow - lastUpdated > maxAge;
        }

        /// <summary>
        /// Marks stock data as stale if it's too old
        /// </summary>
        public static void UpdateStaleStatus(StockPriceModel stock, TimeSpan maxAge)
        {
            if (stock != null)
            {
                stock.IsStale = IsDataStale(stock.LastUpdated, maxAge);
            }
        }
    }
}