using KDSA.Application.DTOs;
using KDSA.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace KDSA.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;
        // 1. Loglama servisini tanımlıyoruz
        private readonly IComplianceService _complianceService;

        // 2. Constructor'a ekliyoruz
        public CompanyController(ICompanyService companyService, IComplianceService complianceService)
        {
            _companyService = companyService;
            _complianceService = complianceService;
        }

        // Sadece Adminler erişebilir
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            if (!IsAdmin()) return Forbid();
            var result = await _companyService.GetAllCompaniesAsync();
            return Ok(result);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CompanyDto company)
        {
            if (!IsAdmin()) return Forbid();

            var result = await _companyService.CreateCompanyAsync(company);

            if (!result) return BadRequest("Firma oluşturulamadı.");

            // 3. LOGLAMA: Başarılı olursa log atıyoruz
            // Admin işlem yaptığı için firma adına "Koru Impact" diyoruz.
            var performedBy = User.Identity?.Name ?? "Admin";
            await _complianceService.LogAsync(
                "Create Company",
                $"New company created: {company.Company_Name}",
                performedBy,
                "Koru Impact"
            );

            return Ok(new { message = "Firma başarıyla oluşturuldu." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsAdmin()) return Forbid();

            var result = await _companyService.DeleteCompanyAsync(id);

            if (!result) return BadRequest("Firma silinemedi.");

            // 4. LOGLAMA: Silme işlemi için log
            var performedBy = User.Identity?.Name ?? "Admin";
            await _complianceService.LogAsync(
                "Delete Company",
                $"Company ID {id} deleted",
                performedBy,
                "Koru Impact"
            );

            return Ok(new { message = "Firma silindi." });
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] CompanyDto company)
        {
            if (!IsAdmin()) return Forbid();

            var result = await _companyService.UpdateCompanyAsync(id, company);

            if (!result) return BadRequest("Firma güncellenemedi.");

            return Ok(new { message = "Firma başarıyla güncellendi." });
        }

        // Yardımcı Metot
        private bool IsAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "Admin" || role == "admin";
        }
    }
}