using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using KDSA.Application.DTOs;

namespace KDSA.API.Controllers
{
    // PROTOKOL: Versioning Requirement (/api/v1/...)
    [Route("api/v1/[controller]")]
    [ApiController]
    public class ComplianceController : ControllerBase
    {
        private readonly IAlexandraService _alexandraService;

        public ComplianceController(IAlexandraService alexandraService)
        {
            _alexandraService = alexandraService;
        }

        // POST api/v1/compliance/context
        [HttpPost("context")]
        public async Task<IActionResult> RegisterContext([FromBody] AISystemContext context)
        {
            if (context == null || string.IsNullOrEmpty(context.SystemId))
                return BadRequest("System ID is mandatory.");

            await _alexandraService.RegisterSystemContextAsync(context);
            return Ok(new { message = "AI System Context registered successfully (MAP Function)." });
        }

        // POST api/v1/compliance/metrics
        [HttpPost("metrics")]
        public async Task<IActionResult> IngestMetrics([FromBody] ModelMetric metric)
        {
            await _alexandraService.IngestMetricsAsync(metric);
            return Ok(new { message = "Metric ingested successfully (MEASURE Function)." });
        }

        // GET api/v1/compliance/artifact/{systemId}
        // Bu endpoint, Partnerin TPRM sürecini otomatize eder.
        [HttpGet("artifact/{systemId}")]
        public async Task<IActionResult> GetComplianceArtifact(string systemId)
        {
            var artifact = await _alexandraService.GenerateComplianceArtifactAsync(systemId);
            return Ok(artifact);
        }

        // GET api/v1/compliance/logs
        [HttpGet("logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _alexandraService.GetFullAuditTrailAsync();
            return Ok(logs);
        }

        // GET metodunu siliyoruz, yerine POST yapıyoruz çünkü veri gönderiyoruz
        [HttpPost("generate-report")]
        public async Task<IActionResult> GenerateReport([FromBody] ReportGenerationDto request)
        {
            // Servise hem ID'yi hem de M2'den gelen metni gönderiyoruz
            var artifact = await _alexandraService.GenerateComplianceArtifactAsync(request.SystemId, request.M2AnalysisResult, request.M1RiskScore);
            return Ok(artifact);
        }
    }
}