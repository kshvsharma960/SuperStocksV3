using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SuperStock.Models;
using SuperStock.Services;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Security.Claims;

namespace SuperStock.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        private readonly StockService _stockservice;

        private readonly UserService _userService;

        public HomeController(ILogger<HomeController> logger, StockService stockService, UserService userService)
        {
            _logger = logger;
            _stockservice = stockService;
            _userService = userService;
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [AllowAnonymous]
        public IActionResult Index()
        {           
            var jwtToken = HttpContext.Session.GetString("JwtToken");
            if (!string.IsNullOrEmpty(jwtToken))
            {
                return View();
            }

            return RedirectToAction("Login","User");           
        }

        //[Route("Register")]
        //[HttpPost]
        //public ActionResult RegisterForCompetition()
        //{
        //    var dbUser = _userService.GetUserFromEmail(user.Email);
        //    return View("Index")
        //}

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public IActionResult Competition()
        {
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                var dbUser = _userService.GetUserStockDataFromEmail(email,"C1");
                if (dbUser != null)
                {
                    return View("Index");
                }
            }

            return View("Competition");
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public IActionResult Leaderboard()
        {
            try
            {
                if (HttpContext.User.Identity is ClaimsIdentity identity)
                {
                    var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                    
                    if (string.IsNullOrEmpty(email))
                    {
                        _logger.LogWarning("No email found in user claims");
                        ViewData["error"] = "User email not found";
                        ViewData["rankDict"] = new Dictionary<string, int>();
                        return View(ViewData);
                    }

                    var allUsers = _userService.GetParticipants();
                    
                    if (allUsers == null || allUsers.Count == 0)
                    {
                        _logger.LogWarning("No participants found in database");
                        ViewData["error"] = "No participants found";
                        ViewData["rankDict"] = new Dictionary<string, int>();
                        return View(ViewData);
                    }

                    var rankDict = _stockservice.GetRankOfAllUsers(email, allUsers);
                    ViewData["rankDict"] = rankDict ?? new Dictionary<string, int>();
                    return View(ViewData);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading leaderboard");
                ViewData["error"] = $"Error loading leaderboard: {ex.Message}";
                ViewData["rankDict"] = new Dictionary<string, int>();
                return View(ViewData);
            }

            return RedirectToAction("Login", "User");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
