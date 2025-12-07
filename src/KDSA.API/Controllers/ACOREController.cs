using KDSA.Application.Interfaces;
using KDSA.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace KDSA.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ACOREController : ControllerBase
    {
        private readonly IACOREService _acoreService;

        public ACOREController(IACOREService acoreService)
        {
            _acoreService = acoreService;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze([FromBody] ACOREInputData data)
        {
            var result = await _acoreService.AnalyzeAndStoreAsync(data);
            return Ok(result);
        }
    }
}