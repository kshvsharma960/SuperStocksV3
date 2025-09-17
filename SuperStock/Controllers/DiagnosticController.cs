using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using SuperStock.Services;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SuperStock.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagnosticController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IMongoClient _mongoClient;
        private readonly UserService _userService;
        private readonly StockService _stockService;

        public DiagnosticController(
            IConfiguration configuration, 
            IMongoClient mongoClient,
            UserService userService,
            StockService stockService)
        {
            _configuration = configuration;
            _mongoClient = mongoClient;
            _userService = userService;
            _stockService = stockService;
        }

        [HttpGet("config")]
        public IActionResult GetConfiguration()
        {
            try
            {
                var config = new
                {
                    MongoDbUri = _configuration["MongoDbUri"] != null ? "***CONFIGURED***" : "NOT SET",
                    JwtKey = _configuration["JwtKey"] != null ? "***CONFIGURED***" : "NOT SET",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                    StockDataConfig = _configuration.GetSection("StockData").Exists()
                };
                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("mongodb")]
        public IActionResult TestMongoConnection()
        {
            try
            {
                var database = _mongoClient.GetDatabase("HomeStocks");
                var collections = database.ListCollectionNames().ToList();
                
                return Ok(new
                {
                    status = "connected",
                    database = "HomeStocks",
                    collections = collections,
                    collectionsCount = collections.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("users")]
        public IActionResult TestUserService()
        {
            try
            {
                var users = _userService.GetUsers();
                var participants = _userService.GetParticipants();
                
                var sampleUserEmails = users != null && users.Count > 0 
                    ? users.Take(3).Select(u => u.Email).ToList() 
                    : new List<string>();
                    
                var sampleParticipantEmails = participants != null && participants.Count > 0 
                    ? participants.Take(3).Select(p => p.Email).ToList() 
                    : new List<string>();

                return Ok(new
                {
                    totalUsers = users?.Count ?? 0,
                    totalParticipants = participants?.Count ?? 0,
                    sampleUserEmails = sampleUserEmails,
                    sampleParticipantEmails = sampleParticipantEmails
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("stocks")]
        public IActionResult TestStockService()
        {
            try
            {
                var localEquityCount = StockService.LocalEquityList?.Count ?? 0;
                
                return Ok(new
                {
                    localEquityListCount = localEquityCount,
                    localEquityListStatus = StockService.LocalEquityList != null ? "loaded" : "null"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("leaderboard-test")]
        public IActionResult TestLeaderboard()
        {
            try
            {
                var participants = _userService.GetParticipants();
                if (participants == null || participants.Count == 0)
                {
                    return Ok(new { message = "No participants found", participantCount = 0 });
                }

                var sampleEmail = participants.Count > 0 ? participants[0].Email : null;
                if (string.IsNullOrEmpty(sampleEmail))
                {
                    return Ok(new { message = "No valid participant email found" });
                }

                var rankDict = _stockService.GetRankOfAllUsers(sampleEmail, participants);
                
                var sampleRanks = rankDict != null && rankDict.Count > 0 
                    ? rankDict.Take(5).ToDictionary(kvp => kvp.Key, kvp => kvp.Value) 
                    : new Dictionary<string, int>();
                
                return Ok(new
                {
                    participantCount = participants.Count,
                    rankDictCount = rankDict?.Count ?? 0,
                    sampleRanks = sampleRanks
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}