// Models/AppUser.cs
using Microsoft.AspNetCore.Identity;

namespace TodoApi.Models
{
    // Kế thừa từ IdentityUser để có sẵn các trường
    // Email, PasswordHash, UserName, PhoneNumber, v.v.
    public class AppUser : IdentityUser
    {
        public ICollection<TodoList> TodoLists { get; set; } = new List<TodoList>();
    }
}