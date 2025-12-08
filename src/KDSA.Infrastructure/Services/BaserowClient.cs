using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Diagnostics; // Output penceresi için şart

namespace KDSA.Infrastructure.Services
{
    public class BaserowClient : IBaserowClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiToken;
        private readonly string _tableId;

        public BaserowClient(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(configuration["Baserow:BaseUrl"]);

            _apiToken = configuration["Baserow:ApiToken"];
            _tableId = configuration["Baserow:AuditLogTableId"];

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Token", _apiToken);
        }

        public async Task<bool> LogDecisionAsync(AuditLogEntry entry)
        {
            // HEM DEBUG HEM CONSOLE (SİYAH EKRAN) İÇİN LOG
            Console.WriteLine("\n\n==================================================");
            Console.WriteLine($"[BASEROW] Veri gönderiliyor... Table ID: {_tableId}");
            Console.WriteLine($"[SKOR] M1 Score: {entry.M1_Risk_Score} -> Yuvarlanmış: {(int)Math.Round(entry.M1_Risk_Score)}");
            Console.WriteLine("==================================================\n\n");

            // 1. GÖNDERİLECEK VERİYİ HAZIRLA (İsim Bazlı)
            var payload = new Dictionary<string, object>
            {
                { "Audit_ID", entry.Audit_ID },
                // Dikkat: Ondalık sayı hatasını önlemek için Int'e çeviriyoruz
                { "M1_Risk_Score", (int)Math.Round(entry.M1_Risk_Score) },
                { "M2_Decision_Input", entry.M2_Decision_Input },
                { "M2_Debiasing_Protocol", entry.M2_Debiasing_Protocol },
                { "M2_Final_Decision", entry.M2_Final_Decision },
                { "Compliance_Timestamp", entry.Compliance_Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ") }
            };

            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // LOG 1: Ne gönderiyoruz?
            Debug.WriteLine("==================================================");
            Debug.WriteLine($"[GÖNDERİLEN JSON]: {json}");
            Debug.WriteLine("==================================================");

            try
            {
                // URL: user_field_names=true (İsim eşleşmesi için kritik)
                var url = $"/api/database/rows/table/{_tableId}/?user_field_names=true";
                var response = await _httpClient.PostAsync(url, content);

                // Cevabı oku (Hata olsa da olmasa da okuyalım)
                var responseBody = await response.Content.ReadAsStringAsync();

                // LOG 2: Baserow ne dedi?
                Debug.WriteLine($"[BASEROW YANIT KODU]: {response.StatusCode}");
                Debug.WriteLine($"[BASEROW YANIT İÇERİĞİ]: {responseBody}");

                if (!response.IsSuccessStatusCode)
                {
                    // HATA FIRLATMA NOKTASI
                    // Bu hata Visual Studio Output penceresinde görünecek
                    throw new Exception($"Baserow Kayıt Başarısız! Hata: {responseBody}");
                }

                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[KRİTİK HATA]: {ex.Message}");
                throw; // Hatayı yutma, yukarı fırlat ki sistem dursun
            }
        }

        public async Task<List<AuditLogEntry>> GetAuditLogsAsync()
        {
            // Okuma kısmı aynı kalabilir veya buraya da log ekleyebilirsiniz
            try
            {
                var response = await _httpClient.GetAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true");
                if (!response.IsSuccessStatusCode) return new List<AuditLogEntry>();

                var jsonString = await response.Content.ReadAsStringAsync();
                var json = JObject.Parse(jsonString);
                return json["results"].ToObject<List<AuditLogEntry>>();
            }
            catch
            {
                return new List<AuditLogEntry>();
            }
        }
    }
}