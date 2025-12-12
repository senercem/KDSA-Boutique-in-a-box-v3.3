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
        [Authorize]
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

        // --- BURASI KRİTİK: SADECE TEK BİR "users" METODU OLMALI ---

        // GET: api/Auth/users
        [HttpGet("users")]
        [Authorize]
        public async Task<IActionResult> GetUsers()
        {
            // 1. Admin Kontrolü (GÜVENLİK İÇİN BU KISMI AÇIN)
            // Test ederken sorun oluyorsa geçici olarak yorum satırı kalabilir 
            // ama canlıya alırken mutlaka açılmalı.

            /*
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(role) || (role != "Admin" && role != "admin"))
            {
                return StatusCode(403, new { message = "Yetkisiz işlem: Admin olmalısınız." });
            }
            */

            // 2. Veriyi Getir
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        // DELETE: api/Auth/users/{id}
        [HttpDelete("users/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _authService.DeleteUserAsync(id);
            if (!success) return BadRequest(new { message = "Kullanıcı silinemedi." });
            return Ok(new { message = "Kullanıcı silindi." });
        }
    }
}