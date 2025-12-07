using KDSA.Domain.Entities;
using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface IACOREService
    {
        Task<ACORERiskProfile> AnalyzeAndStoreAsync(ACOREInputData data);
        Task<ACORERiskProfile> GetLatestRiskProfileAsync(string systemId);
    }
}