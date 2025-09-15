using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Newtonsoft.Json;
using SuperStock.Models;
using SuperStock.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;

namespace SuperStock.Controllers
{
    [ApiController]
    public class ApiDbController : Controller
    {
        private IMongoClient _iMongoClient;
        private readonly StockService _stockService;
        private readonly UserService _userService;

        public ApiDbController(IMongoClient mongoClient, StockService stockService, UserService userService )
        {
            _iMongoClient = mongoClient;
            _stockService = stockService;
            _userService = userService;
        }

        [Route("api/UserStocks")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public string GetUserEquityHoldings(string gameType)
        {
            UserEquityHolding userEquityData = new UserEquityHolding();
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                userEquityData = _stockService.GetUserEquityByEmail(email,gameType).GetAwaiter().GetResult();
            }
            var result = this.Json(userEquityData);
            return JsonConvert.SerializeObject(result);
        }        

        [Route("api/ExecuteOrder")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpPost]
        public ActionResult UpdateUserEquityHoldings(OrderModel OrderData)
        {            
            string userEquityString = "";
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                var gameType = OrderData.GameType;
                var stockName = OrderData.Stock.Contains(".NS") ? OrderData.Stock : OrderData.Stock + ".NS";
                List<StockPriceModel> liveStatus =_stockService.GetStockPrice(stockName).GetAwaiter().GetResult();
                var price = liveStatus.FirstOrDefault()?.Price.ToString();
                if (price == null)
                {
                    price = OrderData.Price;
                }
                userEquityString = _stockService.UpdateUserEquityByEmail(email, OrderData.Stock, Convert.ToDouble(price),Convert.ToInt32(OrderData.Quantity),gameType);
            }

            var result = this.Json(userEquityString);
            return Json( JsonConvert.SerializeObject(result));
        }

        [Route("api/AllStocks")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]        
        [HttpGet]
        public string GetAllStocks(string item)
        {
            var AllEquity = new List<Equities>();
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                AllEquity = _stockService.GetAllAvailableStocks(item).GetAwaiter().GetResult();
            }
            var result = this.Json(AllEquity);
            return JsonConvert.SerializeObject(result);
        }

        [Route("api/Enter")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpPost]
        public string RegisterForCompetition()
        {
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                var dbUser = _userService.GetUserFromEmail(email);
                _stockService.InitializeUser(dbUser, "C1").GetAwaiter().GetResult();
                return "success";
            }
            return "failed";
        }

        [Route("api/GetRank")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [HttpGet]
        public string GetUserRank(string gameType)
        {
            var rank = 1;
            var allUsers = new List<UserEquityHolding>();
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrWhiteSpace(gameType))
                {
                    allUsers = _userService.GetParticipants(gameType);
                }
                else
                {
                    allUsers = _userService.GetParticipants(gameType);
                }
                rank = _stockService.GetRank(email, allUsers,gameType);
            }

            return String.Format($"{rank}  / {allUsers.Count}"); 
        }

        [Route("api/AddDelete")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public string AddDeleteWatchList(string Stock, int AddDel, string gameType)
        {
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                _stockService.UpdateUserWatchList(email, Stock, Convert.ToInt32(AddDel), gameType);
            }

            return Stock;
        }

        [Route("api/UserWatchlist")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public string GetUserWatchList(string gameType)
        {
            List<StockPriceModel> userEquityData = new List<StockPriceModel>();
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                userEquityData = _stockService.GetUserWatchList(email, gameType).GetAwaiter().GetResult();
            }
            var result = this.Json(userEquityData);
            return JsonConvert.SerializeObject(result);
        }

        [Route("api/GetCompetitionData")]
        [Produces("application/json")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public string GetCompetitionData(string gameType)
        {
            List<StockPriceModel> userEquityData = new List<StockPriceModel>();
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                userEquityData = _stockService.GetUserWatchList(email, gameType).GetAwaiter().GetResult();
            }
            var result = this.Json(userEquityData);
            return JsonConvert.SerializeObject(result);
        }

        [Route("api/GetFunds")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public string GetFunds(string gameType)
        {
            string funds = "0.00";
            if(HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                funds = _stockService.GetFundsFromEmail(email,gameType);
            }

            return funds;
        }

        [Route("api/DefaultStocks")]
        [Produces("application/json")]
        public List<DefaultStocks> GetDefaultStocksFromDb()
        {
            var db = _iMongoClient.GetDatabase("HomeStocks");            
            var defaultCollection = db.GetCollection<DefaultStocks>("DefaultStocks");
            var dbList = db.ListCollectionNames();
            var result = defaultCollection.Aggregate();
            var defaultStockData = result.ToList();
            return defaultStockData;      
        }       
    }
}
