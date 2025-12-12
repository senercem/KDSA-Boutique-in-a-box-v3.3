using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using KDSA.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System.Diagnostics; // LOGLAMA İÇİN EKLENDİ

using AuditLogEntry = KDSA.Application.DTOs.AuditLogEntry;

namespace KDSA.Infrastructure.Services
{
    public class ComplianceService : IComplianceService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _tableId;

        public ComplianceService(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
            var baseUrl = _configuration["Baserow:BaseUrl"];
            var apiToken = _configuration["Baserow:ApiToken"];
            _tableId = _configuration["Baserow:AuditLogTableId"];

            if (!string.IsNullOrEmpty(baseUrl)) _httpClient.BaseAddress = new Uri(baseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", apiToken);
        }

        public async Task<List<AuditLogEntry>> GetAuditLogsAsync()
        {
            try
            {
                var url = $"/api/database/rows/table/{_tableId}/?user_field_names=true&order_by=-Compliance_Timestamp";

                // LOG: İstek atılıyor
                Debug.WriteLine($"[BASEROW REQUEST] URL: {url}");

                var response = await _httpClient.GetAsync(url);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Debug.WriteLine($"[BASEROW ERROR] {response.StatusCode} - {jsonString}");
                    return new List<AuditLogEntry>();
                }

                // LOG: Gelen veriyi görelim (Field isimleri neymiş?)
                Debug.WriteLine($"[BASEROW RESPONSE] {jsonString}");

                var json = JObject.Parse(jsonString);
                var results = json["results"];

                var logs = new List<AuditLogEntry>();
                foreach (var row in results)
                {
                    logs.Add(MapToDto(row));
                }
                return logs;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[EXCEPTION] {ex.Message}");
                return new List<AuditLogEntry>();
            }
        }

        public async Task<AuditLogEntry> GetAuditLogByIdAsync(string auditId)
        {
            try
            {
                var url = $"/api/database/rows/table/{_tableId}/?user_field_names=true&filter__Audit_ID__equal={auditId}";

                // Hata Ayıklama İçin Log (Output penceresinde görebilirsiniz)
                Debug.WriteLine($"[BASEROW SINGLE FETCH] URL: {url}");

                var response = await _httpClient.GetAsync(url);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Debug.WriteLine($"[BASEROW ERROR] {response.StatusCode}");
                    return null;
                }

                var json = JObject.Parse(jsonString);
                var results = json["results"];

                if (results == null || !results.HasValues)
                {
                    Debug.WriteLine($"[BASEROW WARNING] Kayıt bulunamadı. ID: {auditId}");
                    return null;
                }

                // İlk eşleşen kaydı al ve dönüştür
                return MapToDto(results[0]);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[GetLogById Error] {ex.Message}");
                return null;
            }
        }

        // ESNEK MAPPING (Her ihtimali dener)
        private AuditLogEntry MapToDto(JToken row)
        {
            return new AuditLogEntry
            {
                Id = row["id"]?.ToString(),
                Audit_ID = row["Audit_ID"]?.ToString() ?? row["id"]?.ToString(),
                Timestamp = DateTime.TryParse(row["Compliance_Timestamp"]?.ToString(), out DateTime dt) ? dt : DateTime.UtcNow,

                Module = row["Module"]?.ToString() ?? "M3 Governance",
                Action = row["Action"]?.ToString() ?? "Log Entry",

                // Eğer Details boşsa ama M2_Final_Decision doluysa, onu Details yerine de kullanabiliriz.
                Details = row["Details"]?.ToString() ?? "",

                M2_Debiasing_Protocol = row["M2_Debiasing_Protocol"]?.ToString(),
                Hash = row["Hash"]?.ToString(),
                PreviousHash = row["PreviousHash"]?.ToString(),
                ComplianceTags = ParseTags(row["ComplianceTags"]),

                // --- YENİ EKLENEN EŞLEŞTİRME ---
                // Baserow'daki sütun adı tam olarak "M2_Final_Decision"
                M2_Final_Decision = row["M2_Final_Decision"]?.ToString()
            };
        }

        // Yardımcı: Birden fazla anahtar ismini dener, bulduğunu alır
        private string GetValue(JToken row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row[key] != null) return row[key].ToString();
            }
            return null;
        }

        private DateTime ParseDate(string dateStr)
        {
            if (string.IsNullOrEmpty(dateStr)) return DateTime.UtcNow;
            return DateTime.TryParse(dateStr, out DateTime dt) ? dt : DateTime.UtcNow;
        }

        private List<string> ParseTags(JToken tagsToken)
        {
            if (tagsToken == null) return new List<string>();
            if (tagsToken.Type == JTokenType.Array) return tagsToken.ToObject<List<string>>();
            if (tagsToken.Type == JTokenType.Object && tagsToken["value"] != null) return new List<string> { tagsToken["value"].ToString() };
            return new List<string> { tagsToken.ToString() };
        }
    }
}