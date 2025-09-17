using SuperStock.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Interface for stock data providers that can fetch stock price information
    /// </summary>
    public interface IStockDataProvider
    {
        /// <summary>
        /// Gets the name of this provider for identification and logging
        /// </summary>
        string ProviderName { get; }

        /// <summary>
        /// Retrieves stock price data for the specified symbols
        /// </summary>
        /// <param name="symbols">Array of stock symbols to fetch data for</param>
        /// <returns>List of stock price models with current market data</returns>
        Task<List<StockPriceModel>> GetStockPriceAsync(params string[] symbols);

        /// <summary>
        /// Checks if the provider is currently healthy and available
        /// </summary>
        /// <returns>True if the provider is operational, false otherwise</returns>
        Task<bool> IsHealthyAsync();
    }
}