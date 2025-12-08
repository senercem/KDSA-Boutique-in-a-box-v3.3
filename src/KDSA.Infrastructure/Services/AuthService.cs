using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BCrypt.Net;
using KDSA.Application.DTOs;
using KDSA.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace KDSA.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _tableId;

        // --- BASEROW USERS TABLE (736) FIELD ID'LERİ ---
        // Sizin verdiğiniz numaralar:
        private const string Field_Name = "field_7175";         // Username
        private const string Field_Email = "field_7176";        // Email (Giriş için kritik)
        private const string Field_PasswordHash = "field_7177"; // PasswordHash
        private const string Field_Role = "field_7178";         // Role
        private const string Field_CreatedDate = "field_7179";  // CreatedDate

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();

            _httpClient.BaseAddress = new Uri(_configuration["Baserow:BaseUrl"]);
            var apiToken = _configuration["Baserow:ApiToken"];

            // appsettings.json dosyasındaki "UsersTableId" (736) değerini okur
            _tableId = _configuration["Baserow:UsersTableId"];

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Token", apiToken);
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
        {
            // 1. E-posta Kontrolü (Aynı mailden var mı?)
            // ID üzerinden filtreleme yapıyoruz: field_7176
            string fieldIdNum = Field_Email.Split('_')[1];
            var checkUrl = $"/api/database/rows/table/{_tableId}/?filter__field_{fieldIdNum}__equal={request.Email}";

            var checkResponse = await _httpClient.GetAsync(checkUrl);
            var checkJson = JObject.Parse(await checkResponse.Content.ReadAsStringAsync());

            if (checkJson["results"] != null && checkJson["results"].HasValues)
            {
                throw new Exception("Bu e-posta adresi zaten kayıtlı.");
            }

            // 2. Şifreleme ve Kayıt
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var payload = new Dictionary<string, object>
            {
                { Field_Name, request.Username },
                { Field_Email, request.Email },
                { Field_PasswordHash, passwordHash },
                { Field_Role, "User" },
                { Field_CreatedDate, DateTime.UtcNow.ToString("yyyy-MM-dd") }
            };

            var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

            // user_field_names parametresini kullanmıyoruz çünkü direkt ID ile gönderiyoruz
            var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/", jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Kayıt başarısız: {error}");
            }

            return GenerateJwtToken(request.Username, request.Email, "User");
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto request)
        {
            // string yeniHash = BCrypt.Net.BCrypt.HashPassword("Baroque3.koru");

            // 1. KULLANICIYI ARA (Email Field ID: 7176)
            string fieldIdNum = Field_Email.Split('_')[1];

            Console.WriteLine($"[LOGIN] Tablo: {_tableId}, Field: {fieldIdNum}, Email: {request.Email}");

            // 'contains' yerine 'equal' kullanabiliriz ama 'contains' bazen boşluk hatalarını tolere eder.
            // Önemli: user_field_names parametresini kaldırdık, saf veri gelecek.
            var searchUrl = $"/api/database/rows/table/{_tableId}/?filter__field_{fieldIdNum}__equal={request.Email}";

            var response = await _httpClient.GetAsync(searchUrl);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Baserow Bağlantı Hatası: {response.StatusCode}");
            }

            var json = JObject.Parse(content);
            var results = json["results"];

            if (results == null || !results.HasValues)
            {
                Console.WriteLine($"[HATA] Kullanıcı bulunamadı. URL: {searchUrl}");
                Console.WriteLine($"[YANIT] {content}");
                throw new Exception("Kullanıcı bulunamadı.");
            }

            // 2. VERİYİ OKU (ID'ler ile)
            var userRow = results[0];

            // Gelen JSON'da "Name" değil "field_7175" yazacak. O yüzden ID ile okuyoruz.
            string storedHash = userRow[Field_PasswordHash]?.ToString();
            string username = userRow[Field_Name]?.ToString();
            string role = userRow[Field_Role]?.ToString() ?? "User";

            if (string.IsNullOrEmpty(storedHash))
            {
                throw new Exception("Kullanıcı verisi bozuk (Şifre yok).");
            }

            // 3. ŞİFRE DOĞRULA
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, storedHash);

            if (!isPasswordValid)
            {
                Console.WriteLine("[HATA] Şifre uyuşmuyor.");
                throw new Exception("Şifre hatalı.");
            }

            return GenerateJwtToken(username, request.Email, role);
        }

        private AuthResponseDto GenerateJwtToken(string username, string email, string role)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, username),
                    new Claim(ClaimTypes.Email, email),
                    new Claim(ClaimTypes.Role, role)
                }),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiryMinutes"])),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return new AuthResponseDto
            {
                Token = tokenHandler.WriteToken(token),
                Username = username,
                Role = role
            };
        }
    }
}