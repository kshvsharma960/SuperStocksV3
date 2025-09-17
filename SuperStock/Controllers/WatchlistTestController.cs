using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SuperStock.Services;
using System;
using System.Threading.Tasks;

namespace SuperStock.Controllers
{
    /// <summary>
    /// Test controller for verifying watchlist CRUD operations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class WatchlistTestController : ControllerBase
    {
        private readonly WatchlistVerification _watchlistVerification;
        private readonly ILogger<WatchlistTestController> _logger;

        public WatchlistTestController(WatchlistVerification watchlistVerification, ILogger<WatchlistTestController> logger)
        {
            _watchlistVerification = watchlistVerification ?? throw new ArgumentNullException(nameof(watchlistVerification));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Runs comprehensive watchlist verification tests
        /// </summary>
        /// <param name="testEmail">Email of test user (must exist in database)</param>
        /// <returns>Verification results</returns>
        [HttpGet("verify")]
        public async Task<IActionResult> VerifyWatchlistOperations([FromQuery] string testEmail = "test@example.com")
        {
            try
            {
                _logger.LogInformation("Starting watchlist verification for email: {Email}", testEmail);

                var result = await _watchlistVerification.RunVerificationTests(testEmail);

                if (result.OverallSuccess)
                {
                    return Ok(new
                    {
                        Success = true,
                        Message = "All watchlist tests passed successfully",
                        Results = result
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        Success = false,
                        Message = "Some watchlist tests failed",
                        Results = result
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during watchlist verification");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Verification failed with error",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Quick test to add a stock to watchlist
        /// </summary>
        [HttpPost("quick-add")]
        public async Task<IActionResult> QuickAddTest([FromQuery] string email, [FromQuery] string symbol)
        {
            try
            {
                var watchlistService = HttpContext.RequestServices.GetService(typeof(WatchlistService)) as WatchlistService;
                var result = await watchlistService.AddToWatchlistAsync(email, symbol);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message, Type = ex.GetType().Name });
            }
        }

        /// <summary>
        /// Quick test to remove a stock from watchlist
        /// </summary>
        [HttpPost("quick-remove")]
        public async Task<IActionResult> QuickRemoveTest([FromQuery] string email, [FromQuery] string symbol)
        {
            try
            {
                var watchlistService = HttpContext.RequestServices.GetService(typeof(WatchlistService)) as WatchlistService;
                var result = await watchlistService.RemoveFromWatchlistAsync(email, symbol);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message, Type = ex.GetType().Name });
            }
        }

        /// <summary>
        /// Get watchlist symbols for a user
        /// </summary>
        [HttpGet("symbols")]
        public async Task<IActionResult> GetWatchlistSymbols([FromQuery] string email)
        {
            try
            {
                var watchlistService = HttpContext.RequestServices.GetService(typeof(WatchlistService)) as WatchlistService;
                var symbols = await watchlistService.GetWatchlistSymbolsAsync(email);
                return Ok(new { Symbols = symbols, Count = symbols.Count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message, Type = ex.GetType().Name });
            }
        }
    }
}