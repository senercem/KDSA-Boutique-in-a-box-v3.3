using KDSA.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface ICompanyService
    {
        Task<List<CompanyDto>> GetAllCompaniesAsync();
        Task<bool> CreateCompanyAsync(CompanyDto company);
        Task<bool> DeleteCompanyAsync(int id);
        Task<bool> UpdateCompanyAsync(int id, CompanyDto company);
    }
}