using ACOREResult = KDSA.Core.Models.ACOREResult;
using ACOREInputDto = KDSA.Core.DTOs.ACOREInputDto;
using KDSA.Domain.Entities;
using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface IACOREService
    {
        // 1. Hesaplama Metodu
        // Buradaki ACOREResult artık KDSA.Core.Models içindekidir.
        ACOREResult CalculateATRI(ACOREInputDto input);

        // 2. Veri Çekme Metodu
        Task<ACOREResult> GetLatestRiskProfileAsync(string systemId);
    }
}