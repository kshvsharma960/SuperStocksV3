using Microsoft.Extensions.Configuration;
using MongoDB.Bson;
using MongoDB.Driver;
using SuperStock.Models;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Threading.Tasks;
using YahooFinanceApi;

namespace WebServices
{
    public class StockService
    {
        public static List<Equities> LocalEquityList;

        private readonly IMongoCollection<Equities> mongoEquityCollection;

        private IMongoCollection<UserEquityHolding> mongoUserHoldingCollection;

        private IMongoCollection<UserEquityHolding> mongoStocksCollection;

        private IMongoCollection<StockPriceModel> mongoUserStocksCollection;

        private readonly IMongoDatabase mongoDatabase;

        internal readonly string key;
        public StockService(IConfiguration configuration, IMongoClient mongoClient)
        {
            mongoDatabase = mongoClient.GetDatabase("HomeStocks");
            mongoEquityCollection = mongoDatabase.GetCollection<Equities>("Equities");
            
                LocalEquityList = mongoEquityCollection.Aggregate().ToList();
            
        }

        public async Task<List<StockPriceModel>> GetStockPrice(params string[] symbols)
        {
            List<StockPriceModel> StockList = new List<StockPriceModel>();
            var securities = await Yahoo.Symbols(symbols).Fields(Field.Symbol, Field.RegularMarketPrice, Field.RegularMarketDayHigh, Field.RegularMarketDayLow, Field.RegularMarketOpen, Field.RegularMarketPreviousClose).QueryAsync();
            foreach (var kvp in securities)
            {
                StockPriceModel spm = new StockPriceModel
                {
                    Name = kvp.Key.Replace(".NS", ""),
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

        private Dictionary<string, ExpandoObject> SymbolHoldingStringToArray(string stocks)
        {
            Dictionary<string, ExpandoObject> StockQuantity = new Dictionary<string, ExpandoObject>();

            if (!string.IsNullOrWhiteSpace(stocks))
            {
                string[] StockColonPrice = stocks.Split(",");
                foreach (var scp in StockColonPrice)
                {
                    dynamic temp = new ExpandoObject();
                    temp.AvgPrice = Convert.ToDouble(scp.Split(":")[1].Trim());
                    temp.Quantity = Convert.ToInt32(scp.Split(":")[2].Trim());
                    StockQuantity.Add(scp.Split(":")[0].Trim(), temp);
                }
            }
            
            return StockQuantity;
        }
        private string ArrayOfSymbolHoldingString(Dictionary<string, ExpandoObject> stocksDict)
        {
            string stockString = "";
            foreach (var kvp in stocksDict)
            {
                dynamic temp = kvp.Value;
                stockString += kvp.Key+":"+temp.AvgPrice+":"+temp.Quantity+",";
            }

            stockString = stockString.Trim(',');
            return stockString;
        }
        public async Task InitializeUser(UserAccountModel user)
        {
            UserEquityHolding userStockData = new UserEquityHolding();
            userStockData.Email = user.Email;
            userStockData.Funds = "0";
            userStockData.SymbolHoldings = "";
            userStockData.WatchList = "";
            userStockData.T1Holdings = "";
            userStockData.UserId = user.UserId;
            mongoUserHoldingCollection = mongoDatabase.GetCollection<UserEquityHolding>("UserStocksData");
            await mongoUserHoldingCollection.InsertOneAsync(userStockData);                        
        }

        internal int GetRank(string email, List<UserAccountModel> allUsers)
        {
            var assetDict = GetAllUsersCurrentAssets(allUsers);
            var rankDict = new Dictionary<string, int>();
            var rank = 1;
            foreach(var kvp in assetDict.OrderByDescending(x => x.Value))
            {
                rankDict.Add(kvp.Key,rank++);
            }
            if (rankDict.ContainsKey(email))
            {
                return rankDict[email];
            }
            return rank;
        }

        private string DeleteFromWatchList(string watchList, string stock)
        {
            if (string.IsNullOrWhiteSpace(watchList) || string.IsNullOrWhiteSpace(stock))
            {
                return watchList ?? "";
            }

            // Sanitize input
            var sanitizedStock = stock.Trim().ToUpperInvariant();

            // Parse the watchlist into individual symbols
            var symbols = watchList.Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            // Remove the stock (case-insensitive comparison)
            symbols.RemoveAll(s => string.Equals(s.ToUpperInvariant(), sanitizedStock, StringComparison.OrdinalIgnoreCase));

            // Return the updated watchlist string
            return string.Join(", ", symbols);
        }

        internal string GetFundsFromEmail(string email)
        {
            UserEquityHolding userStockData = new UserEquityHolding();
            mongoUserHoldingCollection = mongoDatabase.GetCollection<UserEquityHolding>("UserStocksData");
            userStockData = mongoUserHoldingCollection.Find(x => x.Email == email).FirstOrDefault();
            var userFunds = "0.00";
            if ( userStockData!=null && !string.IsNullOrWhiteSpace(userStockData.Funds))
            {
                userFunds = userStockData.Funds;
            }
            return userFunds;
        }

        private string AddToWatchList(string watchList, string stock)
        {
            if (string.IsNullOrWhiteSpace(stock))
            {
                return watchList ?? "";
            }

            var sanitizedStock = stock.Trim().ToUpperInvariant();
            
            // Validate stock symbol format
            if (!System.Text.RegularExpressions.Regex.IsMatch(sanitizedStock, @"^[A-Za-z0-9\.\-]{1,20}$"))
            {
                throw new ArgumentException($"Invalid stock symbol format: {stock}");
            }

            if (string.IsNullOrWhiteSpace(watchList))
            {
                return sanitizedStock;
            }

            // Parse existing watchlist
            var symbols = watchList.Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            // Check for duplicates (case-insensitive)
            if (symbols.Any(s => string.Equals(s.ToUpperInvariant(), sanitizedStock, StringComparison.OrdinalIgnoreCase)))
            {
                return watchList; // Return unchanged if duplicate
            }

            // Add the new stock
            symbols.Add(sanitizedStock);
            return string.Join(", ", symbols);
        }


        public void UpdateUserWatchList(string email, string stock, int action)
        {
            // Input validation
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email cannot be null or empty", nameof(email));
            }

            if (string.IsNullOrWhiteSpace(stock))
            {
                throw new ArgumentException("Stock symbol cannot be null or empty", nameof(stock));
            }

            if (!email.Contains("@"))
            {
                throw new ArgumentException("Invalid email format", nameof(email));
            }

            mongoUserHoldingCollection = mongoDatabase.GetCollection<UserEquityHolding>("UserStocksData");
            
            // Use transaction for atomic operation
            using (var session = mongoDatabase.Client.StartSession())
            {
                session.StartTransaction();
                
                try
                {
                    var userStockData = mongoUserHoldingCollection.Find(session, x => x.Email == email).FirstOrDefault();
                    
                    if (userStockData == null)
                    {
                        throw new InvalidOperationException($"User with email {email} not found");
                    }

                    var updatedWatchList = "";
                    var originalWatchList = userStockData.WatchList ?? "";

                    if (action == 1) // add
                    {
                        updatedWatchList = AddToWatchList(originalWatchList, stock);
                        
                        // Check if anything actually changed (duplicate prevention)
                        if (updatedWatchList == originalWatchList)
                        {
                            throw new InvalidOperationException($"Stock '{stock}' is already in the watchlist");
                        }
                    }
                    else if (action == 0) // delete
                    {
                        updatedWatchList = DeleteFromWatchList(originalWatchList, stock);
                        
                        // Check if anything actually changed (stock not found)
                        if (updatedWatchList == originalWatchList)
                        {
                            throw new InvalidOperationException($"Stock '{stock}' is not in the watchlist");
                        }
                    }
                    else
                    {
                        throw new ArgumentException("Invalid action. Use 1 for add, 0 for delete", nameof(action));
                    }

                    var filter = Builders<UserEquityHolding>.Filter.Eq(u => u.Email, email);
                    var update = Builders<UserEquityHolding>.Update.Set(u => u.WatchList, updatedWatchList);
                    
                    var result = mongoUserHoldingCollection.UpdateOne(session, filter, update);
                    
                    if (result.ModifiedCount == 0)
                    {
                        throw new InvalidOperationException("Failed to update watchlist in database");
                    }

                    session.CommitTransaction();
                }
                catch
                {
                    session.AbortTransaction();
                    throw;
                }
            }
        }

        public async Task<List<StockPriceModel>> GetUserWatchList(string email)
        {
            UserEquityHolding userStockData = new UserEquityHolding();
            mongoUserHoldingCollection = mongoDatabase.GetCollection<UserEquityHolding>("UserStocksData");
            userStockData = mongoUserHoldingCollection.Find(x => x.Email == email).FirstOrDefault();
            var userStockList = new List<StockPriceModel>();
            if (!string.IsNullOrWhiteSpace(userStockData.WatchList))
            {
                var temp = userStockData.WatchList.Split(",");
                var stockArray = temp.Select(x => { return x.Trim() + ".NS"; }).ToArray();
                userStockList = await GetStockPrice(stockArray);
            }
            return userStockList;
        }

        public async Task<List<Equities>> GetAllAvailableStocks(string item)
        {
            List<Equities> stocks = new List<Equities>();
            if (!string.IsNullOrWhiteSpace(item.Trim()))
            {
                stocks = LocalEquityList.FindAll(x => (x.Name.Contains(item,StringComparison.InvariantCultureIgnoreCase) || x.Symbol.Contains(item, StringComparison.InvariantCultureIgnoreCase))).ToList();
            }
            return stocks;
        }

        private Dictionary<string, double> GetAllUsersCurrentAssets(List<UserAccountModel> emailList)
        {
            int rank = 1;
            int total = emailList.Count;
            Dictionary<string, double> AssetDict = new Dictionary<string, double>();
            foreach(var userModel in emailList)
            {
                AssetDict.Add(userModel.Email, GetTotalAssetValue(userModel.Email));
            }

            //var sortedAssetDict = from x in AssetDict orderby x.Value descending select x;
            return AssetDict;
        }

        public double GetTotalAssetValue(string email)
        {
            var availableFunds = Convert.ToDouble(GetFundsFromEmail(email));
            var EquityHoldings = GetUserEquityByEmail(email).GetAwaiter().GetResult();
            double EquityValue = 0;
            foreach(var eholdings in EquityHoldings.UserStockList)
            {
                EquityValue += eholdings.Price * eholdings.Count;
            }

            var assetValue = availableFunds + EquityValue;
            return Math.Round(assetValue, 2);
        }

        public async Task<UserEquityHolding> GetUserEquityByEmail(string email)
        {
            UserEquityHolding userStockData = new UserEquityHolding();
            mongoUserHoldingCollection = mongoDatabase.GetCollection<UserEquityHolding>("UserStocksData");
            userStockData = mongoUserHoldingCollection.Find(x => x.Email == email).FirstOrDefault();
            userStockData.UserStockList = new List<StockPriceModel>();
            if (!string.IsNullOrWhiteSpace(userStockData.SymbolHoldings))
            {
                var stockDict = SymbolHoldingStringToArray(userStockData.SymbolHoldings);
                var stockArray = stockDict.Keys.Select(x => { return x.Trim() + ".NS"; }).ToArray();
                var userStockList = await GetStockPrice(stockArray);
               
                foreach (var stock in userStockList)
                {
                    dynamic data = stockDict[stock.Name];
                    stock.Count = data.Quantity;
                    stock.AveragePrice = Math.Round(data.AvgPrice,2);
                    userStockData.UserStockList.Add(stock);
                }
            }
            return userStockData;
        }

        private bool TryAdjustFunds(string email,OrderTypeVO Otype, double cost)
        {
            var availableFunds = Convert.ToDouble(GetFundsFromEmail(email));
            if (Otype == OrderTypeVO.Buy)
            {
                if (cost < availableFunds)
                {
                    var diff = availableFunds - cost;
                    UpdateFunds(email,diff);
                    return true;
                }
                else
                {
                    throw new Exception("Insufficient Balance in SuperStock Account");
                }
            }
            else
            {
                if(Otype == OrderTypeVO.Sell)
                {
                    AddSubtractFunds(email, Math.Abs(cost));
                    return true;
                }
            }
            return false;
        }

        private bool AddSubtractFunds(string email,double amount) {
            var previousFund = Convert.ToDouble(GetFundsFromEmail(email));
            return UpdateFunds(email, previousFund + amount);
        }

        private bool UpdateFunds(string email, double Funds)
        {
            var finalFunds = Funds.ToString("N2");
            var filter = Builders<UserEquityHolding>.Filter.Eq("EMAIL", email);
            var update = Builders<UserEquityHolding>.Update.Set("FUND", finalFunds.Trim());
            UpdateResult result = mongoUserHoldingCollection.UpdateOne(filter, update);
            return result.IsAcknowledged;
        }

        public string UpdateUserEquityByEmail(string email, string stock, double price, int quantity)
        {
            bool isBuy = quantity > 0;
            bool sufficientFunds;
            if (isBuy)
            {
                sufficientFunds = TryAdjustFunds(email, OrderTypeVO.Buy, price * quantity);
            }
            
            OrderTypeVO orderType;
            UserEquityHolding userStockData = new UserEquityHolding();
            mongoUserHoldingCollection = mongoDatabase.GetCollection<UserEquityHolding>("UserStocksData");
            userStockData = mongoUserHoldingCollection.Find(x => x.Email == email).FirstOrDefault();
            
            var existingStocks = userStockData.SymbolHoldings;
            var stockDict = new Dictionary<string, ExpandoObject>();
            stockDict = SymbolHoldingStringToArray(existingStocks);
           
            if (stockDict.ContainsKey(stock))
            {
                dynamic temp = stockDict[stock];
                var previousStockValue = temp.Quantity * temp.AvgPrice;
                if (!isBuy )
                {
                    if (Math.Abs(quantity) <= Math.Abs(temp.Quantity))
                    {
                        TryAdjustFunds(email, OrderTypeVO.Sell, quantity * price);
                    }
                    else
                    {
                        throw new Exception($"Not much holding to sell as Delivery. Please buy before selling.{quantity-temp.Quantity}");
                    }
                }

                var finalQuantity = temp.Quantity + quantity;

                if (isBuy)
                {
                    var previousAmt = temp.Quantity * temp.AvgPrice;
                    var currentAmt = quantity * price;                    
                    temp.AvgPrice = (previousAmt + currentAmt) / finalQuantity;
                }
                temp.Quantity = finalQuantity;
                stockDict[stock] = temp;
                var finalStockValue = temp.Quantity * temp.AvgPrice;
                if (temp.Quantity == 0)
                {
                    stockDict.Remove(stock);
                }
            }
            else
            {
                if (isBuy)
                {
                    dynamic temp = new ExpandoObject();
                    temp.AvgPrice = price;
                    temp.Quantity = quantity;
                    stockDict.Add(stock, temp);
                }
                else
                {
                    throw new Exception($"Please buy before selling. {quantity}");
                }
            }

            string stockString = ArrayOfSymbolHoldingString(stockDict);

            var filter = Builders<UserEquityHolding>.Filter.Eq("EMAIL", email);
            var update = Builders<UserEquityHolding>.Update.Set("SYMBOLSHOLDINGS", stockString);
            mongoUserHoldingCollection.UpdateOne(filter, update);
            return stockString;
        }
    }
}
