using Newtonsoft.Json;

namespace KDSA.Core.Models
{
    public class PremortemScenario
    {
        // Senaryonun başlığı (Örn: "Yüksek Enflasyon Riski")
        [JsonProperty("Title")]
        public string Title { get; set; } = string.Empty;
        // Detaylı açıklama
        [JsonProperty("Description")]
        public string Description { get; set; } = string.Empty;

        // Olasılık (0.0 - 1.0 arası veya 0-100)
        [JsonProperty("Probability")]
        public double Probability { get; set; }

        // Önleyici öneri
        [JsonProperty("MitigationStrategy")]
        public string MitigationStrategy { get; set; } = string.Empty;
    }
}