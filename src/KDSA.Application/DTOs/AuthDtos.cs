namespace KDSA.Application.DTOs // Namespace'e dikkat
{
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } // JWT Token
        public string Username { get; set; }
        public string Role { get; set; }
    }
}