using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SuperStock.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SuperStock.Services
{
    public class UserService
    {
        private readonly IMongoCollection<UserAccountModel> userCollection;
        private readonly IMongoDatabase homeStocksDb;
        internal readonly string key;
        public UserService(IConfiguration configuration,IMongoClient mongoClient)
        {
            homeStocksDb = mongoClient.GetDatabase("HomeStocks");
            userCollection = homeStocksDb.GetCollection<UserAccountModel>("UserData");
            this.key = configuration.GetSection("JwtKey").ToString();
        }

       public List<UserAccountModel> GetUsers()
        {
            return userCollection.Find(x => true).ToList();
        }

        public List<UserEquityHolding> GetParticipants(string gameType="") // can also be written as => userCollection.Find(x => true).ToList();
        {
            var localUserCollection = homeStocksDb.GetCollection<UserEquityHolding>("UserStocksData" + gameType);
            return localUserCollection.Find(x => true).ToList();
        }

        public UserAccountModel GetUserFromUserId(string id)
        {
            return userCollection.Find(x => x.UserId == id).FirstOrDefault();
        }
        public UserAccountModel GetUserFromEmail(string email)
        {
            return userCollection.Find(x => x.Email == email).FirstOrDefault();
        }

        public UserEquityHolding GetUserStockDataFromEmail(string email,string gameType = "")
        {
            var userStockCol = homeStocksDb.GetCollection<UserEquityHolding>("UserStocksData" + gameType);            
            return userStockCol.Find(x => x.Email == email).FirstOrDefault();
        }

        internal void SignUpUser(UserAccountModel user)
        {
            userCollection.InsertOne(user);
        }

        public UserAccountModel GetUserFromMobile(string mobile)
        {
            return userCollection.Find(x => x.Mobile == mobile).FirstOrDefault();
        }

        public UserAccountModel Create(UserAccountModel user)
        {
            userCollection.InsertOne(user);
            return user;
        }

        public string Authenticate(string email, string password)
        {
            var filter = Builders<UserAccountModel>.Filter
            .Where(x => x.Email.ToLower() == email.ToLower() && x.Password == password);

            var user = this.userCollection.Find(filter).FirstOrDefault();
            if (user == null)
            {
                return null;
            }
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenKey = Encoding.ASCII.GetBytes(key);
            var tokenDescriptor = new SecurityTokenDescriptor()
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name,user.UserName)
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials
                (
                    new SymmetricSecurityKey(tokenKey),
                    SecurityAlgorithms.HmacSha256Signature
                )
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }


        public string Authenticate2(string email, string password)
        {
            var user = this.userCollection.Find(x => x.Email == email && x.Password == password).FirstOrDefault();
            if (user == null)
            {
                return null;
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var issuer = "https://localhost:44305";
            //Create a List of Claims, Keep claims name short    
            var permClaims = new List<Claim>();
            permClaims.Add(new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()));            
            permClaims.Add(new Claim(ClaimTypes.Name, user.UserName));

            //Create Security Token object by giving required parameters    
            var token = new JwtSecurityToken(issuer, //Issure    
                            issuer,  //Audience    
                            permClaims,
                            expires: DateTime.Now.AddDays(1),
                            signingCredentials: credentials);
            var jwt_token = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt_token;
        }
    }
}
