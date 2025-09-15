using Microsoft.AspNetCore.Mvc;
using SuperStock.Models;
using SuperStock.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using YahooFinanceApi;

namespace SuperStock.Controllers
{
    [Produces("application/json")]
    public class ApiStockController : Controller
    {
        private readonly StockService _stockService;
        public ApiStockController(StockService stockService)
        {
            _stockService = stockService;
        }

        [Route("api/UserHoldings/{email}")]
        public async Task<UserEquityHolding> GetUserHoldingDetails(string email,string gameType)
        {
            var data = await _stockService.GetUserEquityByEmail(email,gameType);
            return data;
        }

        //[Route("api/UserStocks/{email}")]
        //public async List<UserEquityHolding> GetUserStocksDetails(string email)
        //{
        //    var data = await _stockService.GetStockPriceByEmail(email);
        //    return data;
        //}

        [Route("api/StockData/{symbols}")]
        public async Task<List<StockPriceModel>> GetStockPrice(params string[] symbols)
        {
            List < StockPriceModel > StockList= new List<StockPriceModel>();
            var securities = await Yahoo.Symbols(symbols).Fields(Field.Symbol, Field.RegularMarketPrice, Field.RegularMarketDayHigh, Field.RegularMarketDayLow, Field.RegularMarketOpen, Field.RegularMarketPreviousClose).QueryAsync();
            foreach(var kvp in securities)
            {
                StockPriceModel spm = new StockPriceModel
                {
                    Name = kvp.Key,
                    Price = kvp.Value[Field.RegularMarketPrice],
                    High = kvp.Value[Field.RegularMarketDayHigh],
                    Low = kvp.Value[Field.RegularMarketDayLow],
                    Open = kvp.Value[Field.RegularMarketOpen],
                    Close = kvp.Value[Field.RegularMarketPreviousClose]
                };
                StockList.Add(spm);
            }
            return StockList;
        }
    }
}
