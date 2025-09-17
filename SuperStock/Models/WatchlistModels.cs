using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.ComponentModel.DataAnnotations;

namespace SuperStock.Models
{
    /// <summary>
    /// Enhanced watchlist item model with proper validation and metadata
    /// </summary>
    [BsonIgnoreExtraElements]
    public class WatchlistItem
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("USERID")]
        [Required]
        public string UserId { get; set; }

        [BsonElement("EMAIL")]
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [BsonElement("SYMBOL")]
        [Required]
        [StringLength(20, MinimumLength = 1)]
        public string Symbol { get; set; }

        [BsonElement("ADDEDDATE")]
        public DateTime AddedDate { get; set; } = DateTime.UtcNow;

        [BsonElement("SORTORDER")]
        public int SortOrder { get; set; }

        [BsonElement("ISACTIVE")]
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Request model for watchlist operations
    /// </summary>
    public class WatchlistRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(20, MinimumLength = 1)]
        public string Symbol { get; set; }
    }

    /// <summary>
    /// Response model for watchlist operations
    /// </summary>
    public class WatchlistResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
        public string ErrorCode { get; set; }
    }

    /// <summary>
    /// Batch watchlist operation request
    /// </summary>
    public class BatchWatchlistRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string[] Symbols { get; set; }
    }
}