using System;
using System.Collections.Generic;

namespace KDSA.Domain.Entities
{
    // Koru OS Blueprint - Module 1.4: KDSA Integration
    // Bu sınıf, Baserow'daki "KDSA_Audit_Log" tablosunun birebir karşılığıdır.
    public class AuditLogEntry
    {
        public int Id { get; set; } // Baserow Row ID
        public string Audit_ID { get; set; } = Guid.NewGuid().ToString(); // UUID
        public double M1_Risk_Score { get; set; } // Human Oversight Trigger
        public string M2_Decision_Input { get; set; } // Data Governance Evidence
        public string M2_Debiasing_Protocol { get; set; } // Transparency (e.g. "Pre-Mortem")
        public string M2_Final_Decision { get; set; } // Final Output
        public string Human_Overseer_ID { get; set; } // Link to Team_Members (Optional initially)
        public DateTime Compliance_Timestamp { get; set; } = DateTime.UtcNow;
    }

    // Charter 2.0 - Standards Framework
    // Hangi regülasyonun (ISO, NIST) hangi kontrolle sağlandığını tutar.
    public class RegulatoryMatrixItem
    {
        public string Standard { get; set; } // e.g., "EU AI Act"
        public string Article { get; set; } // e.g., "Article 14"
        public string Requirement { get; set; } // e.g., "Human Oversight"
        public string KdsaControl { get; set; } // e.g., "M1->M2 Pre-Mortem Loop"
    }
}