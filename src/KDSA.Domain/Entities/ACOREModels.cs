using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace KDSA.Domain.Entities
{
    // Frontend'den (ACOREModule.tsx) gelecek ham veri
    public class ACOREInputData
    {
        public string SystemId { get; set; } // Örn: "SYS-001"
        public int PsychSafety { get; set; }    // 0-100 (Düşük olması risk)
        public int ChangeFatigue { get; set; }  // 0-100 (Yüksek olması risk)
        public int RoleClarity { get; set; }    // 0-100 (Düşük olması risk)
        public int LeadershipTrust { get; set; } // 0-100 (Düşük olması risk)
    }

    // Hesaplama sonucu oluşacak risk profili
    public class ACORERiskProfile
    {
        public double OverallRiskScore { get; set; } // 0-100 Arası Risk Puanı
        public string RiskLevel { get; set; } // Low, Medium, High, Critical
        public List<string> CriticalBreaches { get; set; } = new List<string>();
    }
}
