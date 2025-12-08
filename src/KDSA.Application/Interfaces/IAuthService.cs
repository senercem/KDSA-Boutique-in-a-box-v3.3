using System.Threading.Tasks;
using KDSA.Application.DTOs; // DTO'ları buradan çekecek

namespace KDSA.Application.Interfaces
{
    public interface IAuthService
    {
        // Kayıt Olma Fonksiyonu: Başarılı olursa Token döner, olmazsa null veya hata fırlatır.
        Task<AuthResponseDto> RegisterAsync(RegisterDto request);

        // Giriş Yapma Fonksiyonu: Başarılı olursa Token döner.
        Task<AuthResponseDto> LoginAsync(LoginDto request);
    }
}