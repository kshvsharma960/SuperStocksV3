using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SuperStock.Services;
using SuperStock.Configuration;
using System.Text;
using System.Net.Http.Headers;
using System.Net;

namespace SuperStock
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Configuration
            services.Configure<StockDataConfiguration>(Configuration.GetSection(StockDataConfiguration.SectionName));

            // MongoDB
            services.AddSingleton<IMongoClient, MongoClient>(x => {
                var uri = x.GetRequiredService<IConfiguration>()["MongoDbUri"];
                if (string.IsNullOrEmpty(uri))
                {
                    // Use a default connection string if not provided
                    uri = "mongodb://localhost:27017";
                }
                return new MongoClient(uri);
            });

            // HTTP Client for stock data APIs
            services.AddHttpClient<HttpClientService>(client =>
            {
                client.DefaultRequestHeaders.Add("User-Agent", "SuperStock/1.0");
            });

            // Memory cache for stock data caching
            services.AddMemoryCache();

            // Stock data services
            services.AddScoped<HttpClientService>();
            services.AddScoped<ApiKeyManager>();
            services.AddScoped<StockDataInfrastructureTest>();
            services.AddScoped<StockService>();
            services.AddScoped<UserService>();
            
            // Error handling and logging services
            services.AddScoped<ErrorMessageService>();
            services.AddScoped<StockDataLoggingService>();
            services.AddScoped<ErrorHandlingAndLoggingTest>();
            
            // Stock data providers (order matters for priority)
            services.AddScoped<IStockDataProvider, TwelveDataProvider>();
            services.AddScoped<IStockDataProvider, YahooFinanceProvider>();
            services.AddScoped<TwelveDataProvider>();
            services.AddScoped<YahooFinanceProvider>();
            
            // Enhanced stock data service with provider orchestration
            services.AddScoped<StockDataService>();
            services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(x =>
            {                
                x.RequireHttpsMetadata = false;
                x.SaveToken = true;
                x.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(Configuration.GetSection("JwtKey").ToString())),
                    ValidateIssuer = false,
                    ValidateAudience = false
                };
            });

            //.AddCookie(x => {
            //     x.LoginPath = "/api/User/Login";
            //     x.AccessDeniedPath = "/Home/Privacy";
            // })



            services.AddRazorPages();
            services.AddSession();
            
            // Add health checks for container startup
            services.AddHealthChecks();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Configure forwarded headers for container/proxy scenarios
            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
            });

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            
            // Only redirect to HTTPS in development - Azure App Service handles SSL termination
            if (env.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }
            app.UseStaticFiles();
            app.UseSession();
            app.UseRouting();
            app.Use(async (context, next) =>
            {
                var jwtToken = context.Session.GetString("JwtToken");
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    context.Request.Headers.Add("Authorization", $"Bearer {jwtToken}");

                }
                await next.Invoke();
            });
            app.UseAuthentication();
            app.UseAuthorization();
           
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapRazorPages();
                endpoints.MapHealthChecks("/health");
            });
        }
    }
}
