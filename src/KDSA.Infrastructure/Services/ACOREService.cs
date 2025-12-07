using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using System.Collections.Generic; // Dictionary için gerekli
using System.Threading.Tasks;

namespace KDSA.Infrastructure.Services
{
    public class ACOREService : IACOREService
    {
        // "static" olduğu için Backend kapanmadığı sürece veriyi tutar.
        private static readonly Dictionary<string, ACORERiskProfile> _riskProfiles = new();

        public Task<ACORERiskProfile> AnalyzeAndStoreAsync(ACOREInputData data)
        {
            // --- BASİT RİSK HESAPLAMA MANTIĞI ---
            // 0-100 arası puan. (100 = En Yüksek Risk)
            // PsychSafety: Düşükse risk. (100 - Değer)
            // ChangeFatigue: Yüksekse risk. (Değer)
            // ...

            double score = 0;
            score += (100 - data.PsychSafety);
            score += data.ChangeFatigue;
            score += (100 - data.RoleClarity);
            score += (100 - data.LeadershipTrust);

            double averageRisk = score / 4.0;

            var profile = new ACORERiskProfile
            {
                OverallRiskScore = averageRisk,
                RiskLevel = averageRisk > 75 ? "CRITICAL" : (averageRisk > 50 ? "HIGH" : "LOW"),
                CriticalBreaches = new List<string>() // Şimdilik boş
            };

            // Hafızaya Kaydet
            _riskProfiles[data.SystemId] = profile;

            return Task.FromResult(profile);
        }

        public Task<ACORERiskProfile> GetLatestRiskProfileAsync(string systemId)
        {
            if (_riskProfiles.ContainsKey(systemId))
            {
                return Task.FromResult(_riskProfiles[systemId]);
            }

            // Veri yoksa varsayılan dön
            return Task.FromResult(new ACORERiskProfile { OverallRiskScore = 0, RiskLevel = "UNKNOWN" });
        }
    }
}