using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SuperStock.Models;
using SuperStock.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SuperStock.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : Controller
    {
        private readonly UserService _userService;
        private readonly StockService _stockService;
        public UserController( UserService service, StockService stockService)
        {
            _userService = service;
            _stockService = stockService;
        }
        
        [HttpGet]
        [Route("GetUsers")]
        public ActionResult<List<UserAccountModel>> GetUsers()
        {
            return _userService.GetUsers();
        }

        [Route("GetUser/{userid}")]
        public ActionResult<UserAccountModel> GetUserFromId(string userid)
        {
            var user = _userService.GetUserFromUserId(userid);
            return Json(user);
        }

        public ActionResult<UserAccountModel> CreateUser(UserAccountModel user)
        {
            _userService.Create(user);
            return Json(user);
        }

        [Route("signup")]
        [AllowAnonymous]
        [HttpPost]
        public ActionResult Signup([FromForm] UserAccountModel user)
        {
            var userList = _userService.GetUsers();
            if (userList.Find(x => x.Email.Contains(user.Email.Trim()) ||x.Email.Trim().Equals(user.Email.Trim())) != null)
            {
                ViewBag.Message = "User Already Exists, Please Login !!";
                return View("Login");
            }
            else if (string.IsNullOrWhiteSpace(user.Password) || string.IsNullOrWhiteSpace(user.Email))
            {
                ViewBag.Message = "Invalid Credentials entered  for Registration!!";
                return View("Login");
            }
            else
            {
                _userService.SignUpUser(user);

                _stockService.InitializeUser(user).GetAwaiter().GetResult();
            }
            return View("Login");
        }

        [HttpGet]
        [Route("Login")]
        [AllowAnonymous]
        public IActionResult Login()
        {
            return View();
        }

        [AllowAnonymous]
        [Route("authenticate")]
        [HttpPost]
        public ActionResult Login([FromBody] UserAccountModel user)
        {
            var token = _userService.Authenticate(user.Email, user.Password);
            if (token == null)
            {
                return Unauthorized();
            }

            var dbUser = _userService.GetUserFromEmail(user.Email);
            var OkResult = Ok(new { token, dbUser });
            HttpContext.Session.SetString("JwtToken", token);

            return Json(new { redirectToUrl = Url.Action("Index", "Home") });
        }

        [AllowAnonymous]
        [Route("Logout")]
        public ActionResult Logout()
        {
            HttpContext.Session.Clear();            
            return View("Login");
        }
    }
}
