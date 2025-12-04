using System.Threading.Tasks;

namespace KDSA.Application.Interfaces
{
    public interface IGeminiService
    {
        // Karar Motoru: Metin gönderip analiz sonucunu alacak
        Task<string> AnalyzeRiskAsync(string prompt);
    }
}