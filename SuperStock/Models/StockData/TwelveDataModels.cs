using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SuperStock.Models.StockData
{
    /// <summary>
    /// Response model for Twelve Data quote API
    /// </summary>
    public class TwelveDataQuoteResponse
    {
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("exchange")]
        public string Exchange { get; set; } = string.Empty;

        [JsonPropertyName("mic_code")]
        public string MicCode { get; set; } = string.Empty;

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = string.Empty;

        [JsonPropertyName("datetime")]
        public string DateTime { get; set; } = string.Empty;

        [JsonPropertyName("timestamp")]
        public long Timestamp { get; set; }

        [JsonPropertyName("open")]
        public string Open { get; set; } = "0";

        [JsonPropertyName("high")]
        public string High { get; set; } = "0";

        [JsonPropertyName("low")]
        public string Low { get; set; } = "0";

        [JsonPropertyName("close")]
        public string Close { get; set; } = "0";

        [JsonPropertyName("volume")]
        public string Volume { get; set; } = "0";

        [JsonPropertyName("previous_close")]
        public string PreviousClose { get; set; } = "0";

        [JsonPropertyName("change")]
        public string Change { get; set; } = "0";

        [JsonPropertyName("percent_change")]
        public string PercentChange { get; set; } = "0";

        [JsonPropertyName("average_volume")]
        public string AverageVolume { get; set; } = "0";

        [JsonPropertyName("is_market_open")]
        public bool IsMarketOpen { get; set; }

        [JsonPropertyName("fifty_two_week")]
        public TwelveDataFiftyTwoWeek? FiftyTwoWeek { get; set; }
    }

    /// <summary>
    /// Fifty-two week high/low data from Twelve Data
    /// </summary>
    public class TwelveDataFiftyTwoWeek
    {
        [JsonPropertyName("low")]
        public string Low { get; set; } = "0";

        [JsonPropertyName("high")]
        public string High { get; set; } = "0";

        [JsonPropertyName("low_change")]
        public string LowChange { get; set; } = "0";

        [JsonPropertyName("high_change")]
        public string HighChange { get; set; } = "0";

        [JsonPropertyName("low_change_percent")]
        public string LowChangePercent { get; set; } = "0";

        [JsonPropertyName("high_change_percent")]
        public string HighChangePercent { get; set; } = "0";

        [JsonPropertyName("range")]
        public string Range { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for batch quote requests
    /// </summary>
    public class TwelveDataBatchQuoteResponse
    {
        [JsonPropertyName("quotes")]
        public Dictionary<string, TwelveDataQuoteResponse> Quotes { get; set; } = new();

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Error response model from Twelve Data API
    /// </summary>
    public class TwelveDataErrorResponse
    {
        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("meta")]
        public TwelveDataErrorMeta? Meta { get; set; }
    }

    /// <summary>
    /// Additional error metadata from Twelve Data
    /// </summary>
    public class TwelveDataErrorMeta
    {
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("interval")]
        public string Interval { get; set; } = string.Empty;

        [JsonPropertyName("exchange")]
        public string Exchange { get; set; } = string.Empty;
    }

    /// <summary>
    /// API usage information from Twelve Data
    /// </summary>
    public class TwelveDataApiUsage
    {
        [JsonPropertyName("current_usage")]
        public int CurrentUsage { get; set; }

        [JsonPropertyName("plan_limit")]
        public int PlanLimit { get; set; }

        [JsonPropertyName("plan_name")]
        public string PlanName { get; set; } = string.Empty;

        [JsonPropertyName("reset_time")]
        public string ResetTime { get; set; } = string.Empty;
    }

    /// <summary>
    /// Symbol search response from Twelve Data
    /// </summary>
    public class TwelveDataSymbolSearchResponse
    {
        [JsonPropertyName("data")]
        public List<TwelveDataSymbol> Data { get; set; } = new();

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// Symbol information from Twelve Data
    /// </summary>
    public class TwelveDataSymbol
    {
        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("instrument_name")]
        public string InstrumentName { get; set; } = string.Empty;

        [JsonPropertyName("exchange")]
        public string Exchange { get; set; } = string.Empty;

        [JsonPropertyName("mic_code")]
        public string MicCode { get; set; } = string.Empty;

        [JsonPropertyName("exchange_timezone")]
        public string ExchangeTimezone { get; set; } = string.Empty;

        [JsonPropertyName("instrument_type")]
        public string InstrumentType { get; set; } = string.Empty;

        [JsonPropertyName("country")]
        public string Country { get; set; } = string.Empty;

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = string.Empty;
    }
}