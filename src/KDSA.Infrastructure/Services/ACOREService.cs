using System.Net.Http.Json; // GetFromJsonAsync için gerekli
using KDSA.Application.Interfaces; // IACOREService için gerekli
using ACOREResult = KDSA.Core.Models.ACOREResult; // ACOREInputDto için gerekli
using ACOREInputDto = KDSA.Core.DTOs.ACOREInputDto; // Namespace hatası almamak için global ekledik
namespace KDSA.Infrastructure.Services
{
    public class ACOREService : IACOREService
    {
        private readonly HttpClient _httpClient;

        // Constructor
        public ACOREService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // 1. Metot: M1 Modülünden veri çeken asenkron metot
        public async Task<ACOREResult> GetLatestRiskProfileAsync(string systemId)
        {
            // URL'i kendi M1 modül adresinize göre düzenleyin
            string requestUrl = $"api/m1/risk-profiles/{systemId}";

            try
            {
                var result = await _httpClient.GetFromJsonAsync<ACOREResult>(requestUrl);
                return result ?? new ACOREResult();
            }
            catch
            {
                // Hata durumunda null veya boş nesne dönebilirsiniz
                return null;
            }
        }

        // 2. Metot: (Eksik olan buydu) - Hesaplama Metodu
        public ACOREResult CalculateATRI(ACOREInputDto input)
        {
            // 1. Veri Kontrolü
            if (input == null) return new ACOREResult();

            // 2. RİSK HESAPLAMA MANTIĞI (Basit ve Etkili Bir Formül)
            // -------------------------------------------------------
            // Mantık:
            // - Psychological Safety (Düşükse Kötü -> Risk artar)
            // - Role Clarity (Düşükse Kötü -> Risk artar)
            // - Leadership Trust (Düşükse Kötü -> Risk artar)
            // - Change Fatigue (Yüksekse Kötü -> Risk artar)

            // Risk Puanlarını hesaplayalım (Hepsi 0-100 üzerinden risk puanına dönüşür)
            double riskFromSafety = 100 - input.PsychologicalSafety; // 25 ise -> 75 Risk
            double riskFromClarity = 100 - input.RoleClarity;        // 24 ise -> 76 Risk
            double riskFromTrust = 100 - input.LeadershipTrust;      // 26 ise -> 74 Risk
            // Fatigue düşükse risk düşsün (doğru orantı).
            double riskFromFatigue = input.ChangeFatigue;            // 82 ise -> 82 Risk (Aynen alınır)

            // Ortalama Risk Skoru (Ağırlıklı ortalama da yapılabilir, şimdilik düz ortalama)
            double calculatedRiskScore = (riskFromSafety + riskFromClarity + riskFromTrust + riskFromFatigue) / 4.0;

            // 3. Risk Seviyesini Belirleme (Thresholds)
            string level = "LOW";
            if (calculatedRiskScore >= 75) level = "CRITICAL";      // Kritik
            else if (calculatedRiskScore >= 50) level = "HIGH";     // Yüksek
            else if (calculatedRiskScore >= 25) level = "MEDIUM";   // Orta

            // 4. Sonuç Nesnesini Oluşturma
            var result = new ACOREResult
            {
                Id = Guid.NewGuid().ToString(), // Rastgele bir işlem ID'si

                // Hesaplanan skor (Decimal ve Double olarak)
                Score = (decimal)calculatedRiskScore,
                OverallRiskScore = calculatedRiskScore,

                // Hesaplanan Seviye
                RiskLevel = level,
                RiskZone = level, // Zone bilgisi de aynı olsun

                // Risk Bayrağı (Örn: 50'nin üzerindeyse risk var diyelim)
                RiskFlag = calculatedRiskScore > 50,

                // Açıklama
                Description = $"Analiz başarıyla tamamlandı. Tespit edilen ortalama risk skoru: {calculatedRiskScore:F1}",

                // Dayanıklılık Puanı (Riskin tersi)
                ResilienceScore = (decimal)(100 - calculatedRiskScore),

                CalculatedAt = DateTime.Now
            };

            return result;
        }
    }
}