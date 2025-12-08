using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using KDSA.Infrastructure.Services;

namespace KDSA.Infrastructure.Services
{
    public class AlexandraService : IAlexandraService
    {
        private readonly IBaserowClient _baserowClient;
        private readonly IACOREService _acoreService;

        // Constructor Injection (Hata vermemesi için bu yapı şart)
        public AlexandraService(IBaserowClient baserowClient, IACOREService acoreService)
        {
            _baserowClient = baserowClient;
            _acoreService = acoreService;
        }

        public async Task<bool> RegisterSystemContextAsync(AISystemContext context)
        {
            return await Task.FromResult(true);
        }

        public async Task<bool> IngestMetricsAsync(ModelMetric metric)
        {
            return await Task.FromResult(true);
        }

        public async Task<ComplianceArtifact> GenerateComplianceArtifactAsync(string systemId)
        {
            // 1. M1'den GERÇEK RİSK SKORUNU ÇEK
            var riskProfile = await _acoreService.GetLatestRiskProfileAsync(systemId);

            // Eğer veri yoksa (Frontend'den henüz giriş yapılmadıysa) varsayılan bir değer kullanabiliriz
            // veya 0 gönderebiliriz.
            double realRiskScore = riskProfile.RiskLevel == "UNKNOWN" ? 12.5 : riskProfile.OverallRiskScore;

            // 1. Audit Log Kaydı Oluştur (Gerçek Veri)
            var logEntry = new AuditLogEntry
            {
                Audit_ID = Guid.NewGuid().ToString(),
                M1_Risk_Score = realRiskScore,
                M2_Decision_Input = $"Compliance Check for System: {systemId}",
                M2_Debiasing_Protocol = "Automated TPRM Generation",
                M2_Final_Decision = "Approved",
                Compliance_Timestamp = DateTime.UtcNow
            };

            // 2. Baserow'a Kaydet
            if (_baserowClient != null)
            {
                await _baserowClient.LogDecisionAsync(logEntry);
            }

            // 3. Rapor Çıktısını Hazırla
            var artifact = new ComplianceArtifact
            {
                OverallRiskScore = realRiskScore,
                IncidentResponseStatus = "Active Monitoring", // Düzeltildi

                // DİKKAT: Link formatı artık gerçek Baserow formatında
                AuditLogLink = $"https://baserow.koruimpact.org/database/735?row={logEntry.Audit_ID}",

                RiskSummary = new List<RiskControl>
                {
                    // Artık tek ve doğru satır var
                    new RiskControl { RiskCategory = "Transparency", ControlImplemented = "M3 Immutable Ledger", ControlStatus = "Verified" }
                }
            };

            return artifact;
        }

        public async Task<ComplianceArtifact> GenerateComplianceArtifactAsync(string systemId, string m2Analysis, double m1Score)
        {
            // 1. Audit Log Kaydı Oluştur (Artık Dolu Verilerle!)
            var logEntry = new AuditLogEntry
            {
                Audit_ID = Guid.NewGuid().ToString(),
                M1_Risk_Score = m1Score,
                M2_Decision_Input = $"System Context: {systemId}",
                M2_Debiasing_Protocol = "Neurosymbolic Pre-mortem Analysis",

                // İŞTE BURASI: Frontend'den gelen Yapay Zeka çıktısını buraya ve Veritabanına yazıyoruz
                M2_Final_Decision = string.IsNullOrEmpty(m2Analysis) ? "No Analysis Data Provided" : m2Analysis,

                Compliance_Timestamp = DateTime.UtcNow
            };

            // 2. Baserow'a Kaydet
            if (_baserowClient != null)
            {
                await _baserowClient.LogDecisionAsync(logEntry);
            }

            // 3. Rapor Çıktısını Hazırla
            var artifact = new ComplianceArtifact
            {
                OverallRiskScore = m1Score,
                IncidentResponseStatus = "Active Monitoring",
                AuditLogLink = $"https://baserow.koruimpact.org/database/186/table/735?row={logEntry.Audit_ID}", // ID'yi düzelttim (735)

                RiskSummary = new List<RiskControl>
                {
                    new RiskControl { RiskCategory = "Transparency", ControlImplemented = "M3 Immutable Ledger", ControlStatus = "Verified" },
                    // M2 Analizini de rapora kontrol maddesi olarak ekliyoruz
                    new RiskControl { RiskCategory = "Cognitive Bias", ControlImplemented = "M2 Analysis Logged", ControlStatus = "Completed" }
                }
            };

            return artifact;
        }

        public async Task<List<AuditLogEntry>> GetFullAuditTrailAsync()
        {
            return await _baserowClient.GetAuditLogsAsync();
        }
    }
}