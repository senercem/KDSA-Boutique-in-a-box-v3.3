namespace KDSA.Application.DTOs // Namespace'e dikkat
{
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
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

    public class ChangePasswordDto
    {
        public string Email { get; set; }
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; } // Baserow Row ID (Silmek için lazım)
        public string Username { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string CreatedDate { get; set; }
    }
}