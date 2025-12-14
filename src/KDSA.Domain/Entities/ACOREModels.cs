namespace KDSA.Domain.Entities
{
    // v3.4 Playbook - Appendix F.1 Data Structures
    public class ACOREInputDto
    {
        // Mevcut Frontend'i bozmamak için eski alanları tutuyoruz (Geriye Uyumluluk)
        public double PsychologicalSafety { get; set; }
        public double ChangeFatigue { get; set; }

        // --- v3.4 YENİ PARAMETRELER (Appendix I) ---
        // Eğer Frontend'den gelmezse varsayılan değerleri kullanacağız.

        // ORS II: Organizational Resilience (Environment) - Weight 30%
        public double ORS_Score { get; set; } = 50;

        // RACQ: Adaptive Capacity (Individual) - Weight 30%
        public double RACQ_Score { get; set; } = 50;

        // Simulation: Behavioral Validation (Behavior) - Weight 40%
        public double Simulation_Score { get; set; } = 50;

        // SCARF: Neural Threat/Reward (Neural) - Coefficient Modifier
        public double SCARF_Score { get; set; } = 50;
    }

    public class ACOREResult
    {
        public double ResilienceScore { get; set; } // ATRI Score
        public string RiskZone { get; set; }        // Ambidextrous, Resilient, Strained, Critical
        public bool RiskFlag { get; set; }          // Golden Thread Tetikleyicisi
        public List<string> LimitingFactors { get; set; } // "Neural Brake", "Environment Cap" vb.

        // v3.4 Detayları
        public string Recommendation { get; set; }
    }
}