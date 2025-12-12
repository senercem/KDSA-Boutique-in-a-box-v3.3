using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using KDSA.Application.DTOs;
using Microsoft.AspNetCore.Authorization; // [Authorize] için gerekli

namespace KDSA.API.Controllers
{
    // PROTOKOL: Versioning Requirement (/api/v1/...)
    [Route("api/v1/[controller]")]
    [ApiController]
    public class ComplianceController : ControllerBase
    {
        // MEVCUT SERVİS (M3 Dashboard Listesi vb. için)
        private readonly IAlexandraService _alexandraService;

        // YENİ EKLENEN SERVİS (Tekil Kanıt İndirme için)
        private readonly IComplianceService _complianceService;

        // Constructor'ı güncelliyoruz: İkisini de içeri alıyoruz
        public ComplianceController(IAlexandraService alexandraService, IComplianceService complianceService)
        {
            _alexandraService = alexandraService;
            _complianceService = complianceService;
        }

        // --- MEVCUT METOTLAR (DOKUNULMADI) ---

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

        // POST api/v1/compliance/generate-report
        [HttpPost("generate-report")]
        public async Task<IActionResult> GenerateReport([FromBody] ReportGenerationDto request)
        {
            var artifact = await _alexandraService.GenerateComplianceArtifactAsync(request.SystemId, request.M2AnalysisResult, request.M1RiskScore);
            return Ok(artifact);
        }

        // --- METOT (Evidence Download İçin) ---

        // GET api/v1/compliance/logs/{auditId}
        // Frontend'deki "İndir" butonu buraya istek atacak
        [HttpGet("logs/{auditId}")]
        [Authorize] // Güvenlik için sadece token sahibi erişebilsin
        public async Task<IActionResult> GetLogById(string auditId)
        {
            // Yeni yazdığımız ComplianceService üzerinden veritabanına gidiyoruz
            var log = await _complianceService.GetAuditLogByIdAsync(auditId);

            if (log == null)
            {
                return NotFound(new { message = $"Audit ID ({auditId}) ile eşleşen kayıt bulunamadı." });
            }

            return Ok(log);
        }
    }
}