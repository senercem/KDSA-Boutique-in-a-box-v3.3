using KDSA.Application.DTOs;
using KDSA.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace KDSA.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // DİKKAT: [Authorize] ekleyerek bu metodu kilitledik.
        // Sadece elinde geçerli bir Token olan (zaten giriş yapmış) kişiler yeni kullanıcı ekleyebilir.
        // İleride buraya Roles = "Admin" de ekleyebiliriz.
        [HttpPost("register")]
        [Authorize]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            try
            {
                var result = await _authService.RegisterAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize] // Sadece giriş yapmış kullanıcılar şifre değiştirebilir
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            try
            {
                await _authService.ChangePasswordAsync(request);
                return Ok(new { message = "Şifre başarıyla güncellendi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("users")]
        [Authorize]
        public async Task<IActionResult> GetUsers()
        {
            // 1. Token'ın içindeki ROL bilgisini okuyoruz
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            // 2. GÜVENLİK KONTROLÜ (Düzeltilmiş Mantık)
            // Rol boşsa veya ("Admin" DEĞİL VE "admin" DEĞİL) ise engelle.
            if (string.IsNullOrEmpty(role) || (role != "Admin" && role != "admin"))
            {
                return Forbid(); // 403 Forbidden döner
            }

            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpDelete("users/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _authService.DeleteUserAsync(id);
            if (!success) return BadRequest("Kullanıcı silinemedi.");
            return Ok(new { message = "Kullanıcı silindi." });
        }
    }
}