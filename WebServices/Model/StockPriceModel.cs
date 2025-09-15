using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SuperStock.Models
{
    public class StockPriceModel
    {
        public string Name { get; set; }
        public double Price { get; set; }
        public double Open {get;set;}
        public double Close { get; set; }
        public double High { get; set; }
        public double Low { get; set; }
        public int Count { get; set; }
        public double AveragePrice { get; set; }
    }

    public class OrderModel
    {
        public string Stock { get; set; }
        public string Price { get; set; }
        public int Quantity { get; set; }
    }

    /// <summary>
    /// Default Stocks in DB for Home screen.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class DefaultStocks
    {
        [BsonId]
        public object ObjectId { get; set; }

        [BsonElement("SYMBOL")]
        public string Symbol { get; set; }

        [BsonElement("SECURITY")]
        public string Security { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class Equities
    {
        [BsonElement("NAME")]
        public string Name { get; set; }

        [BsonElement("SYMBOL")]
        public string Symbol { get; set; }

        [BsonElement("SERIES")]
        public string Series { get; set; }

        [BsonElement("DATEOFLISTING")]
        public string DateOfListing { get; set; }

        [BsonElement("PAIDUPVALUE")]
        public string PaidUpValue { get; set; }

        [BsonElement("MARKETLOT")]
        public string MarketLot { get; set; }

        [BsonElement("ISINNUMBER")]
        public string IsinNumber { get; set; }

        [BsonElement("FACEVALUE")]
        public string FaceValue { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class UserEquityHolding
    {
        [BsonElement("USERID")]
        public string UserId { get; set; }

        [BsonElement("EMAIL")]
        public string Email { get; set; }

        [BsonElement("WATCHLIST")]
        public string WatchList { get; set; }

        [BsonElement("SYMBOLSHOLDINGS")]
        public string SymbolHoldings { get; set; }

        [BsonElement("FUND")]
        public string Funds { get; set; }

        [BsonElement("T1HOLDING")]
        public string T1Holdings { get; set; }

        [BsonIgnore]
        public List<StockPriceModel> UserStockList { get; set; }
    }
}
