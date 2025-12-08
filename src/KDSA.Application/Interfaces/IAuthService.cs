using System.Threading.Tasks;
using KDSA.Application.DTOs; // DTO'ları buradan çekecek
using System.Collections.Generic;

namespace KDSA.Application.Interfaces
{
    public interface IAuthService
    {
        // Kayıt Olma Fonksiyonu: Başarılı olursa Token döner, olmazsa null veya hata fırlatır.
        Task<AuthResponseDto> RegisterAsync(RegisterDto request);

        // Giriş Yapma Fonksiyonu: Başarılı olursa Token döner.
        Task<AuthResponseDto> LoginAsync(LoginDto request);
        
        // Şifre Değiştirme Fonksiyonu: Başarılı olursa true döner.
        Task<bool> ChangePasswordAsync(ChangePasswordDto request);

        // Tüm Kullanıcıları Getirme Fonksiyonu: Yönetici işlemleri için.
        Task<List<UserDto>> GetAllUsersAsync();

        // Kullanıcı Silme Fonksiyonu: rowId ile kullanıcıyı siler.
        Task<bool> DeleteUserAsync(int rowId);
    }
}