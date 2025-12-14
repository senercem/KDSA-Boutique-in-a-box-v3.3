using KDSA.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface IComplianceService
    {
        Task<List<AuditLogEntry>> GetAuditLogsAsync(string userCompany = null);

        // DEĞİŞİKLİK: Sona 'string company' parametresi eklendi.
        Task<bool> LogAsync(string action, string details, string performedBy, string company);

        Task<AuditLogEntry> GetAuditLogByIdAsync(string auditId);
    }
}