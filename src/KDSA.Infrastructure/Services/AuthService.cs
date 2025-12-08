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
using System.Diagnostics;

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

            _httpClient.BaseAddress = new Uri(_configuration["Baserow:BaseUrl"]);
            var apiToken = _configuration["Baserow:ApiToken"];
            _tableId = _configuration["Baserow:UsersTableId"]; // Table 736

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Token", apiToken);
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto request)
        {
            // İSİM İLE KONTROL (user_field_names=true)
            // 'Email' sütun adını kullanıyoruz
            var checkUrl = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__field_Email__equal={request.Email}";

            var checkResponse = await _httpClient.GetAsync(checkUrl);
            var checkJson = JObject.Parse(await checkResponse.Content.ReadAsStringAsync());

            if (checkJson["results"] != null && checkJson["results"].HasValues)
            {
                throw new Exception("Bu e-posta adresi zaten kayıtlı.");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // İSİM İLE KAYIT
            var payload = new Dictionary<string, object>
            {
                { "Username", request.Username },
                { "Email", request.Email },
                { "PasswordHash", passwordHash },
                { "Role", string.IsNullOrEmpty(request.Role) ? "User" : request.Role },
                { "CreatedDate", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") }
            };

            var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true", jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Kayıt başarısız: {error}");
            }

            return GenerateJwtToken(request.Username, request.Email, "User");
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto request)
        {
            // İSİM İLE GİRİŞ
            // 'Email' sütununda arama yapıyoruz
            var searchUrl = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__field_Email__equal={request.Email}";

            var response = await _httpClient.GetAsync(searchUrl);
            if (!response.IsSuccessStatusCode) throw new Exception("Baserow bağlantı hatası.");

            var json = JObject.Parse(await response.Content.ReadAsStringAsync());
            var results = json["results"];

            if (results == null || !results.HasValues) throw new Exception("Kullanıcı bulunamadı.");

            var userRow = results[0];

            // İSİM İLE OKUMA
            string storedHash = userRow["PasswordHash"]?.ToString();
            string username = userRow["Username"]?.ToString();
            string role = userRow["Role"]?.ToString() ?? "User";

            if (string.IsNullOrEmpty(storedHash) || !BCrypt.Net.BCrypt.Verify(request.Password, storedHash))
            {
                throw new Exception("Şifre hatalı.");
            }

            return GenerateJwtToken(username, request.Email, role);
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            try
            {
                Debug.WriteLine($"[USER LIST] Tablo ID: {_tableId} taranıyor...");

                // İSİM İLE LİSTELEME
                var response = await _httpClient.GetAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true");

                if (!response.IsSuccessStatusCode)
                {
                    Debug.WriteLine($"[HATA] {response.StatusCode}");
                    return new List<UserDto>();
                }

                var json = JObject.Parse(await response.Content.ReadAsStringAsync());
                var results = json["results"];

                Debug.WriteLine($"[USER LIST] {results?.Count()} kayıt bulundu.");

                var users = new List<UserDto>();
                foreach (var row in results)
                {
                    // JSON'dan İsimle Okuyoruz
                    users.Add(new UserDto
                    {
                        Id = (int)row["id"],
                        Username = row["Username"]?.ToString(),
                        Email = row["Email"]?.ToString(),
                        Role = row["Role"]?.ToString(),
                        CreatedDate = row["CreatedDate"]?.ToString()
                    });
                }
                return users;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[EXCEPTION] {ex.Message}");
                return new List<UserDto>();
            }
        }

        public async Task<bool> DeleteUserAsync(int rowId)
        {
            var response = await _httpClient.DeleteAsync($"/api/database/rows/table/{_tableId}/{rowId}/");
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> ChangePasswordAsync(ChangePasswordDto request)
        {
            // Şifre değiştirirken de İsim kullanıyoruz
            var searchUrl = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__field_Email__equal={request.Email}";
            var response = await _httpClient.GetAsync(searchUrl);
            var json = JObject.Parse(await response.Content.ReadAsStringAsync());
            var results = json["results"];

            if (results == null || !results.HasValues) throw new Exception("Kullanıcı bulunamadı.");

            var userRow = results[0];
            int rowId = (int)userRow["id"];
            string storedHash = userRow["PasswordHash"]?.ToString();

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, storedHash)) throw new Exception("Eski şifre hatalı.");

            string newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            var payload = new Dictionary<string, object> { { "PasswordHash", newHash } };
            var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

            var updateResponse = await _httpClient.PatchAsync($"/api/database/rows/table/{_tableId}/{rowId}/?user_field_names=true", jsonContent);

            return updateResponse.IsSuccessStatusCode;
        }

        private AuthResponseDto GenerateJwtToken(string username, string email, string role)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, username), new Claim(ClaimTypes.Email, email), new Claim(ClaimTypes.Role, role) }),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpiryMinutes"])),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            return new AuthResponseDto { Token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor)), Username = username, Role = role };
        }
    }
}