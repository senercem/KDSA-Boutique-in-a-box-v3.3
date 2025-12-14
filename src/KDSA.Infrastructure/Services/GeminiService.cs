using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using System.Text.RegularExpressions;
using KDSA.Core.Models;
using System.Globalization;

namespace KDSA.Infrastructure.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly IACOREService _acoreService;

        public GeminiService(HttpClient httpClient, IConfiguration configuration, IACOREService acoreService)
        {
            _httpClient = httpClient;
            _acoreService = acoreService;
            _apiKey = configuration["Gemini:ApiKey"] ?? configuration["GeminiApiKey"];
        }

        public async Task<List<PremortemScenario>> AnalyzeDecisionAsync(string context, string risks)
        {
            return await AnalyzeRiskAsync($"Decision Context: {context}\nKnown Risks: {risks}");
        }

        public async Task<List<PremortemScenario>> AnalyzeRiskAsync(string textData)
        {
            if (string.IsNullOrEmpty(_apiKey)) return new List<PremortemScenario>();

            var riskProfile = await _acoreService.GetLatestRiskProfileAsync("SYS-001");
            string systemInstruction = "You are a senior risk strategist. Return ONLY JSON.";

            string jsonSchemaPrompt = textData +
                "\n\nTASK: Generate 3 pre-mortem failure scenarios." +
                "\nOUTPUT: Valid JSON Array." +
                "\nFIELDS: Title, Description, Probability (number 0.1-0.99), MitigationStrategy." +
                "\nEXAMPLE: [{\"Title\": \"Fail 1\", \"Probability\": 0.85, ...}]";

            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = jsonSchemaPrompt } } } },
                system_instruction = new { parts = new[] { new { text = systemInstruction } } }
            };

            return await CallGeminiApi(requestBody);
        }

        private async Task<List<PremortemScenario>> CallGeminiApi(object requestBody)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            try
            {
                var jsonContent = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
                _httpClient.Timeout = TimeSpan.FromSeconds(60);

                var response = await _httpClient.PostAsync(url, jsonContent);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode) return new List<PremortemScenario>();

                var jsonResponse = JObject.Parse(responseString);
                var rawText = jsonResponse["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

                if (!string.IsNullOrEmpty(rawText))
                {
                    string cleanJson = ExtractJsonWithPliers(rawText);

                    var scenarios = new List<PremortemScenario>();
                    var jArray = JArray.Parse(cleanJson);

                    Console.WriteLine("\n--- PARSING DETAYLARI ---");

                    foreach (JObject item in jArray)
                    {
                        // JSON içindeki tüm anahtarları (Keys) konsola yazalım ki ne geldiğini görelim
                        Console.WriteLine("Gelen JSON Anahtarları: " + string.Join(", ", item.Properties().Select(p => p.Name)));

                        string title = GetValue(item, "Title");
                        double prob = GetDouble(item, "Probability");

                        Console.WriteLine($"-> EŞLEŞEN: Başlık='{title}', Olasılık='{prob}'");

                        scenarios.Add(new PremortemScenario
                        {
                            Title = title,
                            Description = GetValue(item, "Description"),
                            Probability = prob,
                            MitigationStrategy = GetValue(item, "MitigationStrategy")
                        });
                    }
                    Console.WriteLine("-------------------------\n");

                    return scenarios;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"HATA: {ex.Message}");
            }

            return new List<PremortemScenario>();
        }

        private string GetValue(JObject item, string key)
        {
            if (item.TryGetValue(key, StringComparison.OrdinalIgnoreCase, out JToken? val)) return val?.ToString() ?? "";
            return "";
        }

        private double GetDouble(JObject item, string key)
        {
            if (item.TryGetValue(key, StringComparison.OrdinalIgnoreCase, out JToken? val))
            {
                if (double.TryParse(val?.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out double result)) return result;
            }
            return 0.5;
        }

        private string ExtractJsonWithPliers(string input)
        {
            int s = input.IndexOf('['); int e = input.LastIndexOf(']');
            return (s >= 0 && e > s) ? input.Substring(s, e - s + 1) : input.Replace("```json", "").Replace("```", "").Trim();
        }
    }
}