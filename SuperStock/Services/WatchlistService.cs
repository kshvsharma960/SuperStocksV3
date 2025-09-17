using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using SuperStock.Exceptions;
using SuperStock.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    /// <summary>
    /// Enhanced watchlist service with proper error handling, validation, and atomic operations
    /// </summary>
    public class WatchlistService
    {
        private readonly IMongoDatabase _database;
        private readonly IMongoCollection<UserEquityHolding> _userHoldingCollection;
        private readonly ILogger<WatchlistService> _logger;
        private readonly Regex _symbolValidationRegex;

        public WatchlistService(IMongoDatabase database, ILogger<WatchlistService> logger)
        {
            _database = database ?? throw new ArgumentNullException(nameof(database));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _userHoldingCollection = _database.GetCollection<UserEquityHolding>("UserStocksData");
            
            // Regex for validating stock symbols (alphanumeric, dots, hyphens, up to 20 chars)
            _symbolValidationRegex = new Regex(@"^[A-Za-z0-9\.\-]{1,20}$", RegexOptions.Compiled);
        }

        /// <summary>
        /// Adds a stock to user's watchlist with proper validation and duplicate prevention
        /// </summary>
        public async Task<WatchlistResponse> AddToWatchlistAsync(string email, string symbol)
        {
            try
            {
                // Input validation
                ValidateInputs(email, symbol);

                // Sanitize symbol
                var sanitizedSymbol = SanitizeSymbol(symbol);

                using var session = await _database.Client.StartSessionAsync();
                
                return await session.WithTransactionAsync(async (s, ct) =>
                {
                    var user = await GetUserEquityHoldingAsync(email, s);
                    
                    // Check for duplicates
                    var currentWatchlist = ParseWatchlistString(user.WatchList);
                    if (currentWatchlist.Contains(sanitizedSymbol, StringComparer.OrdinalIgnoreCase))
                    {
                        throw new DuplicateWatchlistItemException(sanitizedSymbol);
                    }

                    // Add to watchlist
                    var updatedWatchlist = AddSymbolToWatchlist(currentWatchlist, sanitizedSymbol);
                    var watchlistString = string.Join(", ", updatedWatchlist);

                    // Update database atomically
                    var filter = Builders<UserEquityHolding>.Filter.Eq(u => u.Email, email);
                    var update = Builders<UserEquityHolding>.Update.Set(u => u.WatchList, watchlistString);
                    
                    var result = await _userHoldingCollection.UpdateOneAsync(s, filter, update, cancellationToken: ct);
                    
                    if (result.ModifiedCount == 0)
                    {
                        throw new WatchlistDatabaseException("Failed to update watchlist");
                    }

                    _logger.LogInformation("Successfully added {Symbol} to watchlist for user {Email}", sanitizedSymbol, email);

                    return new WatchlistResponse
                    {
                        Success = true,
                        Message = $"Successfully added {sanitizedSymbol} to your watchlist",
                        Data = new { Symbol = sanitizedSymbol, WatchlistCount = updatedWatchlist.Count }
                    };
                });
            }
            catch (WatchlistException)
            {
                throw; // Re-throw watchlist-specific exceptions
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error adding {Symbol} to watchlist for user {Email}", symbol, email);
                throw new WatchlistException("An unexpected error occurred while adding to watchlist", ex);
            }
        }

        /// <summary>
        /// Removes a stock from user's watchlist with proper validation
        /// </summary>
        public async Task<WatchlistResponse> RemoveFromWatchlistAsync(string email, string symbol)
        {
            try
            {
                // Input validation
                ValidateInputs(email, symbol);

                // Sanitize symbol
                var sanitizedSymbol = SanitizeSymbol(symbol);

                using var session = await _database.Client.StartSessionAsync();
                
                return await session.WithTransactionAsync(async (s, ct) =>
                {
                    var user = await GetUserEquityHoldingAsync(email, s);
                    
                    // Check if symbol exists in watchlist
                    var currentWatchlist = ParseWatchlistString(user.WatchList);
                    var symbolToRemove = currentWatchlist.FirstOrDefault(s => 
                        string.Equals(s, sanitizedSymbol, StringComparison.OrdinalIgnoreCase));
                    
                    if (symbolToRemove == null)
                    {
                        throw new WatchlistItemNotFoundException(sanitizedSymbol);
                    }

                    // Remove from watchlist
                    var updatedWatchlist = RemoveSymbolFromWatchlist(currentWatchlist, symbolToRemove);
                    var watchlistString = string.Join(", ", updatedWatchlist);

                    // Update database atomically
                    var filter = Builders<UserEquityHolding>.Filter.Eq(u => u.Email, email);
                    var update = Builders<UserEquityHolding>.Update.Set(u => u.WatchList, watchlistString);
                    
                    var result = await _userHoldingCollection.UpdateOneAsync(s, filter, update, cancellationToken: ct);
                    
                    if (result.ModifiedCount == 0)
                    {
                        throw new WatchlistDatabaseException("Failed to update watchlist");
                    }

                    _logger.LogInformation("Successfully removed {Symbol} from watchlist for user {Email}", sanitizedSymbol, email);

                    return new WatchlistResponse
                    {
                        Success = true,
                        Message = $"Successfully removed {sanitizedSymbol} from your watchlist",
                        Data = new { Symbol = sanitizedSymbol, WatchlistCount = updatedWatchlist.Count }
                    };
                });
            }
            catch (WatchlistException)
            {
                throw; // Re-throw watchlist-specific exceptions
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error removing {Symbol} from watchlist for user {Email}", symbol, email);
                throw new WatchlistException("An unexpected error occurred while removing from watchlist", ex);
            }
        }

        /// <summary>
        /// Gets user's watchlist with stock price information
        /// </summary>
        public async Task<List<StockPriceModel>> GetWatchlistAsync(string email)
        {
            try
            {
                ValidateEmail(email);

                var user = await GetUserEquityHoldingAsync(email);
                var watchlistSymbols = ParseWatchlistString(user.WatchList);

                if (!watchlistSymbols.Any())
                {
                    return new List<StockPriceModel>();
                }

                // Note: This would integrate with the new IStockDataProvider when available
                // For now, returning empty list as the stock price fetching will be handled by other tasks
                _logger.LogInformation("Retrieved watchlist for user {Email} with {Count} symbols", email, watchlistSymbols.Count);
                
                return new List<StockPriceModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving watchlist for user {Email}", email);
                throw new WatchlistException("Failed to retrieve watchlist", ex);
            }
        }

        /// <summary>
        /// Gets user's watchlist symbols only (without price data)
        /// </summary>
        public async Task<List<string>> GetWatchlistSymbolsAsync(string email)
        {
            try
            {
                ValidateEmail(email);

                var user = await GetUserEquityHoldingAsync(email);
                var watchlistSymbols = ParseWatchlistString(user.WatchList);

                _logger.LogInformation("Retrieved {Count} watchlist symbols for user {Email}", watchlistSymbols.Count, email);
                
                return watchlistSymbols;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving watchlist symbols for user {Email}", email);
                throw new WatchlistException("Failed to retrieve watchlist symbols", ex);
            }
        }

        /// <summary>
        /// Batch add multiple symbols to watchlist
        /// </summary>
        public async Task<WatchlistResponse> BatchAddToWatchlistAsync(string email, string[] symbols)
        {
            try
            {
                ValidateEmail(email);
                
                if (symbols == null || symbols.Length == 0)
                {
                    throw new ArgumentException("Symbols array cannot be null or empty");
                }

                var sanitizedSymbols = symbols.Select(SanitizeSymbol).ToArray();
                var addedSymbols = new List<string>();
                var skippedSymbols = new List<string>();

                using var session = await _database.Client.StartSessionAsync();
                
                return await session.WithTransactionAsync(async (s, ct) =>
                {
                    var user = await GetUserEquityHoldingAsync(email, s);
                    var currentWatchlist = ParseWatchlistString(user.WatchList);

                    foreach (var symbol in sanitizedSymbols)
                    {
                        if (!currentWatchlist.Contains(symbol, StringComparer.OrdinalIgnoreCase))
                        {
                            currentWatchlist.Add(symbol);
                            addedSymbols.Add(symbol);
                        }
                        else
                        {
                            skippedSymbols.Add(symbol);
                        }
                    }

                    if (addedSymbols.Any())
                    {
                        var watchlistString = string.Join(", ", currentWatchlist);
                        var filter = Builders<UserEquityHolding>.Filter.Eq(u => u.Email, email);
                        var update = Builders<UserEquityHolding>.Update.Set(u => u.WatchList, watchlistString);
                        
                        var result = await _userHoldingCollection.UpdateOneAsync(s, filter, update, cancellationToken: ct);
                        
                        if (result.ModifiedCount == 0)
                        {
                            throw new WatchlistDatabaseException("Failed to update watchlist");
                        }
                    }

                    _logger.LogInformation("Batch added {AddedCount} symbols to watchlist for user {Email}, skipped {SkippedCount} duplicates", 
                        addedSymbols.Count, email, skippedSymbols.Count);

                    return new WatchlistResponse
                    {
                        Success = true,
                        Message = $"Added {addedSymbols.Count} symbols to watchlist",
                        Data = new { 
                            AddedSymbols = addedSymbols, 
                            SkippedSymbols = skippedSymbols,
                            TotalWatchlistCount = currentWatchlist.Count
                        }
                    };
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in batch add to watchlist for user {Email}", email);
                throw new WatchlistException("Failed to batch add to watchlist", ex);
            }
        }

        #region Private Helper Methods

        private void ValidateInputs(string email, string symbol)
        {
            ValidateEmail(email);
            ValidateSymbol(symbol);
        }

        private void ValidateEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email cannot be null or empty");
            }

            if (!email.Contains("@"))
            {
                throw new ArgumentException("Invalid email format");
            }
        }

        private void ValidateSymbol(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                throw new InvalidStockSymbolException("Symbol cannot be null or empty");
            }

            var sanitized = SanitizeSymbol(symbol);
            if (!_symbolValidationRegex.IsMatch(sanitized))
            {
                throw new InvalidStockSymbolException(symbol);
            }
        }

        private string SanitizeSymbol(string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return string.Empty;
            }

            // Remove whitespace and convert to uppercase
            return symbol.Trim().ToUpperInvariant();
        }

        private List<string> ParseWatchlistString(string watchlistString)
        {
            if (string.IsNullOrWhiteSpace(watchlistString))
            {
                return new List<string>();
            }

            return watchlistString
                .Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();
        }

        private List<string> AddSymbolToWatchlist(List<string> currentWatchlist, string symbol)
        {
            var updatedList = new List<string>(currentWatchlist);
            
            if (!updatedList.Contains(symbol, StringComparer.OrdinalIgnoreCase))
            {
                updatedList.Add(symbol);
            }

            return updatedList;
        }

        private List<string> RemoveSymbolFromWatchlist(List<string> currentWatchlist, string symbol)
        {
            return currentWatchlist
                .Where(s => !string.Equals(s, symbol, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        private async Task<UserEquityHolding> GetUserEquityHoldingAsync(string email, IClientSessionHandle session = null)
        {
            var filter = Builders<UserEquityHolding>.Filter.Eq(u => u.Email, email);
            
            UserEquityHolding user;
            if (session != null)
            {
                user = await _userHoldingCollection.Find(session, filter).FirstOrDefaultAsync();
            }
            else
            {
                user = await _userHoldingCollection.Find(filter).FirstOrDefaultAsync();
            }

            if (user == null)
            {
                throw new UserNotFoundException(email);
            }

            return user;
        }

        #endregion
    }
}