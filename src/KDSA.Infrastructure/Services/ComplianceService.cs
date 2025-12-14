using KDSA.Application.DTOs;
using KDSA.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq; // Filtreleme (Where) için gerekli
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace KDSA.Infrastructure.Services
{
    public class ComplianceService : IComplianceService
    {
        private readonly HttpClient _httpClient;
        private readonly string _tableId;

        public ComplianceService(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            var baseUrl = configuration["Baserow:BaseUrl"];
            var apiToken = configuration["Baserow:ApiToken"];
            _tableId = configuration["Baserow:AuditLogTableId"]; // ID: 735

            if (!string.IsNullOrEmpty(baseUrl)) _httpClient.BaseAddress = new Uri(baseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", apiToken);
        }

        // 1. LOGLARI GETİR (Filtreli)
        public async Task<List<AuditLogEntry>> GetAuditLogsAsync(string userCompany = null)
        {
            try
            {
                // Baserow'dan tüm veriyi çek (Sıralama parametresini kaldırdık, hata vermemesi için)
                var url = $"/api/database/rows/table/{_tableId}/?user_field_names=true";
                Debug.WriteLine($"[BASEROW REQUEST] URL: {url}");

                var response = await _httpClient.GetAsync(url);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Debug.WriteLine($"[BASEROW ERROR] {response.StatusCode} - {jsonString}");
                    return new List<AuditLogEntry>();
                }

                var json = JObject.Parse(jsonString);
                var results = json["results"];

                var logs = new List<AuditLogEntry>();
                foreach (var row in results)
                {
                    logs.Add(MapToDto(row));
                }

                // --- FİLTRELEME MANTIĞI ---
                // Eğer kullanıcı Admin (Koru Impact) değilse, sadece kendi firmasının loglarını görsün.
                if (!string.IsNullOrEmpty(userCompany) && userCompany != "Koru")
                {
                    // Backend taraflı filtreleme
                    logs = logs.Where(l => l.Company == userCompany).ToList();
                }

                // Tarihe göre yeniden (Memory'de) sırala (En yeni en üstte)
                return logs.OrderByDescending(l => l.Timestamp).ToList();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[EXCEPTION] {ex.Message}");
                return new List<AuditLogEntry>();
            }
        }

        // 2. YENİ LOG EKLE (Company Parametresi Eklendi)
        public async Task<bool> LogAsync(string action, string details, string performedBy, string company)
        {
            try
            {
                var payload = new Dictionary<string, object>
                {
                    { "Module", "System" }, // Varsayılan modül
                    { "Action", action },
                    { "Details", details },
                    { "PerformedBy", performedBy },
                    { "Compliance_Timestamp", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ") },
                    // YENİ ALAN: Firma bilgisini de kaydediyoruz
                    { "Company", company ?? "Unknown" }
                };

                var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true", content);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[LOG EXCEPTION] {ex.Message}");
                return false;
            }
        }

        public async Task<AuditLogEntry> GetAuditLogByIdAsync(string auditId)
        {
            // Şimdilik null dönebiliriz, detay sayfası kullanılmıyorsa
            return null;
        }

        // Yardımcı Metot: Baserow JSON -> C# Nesnesi
        private AuditLogEntry MapToDto(JToken row)
        {
            DateTime parsedDate = DateTime.MinValue;
            var dateStr = row["Compliance_Timestamp"]?.ToString();
            if (!string.IsNullOrEmpty(dateStr))
            {
                DateTime.TryParse(dateStr, out parsedDate);
            }

            return new AuditLogEntry
            {
                Id = (int)row["id"],
                Module = row["Module"]?.ToString(),
                Action = row["Action"]?.ToString(),
                Details = row["Details"]?.ToString(),
                PerformedBy = row["PerformedBy"]?.ToString(),
                Timestamp = parsedDate,
                // Baserow'dan "Company" alanını okuyoruz (Esnek okuma)
                Company = row["Company"]?.ToString()
            };
        }
    }
}