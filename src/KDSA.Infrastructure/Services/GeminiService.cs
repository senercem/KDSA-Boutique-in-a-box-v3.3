using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using KDSA.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace KDSA.Infrastructure.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        public GeminiService(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            _apiKey = configuration["Gemini:ApiKey"];
            _baseUrl = configuration["Gemini:BaseUrl"];
        }

        public async Task<string> AnalyzeRiskAsync(string prompt)
        {
            var requestUrl = $"{_baseUrl}?key={_apiKey}";

            // Google Gemini API'sinin beklediği JSON formatı
            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var jsonContent = JsonConvert.SerializeObject(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(requestUrl, content);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync();
                var jsonResponse = JObject.Parse(responseString);

                // Gelen cevaptan sadece metin kısmını alıyoruz
                var resultText = jsonResponse["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

                return resultText ?? "Analiz yapılamadı veya boş cevap döndü.";
            }
            catch (Exception ex)
            {
                // M3 Audit Loglama buraya eklenecek (İleride)
                return $"Hata oluştu: {ex.Message}";
            }
        }
    }
}