using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;

namespace KDSA.Infrastructure.Services
{
    public class AlexandraService : IAlexandraService
    {
        // Şimdilik verileri hafızada tutuyoruz (Baserow bağlanınca burası değişecek)
        private static readonly Dictionary<string, AISystemContext> _systemContexts = new();
        private static readonly List<ModelMetric> _metrics = new();

        public Task<bool> RegisterSystemContextAsync(AISystemContext context)
        {
            if (_systemContexts.ContainsKey(context.SystemId))
            {
                _systemContexts[context.SystemId] = context;
            }
            else
            {
                _systemContexts.Add(context.SystemId, context);
            }
            return Task.FromResult(true);
        }

        public Task<bool> IngestMetricsAsync(ModelMetric metric)
        {
            _metrics.Add(metric);
            return Task.FromResult(true);
        }

        public Task<ComplianceArtifact> GenerateComplianceArtifactAsync(string systemId)
        {
            // Dokümandaki "Compliance Artifact" formatına uygun sahte veri dönüyoruz
            var artifact = new ComplianceArtifact
            {
                OverallRiskScore = 12.5, // Düşük Risk
                IncidentResponseStatus = "Plan Approved",
                AuditLogLink = $"https://baserow.koruimpact.org/audit/{systemId}",
                RiskSummary = new List<RiskControl>
                {
                    new RiskControl { RiskCategory = "Fairness", ControlImplemented = "M2 Debiasing Protocol", ControlStatus = "Implemented" },
                    new RiskControl { RiskCategory = "Transparency", ControlImplemented = "Immutable Ledger (M3)", ControlStatus = "Implemented" }
                },
                RegulatoryComplianceGaps = new List<string>
                {
                    "Human Oversight (Art. 14) documentation pending final review."
                }
            };

            return Task.FromResult(artifact);
        }
    }
}