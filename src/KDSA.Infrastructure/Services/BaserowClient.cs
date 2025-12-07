using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic; // Dictionary için gerekli
using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

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
            // --- GÜNCELLEME: Field ID Kullanımı ---
            // Sizin bulduğunuz ID'leri burada eşleştiriyoruz.
            // Bu sayede veriler %100 doğru sütuna gidecek.

            var payload = new Dictionary<string, object>
            {
                { "field_7169", entry.Audit_ID },          // Audit_ID
                { "field_7172", entry.M1_Risk_Score },     // M1_Risk_Score
                { "field_7170", entry.M2_Decision_Input }, // M2_Decision_Input
                { "field_7171", entry.M2_Debiasing_Protocol }, // M2_Debiasing_Protocol
                { "field_7173", entry.M2_Final_Decision }, // M2_Final_Decision
                { "field_7174", entry.Compliance_Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ") } // Timestamp
            };

            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                // YAZARKEN: ID kullandığımız için 'user_field_names' parametresini kaldırdık.
                var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/", content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Baserow Yazma Hatası: {error}");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Baserow Bağlantı Hatası: {ex.Message}");
                return false;
            }
        }

        public async Task<List<AuditLogEntry>> GetAuditLogsAsync()
        {
            try
            {
                // OKURKEN: Veriyi hala isimlerle ('Audit_ID' vb.) almak istiyoruz ki
                // C# kodumuz bozulmasın. O yüzden burada 'user_field_names=true' KALMALI.
                var response = await _httpClient.GetAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true");

                if (!response.IsSuccessStatusCode)
                    return new List<AuditLogEntry>();

                var jsonString = await response.Content.ReadAsStringAsync();
                var json = JObject.Parse(jsonString);

                var results = json["results"].ToObject<List<AuditLogEntry>>();

                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Baserow Okuma Hatası: {ex.Message}");
                return new List<AuditLogEntry>();
            }
        }
    }
}