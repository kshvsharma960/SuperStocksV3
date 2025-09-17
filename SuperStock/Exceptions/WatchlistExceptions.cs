using System;

namespace SuperStock.Exceptions
{
    /// <summary>
    /// Base exception for watchlist operations
    /// </summary>
    public class WatchlistException : Exception
    {
        public string ErrorCode { get; }

        public WatchlistException(string message, string errorCode = null) : base(message)
        {
            ErrorCode = errorCode ?? "WATCHLIST_ERROR";
        }

        public WatchlistException(string message, Exception innerException, string errorCode = null) 
            : base(message, innerException)
        {
            ErrorCode = errorCode ?? "WATCHLIST_ERROR";
        }
    }

    /// <summary>
    /// Exception thrown when trying to add a duplicate stock to watchlist
    /// </summary>
    public class DuplicateWatchlistItemException : WatchlistException
    {
        public DuplicateWatchlistItemException(string symbol) 
            : base($"Stock '{symbol}' is already in your watchlist", "DUPLICATE_STOCK")
        {
        }
    }

    /// <summary>
    /// Exception thrown when trying to remove a stock that's not in watchlist
    /// </summary>
    public class WatchlistItemNotFoundException : WatchlistException
    {
        public WatchlistItemNotFoundException(string symbol) 
            : base($"Stock '{symbol}' is not in your watchlist", "STOCK_NOT_FOUND")
        {
        }
    }

    /// <summary>
    /// Exception thrown for invalid stock symbols
    /// </summary>
    public class InvalidStockSymbolException : WatchlistException
    {
        public InvalidStockSymbolException(string symbol) 
            : base($"Invalid stock symbol: '{symbol}'", "INVALID_SYMBOL")
        {
        }
    }

    /// <summary>
    /// Exception thrown when watchlist operations fail due to database issues
    /// </summary>
    public class WatchlistDatabaseException : WatchlistException
    {
        public WatchlistDatabaseException(string message, Exception innerException = null) 
            : base($"Database operation failed: {message}", innerException, "DATABASE_ERROR")
        {
        }
    }

    /// <summary>
    /// Exception thrown when user is not found
    /// </summary>
    public class UserNotFoundException : WatchlistException
    {
        public UserNotFoundException(string email) 
            : base($"User with email '{email}' not found", "USER_NOT_FOUND")
        {
        }
    }
}