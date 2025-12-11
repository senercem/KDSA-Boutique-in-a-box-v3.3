using KDSA.Core.Models;
using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface IGeminiService
    {
        // Karar Motoru: Metin gönderip analiz sonucunu alacak
        Task<List<PremortemScenario>> AnalyzeRiskAsync(string prompt);
    }
}