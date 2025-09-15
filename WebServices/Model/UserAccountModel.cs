using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SuperStock.Models
{
    public class UserAccountModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("USERID")]
        public string UserId { get; set; }

        [BsonElement("USERNAME")]
        public string UserName { get; set; }

        [BsonElement("PASSWORD")]
        public string Password { get; set; }

        [BsonElement("EMAIL")]
        public string Email { get; set; }

        [BsonElement("MOBILE")]
        public string Mobile { get; set; }
    }
}
