using System.Threading.Tasks;
using KDSA.Domain.Entities;

namespace KDSA.Application.Interfaces
{
    public interface IBaserowClient
    {
        Task<bool> LogDecisionAsync(AuditLogEntry entry);
    }
}