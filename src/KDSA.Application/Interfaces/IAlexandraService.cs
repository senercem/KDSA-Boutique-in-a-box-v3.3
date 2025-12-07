using System.Threading.Tasks;
using KDSA.Domain.Entities;

namespace KDSA.Application.Interfaces
{
    public interface IAlexandraService
    {
        // 1. Sistemin Bağlamını Kaydet (MAP & GOVERN)
        Task<bool> RegisterSystemContextAsync(AISystemContext context);

        // 2. Performans Metriklerini İçeri Al (MEASURE)
        Task<bool> IngestMetricsAsync(ModelMetric metric);

        // 3. Partner için Uyumluluk Raporu Üret (MANAGE - TPRM Automation)
        Task<ComplianceArtifact> GenerateComplianceArtifactAsync(string systemId);

        Task<List<AuditLogEntry>> GetFullAuditTrailAsync();
    }
}