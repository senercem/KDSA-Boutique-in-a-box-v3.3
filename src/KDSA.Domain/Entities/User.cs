using System;

namespace KDSA.Domain.Entities
{
    public class User
    {
        public int Id { get; set; } // Baserow Row ID
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; } // Şifreyi asla açık tutmayız!
        public string Role { get; set; } = "User"; // Varsayılan rol
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}