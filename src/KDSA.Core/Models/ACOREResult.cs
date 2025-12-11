namespace KDSA.Core.Models
{
    public class ACOREResult
    {
        // M1 modülünden gelen JSON alanları buraya property olarak eklenmeli.
        public string Id { get; set; }
        public string RiskCode { get; set; } // Örn: R-101
        public decimal Score { get; set; }   // Örn: 85.5
        public string Description { get; set; } // Örn: "Yüksek Risk"
        public DateTime CalculatedAt { get; set; }
        public bool RiskFlag { get; set; }
        public string RiskZone { get; set; }
        public decimal ResilienceScore { get; set; }

        // --- ALEXANDRA SERVİSİ İÇİN EKLENEN YENİ ALANLAR ---

        // 1. Risk Seviyesi (Örn: "HIGH", "LOW", "UNKNOWN")
        public string RiskLevel { get; set; }

        // 2. Toplam Risk Skoru (double istendiği için double yapıyoruz)
        public double OverallRiskScore { get; set; }
    }
}