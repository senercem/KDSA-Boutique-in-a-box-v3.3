using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace KDSA.Infrastructure.Services
{
    // Bu servis, "Koru OS" dokümanındaki Audit Log tablosuna veri basar.
    public class BaserowClient : IBaserowClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiToken;
        private readonly string _tableId; // KDSA_Audit_Log tablosunun ID'si

        public BaserowClient(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            // Baserow URL'i (Örn: https://baserow.koruimpact.org)
            _httpClient.BaseAddress = new Uri(configuration["Baserow:BaseUrl"]);

            _apiToken = configuration["Baserow:ApiToken"];
            _tableId = configuration["Baserow:AuditLogTableId"];

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Token", _apiToken);
        }

        public async Task<bool> LogDecisionAsync(AuditLogEntry entry)
        {
            // Baserow API formatına uygun JSON hazırlıyoruz
            // "field_123" gibi alan isimleri Baserow'da dinamiktir.
            // Gerçek entegrasyonda bu ID'leri Baserow panelinden alıp map'leyeceğiz.
            // Şimdilik "UserFriendly" isimlerle gönderiyoruz (Baserow Import uyumlu).

            var payload = new
            {
                Audit_ID = entry.Audit_ID,
                M1_Risk_Score = entry.M1_Risk_Score,
                M2_Decision_Input = entry.M2_Decision_Input,
                M2_Debiasing_Protocol = entry.M2_Debiasing_Protocol,
                M2_Final_Decision = entry.M2_Final_Decision,
                Compliance_Timestamp = entry.Compliance_Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                // Baserow "Create Row" Endpoint'i
                var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true", content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Baserow Loglama Hatası: {error}");
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
    }
}