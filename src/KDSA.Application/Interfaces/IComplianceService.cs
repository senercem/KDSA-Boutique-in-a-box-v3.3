using KDSA.Application.DTOs;
//using KDSA.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface IComplianceService
    {
        Task<List<AuditLogEntry>> GetAuditLogsAsync();
        Task<AuditLogEntry> GetAuditLogByIdAsync(string auditId);
    }
}