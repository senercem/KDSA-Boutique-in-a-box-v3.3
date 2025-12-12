using System;
using System.Collections.Generic;

namespace KDSA.Application.DTOs
{
    public class AuditLogEntry
    {
        // Baserow'un kendi satır ID'si
        public string Id { get; set; }

        // Bizim oluşturduğumuz UUID (Transaction ID)
        public string Audit_ID { get; set; }

        // Tarih
        public DateTime Timestamp { get; set; }

        // Modül İsmi (M1, M2, M3)
        public string Module { get; set; }

        // Yapılan İşlem
        public string Action { get; set; }

        // Detaylar
        public string Details { get; set; }

        // Protokol (Pre-mortem vb.)
        public string M2_Debiasing_Protocol { get; set; }

        // Kriptografik Özet
        public string Hash { get; set; }

        // Önceki Kaydın Özeti (Zincirleme için)
        public string PreviousHash { get; set; }

        // Etiketler (DORA, NIST vb.)
        public List<string> ComplianceTags { get; set; } = new List<string>();

        // M2 Aşaması için Ek Alanlar
        public string M2_Final_Decision { get; set; }
    }
}