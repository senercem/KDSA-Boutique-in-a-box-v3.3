namespace KDSA.Application.DTOs
{
    public class ReportGenerationDto
    {
        public string SystemId { get; set; }
        public string M2AnalysisResult { get; set; } // Yapay Zeka Çıktısı buraya gelecek
        public double M1RiskScore { get; set; }
    }
}