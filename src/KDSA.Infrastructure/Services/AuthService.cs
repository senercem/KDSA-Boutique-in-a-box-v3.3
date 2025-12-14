using BCrypt.Net;
using KDSA.Application.DTOs;
using KDSA.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace KDSA.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _tableId;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();

            var baseUrl = _configuration["Baserow:BaseUrl"];
            var apiToken = _configuration["Baserow:ApiToken"];
            _tableId = _configuration["Baserow:UsersTableId"]; // Table 736

            if (!string.IsNullOrEmpty(baseUrl))
            {
                _httpClient.BaseAddress = new Uri(baseUrl);
            }

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Token", apiToken);
        }

        // 1. REGISTER (KAYIT)
        public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
        {
            // LOG: Neyi arıyoruz?
            Debug.WriteLine($"[REGISTER CHECK] Aranan Email: {request.Email}");

            // Email kontrolü
            var checkUrl = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__field_Email__equal={request.Email}";
            var checkResponse = await _httpClient.GetAsync(checkUrl);
            var responseContent = await checkResponse.Content.ReadAsStringAsync();
            var checkJson = JObject.Parse(responseContent);

            // KONTROL MANTIĞI: Gerçekten bu email var mı?
            if (checkJson["results"] != null && checkJson["results"].HasValues)
            {
                bool reallyExists = false;
                foreach (var row in checkJson["results"])
                {
                    // Esnek okuma
                    string existingEmail = row["Email"]?.ToString() ?? row["email"]?.ToString();
                    if (string.Equals(existingEmail, request.Email, StringComparison.OrdinalIgnoreCase))
                    {
                        reallyExists = true;
                        break;
                    }
                }

                if (reallyExists)
                {
                    throw new Exception($"Bu e-posta adresi ({request.Email}) zaten kayıtlı.");
                }
            }

            // Şifre Hashleme
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var payload = new Dictionary<string, object>
            {
                { "Username", request.Username },
                { "Email", request.Email },
                { "PasswordHash", passwordHash },
                { "Role", string.IsNullOrEmpty(request.Role) ? "User" : request.Role },
                { "CreatedDate", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") },
                { "Company", string.IsNullOrEmpty(request.Company) ? "Koru" : request.Company }
            };

            var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true", jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Kayıt başarısız: {error}");
            }

            return GenerateJwtToken(request.Username, request.Email, request.Role ?? "User");
        }

        // 2. LOGIN (GİRİŞ)
        public async Task<AuthResponseDto> LoginAsync(LoginDto request)
        {
            try
            {
                // URL (Filtreli istek atıyoruz ama güvenmiyoruz)
                var searchUrl = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__field_Email__equal={request.Email}";

                var response = await _httpClient.GetAsync(searchUrl);
                if (!response.IsSuccessStatusCode) throw new Exception("Baserow bağlantı hatası.");

                var content = await response.Content.ReadAsStringAsync();
                var json = JObject.Parse(content);
                var results = json["results"];

                if (results == null || !results.HasValues) throw new Exception("Kullanıcı bulunamadı.");

                // --- DÜZELTME BURADA ---
                // results[0] diyerek körü körüne ilk kaydı almıyoruz.
                // Döngüyle veya LINQ ile e-postası eşleşen DOĞRU kişiyi buluyoruz.

                JToken userRow = null;

                foreach (var row in results)
                {
                    // Email'i hem büyük hem küçük harf alan adıyla dene
                    string dbEmail = row["Email"]?.ToString() ?? row["email"]?.ToString();

                    if (string.Equals(dbEmail, request.Email, StringComparison.OrdinalIgnoreCase))
                    {
                        userRow = row;
                        break; // Bulduk!
                    }
                }

                if (userRow == null)
                {
                    // Eğer API sonuç döndürdü ama bizim aradığımız kişi içinde yoksa
                    // (Örn: filtre çalışmadı ve alakasız kayıtlar geldi)
                    throw new Exception("Kullanıcı bulunamadı (E-posta eşleşmedi).");
                }

                // Buradan sonrası aynı...
                Debug.WriteLine($"[LOGIN DEBUG] Bulunan Kullanıcı: {request.Email}");
                Debug.WriteLine($"[LOGIN DEBUG] DB Satırı: {userRow}");

                string storedHash = userRow["PasswordHash"]?.ToString() ?? userRow["passwordHash"]?.ToString();
                string username = userRow["Username"]?.ToString() ?? userRow["username"]?.ToString();
                string role = userRow["Role"]?.ToString() ?? userRow["role"]?.ToString() ?? "User";

                if (string.IsNullOrEmpty(storedHash))
                {
                    throw new Exception("Sistem hatası: Şifre verisi bozuk.");
                }

                bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, storedHash);

                if (!isValid)
                {
                    Debug.WriteLine($"[LOGIN ERROR] Şifre uyuşmadı!");
                    throw new Exception("Şifre hatalı.");
                }

                return GenerateJwtToken(username, request.Email, role);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[LOGIN EXCEPTION] {ex.Message}");
                throw;
            }
        }

        // 3. TÜM KULLANICILARI GETİR
        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = new List<UserDto>();
            try
            {
                var requestUrl = $"{_configuration["Baserow:BaseUrl"]}/api/database/rows/table/{_tableId}/?user_field_names=true";

                Debug.WriteLine($"[AUTH SERVICE] Kullanıcılar çekiliyor: {requestUrl}");

                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Token", _configuration["Baserow:ApiToken"]);

                var response = await _httpClient.GetAsync(requestUrl);

                if (!response.IsSuccessStatusCode)
                {
                    Debug.WriteLine($"[AUTH SERVICE ERROR] Status: {response.StatusCode}");
                    return users;
                }

                var content = await response.Content.ReadAsStringAsync();
                var json = JObject.Parse(content);
                var results = json["results"];

                if (results == null) return users;

                foreach (var item in results)
                {
                    // ESNEK MAPPING: Hem Büyük Hem Küçük Harf Dene
                    var username = item["Username"]?.ToString() ?? item["username"]?.ToString() ?? "Unknown";
                    var email = item["Email"]?.ToString() ?? item["email"]?.ToString() ?? "-";
                    var role = item["Role"]?.ToString() ?? item["role"]?.ToString() ?? "User";
                    var createdDate = item["CreatedDate"]?.ToString() ?? item["createdDate"]?.ToString() ?? DateTime.Now.ToString("yyyy-MM-dd");
                    var company = item["Company"]?.ToString() ?? item["company"]?.ToString() ?? "Koru";

                    users.Add(new UserDto
                    {
                        Id = (int)item["id"],
                        Username = username,
                        Email = email,
                        Role = role,
                        CreatedDate = createdDate,
                        Company = company
                    });
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[GetAllUsers EXCEPTION]: {ex.Message}");
            }
            return users;
        }

        // 4. ŞİFRE DEĞİŞTİRME
        public async Task<bool> ChangePasswordAsync(ChangePasswordDto request)
        {
            var searchUrl = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__field_Email__equal={request.Email}";
            var response = await _httpClient.GetAsync(searchUrl);
            var json = JObject.Parse(await response.Content.ReadAsStringAsync());
            var results = json["results"];

            JToken userRow = null;
            foreach (var row in results)
            {
                string dbEmail = row["Email"]?.ToString() ?? row["email"]?.ToString();
                if (string.Equals(dbEmail, request.Email, StringComparison.OrdinalIgnoreCase))
                {
                    userRow = row;
                    break;
                }
            }

            if (userRow == null)
            {
                throw new Exception("Kullanıcı bulunamadı (E-posta eşleşmedi).");
            }
            int rowId = (int)userRow["id"];

            // ESNEK OKUMA: Eski şifreyi kontrol ederken de lazım
            string storedHash = userRow["PasswordHash"]?.ToString() ?? userRow["passwordHash"]?.ToString();

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, storedHash)) throw new Exception("Eski şifre hatalı.");

            string newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            var payload = new Dictionary<string, object> { { "PasswordHash", newHash } };
            var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

            var updateResponse = await _httpClient.PatchAsync($"/api/database/rows/table/{_tableId}/{rowId}/?user_field_names=true", jsonContent);

            return updateResponse.IsSuccessStatusCode;
        }

        // 5. KULLANICI SİL
        public async Task<bool> DeleteUserAsync(int rowId)
        {
            var response = await _httpClient.DeleteAsync($"/api/database/rows/table/{_tableId}/{rowId}/");
            return response.IsSuccessStatusCode;
        }

        // JWT TOKEN ÜRETİCİ
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
            return new AuthResponseDto
            {
                Token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor)),
                Username = username,
                Role = role
            };
        }
    }
}