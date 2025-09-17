using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SuperStock.Exceptions;
using SuperStock.Models;
using SuperStock.Services;
using System;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SuperStock.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WatchlistController : ControllerBase
    {
        private readonly WatchlistService _watchlistService;
        private readonly ILogger<WatchlistController> _logger;

        public WatchlistController(WatchlistService watchlistService, ILogger<WatchlistController> logger)
        {
            _watchlistService = watchlistService ?? throw new ArgumentNullException(nameof(watchlistService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Adds a stock to the user's watchlist
        /// </summary>
        [HttpPost("add")]
        public async Task<IActionResult> AddToWatchlist([FromBody] WatchlistRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userEmail = GetUserEmailFromClaims();
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "User not authenticated",
                        ErrorCode = "UNAUTHORIZED"
                    });
                }

                // Use email from token instead of request for security
                var result = await _watchlistService.AddToWatchlistAsync(userEmail, request.Symbol);
                
                return Ok(result);
            }
            catch (DuplicateWatchlistItemException ex)
            {
                return Conflict(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (InvalidStockSymbolException ex)
            {
                return BadRequest(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (UserNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (WatchlistException ex)
            {
                _logger.LogError(ex, "Watchlist error adding symbol {Symbol} for user {Email}", request.Symbol, GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error adding symbol {Symbol} for user {Email}", request.Symbol, GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = "An unexpected error occurred",
                    ErrorCode = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Removes a stock from the user's watchlist
        /// </summary>
        [HttpPost("remove")]
        public async Task<IActionResult> RemoveFromWatchlist([FromBody] WatchlistRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userEmail = GetUserEmailFromClaims();
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "User not authenticated",
                        ErrorCode = "UNAUTHORIZED"
                    });
                }

                var result = await _watchlistService.RemoveFromWatchlistAsync(userEmail, request.Symbol);
                
                return Ok(result);
            }
            catch (WatchlistItemNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (InvalidStockSymbolException ex)
            {
                return BadRequest(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (UserNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (WatchlistException ex)
            {
                _logger.LogError(ex, "Watchlist error removing symbol {Symbol} for user {Email}", request.Symbol, GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error removing symbol {Symbol} for user {Email}", request.Symbol, GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = "An unexpected error occurred",
                    ErrorCode = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Gets the user's watchlist symbols
        /// </summary>
        [HttpGet("symbols")]
        public async Task<IActionResult> GetWatchlistSymbols()
        {
            try
            {
                var userEmail = GetUserEmailFromClaims();
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "User not authenticated",
                        ErrorCode = "UNAUTHORIZED"
                    });
                }

                var symbols = await _watchlistService.GetWatchlistSymbolsAsync(userEmail);
                
                return Ok(new WatchlistResponse
                {
                    Success = true,
                    Message = "Watchlist retrieved successfully",
                    Data = symbols
                });
            }
            catch (UserNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (WatchlistException ex)
            {
                _logger.LogError(ex, "Watchlist error retrieving symbols for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving watchlist for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = "An unexpected error occurred",
                    ErrorCode = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Gets the user's watchlist with stock price data
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetWatchlist()
        {
            try
            {
                var userEmail = GetUserEmailFromClaims();
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "User not authenticated",
                        ErrorCode = "UNAUTHORIZED"
                    });
                }

                var watchlist = await _watchlistService.GetWatchlistAsync(userEmail);
                
                return Ok(new WatchlistResponse
                {
                    Success = true,
                    Message = "Watchlist retrieved successfully",
                    Data = watchlist
                });
            }
            catch (UserNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (WatchlistException ex)
            {
                _logger.LogError(ex, "Watchlist error retrieving data for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving watchlist data for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = "An unexpected error occurred",
                    ErrorCode = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Batch adds multiple stocks to the user's watchlist
        /// </summary>
        [HttpPost("batch-add")]
        public async Task<IActionResult> BatchAddToWatchlist([FromBody] BatchWatchlistRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userEmail = GetUserEmailFromClaims();
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "User not authenticated",
                        ErrorCode = "UNAUTHORIZED"
                    });
                }

                var result = await _watchlistService.BatchAddToWatchlistAsync(userEmail, request.Symbols);
                
                return Ok(result);
            }
            catch (UserNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (WatchlistException ex)
            {
                _logger.LogError(ex, "Watchlist error batch adding symbols for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error batch adding symbols for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = "An unexpected error occurred",
                    ErrorCode = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Legacy endpoint for backward compatibility
        /// </summary>
        [HttpPost("update")]
        public async Task<IActionResult> UpdateWatchlist([FromQuery] string symbol, [FromQuery] int action)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(symbol))
                {
                    return BadRequest(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "Symbol is required",
                        ErrorCode = "INVALID_INPUT"
                    });
                }

                var userEmail = GetUserEmailFromClaims();
                if (string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "User not authenticated",
                        ErrorCode = "UNAUTHORIZED"
                    });
                }

                WatchlistResponse result;
                
                if (action == 1) // add
                {
                    result = await _watchlistService.AddToWatchlistAsync(userEmail, symbol);
                }
                else if (action == 0) // remove
                {
                    result = await _watchlistService.RemoveFromWatchlistAsync(userEmail, symbol);
                }
                else
                {
                    return BadRequest(new WatchlistResponse 
                    { 
                        Success = false, 
                        Message = "Invalid action. Use 1 for add, 0 for remove",
                        ErrorCode = "INVALID_ACTION"
                    });
                }
                
                return Ok(result);
            }
            catch (DuplicateWatchlistItemException ex)
            {
                return Conflict(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (WatchlistItemNotFoundException ex)
            {
                return NotFound(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (InvalidStockSymbolException ex)
            {
                return BadRequest(new WatchlistResponse 
                { 
                    Success = false, 
                    Message = ex.Message,
                    ErrorCode = ex.ErrorCode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating watchlist for user {Email}", GetUserEmailFromClaims());
                return StatusCode(500, new WatchlistResponse 
                { 
                    Success = false, 
                    Message = "An unexpected error occurred",
                    ErrorCode = "INTERNAL_ERROR"
                });
            }
        }

        private string GetUserEmailFromClaims()
        {
            return User?.FindFirst(ClaimTypes.Email)?.Value;
        }
    }
}