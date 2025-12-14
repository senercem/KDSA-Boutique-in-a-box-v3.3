using KDSA.Application.Interfaces;
using KDSA.Core.DTOs;
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
        public async Task<IActionResult> Analyze([FromBody] DecisionInputDto input)
        {
            // 1. Validasyon: Karar metni boşsa işlem yapma
            if (input == null || string.IsNullOrWhiteSpace(input.DecisionContext))
            {
                return BadRequest("Analiz edilecek bir karar bağlamı (Strategic Decision) girmelisiniz.");
            }

            // 2. Prompt Hazırlığı: M2 Modülü için özel prompt
            // Hem kararı hem de bilinen riskleri birleştirip yapay zekaya soruyoruz.
            var prompt = $"Sen Koru Impact KDSA mimarisinin 'Pre-mortem' Karar Motorusun.\n" +
                         $"Analiz Edilecek Stratejik Karar: {input.DecisionContext}\n" +
                         $"Bilinen Riskler: {input.KnownRisks ?? "Belirtilmemiş"}\n\n" +
                         "Lütfen bu karar için detaylı bir pre-mortem analizi yap ve olası başarısızlık senaryolarını listele.";

            // 3. Servis Çağrısı
            var result = await _geminiService.AnalyzeRiskAsync(prompt);

            // 4. Sonuç
            // Frontend genellikle doğrudan sonucu bekler, o yüzden { Analysis = ... } wrapper'ını kaldırdım.
            // Eğer Frontend JSON içinde "Analysis" field'ı bekliyorsa eski haline çevirebiliriz.
            return Ok(result);
        }
    }
}