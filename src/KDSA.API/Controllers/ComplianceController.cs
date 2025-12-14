using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using KDSA.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims; // User Identity erişimi için gerekli

namespace KDSA.API.Controllers
{
    // PROTOKOL: Versioning Requirement (/api/v1/...)
    // NOT: Frontend URL'inin de buna uyması gerekecek: /api/v1/Compliance/logs
    [Route("api/v1/[controller]")]
    [ApiController]
    public class ComplianceController : ControllerBase
    {
        // MEVCUT SERVİS
        private readonly IAlexandraService _alexandraService;

        // YENİ EKLENEN SERVİS (Filtreleme ve Detaylar için)
        private readonly IComplianceService _complianceService;

        public ComplianceController(IAlexandraService alexandraService, IComplianceService complianceService)
        {
            _alexandraService = alexandraService;
            _complianceService = complianceService;
        }

        // --- MEVCUT METOTLAR ---

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
        // GÜNCELLEME: Firma Filtreleme Mantığı Buraya Eklendi
        [HttpGet("logs")]
        [Authorize] // Güvenlik eklendi
        public async Task<IActionResult> GetAuditLogs()
        {
            // 1. Kullanıcıyı tanı
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? User.Identity?.Name;
            if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

            // 2. Firmayı belirle
            string userCompany = null;
            if (userEmail.Contains("koruimpact.org") || userEmail.Contains("admin"))
            {
                userCompany = "Koru"; // Veritabanındaki isimle eşleşmeli
            }
            else
            {
                userCompany = "Unknown"; // Diğerleri için boş liste döner
            }

            // 3. Updated servisi çağır (_complianceService filtrelemeyi biliyor)
            var logs = await _complianceService.GetAuditLogsAsync(userCompany);
            return Ok(logs);
        }

        // POST api/v1/compliance/generate-report
        [HttpPost("generate-report")]
        public async Task<IActionResult> GenerateReport([FromBody] ReportGenerationDto request)
        {
            var artifact = await _alexandraService.GenerateComplianceArtifactAsync(request.SystemId, request.M2AnalysisResult, request.M1RiskScore);
            return Ok(artifact);
        }

        // GET api/v1/compliance/logs/{auditId}
        [HttpGet("logs/{auditId}")]
        [Authorize]
        public async Task<IActionResult> GetLogById(string auditId)
        {
            var log = await _complianceService.GetAuditLogByIdAsync(auditId);

            if (log == null)
            {
                return NotFound(new { message = $"Audit ID ({auditId}) ile eşleşen kayıt bulunamadı." });
            }

            return Ok(log);
        }
    }
}