using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Linq; // LINQ hatası olmaması için gerekli
using KDSA.Application.DTOs;
using KDSA.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Diagnostics;

namespace KDSA.Infrastructure.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _tableId;

        public CompanyService(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient();
            var baseUrl = _configuration["Baserow:BaseUrl"];
            var apiToken = _configuration["Baserow:ApiToken"];
            _tableId = _configuration["Baserow:CompaniesTableId"];

            if (!string.IsNullOrEmpty(baseUrl)) _httpClient.BaseAddress = new Uri(baseUrl);
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", apiToken);
        }

        // 1. FİRMALARI GETİR
        public async Task<List<CompanyDto>> GetAllCompaniesAsync()
        {
            var companies = new List<CompanyDto>();
            try
            {
                var url = $"/api/database/rows/table/{_tableId}/?user_field_names=true";
                Debug.WriteLine($"[CompanyService] GET Request: {url}");

                var response = await _httpClient.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();

                // LOG: Baserow cevabı
                Debug.WriteLine($"[CompanyService] RAW RESPONSE: {content}");

                if (!response.IsSuccessStatusCode) return companies;

                var json = JObject.Parse(content);
                var results = json["results"];

                foreach (var item in results)
                {
                    // Her satırın anahtarlarını (keys) loglayalım
                    try
                    {
                        var keys = string.Join(", ", item.ToObject<JObject>().Properties().Select(p => p.Name));
                        Debug.WriteLine($"[Row Keys Found]: {keys}");
                    }
                    catch { }

                    companies.Add(new CompanyDto
                    {
                        Id = (int)item["id"],

                        // GetValue metodunu aşağıda tanımladık, artık hata vermeyecek.
                        Company_ID = GetValue(item, "Company_ID", "Company ID", "company_id"),

                        // Hem boşluklu hem alt tireli isimleri dener
                        Company_Name = GetValue(item, "Company_Name", "Company Name", "Name", "Firma Adı"),

                        Contact_Email = GetValue(item, "Contact_Email", "Contact Email", "Email"),

                        Created_Date = GetValue(item, "Created_Date", "Created Date")
                    });
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[CompanyService Error] {ex.Message}");
            }
            return companies;
        }

        // 2. YENİ FİRMA EKLE
        public async Task<bool> CreateCompanyAsync(CompanyDto company)
        {
            try
            {
                var payload = new Dictionary<string, object>
                {
                    { "Company_ID", Guid.NewGuid().ToString() },
                    { "Company_Name", company.Company_Name },
                    { "Contact_Email", string.IsNullOrEmpty(company.Contact_Email) ? null : company.Contact_Email },
                    { "Created_Date", DateTime.UtcNow.ToString("yyyy-MM-dd") }
                };

                var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"/api/database/rows/table/{_tableId}/?user_field_names=true", jsonContent);

                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Debug.WriteLine($"[Create Error] {err}");
                }
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[CreateCompany Error] {ex.Message}");
                return false;
            }
        }

        // 3. FİRMA SİL
        public async Task<bool> DeleteCompanyAsync(int id)
        {
            try
            {
                var response = await _httpClient.DeleteAsync($"/api/database/rows/table/{_tableId}/{id}/");
                return response.IsSuccessStatusCode;
            }
            catch { return false; }
        }

        // 4. FİRMA GÜNCELLE
        public async Task<bool> UpdateCompanyAsync(int id, CompanyDto company)
        {
            try
            {
                var url = $"/api/database/rows/table/{_tableId}/{id}/?user_field_names=true";
                var payload = new Dictionary<string, object>
                {
                    { "Company_Name", company.Company_Name },
                    { "Contact_Email", company.Contact_Email ?? "" }
                };
                var jsonContent = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PatchAsync(url, jsonContent);
                return response.IsSuccessStatusCode;
            }
            catch { return false; }
        }

        // --- YARDIMCI METOT (Class'ın içinde, metodun dışında tanımlı olmalı) ---
        private string GetValue(JToken item, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (item[key] != null) return item[key].ToString();
            }
            // Hiçbiri yoksa null değil boş string dön (DTO hatasını önler)
            return "";
        }

    } // Class bitiş parantezi
} // Namespace bitiş parantezi