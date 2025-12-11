using Microsoft.AspNetCore.Mvc;
using KDSA.Application.Interfaces;
// using KDSA.Domain.Entities;
// Bu satırlar derleyiciye "Domain'dekini değil, Core'dakini kullan" der.
using ACOREInputDto = KDSA.Core.DTOs.ACOREInputDto;
using ACOREResult = KDSA.Core.Models.ACOREResult;

namespace KDSA.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ACOREController : ControllerBase
    {
        private readonly IACOREService _acoreService;

        public ACOREController(IACOREService acoreService)
        {
            _acoreService = acoreService;
        }

        [HttpGet("risk-profiles/{systemId}")]
        public async Task<IActionResult> GetRiskProfile(string systemId)
        {
            if (string.IsNullOrEmpty(systemId)) return BadRequest("ID boş olamaz.");

            var result = await _acoreService.GetLatestRiskProfileAsync(systemId);

            if (result == null) return NotFound("Risk profili bulunamadı.");

            return Ok(result);
        }

        [HttpPost("analyze")]
        public IActionResult CalculateRisk([FromBody] ACOREInputDto input)
        {
            if (input == null) return BadRequest("Veri girişi boş olamaz.");

            var result = _acoreService.CalculateATRI(input);

            // v3.4 Playbook Appendix F.1: output_human_factor_risk_flag
            return Ok(result);
        }
    }
}