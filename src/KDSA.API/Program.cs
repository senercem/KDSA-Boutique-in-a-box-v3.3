using KDSA.Application.Interfaces;
using KDSA.Infrastructure.Services;
using Swashbuckle.AspNetCore.Swagger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CORS AYARI ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// --- 2. SERVİS KAYITLARI ---

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Servisler
builder.Services.AddScoped<IGeminiService, GeminiService>();
builder.Services.AddScoped<IAlexandraService, AlexandraService>();
builder.Services.AddScoped<IBaserowClient, BaserowClient>();
builder.Services.AddScoped<IACOREService, ACOREService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// JWT Authentication Ayarları
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"]
    };
});

// --- 3. UYGULAMA İNŞASI ---
var app = builder.Build();

// --- 4. MIDDLEWARE AYARLARI (İstek İşleme Hattı) ---
// DİKKAT: Buradaki sıralama hayati önem taşır!

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 1. CORS (En başta olmalı)
app.UseCors("AllowReactApp");

// 2. AUTHENTICATION (Kimlik Kontrolü - "Sen kimsin?")
// Controller'lara gelmeden önce kimlik tespit edilmeli.
app.UseAuthentication();

// 3. AUTHORIZATION (Yetki Kontrolü - "Buraya girebilir misin?")
app.UseAuthorization();

// 4. CONTROLLERS (API Uçları - "İçeri buyur")
// Güvenlik kontrollerinden geçen istek buraya ulaşır.
app.MapControllers();

// Uygulamayı başlat
app.Run();