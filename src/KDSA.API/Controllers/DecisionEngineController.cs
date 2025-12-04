using KDSA.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace KDSA.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DecisionEngineController : ControllerBase
    {
        private readonly IGeminiService _geminiService;

        public DecisionEngineController(IGeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze([FromBody] AnalysisRequest request)
        {
            if (string.IsNullOrEmpty(request.Context))
                return BadRequest("Analiz edilecek bir bağlam (Context) girmelisiniz.");

            // Playbook v3.3 M2: Karar Motoru Mantığı
            var prompt = $"Sen Koru Impact KDSA mimarisinin Karar Motorusun. Şu durumu analiz et: {request.Context}";

            var result = await _geminiService.AnalyzeRiskAsync(prompt);

            return Ok(new { Analysis = result });
        }
    }

    // Basit bir istek modeli
    public class AnalysisRequest
    {
        public string Context { get; set; }
    }
}